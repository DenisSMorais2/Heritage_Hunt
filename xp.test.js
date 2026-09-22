// ============================================================
// Heritage Hunt CV — testes do sistema de XP
//
// O projecto nao usa npm nem framework de testes, por isso este
// runner e propositadamente minimo e sem dependencias.
//
//   node xp.test.js
// ============================================================

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

// --- Ajudas -------------------------------------------------

// Carteira em memoria que imita o adaptador da app
function freshWallet(initial) {
    let value = initial === undefined ? null : initial;
    XP.configureStorage({
        load: () => value,
        save: (data) => { value = JSON.parse(JSON.stringify(data)); },
        exists: () => true
    });
    return {
        get: () => value,
        set: (data) => { value = data; }
    };
}

// Monumentos com os valores reais do projecto
const MONUMENTS = {
    1: { id: 1, points: 50, name: 'Palácio do Povo' },
    3: { id: 3, points: 30, name: 'Mercado Municipal' },
    4: { id: 4, points: 45, name: 'Igreja Nossa Senhora da Luz' },
    8: { id: 8, points: 25, name: 'Praça Nova' }
};

function discover(monumentId) {
    const monument = MONUMENTS[monumentId] || { id: monumentId, points: 50 };
    return XP.awardXP({
        action: ACTION.MONUMENT_DISCOVERED,
        monumentId: monument.id,
        entityId: monument.id,
        entityAmount: monument.points
    });
}

function addPhoto(monumentId, photoId) {
    return XP.awardXP({
        action: ACTION.PHOTO_ADDED,
        monumentId: monumentId,
        entityId: photoId || ('photo_' + Math.random().toString(36).slice(2))
    });
}

function addExperience(monumentId) {
    return XP.awardXP({
        action: ACTION.EXPERIENCE_ADDED,
        monumentId: monumentId,
        entityId: 'experience_' + monumentId
    });
}

function completeZone(zoneId) {
    return XP.awardXP({ action: ACTION.ZONE_COMPLETED, zoneId: zoneId, entityId: zoneId });
}

// ============================================================
console.log('\nRegras obrigatorias (ponto 45)');
// ============================================================

test('TESTE 1 — primeira descoberta atribui o XP do monumento', () => {
    freshWallet();
    assertEqual(XP.getTotalXP(), 0, 'XP inicial');

    const result = discover(1);              // Palácio do Povo vale 50
    assert(result.awarded, 'devia atribuir');
    assertEqual(result.amount, 50, 'montante');
    assertEqual(result.previousXP, 0, 'previousXP');
    assertEqual(result.currentXP, 50, 'currentXP');
    assertEqual(XP.getTotalXP(), 50, 'total');
});

test('TESTE 2 — descobrir o mesmo monumento outra vez nao repete XP', () => {
    freshWallet();
    discover(1);
    const result = discover(1);

    assert(!result.awarded, 'nao devia atribuir');
    assertEqual(result.reason, XP.REASON.ALREADY_REWARDED, 'motivo');
    assertEqual(XP.getTotalXP(), 50, 'total inalterado');
    assertEqual(XP.getHistoryCount(), 1, 'uma so transacao');
});

test('TESTE 3 — primeira fotografia: +5', () => {
    freshWallet();
    discover(1);
    const result = addPhoto(1, 'photo_a');

    assert(result.awarded, 'devia atribuir');
    assertEqual(result.amount, 5, 'montante');
    assertEqual(XP.getTotalXP(), 55, 'total');
});

test('TESTE 4 — segunda fotografia: +5', () => {
    freshWallet();
    discover(1);
    addPhoto(1, 'photo_a');
    const result = addPhoto(1, 'photo_b');

    assert(result.awarded, 'devia atribuir');
    assertEqual(XP.getTotalXP(), 60, 'total');
});

