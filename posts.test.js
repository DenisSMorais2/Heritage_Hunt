// ============================================================
// Heritage Hunt CV — testes das Descobertas
//
//   node posts.test.js
// ============================================================

const { Posts, POST_CONFIG } = require('./posts.js');

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

const clock = Date.parse('2026-10-01T10:00:00Z');
function at(offset) { return new Date(clock + offset).toISOString(); }

function post(overrides) {
    return Object.assign({
        id: 'p' + Math.random().toString(36).slice(2),
        kind: 'tip',
        title: 'Uma dica que pode ajudar',
        body: 'Olha com atenção para a parte voltada para o mar.',
        monumentId: '5',
        zoneId: null,
        createdAt: at(0),
        mine: false,
        author: { userId: 'u1', name: 'Rita Lopes', xpTotal: 500, discovered: true },
        photos: [],
        helpful: 0,
        interesting: 0,
        myHelpful: false,
        myInteresting: false,
        saved: false,
        comments: 0
    }, overrides || {});
}

function comment(overrides) {
    return Object.assign({
        id: 'c' + Math.random().toString(36).slice(2),
        body: 'Esta dica ajudou bastante!',
        createdAt: at(0),
        deleted: false,
        mine: false,
        author: { userId: 'u2', name: 'João Pereira' },
        helpful: 0,
        myHelpful: false,
        replyTo: null
    }, overrides || {});
}

console.log('\nDescobertas — tipos\n');

test('os seis tipos do desenho existem', () => {
    assertEqual(POST_CONFIG.KIND_IDS.join(','), 'tip,photo,curiosity,trail,place,question');
});

test('um tipo traz consigo o icone e o acento', () => {
    const tip = Posts.kindInfo('tip');
    assert(tip && tip.icon && tip.accent, 'o cartao e o selector nunca discordam');
    assertEqual(Posts.kindInfo('inexistente'), null);
});

test('so os tipos da lista sao aceites', () => {
    assertEqual(Posts.isValidKind('tip'), true);
    assertEqual(Posts.isValidKind('Dica'), false, 'a lista e fechada e sensivel');
    assertEqual(Posts.isValidKind(''), false);
});

test('os filtros comecam em "todas", que vale null', () => {
    const chips = Posts.filterChips();
    assertEqual(chips.length, 7, 'todas + seis tipos');
    assertEqual(chips[0].id, null, 'null e o que list_posts espera sem filtro');
});

console.log('\nDescobertas — feed\n');

test('juntar paginas nao duplica', () => {
    const a = post({ id: 'x1', createdAt: at(0) });
    const b = post({ id: 'x2', createdAt: at(1000) });

    const merged = Posts.mergePosts([a, b], [b, post({ id: 'x3', createdAt: at(2000) })]);
    assertEqual(merged.length, 3);
});

test('o feed mostra as mais recentes primeiro', () => {
    const merged = Posts.mergePosts(
        [post({ id: 'velha', createdAt: at(0) })],
        [post({ id: 'nova', createdAt: at(5000) })]
    );
    assertEqual(merged[0].id, 'nova', 'ao contrario do chat, aqui a ordem e inversa');
});

test('empate no mesmo instante resolve-se de forma estavel', () => {
    const um = Posts.mergePosts([], [post({ id: 'b', createdAt: at(0) }), post({ id: 'a', createdAt: at(0) })]);
    const dois = Posts.mergePosts([], [post({ id: 'a', createdAt: at(0) }), post({ id: 'b', createdAt: at(0) })]);
    assertEqual(um.map(p => p.id).join(','), dois.map(p => p.id).join(','));
});

test('o cursor de paginacao e a publicacao mais antiga', () => {
    const velha = post({ id: 'v', createdAt: at(0) });
    const nova = post({ id: 'n', createdAt: at(9000) });
    assertEqual(Posts.oldestAt([nova, velha]), velha.createdAt);
    assertEqual(Posts.oldestAt([]), null);
});

