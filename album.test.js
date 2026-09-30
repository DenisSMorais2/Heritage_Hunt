// ============================================================
// Heritage Hunt CV — testes do álbum do monumento
//
//   node album.test.js
// ============================================================

const { Album, COVER_SOURCE, ALBUM_STAGE } = require('./album.js');

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

function assertEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error((label || 'valor') + ': esperado ' + JSON.stringify(expected) +
            ', obtido ' + JSON.stringify(actual));
    }
}

// --- Um álbum de mentira, com as regras reais do projecto ---
//
// Limites verdadeiros: 10 fotografias guardadas, 3 com XP,
// experiência a partir de 10 caracteres.

const MONUMENT = {
    id: 5,
    name: 'Torre de Belém',
    image: 'imagens/torre_belem.jpg',
    lat: 16.8931,
    lng: -24.9883
};

function photo(id, extra) {
    return Object.assign({ id: id, path: 'u/5/' + id + '.webp', createdAt: '2026-09-29T10:00:00Z' }, extra || {});
}

// Estado mutável que os testes montam antes de cada caso
let db;

function reset(overrides) {
    db = Object.assign({
        monument: MONUMENT,
        photos: [],
        note: '',
        tags: [],
        coverId: null,
        discoveredAt: '2026-09-29T09:00:00Z',
        zoneId: 'frente_mar',
        story: 'É uma réplica da Torre de Belém de Lisboa.',
        photoRewardsUsed: 0
    }, overrides || {});

    Album.configure({
        getMonument: () => db.monument,
        getPhotos: () => db.photos,
        getNote: () => db.note,
        getTags: () => db.tags,
        getCoverId: () => db.coverId,
        getDiscoveredAt: () => db.discoveredAt,
        getZoneId: () => db.zoneId,
        getStory: () => db.story,
        getPhotoLimit: () => 10,
        getPhotoRewardLimit: () => 3,
        getPhotoRewardsUsed: () => db.photoRewardsUsed,
        hasExperienceReward: () => db.experienceEarned === true,
        getMinExperienceLength: () => 10
    });
}

// ============================================================
console.log('\nA CAPA\n');

test('sem fotografias, a capa é a imagem oficial', () => {
    reset();
    const cover = Album.getCover(5);
    assertEqual(cover.source, COVER_SOURCE.OFFICIAL, 'origem');
    assertEqual(cover.photo, null, 'fotografia');
    assertEqual(cover.image, 'imagens/torre_belem.jpg', 'imagem');
});

test('a primeira fotografia passa a ser capa sem se escolher nada', () => {
    reset({ photos: [photo('p1'), photo('p2')] });
    const cover = Album.getCover(5);
    assertEqual(cover.source, COVER_SOURCE.FIRST, 'origem');
    assertEqual(cover.photo.id, 'p1', 'fotografia');
});

test('a escolha da pessoa vence a primeira fotografia', () => {
    reset({ photos: [photo('p1'), photo('p2')], coverId: 'p2' });
    const cover = Album.getCover(5);
    assertEqual(cover.source, COVER_SOURCE.CHOSEN, 'origem');
    assertEqual(cover.photo.id, 'p2', 'fotografia');
});

test('apagar a capa escolhida cai para a primeira, não deixa o álbum sem imagem', () => {
    reset({ photos: [photo('p1'), photo('p3')], coverId: 'p2' });
    const cover = Album.getCover(5);
    assertEqual(cover.source, COVER_SOURCE.FIRST, 'origem');
    assertEqual(cover.photo.id, 'p1', 'fotografia');
});

test('apagar a última fotografia devolve a imagem oficial', () => {
    reset({ photos: [], coverId: 'p1' });
    assertEqual(Album.getCover(5).source, COVER_SOURCE.OFFICIAL, 'origem');
});

test('uma escolha que já não existe é órfã', () => {
    reset({ photos: [photo('p1')], coverId: 'p9' });
    assertEqual(Album.coverIsOrphan(5), true, 'órfã');
    reset({ photos: [photo('p1')], coverId: 'p1' });
    assertEqual(Album.coverIsOrphan(5), false, 'válida');
    reset({ photos: [photo('p1')] });
    assertEqual(Album.coverIsOrphan(5), false, 'sem escolha não é órfã');
});

