// ============================================================
// Heritage Hunt CV — testes da celebração de descoberta
//
// O projecto não usa npm nem framework de testes, por isso este
// runner segue o formato de xp.test.js / journey.test.js.
//
//   node discovery.test.js
// ============================================================

const { Discovery } = require('./discovery.js');

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

const ZONES = [
    { id: 'centro_historico', monumentIds: [1, 3, 4, 8] },
    { id: 'frente_mar', monumentIds: [5, 6, 11] }
];

const MONUMENT = { id: 4, name: 'Igreja Nossa Senhora da Luz', image: 'igreja.jpg', points: 45 };

// Lote de XP com a forma real devolvida por XP.awardMany
function batch(options) {
    const config = options || {};
    const awarded = [];

    if (config.monumentXP !== 0) {
        awarded.push({
            action: 'MONUMENT_DISCOVERED',
            amount: config.monumentXP === undefined ? 45 : config.monumentXP,
            awarded: true,
            transaction: { monumentId: 4, entityId: 4 }
        });
    }

    if (config.zoneId) {
        awarded.push({
            action: 'ZONE_COMPLETED',
            amount: config.zoneXP === undefined ? 100 : config.zoneXP,
            awarded: true,
            transaction: { zoneId: config.zoneId, entityId: config.zoneId }
        });
    }

    const total = awarded.reduce((sum, a) => sum + a.amount, 0);
    const previousXP = config.previousXP === undefined ? 580 : config.previousXP;

    return {
        awarded: awarded,
        results: awarded,
        totalAwarded: total,
        previousXP: previousXP,
        currentXP: previousXP + total,
        persisted: true
    };
}

function celebration(overrides) {
    const config = overrides || {};

    return Discovery.buildCelebration(Object.assign({
        monument: MONUMENT,
        zones: ZONES,
        journeyId: 'mindelo_historico',
        cityId: 'mindelo',
        islandId: 'sao_vicente',
        xpBatch: batch(),
        progress: { discovered: 8, total: 12 },
        previousProgress: { discovered: 7, total: 12 },
        streakResult: null,
        badges: [],
        levelUp: null,
        nextStep: {
            monumentId: 5,
            zoneId: 'frente_mar',
            monument: { id: 5, name: 'Torre de Belém (Réplica)', points: 35 }
        }
    }, config));
}

console.log('\nCelebração de descoberta\n' + '='.repeat(52) + '\n');

// ============================================================
console.log('TESTE 1 — descoberta normal');
// ============================================================

test('mostra monumento, XP e progresso', () => {
    const result = celebration();

    assertEqual(result.monument.name, 'Igreja Nossa Senhora da Luz', 'nome');
    assertEqual(result.xp.earned, 45, 'XP ganho');
    assertEqual(result.xp.total, 625, 'XP total');
    assertEqual(result.progress.discovered, 8, 'descobertos');
    assertEqual(result.progress.total, 12, 'total');
    assertEqual(result.progress.percent, 67, 'percentagem');
});

test('sem badge, sem zona e sem subida de nível', () => {
    const result = celebration();

    assertEqual(result.badges.length, 0, 'medalhas');
    assertEqual(result.zone, null, 'zona');
    assertEqual(result.levelUp, null, 'nível');
    assertEqual(result.hasSpecials, false, 'blocos especiais');
    assertEqual(result.specialOrder.length, 0, 'ordem dos especiais');
});

test('a variante é a normal e traz a próxima história', () => {
    const result = celebration();

    assertEqual(result.variant, 'standard', 'variante');
    assertEqual(result.next.monumentId, 5, 'próximo monumento');
    assertEqual(result.next.name, 'Torre de Belém (Réplica)', 'nome do próximo');
});

// ============================================================
console.log('\nTESTE 2 — sequência');
// ============================================================

test('novo dia de sequência aparece uma única vez', () => {
    const result = celebration({
        streakResult: { registered: true, isNewDay: true, current: 5, best: 7, streakContinued: true }
    });

    assertEqual(result.streak.current, 5, 'dias');
    assertEqual(result.streak.continued, true, 'continuou');
});

test('já ter explorado hoje não volta a celebrar a sequência', () => {
    const result = celebration({
        streakResult: { registered: true, isNewDay: false, current: 5, best: 7 }
    });

    assertEqual(result.streak, null, 'sequência');
});

test('uma actividade não registada nunca celebra sequência', () => {
    const result = celebration({
        streakResult: { registered: false, isNewDay: true, current: 9 }
    });

    assertEqual(result.streak, null, 'sequência');
});

// ============================================================
console.log('\nTESTE 3 — medalha');
// ============================================================

