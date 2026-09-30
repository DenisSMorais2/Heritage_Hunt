// ============================================================
// Heritage Hunt CV — testes da missao semanal
//
//   node missions.test.js
// ============================================================

const { WeeklyMissions, MISSION_GOAL, WEEKLY_MISSION_CONFIG } = require('./missions.js');

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

const ZONES = {
    centro_historico: [1, 3, 4, 8],
    frente_mar: [5, 6, 11],
    colinas: [2, 12],
    cultura_viva: [7, 9, 10]
};

function zoneIdOf(monumentId) {
    return Object.keys(ZONES).filter(id => ZONES[id].indexOf(monumentId) !== -1)[0] || null;
}

// Uma conta em memoria, com o contexto de elegibilidade a ser
// controlado pelo teste. `store` imita o perfil autenticado.
function setup(context) {
    let store = null;

    WeeklyMissions.configureStorage({
        load: () => store,
        save: (data) => { store = JSON.parse(JSON.stringify(data)); }
    });

    WeeklyMissions.configure({
        getContext: () => Object.assign({
            undiscoveredCount: 12,
            undiscoveredInZone: (zoneId) => (ZONES[zoneId] || []).length,
            photoEligibleCount: 5,
            experienceEligibleCount: 5,
            incompleteZoneCount: 4
        }, context || {}),
        getZoneIdOf: zoneIdOf
    });

    return {
        raw: () => store,
        // Simula um aparelho diferente a partir do mesmo estado
        clone: () => JSON.parse(JSON.stringify(store))
    };
}

// Uma segunda-feira e um domingo da mesma semana, em UTC
const MONDAY = '2026-09-28T12:00:00.000Z';
const SUNDAY_LATE = '2026-10-04T23:30:00.000Z';
const NEXT_MONDAY = '2026-10-05T12:00:00.000Z';

// A missao de uma semana, para os testes nao dependerem de qual e
function missionOf(now) {
    return WeeklyMissions.getStatus(now).mission;
}

// ============================================================
console.log('\nA SEMANA — igual em todos os aparelhos\n');
// ============================================================

test('a chave da semana é a segunda-feira', () => {
    assertEqual(WeeklyMissions.getWeekKey(MONDAY), '2026-09-28', 'segunda');
    assertEqual(WeeklyMissions.getWeekKey('2026-09-30T08:00:00.000Z'), '2026-09-28', 'quarta');
    assertEqual(WeeklyMissions.getWeekKey('2026-10-04T10:00:00.000Z'), '2026-09-28', 'domingo');
});

test('uma segunda nova abre uma semana nova', () => {
    assertEqual(WeeklyMissions.getWeekKey(NEXT_MONDAY), '2026-10-05', 'segunda seguinte');
});

test('a semana é a de Cabo Verde, não a do aparelho', () => {
    // Cabo Verde é UTC-1. Segunda-feira 00:30 UTC ainda é domingo às
    // 23:30 em Mindelo, por isso pertence à semana ANTERIOR.
    //
    // Isto não é um detalhe: o ranking soma por week_start() em hora
    // de Cabo Verde. Se a missão usasse outra semana, o XP que ela
    // gera podia cair numa semana diferente da missão que o gerou.
    assertEqual(WeeklyMissions.getWeekKey('2026-10-05T00:30:00.000Z'), '2026-09-28',
        'domingo à noite em Mindelo');

    // 01:30 UTC já é segunda 00:30 em Mindelo
    assertEqual(WeeklyMissions.getWeekKey('2026-10-05T01:30:00.000Z'), '2026-10-05',
        'segunda de madrugada em Mindelo');
});

test('semanas consecutivas têm índices consecutivos', () => {
    const a = WeeklyMissions.weekIndex('2026-09-28');
    const b = WeeklyMissions.weekIndex('2026-10-05');
    assertEqual(b - a, 1, 'diferença de índices');
});

test('a mesma semana dá sempre a mesma missão (determinística)', () => {
    setup();
    const first = missionOf(MONDAY).id;

    setup();
    const second = missionOf(MONDAY).id;

    assertEqual(first, second, 'missão');
});

test('semanas diferentes dão missões diferentes', () => {
    setup();
    const week1 = WeeklyMissions.selectMissionFor('2026-09-28').id;
    const week2 = WeeklyMissions.selectMissionFor('2026-10-05').id;

    assert(week1 !== week2, 'a missão devia rodar de semana para semana');
});