test('só uma fotografia do próprio álbum pode ser capa', () => {
    reset({ photos: [photo('p1'), photo('p2')] });
    assertEqual(Album.canBeCover(5, 'p2'), true, 'do álbum');
    assertEqual(Album.canBeCover(5, 'de_outra_pessoa'), false, 'de fora');
    assertEqual(Album.canBeCover(5, null), false, 'nenhuma');
    assertEqual(Album.canBeCover(5, ''), false, 'vazia');
});

test('um monumento sem imagem oficial não parte a capa', () => {
    reset({ monument: { id: 5, name: 'X' } });
    const cover = Album.getCover(5);
    assertEqual(cover.source, COVER_SOURCE.OFFICIAL, 'origem');
    assertEqual(cover.image, null, 'imagem');
});

// ============================================================
console.log('\nMEMÓRIA GUARDADA\n');

test('descoberto sem nada não é memória guardada', () => {
    reset();
    assertEqual(Album.isMemorySaved(5), false, 'guardada');
    assertEqual(Album.getStamp(5).saved, false, 'selo');
});

test('uma fotografia chega para ser memória guardada', () => {
    reset({ photos: [photo('p1')] });
    assertEqual(Album.isMemorySaved(5), true, 'guardada');
});

test('uma experiência válida chega, mesmo sem fotografias', () => {
    reset({ note: 'A vista sobre a baía foi o que mais me marcou.' });
    assertEqual(Album.isMemorySaved(5), true, 'guardada');
});

test('uma experiência curta de mais não conta — a mesma regra do XP', () => {
    reset({ note: 'bonito' });
    assertEqual(Album.hasValidExperience(5), false, 'válida');
    assertEqual(Album.isMemorySaved(5), false, 'guardada');
});

test('exactamente o mínimo já conta', () => {
    reset({ note: '1234567890' });
    assertEqual(Album.hasValidExperience(5), true, 'válida');
});

test('espaços à volta não fazem de um texto vazio uma memória', () => {
    reset({ note: '              ' });
    assertEqual(Album.hasValidExperience(5), false, 'válida');
    assertEqual(Album.isMemorySaved(5), false, 'guardada');
});

test('etiquetas sozinhas não são memória guardada', () => {
    reset({ tags: ['architecture', 'memorable'] });
    assertEqual(Album.isMemorySaved(5), false, 'guardada');
});

test('o selo leva a data da descoberta', () => {
    reset();
    assertEqual(Album.getStamp(5).discoveredAt, '2026-09-29T09:00:00Z', 'data');
});

// ============================================================
console.log('\nA TRANSFORMAÇÃO DO ÁLBUM\n');

test('vazio: só descoberto', () => {
    reset();
    assertEqual(Album.getStage(5), ALBUM_STAGE.DISCOVERED, 'estado');
    assertEqual(Album.isEmpty(5), true, 'vazio');
});

test('a primeira fotografia muda o estado', () => {
    reset({ photos: [photo('p1')] });
    assertEqual(Album.getStage(5), ALBUM_STAGE.FIRST_PHOTO, 'estado');
    assertEqual(Album.isEmpty(5), false, 'vazio');
});

test('várias fotografias', () => {
    reset({ photos: [photo('p1'), photo('p2')] });
    assertEqual(Album.getStage(5), ALBUM_STAGE.PHOTOS, 'estado');
});

test('a experiência escrita pesa mais do que as fotografias', () => {
    reset({ photos: [photo('p1'), photo('p2')], note: 'Uma memória com peso.' });
    assertEqual(Album.getStage(5), ALBUM_STAGE.WRITTEN, 'estado');
});

test('fotografias + experiência + etiquetas é o álbum rico', () => {
    reset({
        photos: [photo('p1')],
        note: 'Uma memória com peso.',
        tags: ['architecture']
    });
    assertEqual(Album.getStage(5), ALBUM_STAGE.RICH, 'estado');
});

