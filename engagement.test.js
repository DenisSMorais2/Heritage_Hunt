// ============================================================
// Heritage Hunt CV — testes do loop de descoberta
//
// O projecto nao usa npm nem framework de testes, por isso este
// runner segue o formato de xp.test.js / journey.test.js.
//
//   node engagement.test.js
// ============================================================

const { Engagement } = require('./engagement.js');

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

// --- Ajudas -------------------------------------------------

// As 4 zonas e os 12 monumentos reais do projecto (script.js), para
// que os testes falem dos numeros do enunciado: 3/4, 11/12, 12/12.
const MONUMENTS = [
    { id: 1,  name: 'Palácio do Povo',       points: 50, lat: 16.8909, lng: -24.9878, image: 'a.jpg' },
    { id: 2,  name: 'Farol de D. Amélia',    points: 40, lat: 16.8925, lng: -24.9892, image: 'b.jpg' },
    { id: 3,  name: 'Mercado Municipal',     points: 30, lat: 16.8883, lng: -24.9847, image: 'c.jpg' },
    { id: 4,  name: 'Igreja N. S. da Luz',   points: 45, lat: 16.8912, lng: -24.9865, image: 'd.jpg' },
    { id: 5,  name: 'Torre de Belém',        points: 35, lat: 16.8931, lng: -24.9883, image: 'e.jpg' },
    { id: 6,  name: 'Edifício da Alfândega', points: 30, lat: 16.8876, lng: -24.9859, image: 'f.jpg' },
    { id: 7,  name: 'Casa da Morna',         points: 40, lat: 16.8902, lng: -24.9871, image: 'g.jpg' },
    { id: 8,  name: 'Praça Nova',            points: 25, lat: 16.8895, lng: -24.9868, image: 'h.jpg' },
    { id: 9,  name: 'Centro de Artesanato',  points: 35, lat: 16.8928, lng: -24.9886, image: 'i.jpg' },
    { id: 10, name: 'Casa da Cultura',       points: 40, lat: 16.8918, lng: -24.9874, image: 'j.jpg' },
    { id: 11, name: 'Porto de Mindelo',      points: 50, lat: 16.8867, lng: -24.9839, image: 'k.jpg' },
    { id: 12, name: 'Fortim d\'El Rei',      points: 45, lat: 16.8942, lng: -24.9895, image: 'l.jpg' }
];

const ZONES = [
    { id: 'centro_historico', monumentIds: [1, 3, 4, 8] },
    { id: 'frente_mar',       monumentIds: [5, 6, 11] },
    { id: 'colinas',          monumentIds: [2, 12] },
    { id: 'cultura_viva',     monumentIds: [7, 9, 10] }
];

// A ordem do percurso: as zonas pela ordem de JOURNEY_CONFIG, e os
// monumentos pela ordem de cada zona.
const JOURNEY_ORDER = [1, 3, 4, 8, 5, 6, 11, 2, 12, 7, 9, 10];

/**
 * Configura o dominio com uma lista de descobertas.
 *
 * `discovered` e CRONOLOGICO: o ultimo id e o mais recente, e e
 * dele que sai a "zona actual".
 */
