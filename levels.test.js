// ============================================================
// Heritage Hunt CV — testes do sistema de niveis
//
// O projecto nao usa npm nem framework de testes, por isso este
// runner segue o mesmo formato de xp.test.js e streak.test.js.
//
//   node levels.test.js
// ============================================================

const { Levels, LEVEL_CONFIG } = require('./levels.js');
const { XP } = require('./xp.js');
const ACTION = XP.ACTION;

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

// Carteira em memoria que imita o adaptador da app
function freshWallet(initial) {
    let value = initial === undefined ? null : initial;
    XP.configureStorage({
        load: () => value,
        save: (data) => { value = JSON.parse(JSON.stringify(data)); },
        exists: () => true
    });
    return { get: () => value };
}

// ============================================================
console.log('\n=== Configuracao ===\n');

test('os limiares vivem so na configuracao e estao ordenados', () => {
    assertEqual(LEVEL_CONFIG.length, 4, 'niveis configurados');

    const levels = Levels.getLevels();
    for (let i = 1; i < levels.length; i++) {
        assert(levels[i].minXP > levels[i - 1].minXP, 'minXP crescente em ' + levels[i].id);
        assertEqual(levels[i].level, levels[i - 1].level + 1, 'numeracao continua');
    }
    assertEqual(levels[0].minXP, 0, 'o primeiro nivel comeca em 0');
});

test('cada nivel tem id, icone e acento', () => {
    Levels.getLevels().forEach(function (level) {
        assert(typeof level.id === 'string' && level.id, 'id em ' + level.level);
        assert(typeof level.icon === 'string' && level.icon, 'icone em ' + level.id);
        assert(typeof level.accent === 'string' && level.accent, 'acento em ' + level.id);
    });
});

// ============================================================
console.log('\n=== Nivel a partir do XP (testes 1 a 8) ===\n');

// Cada par: XP -> id de nivel esperado
const LIMITS = [
    [0, 'explorer'],
    [1, 'explorer'],
    [249, 'explorer'],
    [250, 'traveler'],
    [251, 'traveler'],
    [599, 'traveler'],
    [600, 'connoisseur'],
    [601, 'connoisseur'],
    [1199, 'connoisseur'],
    [1200, 'heritage_guardian'],
    [1201, 'heritage_guardian'],
    [5000, 'heritage_guardian']
];

LIMITS.forEach(function (pair) {
    test(pair[0] + ' XP = ' + pair[1], () => {
        assertEqual(Levels.getLevelFromXP(pair[0]).id, pair[1], 'id do nivel');
    });
});

test('teste 8 — o XP nao e truncado no nivel maximo', () => {
    const info = Levels.getProgress(5000);
    assertEqual(info.totalXP, 5000, 'total preservado');
    assertEqual(info.currentLevel.id, 'heritage_guardian', 'nivel');
    assertEqual(info.xpInCurrentLevel, 3800, 'XP dentro do nivel');
});

test('XP invalido ou negativo cai no primeiro nivel', () => {
    assertEqual(Levels.getLevelFromXP(-500).id, 'explorer', 'negativo');
    assertEqual(Levels.getLevelFromXP(null).id, 'explorer', 'null');
    assertEqual(Levels.getLevelFromXP(undefined).id, 'explorer', 'undefined');
    assertEqual(Levels.getLevelFromXP('abc').id, 'explorer', 'texto');
    assertEqual(Levels.getLevelFromXP(NaN).id, 'explorer', 'NaN');
});

// ============================================================
console.log('\n=== Progresso (teste 9) ===\n');

test('teste 9 — 425 XP da 50% dentro de Viajante', () => {
    const info = Levels.getProgress(425);

    assertEqual(info.currentLevel.id, 'traveler', 'nivel actual');
    assertEqual(info.nextLevel.id, 'connoisseur', 'nivel seguinte');
    assertEqual(info.xpInCurrentLevel, 175, '425 - 250');
    assertEqual(info.xpRequiredForNextLevel, 350, '600 - 250');
    assertEqual(info.xpRemaining, 175, 'falta');
    assertEqual(info.progress, 0.5, 'progresso');
    assertEqual(info.percent, 50, 'percentagem');
});