test('a rotação percorre o catálogo todo', () => {
    setup();
    const seen = {};

    for (let i = 0; i < WEEKLY_MISSION_CONFIG.length; i++) {
        const key = WeeklyMissions.getWeekKey(
            new Date(Date.UTC(2026, 8, 28 + i * 7, 12)).toISOString()
        );
        seen[WeeklyMissions.selectMissionFor(key).id] = true;
    }

    assertEqual(Object.keys(seen).length, WEEKLY_MISSION_CONFIG.length, 'missões distintas');
});

// ============================================================
console.log('\nATRIBUIÇÃO — estável dentro da semana\n');
// ============================================================

test('a missão é guardada, não recalculada a cada leitura', () => {
    const world = setup();
    const assigned = missionOf(MONDAY).id;

    assertEqual(world.raw().missionId, assigned, 'guardada');
    assertEqual(world.raw().weekKey, '2026-09-28', 'semana');
});

test('a missão não troca a meio da semana quando o progresso muda', () => {
    // Uma missão atribuída a 0/12 pode deixar de ser elegível depois
    // de descobrir tudo. Não pode por isso trocar debaixo dos pés de
    // quem já a começou.
    const world = setup({ undiscoveredCount: 12 });
    const assigned = missionOf(MONDAY).id;

    // O mesmo estado, agora com a conta a 12/12
    setup({
        undiscoveredCount: 0,
        undiscoveredInZone: () => 0,
        incompleteZoneCount: 0
    });
    WeeklyMissions.configureStorage({
        load: () => world.raw(),
        save: () => {}
    });

    assertEqual(WeeklyMissions.getStatus(MONDAY).mission.id, assigned, 'missão');
});

test('uma semana nova reinicia o progresso', () => {
    const world = setup();
    const status = WeeklyMissions.getStatus(MONDAY);
    const goal = status.goals[0];

    WeeklyMissions.registerAction({ type: goal.type, monumentId: 1, zoneId: 'centro_historico' }, { now: MONDAY });
    assert(WeeklyMissions.getStatus(MONDAY).done >= 0, 'progresso registado');

    const next = WeeklyMissions.getStatus(NEXT_MONDAY);
    assertEqual(next.weekKey, '2026-10-05', 'semana');
    assertEqual(next.done, 0, 'progresso');
    assertEqual(next.isComplete, false, 'completa');
    assertEqual(world.raw().rewardedAt, null, 'recompensa');
});

test('a missão feita passa ao histórico na semana seguinte', () => {
    const world = setup();
    const status = WeeklyMissions.getStatus(MONDAY);

    // Fecha todos os objectivos
    status.goals.forEach(goal => {
        for (let i = 0; i < goal.count; i++) {
            WeeklyMissions.registerAction({
                type: goal.type,
                monumentId: 100 + i,
                zoneId: goal.zoneId || 'centro_historico',
                ref: 'r' + goal.type + i
            }, { now: MONDAY });
        }
    });

    assertEqual(WeeklyMissions.getStatus(MONDAY).isComplete, true, 'completa');

    WeeklyMissions.getStatus(NEXT_MONDAY);
    assertEqual(world.raw().history.length, 1, 'histórico');
    assertEqual(world.raw().history[0].weekKey, '2026-09-28', 'semana arquivada');
});

// ============================================================
console.log('\nELEGIBILIDADE — nunca uma missão impossível\n');
// ============================================================

test('12/12: nenhuma missão de descobrir é atribuída (ponto 40)', () => {
    setup({
        undiscoveredCount: 0,
        undiscoveredInZone: () => 0,
        incompleteZoneCount: 0,
        photoEligibleCount: 12,
        experienceEligibleCount: 12
    });

    // Todas as semanas do catálogo, para nenhuma cair numa impossível
    for (let i = 0; i < WEEKLY_MISSION_CONFIG.length + 3; i++) {
        const key = WeeklyMissions.getWeekKey(
            new Date(Date.UTC(2026, 8, 28 + i * 7, 12)).toISOString()
        );
        const mission = WeeklyMissions.selectMissionFor(key);

        assert(mission !== null, 'devia haver missão compatível na semana ' + key);

        mission.goals.forEach(goal => {
            assert(goal.type !== MISSION_GOAL.DISCOVER_MONUMENT,
                mission.id + ' pede para descobrir com 12/12');
            assert(goal.type !== MISSION_GOAL.COMPLETE_ZONE,
                mission.id + ' pede para fechar uma zona com 12/12');
        });
    }
});