test('TESTE 5 — a quarta fotografia ja nao rende XP', () => {
    freshWallet();
    discover(1);
    assertEqual(addPhoto(1, 'p1').awarded, true, 'foto 1');
    assertEqual(addPhoto(1, 'p2').awarded, true, 'foto 2');
    assertEqual(addPhoto(1, 'p3').awarded, true, 'foto 3');

    const fourth = addPhoto(1, 'p4');
    assert(!fourth.awarded, 'foto 4 nao devia atribuir');
    assertEqual(fourth.reason, XP.REASON.LIMIT_REACHED, 'motivo');
    assertEqual(XP.getTotalXP(), 65, 'total (50 + 3x5)');
    assertEqual(XP.getPhotoRewardsUsed(1), 3, 'slots usados');
    assertEqual(XP.getPhotoRewardsLeft(1), 0, 'slots livres');
});

test('TESTE 6 — primeira experiencia: +10', () => {
    freshWallet();
    discover(1);
    const result = addExperience(1);

    assert(result.awarded, 'devia atribuir');
    assertEqual(result.amount, 10, 'montante');
    assertEqual(XP.getTotalXP(), 60, 'total');
});

test('TESTE 7 — editar a experiencia nao da XP adicional', () => {
    freshWallet();
    discover(1);
    addExperience(1);

    const again = addExperience(1);
    assert(!again.awarded, 'nao devia atribuir');
    assertEqual(again.reason, XP.REASON.ALREADY_REWARDED, 'motivo');
    assertEqual(XP.getTotalXP(), 60, 'total inalterado');

    // e mesmo guardando varias vezes
    addExperience(1);
    addExperience(1);
    assertEqual(XP.getTotalXP(), 60, 'total continua inalterado');
});

test('TESTE 8 — concluir uma zona: +100, uma so vez', () => {
    freshWallet();
    const first = completeZone('centro_historico');
    assert(first.awarded, 'devia atribuir');
    assertEqual(first.amount, 100, 'montante');
    assertEqual(XP.getTotalXP(), 100, 'total');

    const second = completeZone('centro_historico');
    assert(!second.awarded, 'nao devia repetir');
    assertEqual(XP.getTotalXP(), 100, 'total inalterado');
});

test('TESTE 9 — recarregar a pagina nao altera o XP', () => {
    const store = freshWallet();
    discover(1);
    addPhoto(1, 'p1');
    addExperience(1);
    const before = XP.getTotalXP();
    assertEqual(before, 65, 'total antes');

    // Simula reload: adaptador novo sobre exactamente os mesmos dados
    const snapshot = JSON.stringify(store.get());
    freshWallet(JSON.parse(snapshot));

    assertEqual(XP.getTotalXP(), 65, 'total depois do reload');

    // E varias leituras nao escrevem nada
    XP.getHistory({ limit: 5 });
    XP.getPhotoRewardsUsed(1);
    XP.getWallet();
    assertEqual(XP.getTotalXP(), 65, 'total apos leituras');
});

test('TESTE 10 — clique duplo atribui apenas uma vez', () => {
    freshWallet();
    // Duas chamadas seguidas, sem nada pelo meio (o que um duplo
    // clique produz): a segunda ja ve a chave gravada pela primeira.
    const a = discover(4);
    const b = discover(4);

    assert(a.awarded, 'primeira atribui');
    assert(!b.awarded, 'segunda nao atribui');
    assertEqual(XP.getTotalXP(), 45, 'total');
    assertEqual(XP.getHistoryCount(), 1, 'uma transacao');
});