test('o exemplo do enunciado: 430 XP da 51%', () => {
    const info = Levels.getProgress(430);
    assertEqual(info.xpInCurrentLevel, 180, 'XP dentro do nivel');
    assertEqual(info.xpRequiredForNextLevel, 350, 'largura do nivel');
    assertEqual(info.xpRemaining, 170, 'falta para Conhecedor');
    assertEqual(info.percent, 51, 'percentagem');
});

test('a barra nunca usa o XP total directamente (ponto 7)', () => {
    // 430/600 daria 72%; a conta certa da 51%
    const info = Levels.getProgress(430);
    assert(info.percent !== 72, 'nao usa totalXP / nextLevel.minXP');
    assertEqual(info.percent, 51, 'usa a distancia entre niveis');
});

test('o progresso fica sempre entre 0 e 1', () => {
    [0, 1, 249, 250, 599, 600, 1199, 1200, 5000, -10].forEach(function (xp) {
        const progress = Levels.getLevelProgress(xp);
        assert(progress >= 0 && progress <= 1, 'fora do intervalo em ' + xp + ': ' + progress);
    });
});

test('no inicio de cada nivel o progresso e 0', () => {
    Levels.getLevels().forEach(function (level) {
        if (Levels.isMaxLevel(level.minXP)) return;
        assertEqual(Levels.getLevelProgress(level.minXP), 0, 'inicio de ' + level.id);
    });
});

test('um XP antes do limiar o progresso ainda nao chegou a 1', () => {
    assert(Levels.getLevelProgress(249) < 1, 'Explorador a 249');
    assert(Levels.getLevelProgress(599) < 1, 'Viajante a 599');
    assert(Levels.getLevelProgress(1199) < 1, 'Conhecedor a 1199');
});

// ============================================================
console.log('\n=== Nivel maximo (teste 15) ===\n');

test('teste 15 — no nivel maximo nextLevel e null e nada rebenta', () => {
    const info = Levels.getProgress(1250);

    assertEqual(info.nextLevel, null, 'sem nivel seguinte');
    assertEqual(info.xpRequiredForNextLevel, null, 'sem largura');
    assertEqual(info.xpRemaining, null, 'sem falta');
    assertEqual(info.isMaxLevel, true, 'e o maximo');
    // A barra fica cheia em vez de partida (ponto 18)
    assertEqual(info.progress, 1, 'barra completa');
    assertEqual(info.percent, 100, 'percentagem');
});

test('o XP continua a subir depois do nivel maximo (ponto 19)', () => {
    assertEqual(Levels.getProgress(1840).totalXP, 1840, 'total');
    assertEqual(Levels.getProgress(1840).currentLevel.id, 'heritage_guardian', 'nivel');
    assert(Levels.isMaxLevel(1840), 'continua no maximo');
});

// ============================================================
console.log('\n=== Subida de nivel (testes 10, 11 e 17) ===\n');

test('teste 10 — ganhar XP sem mudar de nivel nao e level up', () => {
    const transition = Levels.detectLevelUp(700, 705);
    assertEqual(transition.leveledUp, false, 'sem subida');
    assertEqual(transition.levelsGained, 0, 'niveis ganhos');
    assertEqual(transition.newLevel.id, 'connoisseur', 'mesmo nivel');
});

test('teste 11 — cruzar o limiar e level up', () => {
    const transition = Levels.detectLevelUp(590, 640);
    assertEqual(transition.leveledUp, true, 'subiu');
    assertEqual(transition.previousLevel.id, 'traveler', 'antes');
    assertEqual(transition.newLevel.id, 'connoisseur', 'depois');
    assertEqual(transition.levelsGained, 1, 'um nivel');
});