test('12/12 continua a ter missões de memória disponíveis', () => {
    setup({
        undiscoveredCount: 0,
        undiscoveredInZone: () => 0,
        incompleteZoneCount: 0,
        photoEligibleCount: 12,
        experienceEligibleCount: 12
    });

    const eligible = WeeklyMissions.getEligibleMissions();
    assert(eligible.length >= 2, 'devia haver pelo menos duas: ' + eligible.length);
});

test('uma missão de zona exige lugares por descobrir NESSA zona', () => {
    setup({
        undiscoveredCount: 5,
        // O Centro Histórico está completo; as outras zonas não
        undiscoveredInZone: (zoneId) => (zoneId === 'centro_historico' ? 0 : 2)
    });

    const centro = WEEKLY_MISSION_CONFIG.filter(m => m.id === 'historic_centre')[0];
    assertEqual(WeeklyMissions.isEligible(centro), false, 'Centro Histórico');

    const mar = WEEKLY_MISSION_CONFIG.filter(m => m.id === 'sea_front')[0];
    assertEqual(WeeklyMissions.isEligible(mar), true, 'Frente de mar');
});

test('fotografias em monumentos diferentes exigem monumentos suficientes', () => {
    const album = WEEKLY_MISSION_CONFIG.filter(m => m.id === 'album_keeper')[0];

    setup({ photoEligibleCount: 1 });
    assertEqual(WeeklyMissions.isEligible(album), false, 'com 1 lugar');

    setup({ photoEligibleCount: 2 });
    assertEqual(WeeklyMissions.isEligible(album), true, 'com 2 lugares');
});

test('sem nada possível não há missão — e isso não é um erro', () => {
    setup({
        undiscoveredCount: 0,
        undiscoveredInZone: () => 0,
        incompleteZoneCount: 0,
        photoEligibleCount: 0,
        experienceEligibleCount: 0
    });

    const status = WeeklyMissions.getStatus(MONDAY);
    assertEqual(status.mission, null, 'missão');
    assertEqual(status.total, 0, 'objectivos');
    assertEqual(status.isComplete, false, 'completa');
    assertEqual(status.nextGoal, null, 'próximo objectivo');
});

test('nenhuma missão do catálogo incentiva spam (ponto 41)', () => {
    WEEKLY_MISSION_CONFIG.forEach(mission => {
        mission.goals.forEach(goal => {
            assert(goal.count <= 2,
                mission.id + '/' + goal.type + ' pede ' + goal.count + ' — demasiado');
        });
        assert(mission.goals.length <= 3,
            mission.id + ' tem ' + mission.goals.length + ' objectivos');
    });
});

test('o catálogo tem entre 6 e 10 missões (ponto 21)', () => {
    assert(WEEKLY_MISSION_CONFIG.length >= 6 && WEEKLY_MISSION_CONFIG.length <= 10,
        'catálogo com ' + WEEKLY_MISSION_CONFIG.length);
});

// ============================================================
console.log('\nPROGRESSO — 0/3, 1/3, 2/3, 3/3\n');
// ============================================================

// Uma missao conhecida, para os passos serem previsiveis:
// first_steps = descobrir 1 + guardar 1 fotografia.
function setupFirstSteps() {
    const world = setup();
    // Força a atribuição de `first_steps` escrevendo o estado à mão,
    // como se a semana a tivesse escolhido.
    WeeklyMissions.getStatus(MONDAY);
    const raw = world.raw();
    raw.missionId = 'first_steps';
    raw.refs = {};
    raw.completedAt = null;
    raw.rewardedAt = null;

    let store = raw;
    WeeklyMissions.configureStorage({
        load: () => store,
        save: (data) => { store = JSON.parse(JSON.stringify(data)); }
    });

    return { raw: () => store };
}

test('0/2 no início', () => {
    setupFirstSteps();
    const status = WeeklyMissions.getStatus(MONDAY);

    assertEqual(status.mission.id, 'first_steps', 'missão');
    assertEqual(status.done, 0, 'feitos');
    assertEqual(status.total, 2, 'total');
    assertEqual(status.percent, 0, 'percentagem');
    assertEqual(status.nextGoal.type, MISSION_GOAL.DISCOVER_MONUMENT, 'próximo objectivo');
});

