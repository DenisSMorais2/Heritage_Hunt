// ============================================================
// Heritage Hunt CV — testes das Pistas
//
//   node clues.test.js
// ============================================================

const { Clues, CLUE_CONFIG } = require('./clues.js');

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

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error((message || 'valores diferentes') +
            '\n      esperado: ' + JSON.stringify(expected) +
            '\n      obtido:   ' + JSON.stringify(actual));
    }
}

const clock = Date.parse('2026-10-01T10:00:00Z');
function at(offset) { return new Date(clock + offset).toISOString(); }

function clue(overrides) {
    return Object.assign({
        id: 'c' + Math.random().toString(36).slice(2),
        monumentId: '5',
        body: 'Procura do lado onde consegues ver o mar.',
        createdAt: at(0),
        deleted: false,
        mine: false,
        author: { userId: 'u1', name: 'Ana Silva', xpTotal: 420, discovered: true },
        helpful: 0,
        myHelpful: false
    }, overrides || {});
}

console.log('\nPistas — escrever\n');

test('uma pista vazia nao e pista', () => {
    assertEqual(Clues.validateDraft('   ').reason, 'empty');
    assertEqual(Clues.validateDraft('Olha para o mar.').ok, true);
});

test('o limite e o da base de dados, e e curto de proposito', () => {
    assertEqual(CLUE_CONFIG.MAX_LENGTH, 400, 'espelha clues_body_length');

    assertEqual(Clues.validateDraft('a'.repeat(400)).ok, true);
    assertEqual(Clues.validateDraft('a'.repeat(401)).reason, 'too_long');
});

test('o texto e limpo nas pontas', () => {
    assertEqual(Clues.validateDraft('  olha para o mar  ').body, 'olha para o mar');
});

test('o contador so aparece perto do limite', () => {
    assertEqual(Clues.shouldShowCounter('a'.repeat(10)), false);
    assertEqual(Clues.shouldShowCounter('a'.repeat(280)), true);
    assertEqual(Clues.remainingChars('a'.repeat(399)), 1);
});

console.log('\nPistas — ajudar sem revelar\n');

test('uma pista que aponta uma direccao nao levanta aviso', () => {
    assertEqual(Clues.soundsRevealing('Procura do lado onde consegues ver o mar.'), false);
    assertEqual(Clues.soundsRevealing('É uma zona que muita gente passa e não repara.'), false);
});

test('uma pista que descreve o sitio exacto levanta aviso', () => {
    assertEqual(Clues.soundsRevealing('Está atrás da porta principal.'), true);
    assertEqual(Clues.soundsRevealing('Fica debaixo de um banco.'), true);
    assertEqual(Clues.soundsRevealing('A terceira coluna a contar da esquerda.'), true);
    assertEqual(Clues.soundsRevealing('Uns 20 metros à direita.'), true);
});

test('o aviso ignora acentos e maiusculas', () => {
    assertEqual(Clues.soundsRevealing('ATRÁS DO MURO'), true);
    assertEqual(Clues.soundsRevealing('atras do muro'), true);
});

test('o aviso nao bloqueia nada — e so um sinal', () => {
    // Uma pista que soa a revelar continua a ser valida. Quem
    // escreve e que decide (ponto 55: nada de moderacao automatica).
    assertEqual(Clues.validateDraft('Está atrás da porta.').ok, true);
});

test('texto vazio nunca levanta aviso', () => {
    assertEqual(Clues.soundsRevealing(''), false);
    assertEqual(Clues.soundsRevealing(null), false);
});

console.log('\nPistas — quem pode escrever (ponto 19)\n');

test('quem ainda nao descobriu ve a lista fechada', () => {
    assertEqual(Clues.writeState({ canWrite: false, hasMine: false }), 'locked');
    assertEqual(Clues.canWrite({ canWrite: false, hasMine: false }), false);
});

test('quem descobriu e ainda nao deixou pode escrever', () => {
    assertEqual(Clues.writeState({ canWrite: true, hasMine: false }), 'write');
    assertEqual(Clues.canWrite({ canWrite: true, hasMine: false }), true);
});

test('uma pista por explorador e por monumento', () => {
    assertEqual(Clues.writeState({ canWrite: true, hasMine: true }), 'already');
    assertEqual(Clues.canWrite({ canWrite: true, hasMine: true }), false);
});