test('cruzar o limiar exacto conta (599 -> 600)', () => {
    assertEqual(Levels.detectLevelUp(599, 600).leveledUp, true, '599 -> 600');
    assertEqual(Levels.detectLevelUp(249, 250).leveledUp, true, '249 -> 250');
    assertEqual(Levels.detectLevelUp(1199, 1200).leveledUp, true, '1199 -> 1200');
});

test('parar um XP antes do limiar nao e level up', () => {
    assertEqual(Levels.detectLevelUp(240, 249).leveledUp, false, '240 -> 249');
    assertEqual(Levels.detectLevelUp(590, 599).leveledUp, false, '590 -> 599');
    assertEqual(Levels.detectLevelUp(1190, 1199).leveledUp, false, '1190 -> 1199');
});

test('teste 17 — uma recompensa pode saltar varios niveis', () => {
    const transition = Levels.detectLevelUp(200, 1200);
    assertEqual(transition.leveledUp, true, 'subiu');
    assertEqual(transition.previousLevel.id, 'explorer', 'antes: Explorador');
    assertEqual(transition.newLevel.id, 'heritage_guardian', 'depois: Guardiao');
    assertEqual(transition.levelsGained, 3, 'tres niveis de uma vez');
});

test('teste 13 — a mesma transicao repetida da sempre o mesmo resultado', () => {
    // Uma recompensa duplicada bloqueada pelo XP deixa previousXP === newXP
    const transition = Levels.detectLevelUp(640, 640);
    assertEqual(transition.leveledUp, false, 'sem falso level up');
});

test('o nivel nunca desce por si: e sempre recalculado do total', () => {
    // Nao existe incremento: o nivel de 640 XP e sempre o mesmo
    assertEqual(Levels.getLevelFromXP(640).level, Levels.getLevelFromXP(640).level, 'estavel');
    assertEqual(Levels.detectLevelUp(1200, 600).leveledUp, false, 'descer nao e level up');
});

// ============================================================
console.log('\n=== Jornada (pontos 25 e 26) ===\n');

test('a jornada marca concluido, actual e bloqueado', () => {
    const journey = Levels.getJourney(740);

    assertEqual(journey.length, 4, 'todos os niveis sao mostrados');
    assertEqual(journey[0].state, 'done', 'Explorador');
    assertEqual(journey[1].state, 'done', 'Viajante');
    assertEqual(journey[2].state, 'current', 'Conhecedor');
    assertEqual(journey[3].state, 'locked', 'Guardiao');
});

test('a 0 XP so o primeiro nivel esta activo', () => {
    const journey = Levels.getJourney(0);
    assertEqual(journey[0].state, 'current', 'Explorador');
    assertEqual(journey.filter(l => l.state === 'locked').length, 3, 'os restantes bloqueados');
});

test('no nivel maximo nada fica bloqueado', () => {
    const journey = Levels.getJourney(1500);
    assertEqual(journey.filter(l => l.state === 'locked').length, 0, 'sem bloqueados');
    assertEqual(journey[3].state, 'current', 'Guardiao actual');
});

test('a configuracao devolvida e uma copia (nao se altera por fora)', () => {
    const levels = Levels.getLevels();
    levels[0].minXP = 99999;
    assertEqual(Levels.getLevelFromXP(0).minXP, 0, 'a configuracao original nao mudou');
});

// ============================================================
console.log('\n=== Compatibilidade com utilizadores antigos (testes 14 e 32) ===\n');

test('teste 14 — utilizador antigo com points: 315 fica Viajante', () => {
    // Antes do sistema de XP so existia `points`
    const legacyUser = { name: 'Dénis', points: 315 };

    const xp = Levels.resolveTotalXP(legacyUser);
    assertEqual(xp, 315, 'o XP e preservado');
    assertEqual(Levels.getLevelFromXP(xp).id, 'traveler', 'nivel');
    assertEqual(Levels.getLevelFromXP(xp).level, 2, 'numero do nivel');
});

test('a carteira de XP tem prioridade sobre points', () => {
    const user = { points: 315, xp: { total: 740 } };
    assertEqual(Levels.resolveTotalXP(user), 740, 'usa a carteira');
});

