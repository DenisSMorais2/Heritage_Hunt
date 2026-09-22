// ============================================================
// Heritage Hunt CV — testes da Streak de Exploracao
//
// O projecto nao usa npm nem framework de testes, por isso este
// runner e propositadamente minimo e sem dependencias.
//
//   node streak.test.js
// ============================================================

const { ExplorationStreak, StreakDate } = require('./streak.js');
const ACTIVITY = ExplorationStreak.ACTIVITY;

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

// Armazenamento em memoria que imita o adaptador da app
function freshStore(initial) {
    let value = initial === undefined ? null : initial;
    ExplorationStreak.configureStorage({
        load: () => value,
        save: (data) => { value = JSON.parse(JSON.stringify(data)); }
    });
    return {
        get: () => value,
        set: (data) => { value = data; }
    };
}

// Data local a uma hora fixa, para nao depender do relogio real
function day(offsetDays, hours) {
    const date = new Date(2026, 8, 21, hours === undefined ? 12 : hours, 0, 0, 0); // 21 Set 2026
    date.setDate(date.getDate() + offsetDays);
    return date;
}

function discover(monumentId, when) {
    return ExplorationStreak.registerExplorationActivity(
        { type: ACTIVITY.MONUMENT_DISCOVERY, monumentId: monumentId },
        { now: when }
    );
}

function addPhoto(monumentId, when) {
    return ExplorationStreak.registerExplorationActivity(
        { type: ACTIVITY.PHOTO_ADDED, monumentId: monumentId },
        { now: when }
    );
}

function addExperience(monumentId, when) {
    return ExplorationStreak.registerExplorationActivity(
        { type: ACTIVITY.EXPERIENCE_SAVED, monumentId: monumentId },
        { now: when }
    );
}

// ============================================================
console.log('\nUtilitarios de data');
// ============================================================

test('getLocalDateKey usa a data local, nao UTC', () => {
    // 23:30 local — em UTC+X isto poderia cair no dia seguinte
    assertEqual(StreakDate.getLocalDateKey(new Date(2026, 8, 21, 23, 30)), '2026-09-21');
    // 00:30 local — em UTC-X isto poderia cair no dia anterior
    assertEqual(StreakDate.getLocalDateKey(new Date(2026, 8, 22, 0, 30)), '2026-09-22');
});

test('getLocalDateKey formata com zeros a esquerda', () => {
    assertEqual(StreakDate.getLocalDateKey(new Date(2026, 0, 5, 10, 0)), '2026-01-05');
});

test('isSameDay compara dias e nao instantes', () => {
    assert(StreakDate.isSameDay(new Date(2026, 8, 21, 0, 1), new Date(2026, 8, 21, 23, 59)));
    assert(!StreakDate.isSameDay(new Date(2026, 8, 21, 23, 59), new Date(2026, 8, 22, 0, 1)));
    assert(StreakDate.isSameDay('2026-09-21', new Date(2026, 8, 21, 8, 0)));
});

test('isYesterday reconhece o dia anterior', () => {
    assert(StreakDate.isYesterday('2026-09-20', '2026-09-21'));
    assert(!StreakDate.isYesterday('2026-09-19', '2026-09-21'));
    assert(!StreakDate.isYesterday('2026-09-21', '2026-09-21'));
});

test('daysBetween atravessa meses e anos', () => {
    assertEqual(StreakDate.daysBetween('2026-08-31', '2026-09-01'), 1);
    assertEqual(StreakDate.daysBetween('2026-12-31', '2027-01-01'), 1);
    assertEqual(StreakDate.daysBetween('2026-09-21', '2026-09-21'), 0);
    assertEqual(StreakDate.daysBetween('2026-09-21', '2026-09-18'), -3);
});

test('getWeekDayKeys devolve segunda a domingo', () => {
    // 2026-09-21 e uma segunda-feira
    const week = StreakDate.getWeekDayKeys(new Date(2026, 8, 23, 12, 0)); // quarta
    assertEqual(week.length, 7);
    assertEqual(week[0], '2026-09-21', 'primeiro dia');
    assertEqual(week[6], '2026-09-27', 'ultimo dia');
});

test('getWeekDayKeys trata domingo como fim da semana', () => {
    const week = StreakDate.getWeekDayKeys(new Date(2026, 8, 27, 12, 0)); // domingo
    assertEqual(week[0], '2026-09-21');
    assertEqual(week[6], '2026-09-27');
});

// ============================================================
console.log('\nRegras do streak (pontos 4 e 25)');
// ============================================================