test('etiquetas sem fotografias não fazem um álbum rico', () => {
    reset({ note: 'Uma memória com peso.', tags: ['architecture'] });
    assertEqual(Album.getStage(5), ALBUM_STAGE.WRITTEN, 'estado');
});

test('só etiquetas: continua descoberto, mas já não está vazio', () => {
    reset({ tags: ['architecture'] });
    assertEqual(Album.getStage(5), ALBUM_STAGE.DISCOVERED, 'estado');
    assertEqual(Album.isEmpty(5), false, 'vazio');
});

// ============================================================
console.log('\nFOTOGRAFIAS: GUARDAR ≠ RECOMPENSAR\n');

test('os lugares de guarda são os 10 reais, não os 6 do desenho', () => {
    reset({ photos: [photo('p1'), photo('p2'), photo('p3')] });
    const slots = Album.getPhotoSlots(5);
    assertEqual(slots.used, 3, 'usados');
    assertEqual(slots.max, 10, 'máximo');
    assertEqual(slots.remaining, 7, 'restantes');
    assertEqual(slots.isFull, false, 'cheio');
});

test('o álbum cheio é aos 10', () => {
    const many = [];
    for (let i = 0; i < 10; i++) many.push(photo('p' + i));
    reset({ photos: many });
    const slots = Album.getPhotoSlots(5);
    assertEqual(slots.isFull, true, 'cheio');
    assertEqual(slots.remaining, 0, 'restantes');
});

test('as recompensas são 3, e contam-se à parte dos lugares', () => {
    reset({ photos: [photo('p1'), photo('p2')], photoRewardsUsed: 2 });
    const rewards = Album.getPhotoRewards(5);
    assertEqual(rewards.used, 2, 'usadas');
    assertEqual(rewards.max, 3, 'máximo');
    assertEqual(rewards.remaining, 1, 'restantes');
    assertEqual(rewards.exhausted, false, 'esgotadas');
});

test('a quarta fotografia guarda-se, mas já não rende', () => {
    reset({
        photos: [photo('p1'), photo('p2'), photo('p3'), photo('p4')],
        photoRewardsUsed: 3
    });
    assertEqual(Album.getPhotoSlots(5).isFull, false, 'ainda cabe');
    assertEqual(Album.getPhotoRewards(5).exhausted, true, 'já não rende');
    assertEqual(Album.getPhotoRewards(5).remaining, 0, 'restantes');
});

test('apagar não devolve recompensas: 1 fotografia com 3 lugares gastos', () => {
    reset({ photos: [photo('p1')], photoRewardsUsed: 3 });
    assertEqual(Album.getPhotoSlots(5).used, 1, 'guardadas');
    assertEqual(Album.getPhotoRewards(5).exhausted, true, 'recompensas gastas');
});

// ============================================================
console.log('\nFOTOGRAFIAS PENDENTES\n');

test('sem rede, a fotografia conta na mesma e fica marcada', () => {
    reset({ photos: [photo('p1'), { id: 'p2', data: 'data:...', pending: true }] });
    assertEqual(Album.getPhotoSlots(5).used, 2, 'guardadas');
    assertEqual(Album.hasPendingPhotos(5), true, 'pendentes');
    assertEqual(Album.getPendingPhotos(5).length, 1, 'quantas');
});

test('tudo sincronizado não deixa estado pendente', () => {
    reset({ photos: [photo('p1'), photo('p2')] });
    assertEqual(Album.hasPendingPhotos(5), false, 'pendentes');
});

test('uma fotografia pendente pode ser capa como qualquer outra', () => {
    reset({ photos: [{ id: 'p1', data: 'data:...', pending: true }] });
    assertEqual(Album.getCover(5).photo.id, 'p1', 'capa');
    assertEqual(Album.canBeCover(5, 'p1'), true, 'elegível');
});

// ============================================================
console.log('\nA VISITA EM NÚMEROS\n');

test('três indicadores, todos pessoais', () => {
    reset({
        photos: [photo('p1'), photo('p2'), photo('p3')],
        note: 'A vista sobre a baía foi o que mais me marcou.',
        tags: ['architecture', 'memorable', 'comeback']
    });
    const stats = Album.getStats(5);
    assertEqual(stats.photos, 3, 'fotografias');
    assertEqual(stats.memories, 1, 'memórias');
    assertEqual(stats.tags, 3, 'etiquetas');
});