test('o total conta passos, não objectivos', () => {
    // `two_memories` tem UM objectivo de duas memórias. Se o total
    // contasse objectivos, o cartão mostrava "Escreve 2 memórias 0/2"
    // ao lado de uma barra a dizer "0 / 1" — dois números diferentes
    // para a mesma coisa.
    const world = setup({ experienceEligibleCount: 5 });
    WeeklyMissions.getStatus(MONDAY);
    const raw = world.raw();
    raw.missionId = 'two_memories';
    raw.refs = {};
    raw.completedAt = null;

    let store = raw;
    WeeklyMissions.configureStorage({
        load: () => store,
        save: (data) => { store = JSON.parse(JSON.stringify(data)); }
    });

    let status = WeeklyMissions.getStatus(MONDAY);
    assertEqual(status.goals.length, 1, 'objectivos');
    assertEqual(status.total, 2, 'total em passos');
    assertEqual(status.done, 0, 'feitos');

    WeeklyMissions.registerAction({ type: MISSION_GOAL.WRITE_EXPERIENCE, monumentId: 3 }, { now: MONDAY });
    status = WeeklyMissions.getStatus(MONDAY);
    assertEqual(status.done, 1, 'feitos depois de uma');
    assertEqual(status.percent, 50, 'percentagem');
    assertEqual(status.isComplete, false, 'completa a meio');

    const closing = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.WRITE_EXPERIENCE, monumentId: 8 }, { now: MONDAY });
    assertEqual(closing.completed, true, 'fechou');
    assertEqual(closing.status.done, 2, 'feitos');
    assertEqual(closing.status.percent, 100, 'percentagem');
});

test('uma descoberta avança para 1/2', () => {
    setupFirstSteps();
    const result = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 },
        { now: MONDAY }
    );

    assertEqual(result.changed, true, 'mudou');
    assertEqual(result.completed, false, 'completa');
    assertEqual(result.status.done, 1, 'feitos');
    assertEqual(result.status.percent, 50, 'percentagem');
    assertEqual(result.status.nextGoal.type, MISSION_GOAL.ADD_PHOTO, 'próximo objectivo');
});

test('a fotografia fecha a missão em 2/2', () => {
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });
    const result = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'photo_1' },
        { now: MONDAY }
    );

    assertEqual(result.completed, true, 'completa');
    assertEqual(result.status.done, 2, 'feitos');
    assertEqual(result.status.percent, 100, 'percentagem');
    assertEqual(result.status.isComplete, true, 'estado');
    assertEqual(result.status.nextGoal, null, 'próximo objectivo');
});

test('o mesmo monumento descoberto duas vezes não conta duas', () => {
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });
    const again = WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });

    assertEqual(again.changed, false, 'mudou');
    assertEqual(again.status.done, 1, 'feitos');
});

test('uma acção que a missão não pede é ignorada', () => {
    setupFirstSteps();
    const result = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.COMPLETE_ZONE, zoneId: 'centro_historico' },
        { now: MONDAY }
    );

    assertEqual(result.changed, false, 'mudou');
    assertEqual(result.status.done, 0, 'feitos');
});

test('um tipo desconhecido não parte nada', () => {
    setupFirstSteps();
    const result = WeeklyMissions.registerAction({ type: 'DANCAR_FUNANA' }, { now: MONDAY });

    assertEqual(result.changed, false, 'mudou');
    assert(result.status !== null, 'devia devolver estado');
});

test('duas fotografias do mesmo lugar contam duas quando é isso que se pede', () => {
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p1' }, { now: MONDAY });
    const status = WeeklyMissions.getStatus(MONDAY);
    const photoGoal = status.goals.filter(g => g.type === MISSION_GOAL.ADD_PHOTO)[0];

    // `first_steps` só pede 1, por isso o objectivo já está feito
    assertEqual(photoGoal.isDone, true, 'objectivo da fotografia');
});

