// ============================================================
// Heritage Hunt CV — testes do compressor de imagens
//
// So a aritmetica e testada: `compress()` precisa de canvas, e o
// projecto nao usa npm nem framework de testes.
//
//   node image-compressor.test.js
// ============================================================

const { ImageCompressor, COMPRESSION_PRESET } = require('./image-compressor.js');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('  ✓ ' + name);
    } catch (error) {
        failed++;
        failures.push({ name, error });
        console.log('  ✗ ' + name + '\n      ' + error.message);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'asserção falhou');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error((message || 'valores diferentes') +
            '\n      esperado: ' + JSON.stringify(expected) +
            '\n      obtido:   ' + JSON.stringify(actual));
    }
}

console.log('\n--- Redimensionar (fitWithin) ---');

test('uma imagem maior que o limite encolhe até ao limite', () => {
    const size = ImageCompressor.fitWithin(4000, 3000, 1600);
    assertEqual(size.width, 1600, 'a maior aresta passa a ser o limite');
    assertEqual(size.height, 1200, 'a altura acompanha a proporção');
    assert(size.scaled, 'devia assinalar que houve redimensionamento');
});

test('a proporção é preservada em retrato', () => {
    const size = ImageCompressor.fitWithin(3000, 4000, 1600);
    assertEqual(size.width, 1200);
    assertEqual(size.height, 1600);
});

test('uma imagem mais pequena que o limite passa incólume', () => {
    const size = ImageCompressor.fitWithin(800, 600, 1600);
    assertEqual(size.width, 800, 'nunca se aumenta uma imagem');
    assertEqual(size.height, 600);
    assert(!size.scaled, 'não houve redimensionamento');
});

test('uma imagem exactamente no limite não é tocada', () => {
    const size = ImageCompressor.fitWithin(1600, 900, 1600);
    assertEqual(size.width, 1600);
    assertEqual(size.height, 900);
    assert(!size.scaled);
});

test('uma imagem muito alongada nunca colapsa para zero', () => {
    const size = ImageCompressor.fitWithin(10000, 3, 1600);
    assert(size.height >= 1, 'a altura tem de ser pelo menos 1 pixel');
    assertEqual(size.width, 1600);
});

test('medidas inválidas não rebentam', () => {
    const size = ImageCompressor.fitWithin(0, 0, 1600);
    assertEqual(size.width, 0);
    assertEqual(size.height, 0);
});

console.log('\n--- Degraus de qualidade (nextQuality) ---');

test('desce um degrau de cada vez', () => {
    assertEqual(ImageCompressor.nextQuality(0.82, 0.45), 0.74);
    assertEqual(ImageCompressor.nextQuality(0.74, 0.45), 0.66);
});

test('nunca desce abaixo do mínimo do perfil', () => {
    assertEqual(ImageCompressor.nextQuality(0.5, 0.5), null,
        'no mínimo já não há para onde descer');
});

test('devolve null quando se esgotam os degraus', () => {
    assertEqual(ImageCompressor.nextQuality(0.45, 0.45), null);
});

test('um valor entre degraus apanha o degrau seguinte abaixo', () => {
    assertEqual(ImageCompressor.nextQuality(0.7, 0.45), 0.66);
});

console.log('\n--- Critério de aceitação (isAcceptable) ---');

const ALBUM = COMPRESSION_PRESET.ALBUM;

test('cabe no alvo, aceita-se logo', () => {
    assert(ImageCompressor.isAcceptable(100 * 1024, 0.82, ALBUM),
        '100 KB está abaixo do alvo de 180 KB');
});

test('acima do alvo, continua a tentar enquanto houver qualidade', () => {
    assert(!ImageCompressor.isAcceptable(500 * 1024, 0.82, ALBUM),
        'ainda há degraus por descer');
});

test('esgotados os degraus, aceita-se até ao tecto', () => {
    assert(ImageCompressor.isAcceptable(800 * 1024, ALBUM.minQuality, ALBUM),
        'no mínimo de qualidade, 800 KB ainda está dentro do tecto');
});

test('esgotados os degraus, recusa-se acima do tecto', () => {
    assert(!ImageCompressor.isAcceptable(2 * 1024 * 1024, ALBUM.minQuality, ALBUM),
        '2 MB ultrapassa o tecto mesmo no mínimo de qualidade');
});

console.log('\n--- Poupança (savingsPercent) ---');

test('conta a percentagem poupada', () => {
    assertEqual(ImageCompressor.savingsPercent(1000, 250), 75);
});

test('uma imagem que não encolheu poupa zero', () => {
    assertEqual(ImageCompressor.savingsPercent(1000, 1000), 0);
});

test('nunca devolve poupança negativa', () => {
    assertEqual(ImageCompressor.savingsPercent(1000, 1500), 0,
        'crescer não é poupar');
});

test('origem de tamanho zero não divide por zero', () => {
    assertEqual(ImageCompressor.savingsPercent(0, 100), 0);
});

console.log('\n--- Apresentação de tamanhos (formatBytes) ---');

test('bytes, KB e MB conforme a grandeza', () => {
    assertEqual(ImageCompressor.formatBytes(512), '512 B');
    assertEqual(ImageCompressor.formatBytes(150 * 1024), '150 KB');
    assertEqual(ImageCompressor.formatBytes(3 * 1024 * 1024), '3.0 MB');
});

test('valor em falta conta como zero', () => {
    assertEqual(ImageCompressor.formatBytes(undefined), '0 B');
});

console.log('\n--- Extensão do ficheiro (extensionFor) ---');

test('cada formato tem a sua extensão', () => {
    assertEqual(ImageCompressor.extensionFor('image/webp'), 'webp');
    assertEqual(ImageCompressor.extensionFor('image/png'), 'png');
    assertEqual(ImageCompressor.extensionFor('image/jpeg'), 'jpg');
});

test('formato desconhecido cai em jpg', () => {
    assertEqual(ImageCompressor.extensionFor('image/gif'), 'jpg');
});

console.log('\n--- Perfis ---');

test('o perfil do álbum é maior que o do avatar', () => {
    assert(COMPRESSION_PRESET.ALBUM.maxEdge > COMPRESSION_PRESET.AVATAR.maxEdge,
        'o álbum é visto em grande, o avatar num círculo');
    assert(COMPRESSION_PRESET.ALBUM.targetBytes > COMPRESSION_PRESET.AVATAR.targetBytes);
});

test('todos os perfis cabem no limite de 1 MB do bucket', () => {
    Object.keys(COMPRESSION_PRESET).forEach(nome => {
        const preset = COMPRESSION_PRESET[nome];
        assert(preset.ceilingBytes <= 1048576,
            'o tecto de ' + nome + ' ultrapassa o limite do bucket');
    });
});

test('os degraus de qualidade descem sempre', () => {
    const steps = ImageCompressor.QUALITY_STEPS;
    for (let i = 1; i < steps.length; i++) {
        assert(steps[i] < steps[i - 1], 'o degrau ' + i + ' não desce');
    }
});

test('cada perfil começa num degrau que existe', () => {
    Object.keys(COMPRESSION_PRESET).forEach(nome => {
        const preset = COMPRESSION_PRESET[nome];
        assert(preset.startQuality >= preset.minQuality,
            'o início de ' + nome + ' está abaixo do seu mínimo');
    });
});

console.log('\n----------------------------------------------------');
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('----------------------------------------------------\n');

if (failed > 0) {
    failures.forEach(f => console.log('  ✗ ' + f.name + ': ' + f.error.message));
    process.exit(1);
}