test('a memória é 0 ou 1, nunca um contador', () => {
    reset({ note: 'Uma memória bem longa e escrita com cuidado.' });
    assertEqual(Album.getStats(5).memories, 1, 'memórias');
    reset({ note: 'curto' });
    assertEqual(Album.getStats(5).memories, 0, 'memórias');
});

test('um álbum vazio dá três zeros, não rebenta', () => {
    reset();
    const stats = Album.getStats(5);
    assertEqual(stats.photos, 0, 'fotografias');
    assertEqual(stats.memories, 0, 'memórias');
    assertEqual(stats.tags, 0, 'etiquetas');
});

// ============================================================
console.log('\nA HISTÓRIA DO LUGAR — SEM INVENTAR NADA\n');

test('com história, a secção existe', () => {
    reset();
    const story = Album.getStory(5);
    assertEqual(story.hasStory, true, 'tem história');
    assertEqual(story.hasAny, true, 'secção existe');
});

test('sem história, a secção não existe', () => {
    reset({ story: '' });
    const story = Album.getStory(5);
    assertEqual(story.hasStory, false, 'tem história');
    assertEqual(story.hasAny, false, 'secção existe');
});

test('sem fotografia histórica não se inventa uma', () => {
    reset();
    const story = Album.getStory(5);
    assertEqual(story.hasImage, false, 'tem imagem');
    assertEqual(story.image, null, 'imagem');
});

test('havendo fotografia histórica no conteúdo, ela aparece', () => {
    reset({ monument: Object.assign({}, MONUMENT, { historicalImage: 'imagens/hist.jpg' }) });
    const story = Album.getStory(5);
    assertEqual(story.hasImage, true, 'tem imagem');
    assertEqual(story.image, 'imagens/hist.jpg', 'imagem');
});

test('sem segunda curiosidade não se desenha o cartão', () => {
    reset();
    assertEqual(Album.getStory(5).hasCuriosity, false, 'curiosidade');
});

test('havendo curiosidade no conteúdo, ela aparece', () => {
    reset({ monument: Object.assign({}, MONUMENT, { curiosity: 'No seu interior existia...' }) });
    const story = Album.getStory(5);
    assertEqual(story.hasCuriosity, true, 'curiosidade');
    assertEqual(story.curiosity, 'No seu interior existia...', 'texto');
});

test('só curiosidade, sem história, ainda faz a secção existir', () => {
    reset({
        story: '',
        monument: Object.assign({}, MONUMENT, { curiosity: 'Uma nota curta.' })
    });
    assertEqual(Album.getStory(5).hasAny, true, 'secção existe');
});

test('espaços em branco não são conteúdo', () => {
    reset({ story: '    ' });
    assertEqual(Album.getStory(5).hasStory, false, 'tem história');
});

// ============================================================
console.log('\nO LUGAR\n');

test('o monumento traz zona e coordenadas', () => {
    reset();
    const place = Album.getPlace(5);
    assertEqual(place.zoneId, 'frente_mar', 'zona');
    assertEqual(place.hasCoords, true, 'coordenadas');
});

test('sem coordenadas o cartão sabe que não as tem', () => {
    reset({ monument: { id: 5, name: 'X', image: 'a.jpg' } });
    assertEqual(Album.getPlace(5).hasCoords, false, 'coordenadas');
});

test('sem zona não se inventa uma', () => {
    reset({ zoneId: null });
    assertEqual(Album.getPlace(5).zoneId, null, 'zona');
});

// ============================================================
console.log('\nAS SECÇÕES DA NAVEGAÇÃO INTERNA\n');

test('com história há quatro secções', () => {
    reset();
    assertEqual(Album.getSections(5).map(s => s.id).join(','), 'visit,memory,story,summary', 'secções');
});

test('sem história a aba não é oferecida', () => {
    reset({ story: '' });
    assertEqual(Album.getSections(5).map(s => s.id).join(','), 'visit,memory,summary', 'secções');
});