function setup(discovered, options) {
    const config = options || {};
    let found = (discovered || []).slice();

    // Reimplementacoes minimas do que journey.js e levels.js dao na
    // app. Aqui interessa testar a ESCOLHA do engagement, nao voltar
    // a testar a aritmetica que esses ficheiros ja tem coberta.
    const zoneProgress = (zoneId) => {
        const zone = ZONES.filter(z => z.id === zoneId)[0];
        if (!zone) return null;
        const done = zone.monumentIds.filter(id => found.indexOf(id) !== -1).length;
        return {
            zoneId: zoneId,
            total: zone.monumentIds.length,
            discovered: done,
            remaining: zone.monumentIds.length - done,
            percent: Math.round((done / zone.monumentIds.length) * 100),
            isComplete: done === zone.monumentIds.length
        };
    };

    const journeyProgress = () => ({
        total: MONUMENTS.length,
        discovered: found.length,
        remaining: MONUMENTS.length - found.length,
        percent: Math.round((found.length / MONUMENTS.length) * 100),
        isCompleted: found.length === MONUMENTS.length,
        isEmpty: found.length === 0
    });

    const currentStep = () => {
        const nextId = JOURNEY_ORDER.filter(id => found.indexOf(id) === -1)[0];
        if (nextId === undefined) return null;
        return {
            monumentId: nextId,
            monument: MONUMENTS.filter(m => m.id === nextId)[0],
            zoneId: (ZONES.filter(z => z.monumentIds.indexOf(nextId) !== -1)[0] || {}).id || null
        };
    };

    Engagement.configure({
        getMonuments: () => MONUMENTS,
        getZones: () => ZONES,
        getDiscoveredIds: () => found,
        getJourneyProgress: journeyProgress,
        getCurrentStep: currentStep,
        getZoneProgress: zoneProgress,
        getLevelProgress: config.getLevelProgress || (() => null),
        getDistanceTo: config.getDistanceTo || (() => null),
        getMemoryCounts: config.getMemoryCounts || (() => ({ photos: 0, experiences: 0 }))
    });

    return {
        discover: (id) => { if (found.indexOf(id) === -1) found.push(id); },
        set: (list) => { found = list.slice(); }
    };
}

// Nivel a 35 XP de distancia, como no exemplo do enunciado
function levelNear(remaining) {
    return () => ({
        currentLevel: { id: 'explorer', level: 1 },
        nextLevel: { id: 'traveler', level: 2 },
        xpRemaining: remaining,
        isMaxLevel: false
    });
}

// ============================================================
console.log('\nPRÓXIMA DESCOBERTA — nunca aleatória, sempre com motivo\n');
// ============================================================

test('utilizador novo (0/12): recomenda a primeira etapa do percurso', () => {
    setup([]);
    const next = Engagement.getNextDiscovery();

    assert(next !== null, 'devia haver uma recomendação');
    assertEqual(next.reason, Engagement.REASON.FIRST, 'motivo');
    assertEqual(next.monumentId, 1, 'monumento');
    assertEqual(next.type, 'monument', 'tipo');
});

test('nunca recomenda um monumento já descoberto', () => {
    const world = setup([1, 3, 4]);

    for (let i = 0; i < 9; i++) {
        const next = Engagement.getNextDiscovery();
        assert(next !== null, 'devia haver recomendação na volta ' + i);
        assert([1, 3, 4].indexOf(next.monumentId) === -1 || i > 0,
            'recomendou um já descoberto: ' + next.monumentId);
        world.discover(next.monumentId);
    }
});

test('falta 1 na zona actual: recomenda esse monumento (LAST_IN_ZONE)', () => {
    // Centro Histórico [1, 3, 4, 8] — falta o 8. O último descoberto
    // é o 4, por isso a zona actual é o Centro Histórico.
    setup([1, 3, 4]);
    const next = Engagement.getNextDiscovery();

    assertEqual(next.reason, Engagement.REASON.LAST_IN_ZONE, 'motivo');
    assertEqual(next.monumentId, 8, 'monumento');
    assertEqual(next.zoneId, 'centro_historico', 'zona');
});

test('fechar a zona vence a ordem do percurso', () => {
    // Colinas [2, 12] — falta o 12. A ordem do percurso mandaria o 3
    // (a seguir ao 1), mas fechar uma zona vale mais.
    setup([1, 2]);
    const next = Engagement.getNextDiscovery();

    assertEqual(next.reason, Engagement.REASON.LAST_IN_ZONE, 'motivo');
    assertEqual(next.monumentId, 12, 'monumento');
});

test('sem zona quase feita: segue a próxima etapa da Jornada', () => {
    // 1 e 3 descobertos: faltam 2 no Centro Histórico, nenhuma zona
    // está a um monumento do fim.
    setup([1, 3]);
    const next = Engagement.getNextDiscovery();

    assertEqual(next.reason, Engagement.REASON.JOURNEY_STEP, 'motivo');
    assertEqual(next.monumentId, 4, 'monumento');
});

