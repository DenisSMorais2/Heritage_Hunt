// ============================================================
// Heritage Hunt CV — testes da jornada cultural
//
// O projecto nao usa npm nem framework de testes, por isso este
// runner segue o formato de xp.test.js / levels.test.js.
//
//   node journey.test.js
// ============================================================

const { Journey, JOURNEY_CONFIG } = require('./journey.js');

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
        throw new Error((label || 'valor') + ': esperado ' + JSON.stringify(expected) + ', obtido ' + JSON.stringify(actual));
    }
}

// --- Ajudas -------------------------------------------------

// Percurso pequeno A B C D, para os exemplos do enunciado
function setupABCD(discovered) {
    const monuments = [
        { id: 'A', name: 'Monumento A', points: 50, image: 'a.jpg' },
        { id: 'B', name: 'Monumento B', points: 40, image: 'b.jpg' },
        { id: 'C', name: 'Monumento C', points: 30, image: 'c.jpg' },
        { id: 'D', name: 'Monumento D', points: 45, image: 'd.jpg' }
    ];
    const zones = [
        { id: 'centro_historico', monumentIds: ['A', 'B'] },
        { id: 'frente_mar', monumentIds: ['C', 'D'] }
    ];
    let found = (discovered || []).slice();

    Journey.configure({
        getMonuments: () => monuments,
        getZones: () => zones,
        getDiscoveredIds: () => found
    });

    return {
        discover: (id) => { if (found.indexOf(id) === -1) found.push(id); },
        set: (list) => { found = list.slice(); }
    };
}

// Os dados reais do projecto (script.js)
function setupRealProject(discovered) {
    const monuments = [
        { id: 1, name: 'Palácio do Povo', points: 50 },
        { id: 2, name: 'Farol de D. Amélia', points: 40 },
        { id: 3, name: 'Mercado Municipal', points: 30 },
        { id: 4, name: 'Igreja Nossa Senhora da Luz', points: 45 },
        { id: 5, name: 'Torre de Belém (Réplica)', points: 35 },
        { id: 6, name: 'Edifício da Alfândega', points: 30 },
        { id: 7, name: 'Casa da Morna', points: 40 },
        { id: 8, name: 'Praça Nova', points: 25 },
        { id: 9, name: 'Centro Nacional de Artesanato', points: 35 },
        { id: 10, name: 'Casa da Cultura', points: 40 },
        { id: 11, name: 'Porto de Mindelo', points: 50 },
        { id: 12, name: "Fortim d'El Rei", points: 45 }
    ];
    const zones = [
        { id: 'centro_historico', monumentIds: [1, 3, 4, 8] },
        { id: 'frente_mar', monumentIds: [5, 6, 11] },
        { id: 'colinas', monumentIds: [2, 12] },
        { id: 'cultura_viva', monumentIds: [7, 9, 10] }
    ];
    let found = (discovered || []).slice();

    Journey.configure({
        getMonuments: () => monuments,
        getZones: () => zones,
        getDiscoveredIds: () => found
    });

    return { discover: (id) => { if (found.indexOf(id) === -1) found.push(id); } };
}

function stateOf(id) {
    return Journey.getJourneyStepState(id);
}

// ============================================================
console.log('\n=== Configuracao e ordem (pontos 6 e 7) ===\n');

test('a jornada aponta para zonas, nao repete monumentos', () => {
    assert(JOURNEY_CONFIG.length >= 1, 'ha pelo menos uma jornada');
    JOURNEY_CONFIG.forEach(function (journey) {
        assert(typeof journey.id === 'string' && journey.id, 'id');
        assert(Array.isArray(journey.zoneIds) && journey.zoneIds.length, 'zoneIds em ' + journey.id);
        assert(journey.monumentIds === undefined, journey.id + ' nao deve duplicar monumentos');
    });
});

test('a ordem vem dos dados, nunca alfabetica', () => {
    setupRealProject([]);
    const ids = Journey.getSteps().map(s => s.monumentId);

    // Centro historico -> frente de mar -> colinas -> cultura viva
    assertEqual(ids.join(','), '1,3,4,8,5,6,11,2,12,7,9,10', 'ordem do percurso');

    // Alfabeticamente "Casa da Cultura" viria primeiro; aqui e o Palacio
    assertEqual(Journey.getSteps()[0].monument.name, 'Palácio do Povo', 'primeira etapa');
});