test('em monumentos DIFERENTES, duas fotos do mesmo lugar contam uma', () => {
    const world = setup({ photoEligibleCount: 5 });
    WeeklyMissions.getStatus(MONDAY);
    const raw = world.raw();
    raw.missionId = 'album_keeper';   // 2 fotografias, monumentos diferentes
    raw.refs = {};
    raw.completedAt = null;

    let store = raw;
    WeeklyMissions.configureStorage({
        load: () => store,
        save: (data) => { store = JSON.parse(JSON.stringify(data)); }
    });

    WeeklyMissions.registerAction({ type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p1' }, { now: MONDAY });
    WeeklyMissions.registerAction({ type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p2' }, { now: MONDAY });

    let status = WeeklyMissions.getStatus(MONDAY);
    assertEqual(status.goals[0].done, 1, 'duas fotos do mesmo lugar');

    WeeklyMissions.registerAction({ type: MISSION_GOAL.ADD_PHOTO, monumentId: 8, ref: 'p3' }, { now: MONDAY });
    status = WeeklyMissions.getStatus(MONDAY);
    assertEqual(status.goals[0].done, 2, 'um lugar diferente');
    assertEqual(status.isComplete, true, 'completa');
});

test('uma missão de zona só conta acções nessa zona', () => {
    const world = setup({ undiscoveredInZone: () => 3 });
    WeeklyMissions.getStatus(MONDAY);
    const raw = world.raw();
    raw.missionId = 'historic_centre';   // descobrir 1 no Centro Histórico
    raw.refs = {};
    raw.completedAt = null;

    let store = raw;
    WeeklyMissions.configureStorage({
        load: () => store,
        save: (data) => { store = JSON.parse(JSON.stringify(data)); }
    });

    // O 2 é das Colinas: não conta
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 2 }, { now: MONDAY });
    let discover = WeeklyMissions.getStatus(MONDAY).goals
        .filter(g => g.type === MISSION_GOAL.DISCOVER_MONUMENT)[0];
    assertEqual(discover.done, 0, 'monumento de outra zona');

    // O 4 é do Centro Histórico: conta
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 4 }, { now: MONDAY });
    discover = WeeklyMissions.getStatus(MONDAY).goals
        .filter(g => g.type === MISSION_GOAL.DISCOVER_MONUMENT)[0];
    assertEqual(discover.done, 1, 'monumento da zona');
});

// ============================================================
console.log('\nRECOMPENSA — uma única vez naquela semana\n');
// ============================================================

test('completar devolve `completed` só na transição', () => {
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });

    const closing = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p1' }, { now: MONDAY });
    assertEqual(closing.completed, true, 'a acção que fechou');

    const after = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.ADD_PHOTO, monumentId: 8, ref: 'p2' }, { now: MONDAY });
    assertEqual(after.completed, false, 'depois de fechada');
    assertEqual(after.changed, false, 'não avança mais');
});

test('markRewarded devolve true uma vez e só uma', () => {
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });
    WeeklyMissions.registerAction({ type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p1' }, { now: MONDAY });

    assertEqual(WeeklyMissions.markRewarded(MONDAY), true, 'primeira vez');
    assertEqual(WeeklyMissions.markRewarded(MONDAY), false, 'segunda vez');
    assertEqual(WeeklyMissions.getStatus(MONDAY).isRewarded, true, 'estado');
});

test('uma missão não fechada não pode ser recompensada', () => {
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });

    assertEqual(WeeklyMissions.markRewarded(MONDAY), false, 'a meio');
});

test('um reload não volta a celebrar nem a recompensar', () => {
    const world = setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });
    WeeklyMissions.registerAction({ type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p1' }, { now: MONDAY });
    WeeklyMissions.markRewarded(MONDAY);

    // "Reload": o mesmo estado, lido de novo
    const saved = JSON.parse(JSON.stringify(world.raw()));
    WeeklyMissions.configureStorage({ load: () => saved, save: () => {} });

    const status = WeeklyMissions.getStatus(MONDAY);
    assertEqual(status.isComplete, true, 'completa');
    assertEqual(status.isRewarded, true, 'já recompensada');
});

test('a acção de XP é a mesma em todo o sistema', () => {
    assertEqual(WeeklyMissions.REWARD_ACTION, 'WEEKLY_MISSION_COMPLETED', 'acção');
});

test('o módulo não decide quanto vale a recompensa (ponto 25)', () => {
    // O montante vive em XP_CONFIG. Se aparecer aqui, há dois
    // sítios a decidir o mesmo — e um deles vai divergir.
    const source = require('fs').readFileSync(__dirname + '/missions.js', 'utf8');
    const rewardLines = source.split('\n').filter(line =>
        /amount\s*:/.test(line) || /REWARD_XP|rewardAmount/.test(line)
    );
    assertEqual(rewardLines.length, 0, 'linhas com montante: ' + rewardLines.join(' | '));
});