test('11/12: o último lugar da jornada tem motivo próprio', () => {
    const all = MONUMENTS.map(m => m.id);
    setup(all.filter(id => id !== 1));

    const next = Engagement.getNextDiscovery();
    assertEqual(next.reason, Engagement.REASON.LAST_IN_JOURNEY, 'motivo');
    assertEqual(next.monumentId, 1, 'monumento');
});

test('12/12: não há próxima descoberta que inventar', () => {
    setup(MONUMENTS.map(m => m.id));
    assertEqual(Engagement.getNextDiscovery(), null, 'recomendação');
});

test('duas zonas a um do fim: desempata pela mais próxima', () => {
    // Faltam o 8 (Centro Histórico) e o 12 (Colinas). O último
    // descoberto é o 7 (Cultura Viva), por isso não há zona actual
    // entre as candidatas e a distância decide.
    setup([1, 3, 4, 2, 7], {
        getDistanceTo: (monument) => (monument.id === 12 ? 200 : 4000)
    });

    const next = Engagement.getNextDiscovery();
    assertEqual(next.reason, Engagement.REASON.LAST_IN_ZONE, 'motivo');
    assertEqual(next.monumentId, 12, 'devia escolher o mais próximo');
});

test('sem localização, a escolha é igual em todos os aparelhos', () => {
    setup([1, 3, 4, 2, 7]);
    const first = Engagement.getNextDiscovery();

    setup([1, 3, 4, 2, 7]);
    const second = Engagement.getNextDiscovery();

    assertEqual(first.monumentId, second.monumentId, 'monumento');
    // Sem distância ganha a primeira zona da ordem do percurso
    assertEqual(first.zoneId, 'centro_historico', 'zona');
});

test('a zona actual vence a proximidade', () => {
    // Último descoberto: 4 (Centro Histórico, falta o 8). Mesmo com o
    // 12 muito mais perto, acabar o que se começou vale mais — o
    // cartão não pode mudar a cada passo que a pessoa dá.
    setup([1, 2, 3, 4], {
        getDistanceTo: (monument) => (monument.id === 12 ? 50 : 3000)
    });

    const next = Engagement.getNextDiscovery();
    assertEqual(next.monumentId, 8, 'monumento');
    assertEqual(next.zoneId, 'centro_historico', 'zona');
});

test('a distância entra no resultado quando existe', () => {
    setup([1, 3, 4], { getDistanceTo: () => 650 });
    assertEqual(Engagement.getNextDiscovery().distance, 650, 'distância');
});

test('sem localização, o cartão mostra-se sem distância (offline)', () => {
    setup([1, 3, 4]);
    assertEqual(Engagement.getNextDiscovery().distance, null, 'distância');
});

test('uma fonte de distância que rebenta não derruba a recomendação', () => {
    setup([1, 3, 4], {
        getDistanceTo: () => { throw new Error('sem permissão'); }
    });

    const next = Engagement.getNextDiscovery();
    assert(next !== null, 'devia haver recomendação');
    assertEqual(next.distance, null, 'distância');
});

test('o resultado traz o que o cartão precisa de desenhar', () => {
    setup([1, 3, 4]);
    const next = Engagement.getNextDiscovery();

    assertEqual(next.title, 'Praça Nova', 'título');
    assertEqual(next.image, 'h.jpg', 'imagem');
    assertEqual(next.points, 25, 'pontos');
    assert(next.monument !== undefined, 'devia trazer o monumento');
});

// ============================================================
console.log('\nQUASE LÁ — uma mensagem, nunca cinco\n');
// ============================================================

test('0 descobertas: não está "quase" nada', () => {
    setup([]);
    assertEqual(Engagement.getAlmostThere(), null, 'mensagem');
});

