// ============================================================
// Heritage Hunt CV — Álbum do monumento (camada de dominio)
//
// O album deixa de ser "galeria + formulario" e passa a ser o
// diario visual de um lugar. Este ficheiro responde as perguntas
// que a pagina precisa de fazer sobre esse diario:
//
//     Que fotografia representa este album?
//     Ja ha aqui uma memoria, ou so uma descoberta?
//     Em que ponto da transformacao esta?
//     Que seccoes tem mesmo conteudo para mostrar?
//
// NADA AQUI E UM SISTEMA NOVO. As fotografias continuam a ser as
// do `monument_photos_<id>`, a experiencia a do `monument_note_<id>`,
// as etiquetas as do `monument_tags_<id>`, e o XP o do `xp.js`.
// Este modulo LE o que ja existe e deriva o resto.
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage (adaptadores injectados);
//   - nao atribui XP nem decide quanto vale o que quer que seja;
//   - nao inventa conteudo cultural: se o monumento nao tem
//     historia, a seccao nao existe;
//   - nao conhece traducoes.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Album = api.Album;
        root.COVER_SOURCE = api.COVER_SOURCE;
        root.ALBUM_STAGE = api.ALBUM_STAGE;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // De onde veio a capa (ponto 5 do enunciado)
    //
    // A ordem e a do enunciado, e e ela que a interface segue:
    //   1. a fotografia que a pessoa escolheu;
    //   2. a primeira fotografia pessoal;
    //   3. a imagem oficial do monumento.
    // ==========================================================
    const COVER_SOURCE = {
        CHOSEN: 'chosen',
        FIRST: 'first',
        OFFICIAL: 'official'
    };

    // ==========================================================
    // A transformacao do album (ponto 37)
    //
    // Nao e progresso nem pontuacao: e o estado em que o album
    // esta, e e o que faz a pagina mudar de tom.
    // ==========================================================
    const ALBUM_STAGE = {
        // Descoberto, imagem oficial, sem nada de pessoal
        DISCOVERED: 'discovered',
        // Primeira fotografia: comeca a parecer pessoal
        FIRST_PHOTO: 'firstPhoto',
        // Varias fotografias, com capa escolhida ou nao
        PHOTOS: 'photos',
        // Fotografias + a experiencia escrita
        WRITTEN: 'written',
        // Tudo junto, com etiquetas: o album rico
        RICH: 'rich'
    };

    // ==========================================================
    // Fontes injectadas
    //
    // Todas apontam para sistemas que JA existem. Este modulo nao
    // guarda nada por sua conta.
    // ==========================================================
    const DEFAULT_SOURCES = {
        getMonument: function () { return null; },
        getPhotos: function () { return []; },
        getNote: function () { return ''; },
        getTags: function () { return []; },
        // A escolha de capa da pessoa, ou null
        getCoverId: function () { return null; },
        getDiscoveredAt: function () { return null; },
        getZoneId: function () { return null; },
        // Conteudo cultural: devolve '' quando o monumento nao tem
        getStory: function () { return ''; },

        // Regras que vivem noutros ficheiros — nunca repetidas aqui
        getPhotoLimit: function () { return 0; },
        getPhotoRewardLimit: function () { return 0; },
        getPhotoRewardsUsed: function () { return 0; },
        hasExperienceReward: function () { return false; },
        getMinExperienceLength: function () { return 0; }
    };

    const sources = Object.assign({}, DEFAULT_SOURCES);

    function configure(options) {
        const config = options || {};
        Object.keys(DEFAULT_SOURCES).forEach(function (key) {
            if (typeof config[key] === 'function') sources[key] = config[key];
        });
    }

    // ==========================================================
    // Auxiliares
    // ==========================================================
    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function safe(fn, fallback) {
        try {
            const value = fn();
            return value === undefined || value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function photosOf(monumentId) {
        return asArray(safe(function () { return sources.getPhotos(monumentId); }, []))
            .filter(function (photo) { return photo && typeof photo === 'object'; });
    }

    function noteOf(monumentId) {
        const note = safe(function () { return sources.getNote(monumentId); }, '');
        return typeof note === 'string' ? note.trim() : '';
    }

    function tagsOf(monumentId) {
        return asArray(safe(function () { return sources.getTags(monumentId); }, []))
            .filter(function (tag) { return typeof tag === 'string' && tag; });
    }

    function toNonNegativeInt(value) {
        const n = Number(value);
        return isNaN(n) || n < 0 ? 0 : Math.floor(n);
    }

    // ==========================================================
    // A CAPA (pontos 5, 8, 9 e 40)
    //
    // A escolha da pessoa vence sempre — mas so enquanto a
    // fotografia escolhida existir. Apagar a capa nao pode deixar
    // o album sem imagem nenhuma: cai para a primeira fotografia,
    // e dai para a imagem oficial.
    //
    // DECISAO (ponto 9): a primeira fotografia passa a ser capa
    // AUTOMATICAMENTE, sem pedir nada. Nao se guarda escolha
    // nenhuma por isso — e so o resultado desta ordem. Assim o
    // album ganha cara na primeira fotografia (ponto 61) e a
    // pessoa continua livre de escolher outra depois.
    // ==========================================================
    function getCover(monumentId) {
        const monument = safe(function () { return sources.getMonument(monumentId); }, null);
        const official = (monument && monument.image) || null;
        const photos = photosOf(monumentId);

        if (!photos.length) {
            return { source: COVER_SOURCE.OFFICIAL, photo: null, image: official };
        }

        const coverId = safe(function () { return sources.getCoverId(monumentId); }, null);

        if (coverId) {
            const chosen = photos.filter(function (photo) {
                return photo.id === coverId;
            })[0];

            if (chosen) {
                return { source: COVER_SOURCE.CHOSEN, photo: chosen, image: official };
            }
        }

        // Escolha inexistente ou apagada: a primeira fotografia
        return { source: COVER_SOURCE.FIRST, photo: photos[0], image: official };
    }

    /**
     * A fotografia escolhida ainda existe? Serve para limpar uma
     * escolha orfa em vez de a arrastar para sempre.
     */
    function coverIsOrphan(monumentId) {
        const coverId = safe(function () { return sources.getCoverId(monumentId); }, null);
        if (!coverId) return false;

        return !photosOf(monumentId).some(function (photo) {
            return photo.id === coverId;
        });
    }

    /**
     * Esta fotografia pode ser escolhida como capa? So as do
     * proprio album — nunca um id vindo de fora (ponto 55).
     */
    function canBeCover(monumentId, photoId) {
        if (!photoId) return false;
        return photosOf(monumentId).some(function (photo) {
            return photo.id === photoId;
        });
    }

    // ==========================================================
    // MEMORIA GUARDADA (pontos 7 e 39)
    //
    // Derivado, nunca guardado. Um booleano proprio so podia
    // ficar dessincronizado do que a pessoa tem mesmo no album.
    //
    // "Contribuicao pessoal significativa" = uma fotografia, OU
    // uma experiencia que conta como experiencia. E a MESMA regra
    // de comprimento que o XP usa — duas definicoes de "escreveu
    // alguma coisa" seriam duas verdades diferentes.
    // ==========================================================
    function hasValidExperience(monumentId) {
        const min = toNonNegativeInt(safe(sources.getMinExperienceLength, 0));
        return noteOf(monumentId).length >= min && noteOf(monumentId).length > 0;
    }

    function isMemorySaved(monumentId) {
        if (photosOf(monumentId).length > 0) return true;
        return hasValidExperience(monumentId);
    }

    // ==========================================================
    // O selo do heroi (pontos 6 e 7)
    // ==========================================================
    function getStamp(monumentId) {
        return {
            saved: isMemorySaved(monumentId),
            discoveredAt: safe(function () {
                return sources.getDiscoveredAt(monumentId);
            }, null)
        };
    }

    // ==========================================================
    // A transformacao (ponto 37)
    // ==========================================================
    function getStage(monumentId) {
        const photos = photosOf(monumentId).length;
        const written = hasValidExperience(monumentId);
        const tags = tagsOf(monumentId).length;

        if (written && tags > 0 && photos > 0) return ALBUM_STAGE.RICH;
        if (written) return ALBUM_STAGE.WRITTEN;
        if (photos > 1) return ALBUM_STAGE.PHOTOS;
        if (photos === 1) return ALBUM_STAGE.FIRST_PHOTO;
        return ALBUM_STAGE.DISCOVERED;
    }

    /**
     * O album esta praticamente vazio? Decide o texto da accao
     * final (ponto 35) e o estado editorial do ponto 36.
     */
    function isEmpty(monumentId) {
        return !isMemorySaved(monumentId) && tagsOf(monumentId).length === 0;
    }

    // ==========================================================
    // AS FOTOGRAFIAS (pontos 12 e 16)
    //
    // Duas contas diferentes, e NAO se confundem:
    //
    //   `slots`   quantas fotografias cabem (limite de guarda)
    //   `rewards` quantas ainda rendem XP (limite de recompensa)
    //
    // O enunciado avisa para nao as trocar, e o mockup mostrava
    // "3 de 6" — que nao e nenhuma das duas neste projecto.
    // ==========================================================
    function getPhotoSlots(monumentId) {
        const used = photosOf(monumentId).length;
        const max = toNonNegativeInt(safe(sources.getPhotoLimit, 0));

        return {
            used: used,
            max: max,
            remaining: Math.max(0, max - used),
            isFull: max > 0 && used >= max
        };
    }

    function getPhotoRewards(monumentId) {
        const used = toNonNegativeInt(safe(function () {
            return sources.getPhotoRewardsUsed(monumentId);
        }, 0));
        const max = toNonNegativeInt(safe(sources.getPhotoRewardLimit, 0));

        return {
            used: used,
            max: max,
            remaining: Math.max(0, max - used),
            exhausted: max > 0 && used >= max
        };
    }

    /**
     * As fotografias que ainda nao subiram (ponto 50). A pagina
     * mostra-as na mesma — foram guardadas — com o aviso de que
     * estao a espera de rede.
     */
    function getPendingPhotos(monumentId) {
        return photosOf(monumentId).filter(function (photo) {
            return !!photo.pending;
        });
    }

    function hasPendingPhotos(monumentId) {
        return getPendingPhotos(monumentId).length > 0;
    }

    // ==========================================================
    // A MINHA VISITA EM NUMEROS (ponto 31)
    //
    // Tres indicadores, e so pessoais. XP nao entra aqui: o album
    // e memoria, nao painel de progressao (ponto 32).
    // ==========================================================
    function getStats(monumentId) {
        return {
            photos: photosOf(monumentId).length,
            // 0 ou 1: ou escreveu a memoria, ou nao
            memories: hasValidExperience(monumentId) ? 1 : 0,
            tags: tagsOf(monumentId).length
        };
    }

    // ==========================================================
    // A HISTORIA DO LUGAR (pontos 25 a 30)
    //
    // NAO SE INVENTA NADA. O projecto tem, por monumento, uma
    // descricao e uma historia (`monumentStories`). Nao tem
    // fotografia historica nem uma segunda curiosidade — por isso
    // essas partes simplesmente nao existem, em vez de serem
    // preenchidas com texto inventado (ponto 27).
    //
    // `historicalImage` e lido do proprio monumento: no dia em que
    // houver uma, a seccao mostra-a sem mais codigo.
    // ==========================================================
    function getStory(monumentId) {
        const monument = safe(function () { return sources.getMonument(monumentId); }, null);
        const text = safe(function () { return sources.getStory(monumentId); }, '');
        const story = typeof text === 'string' ? text.trim() : '';

        const image = monument && typeof monument.historicalImage === 'string'
            ? monument.historicalImage.trim()
            : '';

        // Uma segunda curiosidade so existe se o conteudo a tiver
        const curiosity = monument && typeof monument.curiosity === 'string'
            ? monument.curiosity.trim()
            : '';

        return {
            hasStory: !!story,
            story: story,
            hasImage: !!image,
            image: image || null,
            hasCuriosity: !!curiosity,
            curiosity: curiosity || null,
            // A seccao inteira so aparece se houver alguma coisa
            hasAny: !!(story || curiosity)
        };
    }

    // ==========================================================
    // ONDE ISTO ACONTECEU (ponto 33)
    // ==========================================================
    function getPlace(monumentId) {
        const monument = safe(function () { return sources.getMonument(monumentId); }, null);
        const zoneId = safe(function () { return sources.getZoneId(monumentId); }, null);

        const hasCoords = !!(monument &&
            typeof monument.lat === 'number' && typeof monument.lng === 'number');

        return {
            zoneId: zoneId || null,
            lat: hasCoords ? monument.lat : null,
            lng: hasCoords ? monument.lng : null,
            hasCoords: hasCoords
        };
    }

    // ==========================================================
    // QUE SECCOES EXISTEM (pontos 10 e 54)
    //
    // A navegacao interna so pode oferecer o que a pagina tem. Uma
    // aba que salta para uma seccao que nao foi desenhada e uma
    // aba partida — e as seccoes degradam de forma independente.
    // ==========================================================
    function getSections(monumentId) {
        const story = getStory(monumentId);

        return [
            // A visita e a memoria existem sempre: mesmo vazias,
            // tem estado editorial proprio (ponto 36).
            { id: 'visit', present: true },
            { id: 'memory', present: true },
            { id: 'story', present: story.hasAny },
            { id: 'summary', present: true }
        ].filter(function (section) { return section.present; });
    }

    // ==========================================================
    // O retrato completo, numa leitura
    //
    // A interface pede ISTO uma vez por render, em vez de chamar
    // oito funcoes e arriscar-se a ler o album a meio de uma
    // alteracao.
    // ==========================================================
    function getAlbum(monumentId) {
        return {
            monumentId: monumentId,
            monument: safe(function () { return sources.getMonument(monumentId); }, null),
            cover: getCover(monumentId),
            stamp: getStamp(monumentId),
            stage: getStage(monumentId),
            isEmpty: isEmpty(monumentId),
            photos: photosOf(monumentId),
            slots: getPhotoSlots(monumentId),
            rewards: getPhotoRewards(monumentId),
            pending: getPendingPhotos(monumentId).length,
            note: noteOf(monumentId),
            hasExperience: hasValidExperience(monumentId),
            experienceEarned: !!safe(function () {
                return sources.hasExperienceReward(monumentId);
            }, false),
            tags: tagsOf(monumentId),
            stats: getStats(monumentId),
            story: getStory(monumentId),
            place: getPlace(monumentId),
            sections: getSections(monumentId)
        };
    }

    const Album = {
        configure: configure,

        getAlbum: getAlbum,

        // Capa
        getCover: getCover,
        canBeCover: canBeCover,
        coverIsOrphan: coverIsOrphan,

        // Estado
        isMemorySaved: isMemorySaved,
        hasValidExperience: hasValidExperience,
        getStamp: getStamp,
        getStage: getStage,
        isEmpty: isEmpty,

        // Fotografias
        getPhotoSlots: getPhotoSlots,
        getPhotoRewards: getPhotoRewards,
        getPendingPhotos: getPendingPhotos,
        hasPendingPhotos: hasPendingPhotos,

        // Conteudo
        getStats: getStats,
        getStory: getStory,
        getPlace: getPlace,
        getSections: getSections,

        COVER: COVER_SOURCE,
        STAGE: ALBUM_STAGE
    };

    return {
        Album: Album,
        COVER_SOURCE: COVER_SOURCE,
        ALBUM_STAGE: ALBUM_STAGE
    };
});