test('a medalha desbloqueada entra na celebração', () => {
    const result = celebration({
        progress: { discovered: 6, total: 12 },
        previousProgress: { discovered: 5, total: 12 },
        badges: [{
            id: 2,
            name: 'Aventureiro Intermediário',
            description: 'Descobriu 50% dos monumentos!',
            icon: 'fas fa-map-marked-alt',
            threshold: 50
        }]
    });

    assertEqual(result.badges.length, 1, 'medalhas');
    assertEqual(result.badges[0].name, 'Aventureiro Intermediário', 'nome');
    assertEqual(result.badges[0].threshold, 50, 'limiar');
    assertEqual(result.specialOrder.join(','), 'badge', 'ordem');
});

test('50% dos monumentos dá o tom de metade da jornada', () => {
    const result = celebration({
        progress: { discovered: 6, total: 12 },
        previousProgress: { discovered: 5, total: 12 }
    });

    assertEqual(result.progress.percent, 50, 'percentagem');
    assertEqual(result.tone, 'half', 'tom');
});

// ============================================================
console.log('\nTESTE 4 — subida de nível');
// ============================================================

test('a subida de nível entra na mesma celebração', () => {
    const result = celebration({
        levelUp: { id: 'connoisseur', level: 3, icon: 'fas fa-landmark', accent: 'violet' }
    });

    assertEqual(result.levelUp.id, 'connoisseur', 'id do nível');
    assertEqual(result.levelUp.level, 3, 'número do nível');
    assertEqual(result.specialOrder.join(','), 'levelUp', 'ordem');
});

// ============================================================
console.log('\nTESTE 5 — zona concluída');
// ============================================================

test('o XP do monumento e o da zona somam correctamente', () => {
    const result = celebration({ xpBatch: batch({ zoneId: 'centro_historico' }) });

    assertEqual(result.xp.monument, 45, 'XP do monumento');
    assertEqual(result.xp.zone, 100, 'XP da zona');
    assertEqual(result.xp.earned, 145, 'XP ganho no total');
    assertEqual(result.xp.total, 725, 'XP acumulado');
    assertEqual(result.xp.hasZoneBonus, true, 'bónus de zona');
});

test('a zona traz o id real e o seu tamanho', () => {
    const result = celebration({ xpBatch: batch({ zoneId: 'centro_historico' }) });

    assertEqual(result.zone.id, 'centro_historico', 'id da zona');
    assertEqual(result.zone.total, 4, 'monumentos da zona');
    assertEqual(result.zone.discovered, 4, 'descobertos na zona');
    assertEqual(result.zone.xp, 100, 'XP da zona');
});

// ============================================================
console.log('\nTESTE 6 — várias recompensas ao mesmo tempo');
// ============================================================

test('nível, zona e medalha convivem numa só celebração', () => {
    const result = celebration({
        xpBatch: batch({ zoneId: 'centro_historico' }),
        levelUp: { id: 'connoisseur', level: 3, icon: 'fas fa-landmark', accent: 'violet' },
        badges: [{ id: 2, name: 'Aventureiro Intermediário', description: '50%', icon: 'fas fa-map-marked-alt', threshold: 50 }]
    });

    assertEqual(result.hasSpecials, true, 'tem especiais');
    assertEqual(result.specialOrder.join(','), 'levelUp,zone,badge', 'ordem de destaque');
});

test('a ordem de destaque é sempre a mesma, chegue o que chegar', () => {
    const onlyZoneAndBadge = celebration({
        xpBatch: batch({ zoneId: 'centro_historico' }),
        badges: [{ id: 1, name: 'Explorador Iniciante', description: '25%', icon: 'fas fa-compass', threshold: 25 }]
    });

    assertEqual(onlyZoneAndBadge.specialOrder.join(','), 'zone,badge', 'ordem sem nível');
});

// ============================================================
console.log('\nTESTE 7 — primeira descoberta e jornada concluída');
// ============================================================

test('a primeira descoberta tem variante própria', () => {
    const result = celebration({
        progress: { discovered: 1, total: 12 },
        previousProgress: { discovered: 0, total: 12 }
    });

    assertEqual(result.variant, 'first', 'variante');
    assertEqual(result.tone, 'first', 'tom');
    assertEqual(result.progress.isFirst, true, 'é a primeira');
    assertEqual(result.progress.previousPercent, 0, 'percentagem anterior');
});

test('o último monumento celebra a jornada concluída', () => {
    const result = celebration({
        progress: { discovered: 12, total: 12 },
        previousProgress: { discovered: 11, total: 12 },
        nextStep: null
    });

    assertEqual(result.variant, 'complete', 'variante');
    assertEqual(result.tone, 'complete', 'tom');
    assertEqual(result.progress.percent, 100, 'percentagem');
    assertEqual(result.next, null, 'próxima história');
});

test('numa jornada concluída não há próxima etapa, mesmo que venha uma', () => {
    const result = celebration({
        progress: { discovered: 12, total: 12 },
        previousProgress: { discovered: 11, total: 12 }
    });

    assertEqual(result.next, null, 'próxima história');
});