test('substituir uma publicacao nao mexe nas outras', () => {
    const a = post({ id: 'a', title: 'A' });
    const b = post({ id: 'b', title: 'B' });
    const lista = Posts.replacePost([a, b], Object.assign({}, b, { title: 'B2' }));

    assertEqual(lista.length, 2);
    assertEqual(lista[0].title, 'A');
    assertEqual(lista[1].title, 'B2');
});

test('remover tira só a publicacao pedida', () => {
    const lista = Posts.removePost([post({ id: 'a' }), post({ id: 'b' })], 'a');
    assertEqual(lista.length, 1);
    assertEqual(lista[0].id, 'b');
});

console.log('\nDescobertas — reaccoes\n');

test('reagir sobe o contador e marca como minha', () => {
    const antes = post({ helpful: 31, myHelpful: false });
    const depois = Posts.toggleReaction(antes, 'helpful');

    assertEqual(depois.helpful, 32);
    assertEqual(depois.myHelpful, true);
});

test('reagir outra vez desfaz', () => {
    const antes = post({ helpful: 32, myHelpful: true });
    const depois = Posts.toggleReaction(antes, 'helpful');

    assertEqual(depois.helpful, 31);
    assertEqual(depois.myHelpful, false);
});

test('as duas reaccoes sao independentes', () => {
    let p = post({ helpful: 0, interesting: 0 });
    p = Posts.toggleReaction(p, 'helpful');
    p = Posts.toggleReaction(p, 'interesting');

    assertEqual(p.helpful, 1);
    assertEqual(p.interesting, 1, '"ajudou-me" e "interessante" nao sao a mesma coisa');
});

test('reagir devolve uma copia e nao altera a original', () => {
    const antes = post({ helpful: 5, myHelpful: false });
    Posts.toggleReaction(antes, 'helpful');
    assertEqual(antes.helpful, 5, 'mutar a linha do feed mudaria o botao noutros sitios');
    assertEqual(antes.myHelpful, false);
});

test('uma reaccao desconhecida nao faz nada', () => {
    const antes = post({ helpful: 3 });
    assertEqual(Posts.toggleReaction(antes, 'amei'), antes);
});

test('o contador nunca desce abaixo de zero', () => {
    const p = Posts.toggleReaction(post({ helpful: 0, myHelpful: true }), 'helpful');
    assertEqual(p.helpful, 0);
});

test('guardar alterna', () => {
    assertEqual(Posts.toggleSaved(post({ saved: false })).saved, true);
    assertEqual(Posts.toggleSaved(post({ saved: true })).saved, false);
});

console.log('\nDescobertas — escrever\n');

test('uma publicacao precisa de tipo e de titulo', () => {
    assertEqual(Posts.validateDraft({ title: 'x' }).reason, 'kind');
    assertEqual(Posts.validateDraft({ kind: 'tip', title: '   ' }).reason, 'title');
    assertEqual(Posts.validateDraft({ kind: 'tip', title: 'Boa dica' }).ok, true);
});

test('e isso distingue-a de uma mensagem de chat', () => {
    // Uma mensagem de chat valida nao tem titulo nem tipo; aqui
    // nenhuma das duas coisas pode faltar (ponto 33).
    assertEqual(Posts.validateDraft({ body: 'so corpo' }).ok, false);
});

test('os limites sao os da base de dados', () => {
    assertEqual(POST_CONFIG.TITLE_MAX, 120);
    assertEqual(POST_CONFIG.BODY_MAX, 2000);

    assertEqual(Posts.validateDraft({ kind: 'tip', title: 'a'.repeat(121) }).reason, 'title_long');
    assertEqual(Posts.validateDraft({ kind: 'tip', title: 'ok', body: 'a'.repeat(2001) }).reason, 'body_long');
});