test('order e sequencial e cada monumento aparece uma unica vez', () => {
    setupRealProject([]);
    const steps = Journey.getSteps();
    const ids = steps.map(s => s.monumentId);

    assertEqual(steps.length, 12, 'total de etapas');
    assertEqual(new Set(ids).size, 12, 'sem monumentos duplicados');
    steps.forEach(function (step, index) {
        assertEqual(step.order, index + 1, 'order da etapa ' + index);
    });
});

test('os monumentos ficam agrupados pelas zonas existentes', () => {
    setupRealProject([]);
    const groups = Journey.getJourney().groups;

    assertEqual(groups.length, 4, 'numero de zonas');
    assertEqual(groups.map(g => g.zoneId).join(','), 'centro_historico,frente_mar,colinas,cultura_viva', 'ordem das zonas');
    assertEqual(groups[0].steps.length, 4, 'centro historico');
    assertEqual(groups[1].steps.length, 3, 'frente de mar');
});

test('um monumento fora de qualquer zona nao se perde', () => {
    Journey.configure({
        getMonuments: () => [
            { id: 1, name: 'Dentro', points: 10 },
            { id: 99, name: 'Orfao', points: 10 }
        ],
        getZones: () => [{ id: 'centro_historico', monumentIds: [1] }],
        getDiscoveredIds: () => []
    });

    const steps = Journey.getSteps();
    assertEqual(steps.length, 2, 'ambos no percurso');
    assertEqual(steps[1].monumentId, 99, 'o orfao vai para o fim');
    assertEqual(steps[1].zoneId, null, 'sem zona');
});

test('um monumento listado em duas zonas entra uma so vez', () => {
    Journey.configure({
        getMonuments: () => [{ id: 1, name: 'M1', points: 10 }, { id: 2, name: 'M2', points: 10 }],
        getZones: () => [
            { id: 'centro_historico', monumentIds: [1, 2] },
            { id: 'frente_mar', monumentIds: [2] }
        ],
        getDiscoveredIds: () => []
    });

    assertEqual(Journey.getSteps().length, 2, 'sem duplicados');
});

// ============================================================
console.log('\n=== Estados e progresso (pontos 50, 51 e 52) ===\n');

test('teste 1 — 0 de 4 descobertos: current = etapa 1, 0%', () => {
    setupABCD([]);
    const progress = Journey.getJourneyProgress();

    assertEqual(progress.discovered, 0, 'descobertos');
    assertEqual(progress.total, 4, 'total');
    assertEqual(progress.remaining, 4, 'por descobrir');
    assertEqual(progress.percent, 0, 'percentagem');
    assertEqual(progress.currentMonumentId, 'A', 'etapa actual');
    assertEqual(progress.isCompleted, false, 'nao concluida');
    assertEqual(progress.isEmpty, true, 'jornada vazia');

    assertEqual(stateOf('A'), 'current', 'A');
    assertEqual(stateOf('B'), 'upcoming', 'B');
});

test('teste 2 — 1 de 4: current = etapa 2, 25%', () => {
    setupABCD(['A']);
    const progress = Journey.getJourneyProgress();

    assertEqual(progress.discovered, 1, 'descobertos');
    assertEqual(progress.percent, 25, 'percentagem');
    assertEqual(progress.currentMonumentId, 'B', 'etapa actual');

    assertEqual(stateOf('A'), 'discovered', 'A');
    assertEqual(stateOf('B'), 'current', 'B');
    assertEqual(stateOf('C'), 'upcoming', 'C');
});

test('teste 3 — 2 de 4: 50% (exemplo do ponto 50)', () => {
    setupABCD(['A', 'B']);
    const progress = Journey.getJourneyProgress();

    assertEqual(progress.percent, 50, 'percentagem');
    assertEqual(stateOf('A'), 'discovered', 'A');
    assertEqual(stateOf('B'), 'discovered', 'B');
    assertEqual(stateOf('C'), 'current', 'C');
    assertEqual(stateOf('D'), 'upcoming', 'D');
});