test('TESTE 11 — utilizador antigo com 315 pontos fica com 315 XP', () => {
    const profile = {
        name: 'Dénis',
        points: 315,
        scannedMonuments: [
            { id: 1, points: 50, discoveredAt: '2026-09-01T10:00:00.000Z' },
            { id: 3, points: 30, discoveredAt: '2026-09-02T10:00:00.000Z' },
            { id: 4, points: 45, discoveredAt: '2026-09-03T10:00:00.000Z' }
        ]
    };

    XP.configureStorage({
        load: () => profile.xp || null,
        save: (data) => { profile.xp = data; },
        exists: () => true
    });

    XP.migrateLegacyPoints({
        legacyPoints: profile.points,
        discoveredMonuments: profile.scannedMonuments
    });

    assertEqual(XP.getTotalXP(), 315, 'total migrado');
    assertEqual(profile.points, 315, 'pontos originais intactos');
    assertEqual(XP.getHistoryCount(), 3, 'historico reconstruido');

    // Nao volta a migrar
    XP.migrateLegacyPoints({ legacyPoints: 315, discoveredMonuments: profile.scannedMonuments });
    assertEqual(XP.getTotalXP(), 315, 'total apos segunda migracao');

    // E os monumentos ja descobertos nao voltam a render XP
    const again = discover(1);
    assert(!again.awarded, 'monumento ja pago');
    assertEqual(XP.getTotalXP(), 315, 'total final');
});

test('TESTE 12 — o historico mostra todas as fontes', () => {
    freshWallet();
    discover(4);
    addPhoto(4, 'p1');
    addExperience(4);
    completeZone('centro_historico');

    const history = XP.getHistory();
    assertEqual(history.length, 4, 'quatro transacoes');

    // Mais recente primeiro
    assertEqual(history[0].action, ACTION.ZONE_COMPLETED, 'ultima accao');
    assertEqual(history[0].amount, 100, 'montante da zona');
    assertEqual(history[0].zoneId, 'centro_historico', 'zona');

    const byAction = {};
    history.forEach(tx => { byAction[tx.action] = tx.amount; });
    assertEqual(byAction[ACTION.MONUMENT_DISCOVERED], 45, 'descoberta');
    assertEqual(byAction[ACTION.PHOTO_ADDED], 5, 'fotografia');
    assertEqual(byAction[ACTION.EXPERIENCE_ADDED], 10, 'experiencia');

    assertEqual(XP.getTotalXP(), 160, 'total');
    history.forEach(tx => {
        assert(typeof tx.id === 'string' && tx.id, 'transacao com id');
        assert(typeof tx.createdAt === 'string', 'transacao com data');
        assert(typeof tx.rewardKey === 'string', 'transacao com chave');
    });
});

test('TESTE 13 — utilizadores diferentes nao partilham XP', () => {
    const ana = { xp: null };
    const denis = { xp: null };
    let current = ana;

    XP.configureStorage({
        load: () => current.xp,
        save: (data) => { current.xp = data; },
        exists: () => !!current
    });

    current = ana;
    discover(1);
    addPhoto(1, 'a1');
    assertEqual(XP.getTotalXP(), 55, 'XP da Ana');

    current = denis;
    assertEqual(XP.getTotalXP(), 0, 'Dénis comeca a zero');
    discover(3);
    assertEqual(XP.getTotalXP(), 30, 'XP do Dénis');

    current = ana;
    assertEqual(XP.getTotalXP(), 55, 'XP da Ana intacto');

    // E o Dénis pode descobrir o monumento 1 sem colidir com a Ana
    current = denis;
    assert(discover(1).awarded, 'Dénis descobre o monumento 1');
    assertEqual(XP.getTotalXP(), 80, 'XP do Dénis');
    current = ana;
    assertEqual(XP.getTotalXP(), 55, 'XP da Ana continua intacto');
});

test('TESTE 14 — apagar e recriar nao permite farming', () => {
    freshWallet();
    discover(1);

    // Fotografias: os slots gastos nao voltam
    addPhoto(1, 'p1');
    addPhoto(1, 'p2');
    assertEqual(XP.getTotalXP(), 60, 'duas fotos');
    assertEqual(XP.getPhotoRewardsUsed(1), 2, 'dois slots usados');

    // O utilizador apaga as duas e adiciona duas novas (ids novos)
    assert(addPhoto(1, 'p3').awarded, 'terceira foto ainda rende');
    const fourth = addPhoto(1, 'p4');
    assert(!fourth.awarded, 'a quarta ja nao rende mesmo sendo um id novo');
    assertEqual(XP.getTotalXP(), 65, 'total travado no limite');

    // Experiencia: apagar e escrever de novo tambem nao rende
    addExperience(1);
    assertEqual(XP.getTotalXP(), 75, 'experiencia paga uma vez');
    assert(!addExperience(1).awarded, 'recriar nao rende');
    assertEqual(XP.getTotalXP(), 75, 'total inalterado');
});