test('o titulo e limpo nas pontas', () => {
    assertEqual(Posts.validateDraft({ kind: 'tip', title: '  Boa dica  ' }).title, 'Boa dica');
});

test('ha um tecto de fotografias', () => {
    const muitas = { kind: 'photo', title: 'x', photos: [1, 2, 3, 4, 5] };
    assertEqual(Posts.validateDraft(muitas).reason, 'photos');
});

test('missingField aponta ao campo que falta', () => {
    assertEqual(Posts.missingField({ kind: 'tip', title: '' }), 'title');
    assertEqual(Posts.missingField({ kind: 'tip', title: 'ok' }), null);
});

test('os contadores de caracteres contam', () => {
    assertEqual(Posts.remainingTitle('a'.repeat(100)), 20);
    assertEqual(Posts.remainingBody('a'.repeat(1900)), 100);
});

console.log('\nDescobertas — comentarios\n');

test('um comentario vazio nao e comentario', () => {
    assertEqual(Posts.validateComment('   ').reason, 'empty');
    assertEqual(Posts.validateComment('Obrigado!').ok, true);
});

test('o comentario tem o mesmo tecto de uma mensagem', () => {
    assertEqual(POST_CONFIG.COMMENT_MAX, 1000);
    assertEqual(Posts.validateComment('a'.repeat(1001)).reason, 'too_long');
});

test('os comentarios mais recentes aparecem primeiro', () => {
    const velho = comment({ id: 'v', createdAt: at(0) });
    const novo = comment({ id: 'n', createdAt: at(5000) });

    const merged = Posts.mergeComments([velho], [novo]);
    assertEqual(merged[0].id, 'n', 'e a ordem do desenho');
});

test('juntar comentarios nao duplica', () => {
    const c = comment({ id: 'c1' });
    assertEqual(Posts.mergeComments([c], [c]).length, 1);
});

test('o cursor dos comentarios e o mais antigo que ja temos', () => {
    const velho = comment({ id: 'v', createdAt: at(0) });
    const novo = comment({ id: 'n', createdAt: at(9000) });
    assertEqual(Posts.oldestCommentAt([novo, velho]), velho.createdAt);
});

test('o polegar de um comentario alterna e nao muta o original', () => {
    const antes = comment({ helpful: 4, myHelpful: false });
    const depois = Posts.toggleCommentHelpful(antes);

    assertEqual(depois.helpful, 5);
    assertEqual(depois.myHelpful, true);
    assertEqual(antes.helpful, 4);
});

console.log('\nDescobertas — pistas e moderacao\n');

test('o aviso do QR so aparece quando ha um monumento em jogo', () => {
    assertEqual(Posts.shouldWarnAboutQr({ kind: 'tip', monumentId: '5' }), true);
    assertEqual(Posts.shouldWarnAboutQr({ kind: 'tip', monumentId: null }), false,
        'uma curiosidade sobre a ilha nao tem QR para estragar');
});

test('nem todos os tipos ligados a um monumento pedem o aviso', () => {
    assertEqual(Posts.shouldWarnAboutQr({ kind: 'question', monumentId: '5' }), true);
    assertEqual(Posts.shouldWarnAboutQr({ kind: 'place', monumentId: '5' }), true);
    assertEqual(Posts.shouldWarnAboutQr({ kind: 'photo', monumentId: '5' }), false,
        'uma fotografia da vista nao e uma pista');
    assertEqual(Posts.shouldWarnAboutQr({ kind: 'curiosity', monumentId: '5' }), false);
});

test('as razoes de denuncia sao as da base de dados', () => {
    assertEqual(Posts.isValidReportReason('qr_location'), true);
    assertEqual(Posts.isValidReportReason('outra_coisa'), false);
    assertEqual(POST_CONFIG.REPORT_REASONS.length, 5);
});

console.log('\n' + '-'.repeat(52));
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach((f) => console.log('  ✗ ' + f.name + '\n    ' + f.error.message + '\n'));
    process.exit(1);
}