test('utilizador sem XP nem points comeca a zero', () => {
    assertEqual(Levels.resolveTotalXP({ name: 'novo' }), 0, 'sem dados');
    assertEqual(Levels.resolveTotalXP(null), 0, 'null');
    assertEqual(Levels.resolveTotalXP(undefined), 0, 'undefined');
    assertEqual(Levels.resolveTotalXP(430), 430, 'numero directo');
});

test('o "Nivel 4" antigo (100 XP por nivel) nao sobrevive a migracao', () => {
    // A regra antiga dava Math.floor(315 / 100) + 1 = 4
    const legacyLevel = Math.floor(315 / 100) + 1;
    assertEqual(legacyLevel, 4, 'regra antiga');
    assertEqual(Levels.getLevelFromXP(315).level, 2, 'regra nova');
    // O que nao pode mudar e o XP
    assertEqual(Levels.resolveTotalXP({ points: 315 }), 315, 'XP intacto');
});

// ============================================================
console.log('\n=== Integracao com o sistema de XP (pontos 20 e 21) ===\n');

test('o fluxo real: descobrir um monumento cruza o limiar uma so vez', () => {
    freshWallet();

    // 590 XP reconstruidos a partir de pontos antigos
    XP.migrateLegacyPoints({ legacyPoints: 590, discoveredMonuments: [] });
    assertEqual(XP.getTotalXP(), 590, 'ponto de partida');
    assertEqual(Levels.getLevelFromXP(XP.getTotalXP()).id, 'traveler', 'Viajante');

    const batch = XP.awardMany([{
        action: ACTION.MONUMENT_DISCOVERED,
        monumentId: 1,
        entityId: 1,
        entityAmount: 50
    }]);

    assertEqual(batch.previousXP, 590, 'previousXP');
    assertEqual(batch.currentXP, 640, 'newXP');

    const transition = Levels.detectLevelUp(batch.previousXP, batch.currentXP);
    assertEqual(transition.leveledUp, true, 'houve subida');
    assertEqual(transition.newLevel.id, 'connoisseur', 'Conhecedor');

    // Teste 13: repetir a mesma descoberta nao rende XP nem novo nivel
    const again = XP.awardMany([{
        action: ACTION.MONUMENT_DISCOVERED,
        monumentId: 1,
        entityId: 1,
        entityAmount: 50
    }]);
    assertEqual(again.totalAwarded, 0, 'sem XP repetido');
    assertEqual(Levels.detectLevelUp(again.previousXP, again.currentXP).leveledUp, false, 'sem falso level up');
});

test('uma accao que nao rende XP nunca muda o nivel', () => {
    freshWallet();
    XP.migrateLegacyPoints({ legacyPoints: 249, discoveredMonuments: [] });

    // Accao invalida: o total nao mexe
    const batch = XP.awardMany([{ action: 'ACCAO_INEXISTENTE' }]);
    assertEqual(batch.previousXP, batch.currentXP, 'total inalterado');
    assertEqual(Levels.getLevelFromXP(XP.getTotalXP()).id, 'explorer', 'continua Explorador');
});

test('o nivel lido da carteira e sempre o derivado do total', () => {
    freshWallet();
    XP.migrateLegacyPoints({ legacyPoints: 1199, discoveredMonuments: [] });
    assertEqual(Levels.getLevelFromXP(XP.getWallet().total).id, 'connoisseur', 'a 1199');

    XP.awardMany([{ action: ACTION.EXPERIENCE_ADDED, monumentId: 7, entityId: 'exp7' }]);
    assertEqual(XP.getTotalXP(), 1209, 'total depois de +10');
    assertEqual(Levels.getLevelFromXP(XP.getTotalXP()).id, 'heritage_guardian', 'Guardiao');
});

// ============================================================
console.log('\n' + '-'.repeat(52));
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach(f => console.error('FALHOU: ' + f.name + '\n  ' + f.error.stack));
    process.exit(1);
}