test('TESTE 15 — a ultima descoberta da zona rende monumento + zona', () => {
    freshWallet();
    discover(1);   // 50
    discover(3);   // 30
    discover(8);   // 25
    assertEqual(XP.getTotalXP(), 105, 'antes da ultima');

    // A descoberta e a conclusao da zona sao gravadas juntas
    const batch = XP.awardMany([
        { action: ACTION.MONUMENT_DISCOVERED, monumentId: 4, entityId: 4, entityAmount: 45 },
        { action: ACTION.ZONE_COMPLETED, zoneId: 'centro_historico', entityId: 'centro_historico' }
    ]);

    assertEqual(batch.totalAwarded, 145, 'XP desta descoberta (45 + 100)');
    assertEqual(batch.awarded.length, 2, 'duas recompensas');
    assertEqual(batch.previousXP, 105, 'previousXP');
    assertEqual(batch.currentXP, 250, 'currentXP');
    assertEqual(XP.getTotalXP(), 250, 'total');

    // E nao repete
    const again = XP.awardMany([
        { action: ACTION.MONUMENT_DISCOVERED, monumentId: 4, entityId: 4, entityAmount: 45 },
        { action: ACTION.ZONE_COMPLETED, zoneId: 'centro_historico', entityId: 'centro_historico' }
    ]);
    assertEqual(again.totalAwarded, 0, 'nada repetido');
    assertEqual(XP.getTotalXP(), 250, 'total inalterado');
});

// ============================================================
console.log('\nConfiguracao central e seguranca');
// ============================================================

test('os montantes vem da configuracao, nunca de quem chama', () => {
    freshWallet();
    const result = XP.awardXP({
        action: ACTION.EXPERIENCE_ADDED,
        monumentId: 7,
        entityId: 'experience_7',
        amount: 10000          // tentativa de injectar o valor
    });

    assert(result.awarded, 'devia atribuir');
    assertEqual(result.amount, 10, 'montante da configuracao');
    assertEqual(XP.getTotalXP(), 10, 'total');
});

test('entityAmount so e aceite onde a configuracao o permite', () => {
    freshWallet();
    // PHOTO_ADDED nao tem useEntityAmount: o valor da entidade e ignorado
    const photo = XP.awardXP({ action: ACTION.PHOTO_ADDED, monumentId: 2, entityId: 'p', entityAmount: 9999 });
    assertEqual(photo.amount, 5, 'fotografia fixa em 5');

    // ZONE_COMPLETED tambem nao
    const zone = XP.awardXP({ action: ACTION.ZONE_COMPLETED, zoneId: 'z', entityAmount: 9999 });
    assertEqual(zone.amount, 100, 'zona fixa em 100');
});

test('uma accao desconhecida nao atribui XP', () => {
    freshWallet();
    const result = XP.awardXP({ action: 'FREE_XP_PLEASE', entityId: 'x' });
    assert(!result.awarded, 'nao devia atribuir');
    assertEqual(result.reason, XP.REASON.INVALID_ACTION, 'motivo');
    assertEqual(XP.getTotalXP(), 0, 'total');
});