test('falta 1 na zona: fala da zona', () => {
    setup([1, 3, 4]);
    const almost = Engagement.getAlmostThere();

    assertEqual(almost.rule, Engagement.RULE.ZONE_ONE_LEFT, 'regra');
    assertEqual(almost.zoneId, 'centro_historico', 'zona');
    assertEqual(almost.vars.done, 3, 'descobertos na zona');
    assertEqual(almost.vars.total, 4, 'total da zona');
});

test('faltam 2 na zona: "mais 2 descobertas"', () => {
    setup([1, 3]);
    const almost = Engagement.getAlmostThere();

    assertEqual(almost.rule, Engagement.RULE.ZONE_FEW_LEFT, 'regra');
    assertEqual(almost.vars.n, 2, 'quantas faltam');
});

test('zona quase feita VENCE o nível quase subido (ponto 9)', () => {
    // Os dois ao mesmo tempo: 1 monumento de fechar a zona e 35 XP de
    // subir de nível. Só se diz um — e é a zona.
    setup([1, 3, 4], { getLevelProgress: levelNear(35) });

    const almost = Engagement.getAlmostThere();
    assertEqual(almost.rule, Engagement.RULE.ZONE_ONE_LEFT, 'regra');
});

test('uma zona intocada não conta como "quase lá"', () => {
    // As Colinas só têm 2 monumentos: a 0/2 estão sempre "a 2 do
    // fim". Isso é estar no início, não estar quase a acabar — por
    // isso a regra da zona exige zonas começadas.
    setup([1, 3, 4, 8], { getLevelProgress: levelNear(35) });

    const almost = Engagement.getAlmostThere();
    assert(almost.rule !== Engagement.RULE.ZONE_FEW_LEFT,
        'não devia falar de uma zona intocada');
});

test('sem zona começada por fechar, o nível entra', () => {
    // 1, 3, 4, 8 fecham o Centro Histórico e nenhuma outra zona foi
    // começada, por isso sobra o nível.
    setup([1, 3, 4, 8], { getLevelProgress: levelNear(35) });

    const almost = Engagement.getAlmostThere();
    assertEqual(almost.rule, Engagement.RULE.LEVEL_CLOSE, 'regra');
    assertEqual(almost.vars.n, 35, 'XP que faltam');
    assertEqual(almost.levelId, 'traveler', 'nível');
});

test('uma zona começada e a 2 do fim volta a contar', () => {
    // Colinas [2, 12] com o 2 descoberto: 1/2, falta 1 — começada.
    setup([1, 3, 4, 8, 2], { getLevelProgress: levelNear(35) });

    const almost = Engagement.getAlmostThere();
    assertEqual(almost.rule, Engagement.RULE.ZONE_ONE_LEFT, 'regra');
    assertEqual(almost.zoneId, 'colinas', 'zona');
});

test('um nível ainda longe não é "quase lá"', () => {
    setup([1, 3, 4, 8], { getLevelProgress: levelNear(220) });

    const almost = Engagement.getAlmostThere();
    assertEqual(almost.rule, Engagement.RULE.JOURNEY_PROGRESS, 'regra');
});

test('11/12 vence tudo o resto', () => {
    const all = MONUMENTS.map(m => m.id);
    setup(all.filter(id => id !== 1), { getLevelProgress: levelNear(10) });

    const almost = Engagement.getAlmostThere();
    assertEqual(almost.rule, Engagement.RULE.JOURNEY_ONE_LEFT, 'regra');
    assertEqual(almost.isMajor, true, 'devia ter maior importância visual');
    assertEqual(almost.vars.done, 11, 'descobertos');
    assertEqual(almost.vars.total, 12, 'total');
});

test('12/12: já não falta nada', () => {
    setup(MONUMENTS.map(m => m.id));
    assertEqual(Engagement.getAlmostThere(), null, 'mensagem');
});