test('a visita e a memória existem sempre, mesmo vazias', () => {
    reset({ story: '' });
    const ids = Album.getSections(5).map(s => s.id);
    assert(ids.indexOf('visit') !== -1, 'visita');
    assert(ids.indexOf('memory') !== -1, 'memória');
});

// ============================================================
console.log('\nO RETRATO COMPLETO\n');

test('getAlbum responde a tudo numa leitura', () => {
    reset({
        photos: [photo('p1'), photo('p2')],
        coverId: 'p2',
        note: 'A vista sobre a baía foi o que mais me marcou.',
        tags: ['architecture'],
        photoRewardsUsed: 2,
        experienceEarned: true
    });

    const album = Album.getAlbum(5);
    assertEqual(album.cover.source, COVER_SOURCE.CHOSEN, 'capa');
    assertEqual(album.stamp.saved, true, 'selo');
    assertEqual(album.stage, ALBUM_STAGE.RICH, 'estado');
    assertEqual(album.isEmpty, false, 'vazio');
    assertEqual(album.slots.used, 2, 'fotografias');
    assertEqual(album.rewards.remaining, 1, 'recompensas');
    assertEqual(album.hasExperience, true, 'experiência');
    assertEqual(album.experienceEarned, true, 'XP da experiência');
    assertEqual(album.stats.tags, 1, 'etiquetas');
    assertEqual(album.story.hasStory, true, 'história');
    assertEqual(album.sections.length, 4, 'secções');
});

test('getAlbum num álbum acabado de descobrir não rebenta em nada', () => {
    reset();
    const album = Album.getAlbum(5);
    assertEqual(album.cover.source, COVER_SOURCE.OFFICIAL, 'capa');
    assertEqual(album.stamp.saved, false, 'selo');
    assertEqual(album.isEmpty, true, 'vazio');
    assertEqual(album.photos.length, 0, 'fotografias');
    assertEqual(album.note, '', 'nota');
    assertEqual(album.stats.photos, 0, 'números');
});

// ============================================================
console.log('\nFONTES QUE FALHAM\n');

test('uma fonte que rebenta não parte o álbum', () => {
    Album.configure({
        getMonument: () => { throw new Error('ups'); },
        getPhotos: () => { throw new Error('ups'); },
        getNote: () => { throw new Error('ups'); },
        getTags: () => { throw new Error('ups'); },
        getCoverId: () => { throw new Error('ups'); },
        getDiscoveredAt: () => { throw new Error('ups'); },
        getZoneId: () => { throw new Error('ups'); },
        getStory: () => { throw new Error('ups'); },
        getPhotoLimit: () => { throw new Error('ups'); },
        getPhotoRewardLimit: () => { throw new Error('ups'); },
        getPhotoRewardsUsed: () => { throw new Error('ups'); },
        hasExperienceReward: () => { throw new Error('ups'); },
        getMinExperienceLength: () => { throw new Error('ups'); }
    });

    const album = Album.getAlbum(5);
    assertEqual(album.photos.length, 0, 'fotografias');
    assertEqual(album.isEmpty, true, 'vazio');
    assertEqual(album.cover.source, COVER_SOURCE.OFFICIAL, 'capa');
});

test('fontes que devolvem lixo são ignoradas, não propagadas', () => {
    reset({ photos: 'não é uma lista', tags: 42, note: null });
    const album = Album.getAlbum(5);
    assertEqual(album.photos.length, 0, 'fotografias');
    assertEqual(album.tags.length, 0, 'etiquetas');
    assertEqual(album.note, '', 'nota');
});

test('entradas inválidas na lista de fotografias são descartadas', () => {
    reset({ photos: [photo('p1'), null, 'string solta', 7] });
    assertEqual(Album.getAlbum(5).photos.length, 1, 'fotografias');
});

// ============================================================
console.log('');
console.log('─'.repeat(52));
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('─'.repeat(52));

if (failed) {
    console.log('\nFalhas:');
    failures.forEach(f => console.log('  • ' + f.name + '\n    ' + f.error.message));
    process.exit(1);
}