test('uma accao sem referencia nao atribui XP', () => {
    freshWallet();
    assertEqual(XP.awardXP({ action: ACTION.MONUMENT_DISCOVERED }).reason, XP.REASON.MISSING_REFERENCE, 'monumento');
    assertEqual(XP.awardXP({ action: ACTION.PHOTO_ADDED, entityId: 'p' }).reason, XP.REASON.MISSING_REFERENCE, 'foto sem monumento');
    assertEqual(XP.awardXP({ action: ACTION.ZONE_COMPLETED }).reason, XP.REASON.MISSING_REFERENCE, 'zona');
    assertEqual(XP.getTotalXP(), 0, 'total');
});

test('os valores da configuracao sao os pedidos', () => {
    assertEqual(XP.getActionAmount(ACTION.MONUMENT_DISCOVERED), 50, 'monumento');
    assertEqual(XP.getActionAmount(ACTION.PHOTO_ADDED), 5, 'fotografia');
    assertEqual(XP.getActionAmount(ACTION.EXPERIENCE_ADDED), 10, 'experiencia');
    assertEqual(XP.getActionAmount(ACTION.ZONE_COMPLETED), 100, 'zona');
    assertEqual(XP.getPhotoRewardLimit(), 3, 'limite de fotografias');
});

test('um monumento sem valor proprio cai nos 50 XP da configuracao', () => {
    freshWallet();
    const result = XP.awardXP({ action: ACTION.MONUMENT_DISCOVERED, monumentId: 99, entityId: 99 });
    assertEqual(result.amount, 50, 'montante por omissao');
});

// ============================================================
console.log('\nPersistencia, observadores e robustez');
// ============================================================

test('sem utilizador nao ha atribuicao de XP', () => {
    XP.configureStorage({ load: () => null, save: () => {}, exists: () => false });
    const result = discover(1);
    assert(!result.awarded, 'nao devia atribuir');
    assertEqual(result.reason, XP.REASON.NO_WALLET, 'motivo');
    assertEqual(XP.getTotalXP(), 0, 'total');
});

test('se a gravacao falhar, a recompensa nao conta', () => {
    let saved = null;
    XP.configureStorage({
        load: () => saved,
        save: () => { throw new Error('QuotaExceededError'); },
        exists: () => true
    });

    const result = discover(1);
    assert(!result.awarded, 'nao pode anunciar XP que nao foi guardado');
    assertEqual(result.reason, 'persist_failed', 'motivo');
    assertEqual(result.persisted, false, 'persisted');
});

test('a zona nao fica sem o monumento quando a gravacao falha', () => {
    XP.configureStorage({
        load: () => null,
        save: () => { throw new Error('disco cheio'); },
        exists: () => true
    });

    const batch = XP.awardMany([
        { action: ACTION.MONUMENT_DISCOVERED, monumentId: 4, entityId: 4, entityAmount: 45 },
        { action: ACTION.ZONE_COMPLETED, zoneId: 'centro_historico' }
    ]);

    assertEqual(batch.totalAwarded, 0, 'nada atribuido');
    assertEqual(batch.awarded.length, 0, 'nenhuma recompensa');
    assertEqual(batch.currentXP, batch.previousXP, 'total inalterado');
});

test('os observadores sao avisados com o antes e o depois', () => {
    freshWallet();
    const events = [];
    const unsubscribe = XP.subscribeToXPChanges(e => events.push(e));

    discover(1);
    assertEqual(events.length, 1, 'um evento');
    assertEqual(events[0].previousXP, 0, 'previousXP');
    assertEqual(events[0].currentXP, 50, 'currentXP');
    assertEqual(events[0].totalAwarded, 50, 'totalAwarded');

    discover(1);   // duplicado: nao notifica
    assertEqual(events.length, 1, 'duplicado nao notifica');

    unsubscribe();
    discover(3);
    assertEqual(events.length, 1, 'deixou de receber');
});

test('um observador com erro nao parte a atribuicao', () => {
    freshWallet();
    const originalError = console.error;
    console.error = () => {};            // o erro abaixo e propositado
    try {
        XP.subscribeToXPChanges(() => { throw new Error('ups'); });
        const result = discover(1);
        assert(result.awarded, 'a recompensa passa na mesma');
        assertEqual(XP.getTotalXP(), 50, 'total');
    } finally {
        console.error = originalError;
    }
});