// ============================================================
console.log('\nTESTE 8 — a barra nunca começa do zero');
// ============================================================

test('o progresso anterior é preservado para a animação', () => {
    const result = celebration();

    assertEqual(result.progress.previousDiscovered, 7, 'descobertos antes');
    assertEqual(result.progress.previousPercent, 58, 'percentagem antes');
    assertEqual(result.progress.percent, 67, 'percentagem agora');
});

test('um progresso anterior inválido nunca ultrapassa o actual', () => {
    const result = celebration({ previousProgress: { discovered: 99, total: 12 } });

    assertEqual(result.progress.previousDiscovered, 8, 'descobertos antes');
    assertEqual(result.progress.previousPercent, 67, 'percentagem antes');
});

// ============================================================
console.log('\nTESTE 9 — a UI nunca decide recompensas');
// ============================================================

test('o XP vem do lote, não dos pontos do monumento', () => {
    // O monumento vale 45, mas o domínio do XP atribuiu 30.
    const result = celebration({ xpBatch: batch({ monumentXP: 30 }) });

    assertEqual(result.xp.monument, 30, 'XP do monumento');
    assertEqual(result.xp.earned, 30, 'XP ganho');
    assertEqual(result.monument.points, 45, 'pontos do monumento, só informativos');
});

test('um lote sem recompensas não inventa XP', () => {
    const result = celebration({
        xpBatch: { awarded: [], results: [], totalAwarded: 0, previousXP: 580, currentXP: 580, persisted: true }
    });

    assertEqual(result.xp.earned, 0, 'XP ganho');
    assertEqual(result.xp.monument, 0, 'XP do monumento');
    assertEqual(result.zone, null, 'zona');
    assertEqual(result.xp.hasZoneBonus, false, 'bónus de zona');
});

test('sem lote nenhum, o XP é zero e nada rebenta', () => {
    const result = celebration({ xpBatch: null });

    assertEqual(result.xp.earned, 0, 'XP ganho');
    assertEqual(result.xp.total, 0, 'XP total');
    assertEqual(result.zone, null, 'zona');
});

// ============================================================
console.log('\nTESTE 10 — tom da frase contextual');
// ============================================================

test('o tom é o do limiar atravessado por esta descoberta', () => {
    const quarter = celebration({
        progress: { discovered: 3, total: 12 },
        previousProgress: { discovered: 2, total: 12 }
    });
    assertEqual(quarter.tone, 'quarter', 'tom aos 25%');

    const threeQuarters = celebration({
        progress: { discovered: 9, total: 12 },
        previousProgress: { discovered: 8, total: 12 }
    });
    assertEqual(threeQuarters.tone, 'threeQuarters', 'tom aos 75%');
});

test('sem limiar atravessado, o tom é o de continuar', () => {
    const result = celebration({
        progress: { discovered: 5, total: 12 },
        previousProgress: { discovered: 4, total: 12 }
    });

    assertEqual(result.tone, 'onward', 'tom');
});

test('atravessar dois limiares de uma vez usa o mais alto', () => {
    const result = celebration({
        progress: { discovered: 7, total: 12 },
        previousProgress: { discovered: 2, total: 12 }
    });

    assertEqual(result.progress.previousPercent, 17, 'percentagem antes');
    assertEqual(result.progress.percent, 58, 'percentagem agora');
    assertEqual(result.tone, 'half', 'tom');
});

// ============================================================
console.log('\nTESTE 11 — defesas');
// ============================================================

test('sem monumento não há celebração', () => {
    assertEqual(Discovery.buildCelebration({}), null, 'resultado');
    assertEqual(Discovery.buildCelebration(null), null, 'resultado sem argumentos');
});

test('uma zona desconhecida não inventa um tamanho', () => {
    const result = celebration({ xpBatch: batch({ zoneId: 'zona_inexistente' }) });

    assertEqual(result.zone.id, 'zona_inexistente', 'id');
    assertEqual(result.zone.total, 0, 'tamanho');
});

test('a ordem dos especiais publicada não é alterável de fora', () => {
    const order = Discovery.SPECIAL_ORDER;
    order.push('inventado');

    assertEqual(Discovery.SPECIAL_ORDER.indexOf('inventado'), -1, 'ordem intacta');
    assertEqual(Discovery.SPECIAL_ORDER.join(','), 'levelUp,zone,badge', 'ordem original');
});

test('uma jornada sem monumentos não divide por zero', () => {
    const result = celebration({
        progress: { discovered: 0, total: 0 },
        previousProgress: { discovered: 0, total: 0 }
    });

    assertEqual(result.progress.percent, 0, 'percentagem');
    assertEqual(result.progress.isComplete, false, 'concluída');
});

// ============================================================
console.log('\n' + '-'.repeat(52));
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach(f => console.error('FALHOU: ' + f.name + '\n  ' + f.error.stack));
    process.exit(1);
}