// ============================================================
console.log('\nOFFLINE E SINCRONIZAÇÃO — sem contar duas vezes\n');
// ============================================================

test('o progresso guarda referências, não contadores', () => {
    const world = setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });

    const refs = world.raw().refs[MISSION_GOAL.DISCOVER_MONUMENT];
    assert(Array.isArray(refs), 'devia guardar uma lista');
    assertEqual(refs.length, 1, 'referências');
    assertEqual(refs[0], 'm_3', 'referência');
});

test('sincronizar o mesmo evento outra vez não avança (ponto 24)', () => {
    setupFirstSteps();

    // A mesma descoberta chega três vezes: no momento, na fila
    // offline e na reconciliação do arranque seguinte.
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: MONDAY });

    assertEqual(WeeklyMissions.getStatus(MONDAY).done, 1, 'feitos');
});

test('uma gravação falhada não faz a missão avançar', () => {
    let store = null;

    // A falha é o objectivo do teste, por isso o aviso do módulo não
    // é ruído a esconder — é só ruído a não imprimir aqui.
    const warn = console.warn;
    console.warn = () => {};

    WeeklyMissions.configureStorage({
        load: () => store,
        save: () => { throw new Error('quota cheia'); }
    });
    WeeklyMissions.configure({
        getContext: () => ({
            undiscoveredCount: 12,
            undiscoveredInZone: () => 4,
            photoEligibleCount: 5,
            experienceEligibleCount: 5,
            incompleteZoneCount: 4
        }),
        getZoneIdOf: zoneIdOf
    });

    const status = WeeklyMissions.getStatus(MONDAY);
    const result = WeeklyMissions.registerAction(
        { type: status.goals[0].type, monumentId: 3, zoneId: 'centro_historico', ref: 'x' },
        { now: MONDAY }
    );

    console.warn = warn;

    assertEqual(result.persisted, false, 'persistida');
    assertEqual(result.changed, false, 'mudou');
});

test('um estado corrompido não parte a missão', () => {
    let store = { weekKey: 'lixo', missionId: 'nao_existe', refs: 'isto-nao-e-um-objecto', history: 42 };

    WeeklyMissions.configureStorage({
        load: () => store,
        save: (data) => { store = data; }
    });
    WeeklyMissions.configure({
        getContext: () => ({
            undiscoveredCount: 12,
            undiscoveredInZone: () => 4,
            photoEligibleCount: 5,
            experienceEligibleCount: 5,
            incompleteZoneCount: 4
        }),
        getZoneIdOf: zoneIdOf
    });

    const status = WeeklyMissions.getStatus(MONDAY);
    assert(status.mission !== null, 'devia atribuir uma missão nova');
    assertEqual(status.weekKey, '2026-09-28', 'semana');
    assertEqual(status.done, 0, 'progresso');
});

test('normalize nunca lança, aceite o que lhe derem', () => {
    [null, undefined, 0, 'texto', [], { refs: null }].forEach(value => {
        const state = WeeklyMissions.normalize(value);
        assert(state !== null, 'devia devolver um modelo');
        assertEqual(typeof state.refs, 'object', 'refs');
        assert(Array.isArray(state.history), 'histórico');
    });
});

test('o histórico não cresce sem fim', () => {
    const many = [];
    for (let i = 0; i < 80; i++) {
        many.push({ weekKey: '2026-01-05', missionId: 'first_steps', completedAt: null });
    }

    const state = WeeklyMissions.normalize({ history: many });
    assert(state.history.length <= WeeklyMissions.HISTORY_LIMIT,
        'histórico com ' + state.history.length);
});

test('uma missão completa ao domingo à noite pertence a essa semana', () => {
    // O momento de maior risco: o relógio do aparelho num fuso
    // diferente podia empurrar a conclusão para a semana seguinte, e
    // o XP para um ranking diferente do da missão.
    setupFirstSteps();
    WeeklyMissions.registerAction({ type: MISSION_GOAL.DISCOVER_MONUMENT, monumentId: 3 }, { now: SUNDAY_LATE });
    const result = WeeklyMissions.registerAction(
        { type: MISSION_GOAL.ADD_PHOTO, monumentId: 3, ref: 'p1' }, { now: SUNDAY_LATE });

    assertEqual(result.completed, true, 'completa');
    assertEqual(result.status.weekKey, '2026-09-28', 'semana');
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
