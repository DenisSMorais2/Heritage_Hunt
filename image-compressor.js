// ============================================================
// Heritage Hunt CV — Compressor de imagens
//
// Porque existe: o espaco de armazenamento e finito e partilhado
// por todos os exploradores. Uma fotografia de telemovel pesa
// facilmente 4 MB; a mesma fotografia, no tamanho em que e mesmo
// vista dentro da app, pesa cerca de 150 KB. Comprimir antes de
// subir e a diferenca entre o armazenamento durar meses ou anos.
//
// Regras deste ficheiro:
//   - a MATEMATICA nao toca no DOM (e por isso que ha testes);
//   - so `compress()` precisa de browser — o resto e aritmetica;
//   - nunca aumenta uma imagem: uma foto pequena passa incolume;
//   - a qualidade desce por degraus ate o tamanho caber, e nao de
//     uma vez, para nao estragar quem ja cabia a primeira.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.ImageCompressor = api.ImageCompressor;
        root.COMPRESSION_PRESET = api.COMPRESSION_PRESET;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // Perfis
    //
    // Acrescentar um uso novo para imagens e acrescentar uma
    // entrada aqui. Nenhum numero destes existe fora deste mapa.
    // ==========================================================

    const COMPRESSION_PRESET = {
        // Album de um monumento: vista num ecra de telemovel, em
        // grelha, e ampliavel ate ao tamanho do ecra.
        ALBUM: {
            maxEdge: 1600,
            targetBytes: 180 * 1024,
            ceilingBytes: 900 * 1024,
            startQuality: 0.82,
            minQuality: 0.45
        },
        // Foto de perfil: nunca e vista maior que um circulo.
        AVATAR: {
            maxEdge: 512,
            targetBytes: 60 * 1024,
            ceilingBytes: 300 * 1024,
            startQuality: 0.8,
            minQuality: 0.5
        }
    };

    // Degraus de qualidade. Descer devagar no inicio preserva o
    // detalhe de quem estava quase a caber; mais abaixo os saltos
    // alargam, porque ai ja so interessa caber.
    const QUALITY_STEPS = [0.82, 0.74, 0.66, 0.58, 0.5, 0.45];

    // ==========================================================
    // Matematica — sem DOM, testavel
    // ==========================================================

    // Cabe a imagem dentro de um quadrado de `maxEdge`, mantendo a
    // proporcao. NUNCA aumenta: esticar uma foto pequena so gastava
    // espaco a inventar pixeis que nao existem.
    function fitWithin(width, height, maxEdge) {
        const w = Math.max(0, Math.round(width) || 0);
        const h = Math.max(0, Math.round(height) || 0);

        if (!w || !h || !maxEdge) return { width: w, height: h, scaled: false };

        const longest = Math.max(w, h);
        if (longest <= maxEdge) return { width: w, height: h, scaled: false };

        const ratio = maxEdge / longest;
        return {
            // Pelo menos 1 pixel: uma imagem muito alongada nunca
            // pode colapsar para zero de largura.
            width: Math.max(1, Math.round(w * ratio)),
            height: Math.max(1, Math.round(h * ratio)),
            scaled: true
        };
    }

    // O degrau seguinte, ou null quando ja nao ha para onde descer.
    function nextQuality(current, minQuality) {
        const floor = typeof minQuality === 'number' ? minQuality : 0;

        for (let i = 0; i < QUALITY_STEPS.length; i++) {
            const step = QUALITY_STEPS[i];
            if (step < current - 0.001 && step >= floor - 0.001) return step;
        }

        return null;
    }

    // A tentativa serve? Cabe no alvo, ou ja nao ha qualidade para
    // baixar e o resultado ainda esta dentro do tecto aceitavel.
    function isAcceptable(bytes, quality, preset) {
        if (bytes <= preset.targetBytes) return true;
        if (nextQuality(quality, preset.minQuality) === null) {
            return bytes <= preset.ceilingBytes;
        }
        return false;
    }

    // Quanto se poupou, em percentagem inteira. Serve para o aviso
    // ao utilizador e para se poder medir o ganho real.
    function savingsPercent(originalBytes, finalBytes) {
        if (!originalBytes || originalBytes <= 0) return 0;
        if (finalBytes >= originalBytes) return 0;
        return Math.round(((originalBytes - finalBytes) / originalBytes) * 100);
    }

    function formatBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value < 1024) return value + ' B';
        if (value < 1024 * 1024) return Math.round(value / 1024) + ' KB';
        return (value / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function extensionFor(mimeType) {
        if (mimeType === 'image/webp') return 'webp';
        if (mimeType === 'image/png') return 'png';
        return 'jpg';
    }

    // ==========================================================
    // Browser — a unica parte que precisa de DOM
    // ==========================================================

    let webpSupport = null;

    // O WebP poupa tipicamente 25 a 35 % sobre o JPEG com a mesma
    // qualidade aparente. Testamos uma vez e guardamos a resposta.
    function supportsWebP() {
        if (webpSupport !== null) return webpSupport;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } catch (e) {
            webpSupport = false;
        }

        return webpSupport;
    }

    function bestFormat() {
        return supportsWebP() ? 'image/webp' : 'image/jpeg';
    }

    // Le a origem — ficheiro, Blob ou Data URL — para algo que se
    // possa desenhar. `createImageBitmap` e preferido porque respeita
    // a orientacao EXIF: sem isso, fotos tiradas de lado subiam
    // deitadas.
    async function loadDrawable(source) {
        const blob = await toBlob(source);

        if (typeof createImageBitmap === 'function') {
            try {
                return {
                    image: await createImageBitmap(blob, { imageOrientation: 'from-image' }),
                    blob: blob
                };
            } catch (e) {
                // Navegador sem a opcao de orientacao: segue para o
                // caminho antigo, que ja e melhor que falhar.
            }
        }

        const url = URL.createObjectURL(blob);

        try {
            const image = await new Promise(function (resolve, reject) {
                const element = new Image();
                element.onload = function () { resolve(element); };
                element.onerror = function () { reject(new Error('imagem ilegivel')); };
                element.src = url;
            });
            return { image: image, blob: blob, objectUrl: url };
        } catch (error) {
            URL.revokeObjectURL(url);
            throw error;
        }
    }

    async function toBlob(source) {
        if (source instanceof Blob) return source;

        if (typeof source === 'string' && source.indexOf('data:') === 0) {
            const response = await fetch(source);
            return await response.blob();
        }

        throw new Error('origem de imagem nao suportada');
    }

    function canvasToBlob(canvas, mimeType, quality) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (blob) resolve(blob);
                else reject(new Error('nao foi possivel codificar a imagem'));
            }, mimeType, quality);
        });
    }

    // Comprime uma imagem e devolve o que se sabe sobre ela.
    //
    // Devolve sempre um Blob pronto a subir, mesmo quando nao houve
    // nada a ganhar: quem chama nao tem de decidir nada.
    async function compress(source, presetName) {
        const preset = COMPRESSION_PRESET[presetName] || COMPRESSION_PRESET.ALBUM;
        const loaded = await loadDrawable(source);
        const originalBytes = loaded.blob.size;

        try {
            const naturalWidth = loaded.image.width;
            const naturalHeight = loaded.image.height;
            const size = fitWithin(naturalWidth, naturalHeight, preset.maxEdge);

            const canvas = document.createElement('canvas');
            canvas.width = size.width;
            canvas.height = size.height;

            const context = canvas.getContext('2d');
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(loaded.image, 0, 0, size.width, size.height);

            const mimeType = bestFormat();
            let quality = preset.startQuality;
            let blob = await canvasToBlob(canvas, mimeType, quality);

            // Desce um degrau de cada vez, e para assim que couber.
            while (!isAcceptable(blob.size, quality, preset)) {
                const lower = nextQuality(quality, preset.minQuality);
                if (lower === null) break;

                quality = lower;
                blob = await canvasToBlob(canvas, mimeType, quality);
            }

            return {
                blob: blob,
                bytes: blob.size,
                originalBytes: originalBytes,
                width: size.width,
                height: size.height,
                format: mimeType,
                extension: extensionFor(mimeType),
                quality: quality,
                savings: savingsPercent(originalBytes, blob.size)
            };
        } finally {
            if (loaded.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
            if (loaded.image && typeof loaded.image.close === 'function') loaded.image.close();
        }
    }

    const ImageCompressor = {
        compress: compress,

        // Aritmetica exposta para os testes e para quem precise de
        // prever o resultado sem comprimir nada.
        fitWithin: fitWithin,
        nextQuality: nextQuality,
        isAcceptable: isAcceptable,
        savingsPercent: savingsPercent,
        formatBytes: formatBytes,
        extensionFor: extensionFor,
        supportsWebP: supportsWebP,
        bestFormat: bestFormat,

        PRESET: COMPRESSION_PRESET,
        QUALITY_STEPS: QUALITY_STEPS
    };

    return { ImageCompressor: ImageCompressor, COMPRESSION_PRESET: COMPRESSION_PRESET };
});