test('TESTE 1 — primeira exploracao: current = 1, best = 1', () => {
    freshStore();
    const result = discover(1, day(0));

    assert(result.registered, 'devia registar');
    assert(result.isNewDay, 'devia ser um novo dia');
    assert(result.isNewStreak, 'devia ser uma nova sequencia');
    assertEqual(result.current, 1, 'current');
    assertEqual(result.best, 1, 'best');
    assertEqual(result.totalExplorationDays, 1, 'totalExplorationDays');
});

test('TESTE 2 — segunda accao no mesmo dia: current continua 1', () => {
    freshStore();
    discover(1, day(0));
    const result = addPhoto(1, day(0, 18));

    assert(result.registered, 'devia registar a actividade');
    assert(!result.isNewDay, 'nao devia abrir um novo dia');
    assertEqual(result.current, 1, 'current');
    assertEqual(result.totalExplorationDays, 1, 'totalExplorationDays');
});

test('TESTE 3 — exploracao no dia seguinte: current = 2', () => {
    freshStore();
    discover(1, day(0));
    const result = discover(2, day(1));

    assert(result.isNewDay, 'devia ser um novo dia');
    assert(result.streakContinued, 'devia continuar a sequencia');
    assert(!result.isNewStreak, 'nao devia recomecar');
    assertEqual(result.current, 2, 'current');
    assertEqual(result.best, 2, 'best');
    assertEqual(result.totalExplorationDays, 2, 'totalExplorationDays');
});

test('TESTE 4 — passa um dia sem explorar: current volta a 1', () => {
    freshStore();
    discover(1, day(0));
    discover(2, day(1));
    discover(3, day(2));            // current = 3
    const result = discover(4, day(4)); // falhou o dia 3

    assert(result.isNewStreak, 'devia recomecar a sequencia');
    assertEqual(result.current, 1, 'current');
    assertEqual(result.totalExplorationDays, 4, 'totalExplorationDays');
});

test('TESTE 5 — best nao e perdido ao repor current', () => {
    freshStore();
    discover(1, day(0));
    discover(2, day(1));
    discover(3, day(2));            // best = 3
    const result = discover(4, day(6));

    assertEqual(result.current, 1, 'current');
    assertEqual(result.best, 3, 'best mantem-se');
    assertEqual(ExplorationStreak.getBestStreak(), 3, 'best persistido');
});

test('TESTE 6 — totalExplorationDays aumenta uma vez por dia', () => {
    freshStore();
    discover(1, day(0));
    addPhoto(1, day(0, 14));
    addPhoto(1, day(0, 15));
    addExperience(1, day(0, 16));
    assertEqual(ExplorationStreak.getTotalExplorationDays(), 1, 'dia 1');

    discover(2, day(1));
    addPhoto(2, day(1, 20));
    assertEqual(ExplorationStreak.getTotalExplorationDays(), 2, 'dia 2');
});

test('TESTE 7 — reload nao aumenta o streak', () => {
    const store = freshStore();
    discover(1, day(0));
    const snapshot = JSON.stringify(store.get());

    // Simula reload: novo adaptador sobre exactamente os mesmos dados
    freshStore(JSON.parse(snapshot));
    const status = ExplorationStreak.getStreakStatus(day(0));

    assertEqual(status.current, 1, 'current');
    assertEqual(status.totalExplorationDays, 1, 'totalExplorationDays');
    assert(status.exploredToday, 'ja explorou hoje');

    // Varias leituras seguidas tambem nao mexem em nada
    ExplorationStreak.getStreakStatus(day(0));
    ExplorationStreak.getWeekExplorationStatus(day(0));
    ExplorationStreak.hasExploredToday(day(0));
    assertEqual(ExplorationStreak.getStreakStatus(day(0)).current, 1, 'current apos leituras');
});

test('TESTE 8 — tipos diferentes no mesmo dia contam uma vez', () => {
    freshStore();
    discover(1, day(0));
    addPhoto(1, day(0, 13));
    addPhoto(1, day(0, 14));
    addPhoto(1, day(0, 15));
    addExperience(1, day(0, 16));

    const status = ExplorationStreak.getStreakStatus(day(0));
    assertEqual(status.current, 1, 'current');
    assertEqual(status.totalExplorationDays, 1, 'totalExplorationDays');
    assertEqual(ExplorationStreak.getDayActivities('2026-09-21').length, 5, 'actividades no historico');
});