test('sem nada iminente, sobra o progresso da jornada', () => {
    // Centro Histórico e Cultura Viva completos; frente_mar e colinas
    // intocadas. Sem nível configurado, não há nada iminente.
    setup([1, 3, 4, 8, 7, 9, 10]);
    const almost = Engagement.getAlmostThere();

    assertEqual(almost.rule, Engagement.RULE.JOURNEY_PROGRESS, 'regra');
    assertEqual(almost.vars.done, 7, 'descobertos');
    assertEqual(almost.vars.total, 12, 'total');
});

// ============================================================
console.log('\nZONAS E ESTADO DA JORNADA\n');
// ============================================================

test('progresso por zona: 3 / 4 no Centro Histórico', () => {
    setup([1, 3, 4]);
    const zones = Engagement.getZoneStates();
    const centro = zones.filter(z => z.zoneId === 'centro_historico')[0];

    assertEqual(centro.discovered, 3, 'descobertos');
    assertEqual(centro.total, 4, 'total');
    assertEqual(centro.remaining, 1, 'a faltar');
    assertEqual(centro.percent, 75, 'percentagem');
    assertEqual(centro.isComplete, false, 'completa');
});

test('progresso por zona: 4 / 4 conclui', () => {
    setup([1, 3, 4, 8]);
    const centro = Engagement.getZoneStates().filter(z => z.zoneId === 'centro_historico')[0];

    assertEqual(centro.discovered, 4, 'descobertos');
    assertEqual(centro.percent, 100, 'percentagem');
    assertEqual(centro.isComplete, true, 'completa');
});

test('as zonas saem pela ordem do percurso', () => {
    setup([]);
    const ids = Engagement.getZoneStates().map(z => z.zoneId);
    assertEqual(ids.join(','), 'centro_historico,frente_mar,colinas,cultura_viva', 'ordem');
});

test('a zona actual é a do último lugar descoberto', () => {
    setup([1, 3, 7]);
    assertEqual(Engagement.getCurrentZoneId(), 'cultura_viva', 'zona actual');
});

test('sem descobertas não há zona actual', () => {
    setup([]);
    assertEqual(Engagement.getCurrentZoneId(), null, 'zona actual');
});

test('estados da jornada: empty / exploring / lastOne / complete', () => {
    const all = MONUMENTS.map(m => m.id);

    setup([]);
    assertEqual(Engagement.getJourneyState(), 'empty', '0/12');

    setup([1, 3]);
    assertEqual(Engagement.getJourneyState(), 'exploring', '2/12');

    setup(all.slice(0, 11));
    assertEqual(Engagement.getJourneyState(), 'lastOne', '11/12');

    setup(all);
    assertEqual(Engagement.getJourneyState(), 'complete', '12/12');
});

test('resumo dos 12/12: o que foi construído', () => {
    setup(MONUMENTS.map(m => m.id), {
        getMemoryCounts: () => ({ photos: 18, experiences: 7 })
    });

    const summary = Engagement.getCompletionSummary();
    assertEqual(summary.monuments, 12, 'monumentos');
    assertEqual(summary.monumentsTotal, 12, 'total');
    assertEqual(summary.zones, 4, 'zonas concluídas');
    assertEqual(summary.zonesTotal, 4, 'zonas');
    assertEqual(summary.photos, 18, 'fotografias');
    assertEqual(summary.experiences, 7, 'memórias');
    assertEqual(summary.isComplete, true, 'completa');
});

test('contagens de memórias em falta não partem o resumo', () => {
    setup(MONUMENTS.map(m => m.id), {
        getMemoryCounts: () => { throw new Error('sem álbum'); }
    });

    const summary = Engagement.getCompletionSummary();
    assertEqual(summary.photos, 0, 'fotografias');
    assertEqual(summary.experiences, 0, 'memórias');
});

// ============================================================
console.log('\nO QUE MOSTRAR AO VOLTAR — uma prioridade, não uma pilha\n');
// ============================================================

const missionOpen = { mission: { id: 'first_steps' }, isComplete: false };
const missionDone = { mission: { id: 'first_steps' }, isComplete: true };
const missionNone = { mission: null, isComplete: false };