test('sem informacao nenhuma, fica fechado', () => {
    assertEqual(Clues.writeState(null), 'locked', 'o estado seguro e o fechado');
    assertEqual(Clues.writeState({}), 'locked');
});

console.log('\nPistas — a lista\n');

test('as pistas ordenam-se por quem ajudou mais, nao por novidade', () => {
    const nova = clue({ id: 'nova', helpful: 1, createdAt: at(9000) });
    const util = clue({ id: 'util', helpful: 18, createdAt: at(0) });

    const ordenada = Clues.sortByHelpful([nova, util]);
    assertEqual(ordenada[0].id, 'util', 'o contrario do feed, e de proposito');
});

test('empate em "ajudou-me" desempata pela mais recente', () => {
    const velha = clue({ id: 'velha', helpful: 5, createdAt: at(0) });
    const nova = clue({ id: 'nova', helpful: 5, createdAt: at(5000) });

    assertEqual(Clues.sortByHelpful([velha, nova])[0].id, 'nova');
});

test('ordenar nao altera a lista original', () => {
    const lista = [clue({ id: 'a', helpful: 1 }), clue({ id: 'b', helpful: 9 })];
    Clues.sortByHelpful(lista);
    assertEqual(lista[0].id, 'a');
});

test('agradecer sobe o contador sem mutar a original', () => {
    const antes = clue({ helpful: 17, myHelpful: false });
    const depois = Clues.toggleHelpful(antes);

    assertEqual(depois.helpful, 18);
    assertEqual(depois.myHelpful, true);
    assertEqual(antes.helpful, 17);
});

test('agradecer outra vez desfaz, e nunca desce abaixo de zero', () => {
    assertEqual(Clues.toggleHelpful(clue({ helpful: 1, myHelpful: true })).helpful, 0);
    assertEqual(Clues.toggleHelpful(clue({ helpful: 0, myHelpful: true })).helpful, 0);
});

test('substituir e remover mexem so na pista pedida', () => {
    const a = clue({ id: 'a', body: 'A' });
    const b = clue({ id: 'b', body: 'B' });

    const trocada = Clues.replaceClue([a, b], Object.assign({}, b, { body: 'B2' }));
    assertEqual(trocada[0].body, 'A');
    assertEqual(trocada[1].body, 'B2');

    assertEqual(Clues.removeClue([a, b], 'a').length, 1);
});

console.log('\nPistas — o indice da aba\n');

function mon(id, clues, discovered, hasMine) {
    return { monumentId: id, zoneId: 'centro_historico', clues: clues, discovered: discovered, hasMine: !!hasMine };
}

test('os monumentos com pistas vem primeiro', () => {
    const rows = Clues.sortMonuments([mon('1', 0, true), mon('2', 5, false)]);
    assertEqual(rows[0].monumentId, '2');
});

test('entre os que tem pistas, os que ainda nao descobri vem a frente', () => {
    const rows = Clues.sortMonuments([mon('1', 3, true), mon('2', 3, false)]);
    assertEqual(rows[0].monumentId, '2', 'sao esses que me interessam quando estou perdido');
});

test('entre os que nao tem pistas, os que eu posso ajudar vem a frente', () => {
    const rows = Clues.sortMonuments([mon('1', 0, false), mon('2', 0, true)]);
    assertEqual(rows[0].monumentId, '2', 'o convite para deixar a primeira');
});

test('conta quantos monumentos ainda esperam pela minha pista', () => {
    const rows = [mon('1', 2, true, true), mon('2', 0, true, false), mon('3', 4, false, false)];
    assertEqual(Clues.monumentsICanHelp(rows), 1);
});

test('soma as pistas de todos os monumentos', () => {
    assertEqual(Clues.totalClues([mon('1', 2, true), mon('2', 3, true), mon('3', 0, false)]), 5);
});

test('as razoes de denuncia sao as da base de dados', () => {
    assertEqual(Clues.isValidReportReason('qr_location'), true, 'a razao principal aqui');
    assertEqual(Clues.isValidReportReason('nao_gostei'), false);
    assertEqual(CLUE_CONFIG.REPORT_REASONS.length, 5);
});

console.log('\n' + '-'.repeat(52));
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach((f) => console.log('  ✗ ' + f.name + '\n    ' + f.error.message + '\n'));
    process.exit(1);
}