test('TESTE 9 — perfis antigos sem explorationStreak continuam a funcionar', () => {
    // Perfil gravado por uma versao anterior da app
    const legacyProfile = {
        name: 'Explorador',
        email: 'ex@exemplo.cv',
        points: 120,
        scannedMonuments: [{ id: 1 }, { id: 2 }]
    };

    ExplorationStreak.configureStorage({
        load: () => legacyProfile.explorationStreak || null,
        save: (data) => { legacyProfile.explorationStreak = data; }
    });

    const status = ExplorationStreak.getStreakStatus(day(0));
    assertEqual(status.current, 0, 'current');
    assertEqual(status.best, 0, 'best');
    assertEqual(status.totalExplorationDays, 0, 'totalExplorationDays');
    assertEqual(status.lastExplorationDate, null, 'lastExplorationDate');
    assertEqual(ExplorationStreak.getExplorationHistory().length, 0, 'history');
    assertEqual(legacyProfile.points, 120, 'os dados existentes nao sao tocados');

    // E a partir daqui passa a funcionar normalmente
    const result = discover(3, day(0));
    assertEqual(result.current, 1, 'current apos primeira descoberta');
    assertEqual(legacyProfile.points, 120, 'pontos intactos');
    assert(legacyProfile.explorationStreak, 'campo criado no perfil');
});

// ============================================================
console.log('\nCasos adicionais');
// ============================================================

test('so uma actividade valida do dia abre o dia (foto sozinha conta)', () => {
    freshStore();
    const result = addPhoto(5, day(0));
    assert(result.isNewDay, 'a foto abre o dia');
    assertEqual(result.current, 1);
});

test('tipo de actividade invalido e rejeitado', () => {
    freshStore();
    const result = ExplorationStreak.registerExplorationActivity({ type: 'app_opened' }, { now: day(0) });
    assert(!result.registered, 'nao devia registar');
    assertEqual(result.reason, 'invalid_activity_type');
    assertEqual(ExplorationStreak.getCurrentStreak(day(0)), 0, 'streak intacto');
});

test('abrir a app varias vezes nao altera nada', () => {
    freshStore();
    discover(1, day(0));
    for (let i = 0; i < 20; i++) {
        ExplorationStreak.getStreakStatus(day(0));
        ExplorationStreak.getWeekExplorationStatus(day(0));
        ExplorationStreak.getMilestoneStatus(day(0));
    }
    assertEqual(ExplorationStreak.getCurrentStreak(day(0)), 1);
    assertEqual(ExplorationStreak.getTotalExplorationDays(), 1);
});

test('sequencia deixa de estar activa apos falhar um dia', () => {
    freshStore();
    discover(1, day(0));
    discover(2, day(1));
    discover(3, day(2)); // current = 3

    // No proprio dia ainda esta viva
    assertEqual(ExplorationStreak.getCurrentStreak(day(2)), 3, 'no dia');
    // No dia seguinte continua viva (ainda da para manter)
    assertEqual(ExplorationStreak.getCurrentStreak(day(3)), 3, 'dia seguinte');
    // Dois dias depois ja nao
    assertEqual(ExplorationStreak.getCurrentStreak(day(4)), 0, 'dois dias depois');
    // Mas o recorde permanece
    assertEqual(ExplorationStreak.getBestStreak(), 3, 'best');
});

test('pendingToday distingue "ja explorou" de "ainda nao"', () => {
    freshStore();
    discover(1, day(0));

    const today = ExplorationStreak.getStreakStatus(day(0));
    assert(today.exploredToday, 'explorou hoje');
    assert(!today.pendingToday, 'nada pendente');

    const tomorrow = ExplorationStreak.getStreakStatus(day(1));
    assert(!tomorrow.exploredToday, 'ainda nao explorou');
    assert(tomorrow.pendingToday, 'pendente');
    assertEqual(tomorrow.current, 1, 'sequencia ainda viva');
});

test('getWeekExplorationStatus marca os dias certos', () => {
    freshStore();
    discover(1, day(0)); // segunda 21
    discover(2, day(1)); // terca 22
    discover(3, day(2)); // quarta 23

    const week = ExplorationStreak.getWeekExplorationStatus(day(2));
    assertEqual(week.startDate, '2026-09-21');
    assertEqual(week.endDate, '2026-09-27');

    const explored = week.days.map(d => d.explored);
    assertEqual(JSON.stringify(explored), JSON.stringify([true, true, true, false, false, false, false]));

    assert(week.days[2].isToday, 'quarta e hoje');
    assert(!week.days[2].isFuture, 'hoje nao e futuro');
    assert(week.days[3].isFuture, 'quinta e futuro');
    assertEqual(week.days[0].activityCount, 1, 'uma actividade na segunda');
});