test('missão incompleta ganha o lugar', () => {
    setup([1, 3, 4]);
    const focus = Engagement.getFocus(missionOpen);

    assertEqual(focus.type, 'mission', 'tipo');
    assertEqual(focus.mission, missionOpen, 'missão');
});

test('missão feita devolve o lugar à próxima descoberta', () => {
    setup([1, 3, 4]);
    const focus = Engagement.getFocus(missionDone);

    assertEqual(focus.type, 'nextDiscovery', 'tipo');
    assertEqual(focus.next.monumentId, 8, 'monumento');
});

test('sem missão: próxima descoberta', () => {
    setup([1, 3, 4]);
    assertEqual(Engagement.getFocus(missionNone).type, 'nextDiscovery', 'tipo');
    assertEqual(Engagement.getFocus(null).type, 'nextDiscovery', 'tipo sem argumento');
});

test('0/12: o estado diz que o convite é outro', () => {
    setup([]);
    const focus = Engagement.getFocus(null);

    assertEqual(focus.type, 'nextDiscovery', 'tipo');
    assertEqual(focus.journeyState, 'empty', 'estado');
});

test('12/12 sem missão: o fecho da jornada', () => {
    setup(MONUMENTS.map(m => m.id));
    const focus = Engagement.getFocus(null);

    assertEqual(focus.type, 'journeyComplete', 'tipo');
    assertEqual(focus.summary.monuments, 12, 'monumentos');
});

test('12/12 com missão a meio: a missão continua a ganhar', () => {
    setup(MONUMENTS.map(m => m.id));
    assertEqual(Engagement.getFocus(missionOpen).type, 'mission', 'tipo');
});

// ============================================================
console.log('\nROBUSTEZ — o loop nunca derruba a aplicação\n');
// ============================================================

test('sem fontes configuradas não rebenta', () => {
    Engagement.configure({
        getMonuments: () => [],
        getZones: () => [],
        getDiscoveredIds: () => [],
        getJourneyProgress: null,
        getCurrentStep: null,
        getZoneProgress: null,
        getLevelProgress: null,
        getDistanceTo: null,
        getMemoryCounts: null
    });

    assertEqual(Engagement.getNextDiscovery(), null, 'recomendação');
    assertEqual(Engagement.getAlmostThere(), null, 'quase lá');
    assertEqual(Engagement.getJourneyState(), 'empty', 'estado');
    assertEqual(Engagement.getZoneStates().length, 0, 'zonas');
});

test('progresso da zona calculado localmente quando a jornada falta', () => {
    Engagement.configure({
        getMonuments: () => MONUMENTS,
        getZones: () => ZONES,
        getDiscoveredIds: () => [1, 3, 4],
        // Sem getZoneProgress: a conta local entra em seu lugar
        getZoneProgress: null,
        getJourneyProgress: null,
        getCurrentStep: null,
        getLevelProgress: null,
        getDistanceTo: null,
        getMemoryCounts: null
    });

    const centro = Engagement.getZoneStates().filter(z => z.zoneId === 'centro_historico')[0];
    assertEqual(centro.discovered, 3, 'descobertos');
    assertEqual(centro.remaining, 1, 'a faltar');

    const next = Engagement.getNextDiscovery();
    assertEqual(next.reason, Engagement.REASON.LAST_IN_ZONE, 'motivo');
    assertEqual(next.monumentId, 8, 'monumento');
});

test('uma jornada que rebenta não impede a recomendação', () => {
    Engagement.configure({
        getMonuments: () => MONUMENTS,
        getZones: () => ZONES,
        getDiscoveredIds: () => [1, 3, 4],
        getZoneProgress: () => { throw new Error('jornada indisponível'); },
        getJourneyProgress: () => { throw new Error('jornada indisponível'); },
        getCurrentStep: () => { throw new Error('jornada indisponível'); },
        getLevelProgress: null,
        getDistanceTo: null,
        getMemoryCounts: null
    });

    const next = Engagement.getNextDiscovery();
    assert(next !== null, 'devia haver recomendação');
    assertEqual(next.monumentId, 8, 'monumento');
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