test('teste 4 — descoberta fora da ordem: A e C descobertos, B = current', () => {
    setupABCD(['A', 'C']);
    const progress = Journey.getJourneyProgress();

    assertEqual(progress.discovered, 2, 'descobertos');
    assertEqual(progress.percent, 50, 'percentagem');
    assertEqual(progress.currentMonumentId, 'B', 'etapa actual');

    assertEqual(stateOf('A'), 'discovered', 'A');
    assertEqual(stateOf('B'), 'current', 'B');
    assertEqual(stateOf('C'), 'discovered', 'C');
    assertEqual(stateOf('D'), 'upcoming', 'D');
});

test('teste 5 — 4 de 4: 100%, current = null, concluida', () => {
    setupABCD(['A', 'B', 'C', 'D']);
    const progress = Journey.getJourneyProgress();

    assertEqual(progress.discovered, 4, 'descobertos');
    assertEqual(progress.remaining, 0, 'por descobrir');
    assertEqual(progress.percent, 100, 'percentagem');
    assertEqual(progress.currentMonumentId, null, 'sem etapa actual');
    assertEqual(progress.isCompleted, true, 'concluida');
    assertEqual(Journey.getCurrentJourneyStep(), null, 'getCurrentJourneyStep');
    assertEqual(Journey.getNextUndiscoveredMonument(), null, 'sem proximo monumento');
    assert(Journey.isJourneyCompleted(), 'isJourneyCompleted');

    Journey.getSteps().forEach(function (step) {
        assertEqual(step.state, 'discovered', step.monumentId);
    });
});

test('descobrir a ultima etapa da ordem nao inventa uma etapa actual', () => {
    setupABCD(['D']);
    const progress = Journey.getJourneyProgress();
    assertEqual(progress.currentMonumentId, 'A', 'volta ao primeiro por descobrir');
    assertEqual(stateOf('D'), 'discovered', 'D');
});

test('teste 8 — um monumento descoberto nunca volta a upcoming', () => {
    const journey = setupABCD([]);
    assertEqual(stateOf('C'), 'upcoming', 'antes');

    journey.discover('C');
    assertEqual(stateOf('C'), 'discovered', 'depois de descobrir');

    // Mesmo descobrindo outros a seguir, C continua descoberto
    journey.discover('A');
    journey.discover('B');
    assertEqual(stateOf('C'), 'discovered', 'continua descoberto');
    assertEqual(stateOf('D'), 'current', 'D passa a actual');
});

test('existe sempre exactamente uma etapa actual enquanto faltar algo', () => {
    const combos = [[], ['A'], ['B'], ['A', 'C'], ['B', 'D'], ['A', 'B', 'C']];
    combos.forEach(function (found) {
        setupABCD(found);
        const current = Journey.getSteps().filter(s => s.state === 'current');
        assertEqual(current.length, 1, 'com ' + JSON.stringify(found));
    });

    setupABCD(['A', 'B', 'C', 'D']);
    assertEqual(Journey.getSteps().filter(s => s.state === 'current').length, 0, 'jornada completa');
});

test('a percentagem e arredondada (8/12 = 67%)', () => {
    setupRealProject([1, 3, 4, 8, 5, 6, 11, 2]);
    const progress = Journey.getJourneyProgress();
    assertEqual(progress.discovered, 8, 'descobertos');
    assertEqual(progress.percent, 67, '8/12 arredondado');
    assertEqual(progress.remaining, 4, 'faltam');
});

// ============================================================
console.log('\n=== Progresso por zona (pontos 28 e 29) ===\n');

test('cada zona conhece o seu proprio progresso', () => {
    setupRealProject([1, 3]);
    const centro = Journey.getZoneProgress('centro_historico');

    assertEqual(centro.total, 4, 'total');
    assertEqual(centro.discovered, 2, 'descobertos');
    assertEqual(centro.percent, 50, 'percentagem');
    assertEqual(centro.isComplete, false, 'incompleta');

    const frente = Journey.getZoneProgress('frente_mar');
    assertEqual(frente.discovered, 0, 'frente de mar por comecar');
});