test('conquistas de sequencia desbloqueiam nos dias certos', () => {
    freshStore();
    let result;
    for (let i = 0; i < 3; i++) result = discover(i + 1, day(i));

    assertEqual(result.current, 3);
    assertEqual(result.newMilestones.length, 1, 'um marco novo');
    assertEqual(result.newMilestones[0].id, 'curious');

    // Nao volta a desbloquear
    const again = addPhoto(1, day(2, 20));
    assertEqual(again.newMilestones.length, 0, 'sem repeticao no mesmo dia');

    for (let i = 3; i < 7; i++) result = discover(i + 1, day(i));
    assertEqual(result.current, 7);
    assertEqual(result.newMilestones[0].id, 'persistent');

    const status = ExplorationStreak.getMilestoneStatus(day(6));
    assertEqual(status.filter(m => m.unlocked).length, 2, 'dois marcos desbloqueados');
});

test('conquista de sequencia permanece depois de perder o streak', () => {
    freshStore();
    for (let i = 0; i < 3; i++) discover(i + 1, day(i));
    discover(9, day(10)); // sequencia perdida

    const status = ExplorationStreak.getMilestoneStatus(day(10));
    assertEqual(status[0].unlocked, true, 'Explorador Curioso mantem-se');
    assertEqual(ExplorationStreak.getCurrentStreak(day(10)), 1, 'current recomeca');
});

test('dados corrompidos nao partem a aplicacao', () => {
    const broken = {
        current: 'muitos',
        best: -4,
        totalExplorationDays: null,
        lastExplorationDate: '21/09/2026',
        history: 'nada disto',
        unlockedMilestones: ['inexistente', 'curious', 'curious']
    };
    freshStore(broken);

    const status = ExplorationStreak.getStreakStatus(day(0));
    assertEqual(status.current, 0, 'current');
    assertEqual(status.best, 0, 'best');
    assertEqual(status.totalExplorationDays, 0, 'total');
    assertEqual(status.lastExplorationDate, null, 'lastExplorationDate');
    assertEqual(JSON.stringify(status.unlockedMilestones), JSON.stringify(['curious']), 'marcos limpos');
    assertEqual(ExplorationStreak.getWeekExplorationStatus(day(0)).days.length, 7, 'semana continua a desenhar');
});

test('best e corrigido se estiver abaixo de current', () => {
    freshStore({ current: 5, best: 2, totalExplorationDays: 5, lastExplorationDate: '2026-09-21', history: [] });
    assertEqual(ExplorationStreak.getBestStreak(), 5);
});

test('o historico e limitado mas os contadores nao', () => {
    freshStore();
    for (let i = 0; i < 200; i++) discover(1, day(i));

    const streak = ExplorationStreak.getStreak();
    assertEqual(streak.current, 200, 'current');
    assertEqual(streak.totalExplorationDays, 200, 'total');
    assert(streak.history.length <= 180, 'historico limitado a 180 dias, obtido ' + streak.history.length);
    assertEqual(streak.history[0].date, StreakDate.getLocalDateKey(day(199)), 'mantem o mais recente');
});

test('falha de escrita nao rebenta o registo', () => {
    ExplorationStreak.configureStorage({
        load: () => null,
        save: () => { throw new Error('QuotaExceededError'); }
    });
    const result = discover(1, day(0));
    assert(result.registered, 'o resultado continua a ser devolvido');
    assertEqual(result.current, 1);
});

test('virar do ano mantem a sequencia', () => {
    freshStore();
    discover(1, new Date(2026, 11, 31, 22, 0));
    const result = discover(2, new Date(2027, 0, 1, 9, 0));
    assertEqual(result.current, 2, 'current');
    assert(result.streakContinued, 'sequencia continuou');
});

test('actividade perto da meia-noite fica no dia local correcto', () => {
    freshStore();
    discover(1, new Date(2026, 8, 21, 23, 58));
    assertEqual(ExplorationStreak.getStreak().lastExplorationDate, '2026-09-21', 'dia da vespera');

    const result = discover(2, new Date(2026, 8, 22, 0, 3));
    assertEqual(result.current, 2, 'current');
    assertEqual(ExplorationStreak.getStreak().lastExplorationDate, '2026-09-22', 'novo dia');
});

// ============================================================
console.log('\n' + '-'.repeat(52));
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach(f => console.error('FALHOU: ' + f.name + '\n  ' + f.error.stack));
    process.exit(1);
}