test('o historico e paginado', () => {
    freshWallet();
    for (let i = 1; i <= 12; i++) {
        XP.awardXP({ action: ACTION.MONUMENT_DISCOVERED, monumentId: i, entityId: i, entityAmount: 10 });
    }
    assertEqual(XP.getHistoryCount(), 12, 'total de transacoes');
    assertEqual(XP.getHistory({ limit: 5 }).length, 5, 'primeira pagina');
    assertEqual(XP.getHistory({ limit: 5, offset: 5 }).length, 5, 'segunda pagina');
    assertEqual(XP.getHistory({ limit: 5, offset: 10 }).length, 2, 'ultima pagina');
    assertEqual(XP.getHistory({ limit: 5, offset: 50 }).length, 0, 'fora do intervalo');
});

test('carteiras corrompidas nao partem a aplicacao', () => {
    freshWallet({
        total: 'muito',
        history: 'nada disto',
        rewardKeys: { naoE: 'array' },
        migratedFrom: 'talvez'
    });

    assertEqual(XP.getTotalXP(), 0, 'total');
    assertEqual(XP.getHistory().length, 0, 'historico');
    assert(discover(1).awarded, 'continua a funcionar');
    assertEqual(XP.getTotalXP(), 50, 'total depois');
});

test('perfis antigos sem carteira comecam a zero sem erro', () => {
    const legacyProfile = { name: 'Antigo', points: 0, scannedMonuments: [] };
    XP.configureStorage({
        load: () => legacyProfile.xp || null,
        save: (data) => { legacyProfile.xp = data; },
        exists: () => true
    });

    assertEqual(XP.getTotalXP(), 0, 'total');
    assertEqual(XP.getHistory().length, 0, 'historico');
    assertEqual(XP.getPhotoRewardsUsed(1), 0, 'slots');
    assert(discover(1).awarded, 'primeira descoberta funciona');
    assert(legacyProfile.xp, 'carteira criada no perfil');
});

test('a idempotencia sobrevive ao corte do historico', () => {
    freshWallet();
    const limit = XP.HISTORY_LIMIT;

    for (let i = 1; i <= limit + 20; i++) {
        XP.awardXP({ action: ACTION.MONUMENT_DISCOVERED, monumentId: i, entityId: i, entityAmount: 10 });
    }

    const wallet = XP.getWallet();
    assertEqual(wallet.history.length, limit, 'historico cortado');
    assertEqual(wallet.rewardKeys.length, limit + 20, 'chaves completas');
    assertEqual(wallet.total, (limit + 20) * 10, 'total');

    // O monumento 1 ja saiu do historico, mas continua a nao render XP
    const again = XP.awardXP({ action: ACTION.MONUMENT_DISCOVERED, monumentId: 1, entityId: 1, entityAmount: 10 });
    assert(!again.awarded, 'continua bloqueado');
});

test('XP so sobe, nunca desce', () => {
    freshWallet();
    discover(1);
    addPhoto(1, 'p1');
    addPhoto(1, 'p2');
    addPhoto(1, 'p3');
    addExperience(1);
    const before = XP.getTotalXP();
    assertEqual(before, 75, 'total com tudo esgotado');

    // Nao existe API para retirar XP e todas as recompensas ja foram usadas:
    // repetir qualquer accao mantem exactamente o mesmo total.
    discover(1);
    addPhoto(1, 'p4');
    addPhoto(1, 'p5');
    addExperience(1);
    assertEqual(XP.getTotalXP(), before, 'o total nao mexe');
    assert(XP.getTotalXP() >= before, 'o total nunca desce');
});

// ============================================================
console.log('\n' + '-'.repeat(52));
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach(f => console.error('FALHOU: ' + f.name + '\n  ' + f.error.stack));
    process.exit(1);
}