test('uma zona completa e assinalada', () => {
    setupRealProject([1, 3, 4, 8]);
    const centro = Journey.getZoneProgress('centro_historico');

    assertEqual(centro.isComplete, true, 'centro historico completo');
    assertEqual(centro.percent, 100, 'percentagem');
    assertEqual(Journey.getJourney().groups[0].isComplete, true, 'no grupo');
    // A etapa actual passa para a zona seguinte
    assertEqual(Journey.getJourneyProgress().currentMonumentId, 5, 'primeira da frente de mar');
});

test('uma zona desconhecida devolve null em vez de rebentar', () => {
    setupRealProject([]);
    assertEqual(Journey.getZoneProgress('zona_inexistente'), null, 'zona inexistente');
});

// ============================================================
console.log('\n=== Sem dados / casos defensivos ===\n');

test('sem monumentos o percurso fica vazio sem rebentar', () => {
    Journey.configure({
        getMonuments: () => [],
        getZones: () => [],
        getDiscoveredIds: () => []
    });

    const progress = Journey.getJourneyProgress();
    assertEqual(progress.total, 0, 'total');
    assertEqual(progress.percent, 0, 'percentagem');
    assertEqual(progress.currentMonumentId, null, 'sem actual');
    assertEqual(progress.isCompleted, false, 'uma jornada vazia nao esta concluida');
    assertEqual(Journey.getJourney().groups.length, 0, 'sem grupos');
});

test('uma zona que aponte para um monumento inexistente e ignorada', () => {
    Journey.configure({
        getMonuments: () => [{ id: 1, name: 'M1', points: 10 }],
        getZones: () => [{ id: 'centro_historico', monumentIds: [1, 404] }],
        getDiscoveredIds: () => []
    });

    assertEqual(Journey.getSteps().length, 1, 'so o monumento real');
});

test('fontes em falta nao rebentam', () => {
    Journey.configure({});
    Journey.configure({ getMonuments: () => null, getZones: () => null, getDiscoveredIds: () => null });
    assertEqual(Journey.getSteps().length, 0, 'percurso vazio');
    assertEqual(Journey.getJourneyProgress().total, 0, 'total');
});

test('uma jornada inexistente devolve null', () => {
    setupRealProject([]);
    assertEqual(Journey.getJourney('jornada_inexistente'), null, 'getJourney');
    assertEqual(Journey.getSteps('jornada_inexistente').length, 0, 'getSteps');
});

// ============================================================
console.log('\n=== Estado derivado, nunca duplicado (pontos 46 e 47) ===\n');

test('a jornada le sempre a fonte real: mudar as descobertas muda o percurso', () => {
    const journey = setupABCD([]);
    assertEqual(Journey.getJourneyProgress().percent, 0, 'inicio');

    journey.discover('A');
    assertEqual(Journey.getJourneyProgress().percent, 25, 'depois de A');

    journey.discover('B');
    assertEqual(Journey.getJourneyProgress().percent, 50, 'depois de B');

    // Nada foi guardado dentro da jornada: voltar atras na fonte
    // volta atras no percurso
    journey.set([]);
    assertEqual(Journey.getJourneyProgress().percent, 0, 'a jornada nao guarda copia');
    assertEqual(stateOf('A'), 'current', 'A volta a ser a etapa actual');
});

test('o percurso devolvido nao deixa alterar a configuracao', () => {
    setupRealProject([]);
    const journeys = Journey.getJourneys();
    journeys[0].zoneIds.push('zona_falsa');
    journeys[0].id = 'outro';

    assertEqual(Journey.getJourneys()[0].id, 'mindelo_historico', 'id intacto');
    assertEqual(Journey.getJourneys()[0].zoneIds.length, 4, 'zoneIds intactos');
});

test('os passos trazem o monumento real, nao uma copia inventada', () => {
    setupRealProject([]);
    const step = Journey.getSteps()[0];

    assertEqual(step.monument.name, 'Palácio do Povo', 'nome real');
    assertEqual(step.monument.points, 50, 'pontos reais');
    assertEqual(step.monumentId, 1, 'id real');
});

// ============================================================
console.log('\n' + '-'.repeat(52));
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach(f => console.error('FALHOU: ' + f.name + '\n  ' + f.error.stack));
    process.exit(1);
}
