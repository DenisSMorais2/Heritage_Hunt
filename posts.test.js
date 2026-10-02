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

test('uma publicacao precisa sempre de um tipo', () => {
    assertEqual(Posts.validateDraft({ body: 'x' }).reason, 'kind');
    assertEqual(Posts.validateDraft({ kind: 'inventado', body: 'x' }).reason, 'kind');
});

test('e isso distingue-a de uma mensagem de chat', () => {
    // Uma mensagem de chat valida nao tem tipo; aqui o tipo nunca
    // pode faltar (ponto 33).
    assertEqual(Posts.validateDraft({ body: 'so corpo' }).ok, false);
});

test('cada tipo exige o que a sua intencao exige', () => {
    // Dica: o texto e tudo. Sem titulo, sem foto, sem lugar.
    assertEqual(Posts.validateDraft({ kind: 'tip', body: 'Olha para o lado do mar.' }).ok, true);
    assertEqual(Posts.validateDraft({ kind: 'tip', body: '   ' }).reason, 'body');

    // Fotografia: a imagem e que e obrigatoria, nao o texto.
    assertEqual(Posts.validateDraft({ kind: 'photo', photos: [{}] }).ok, true);
    assertEqual(Posts.validateDraft({ kind: 'photo', body: 'bonita' }).reason, 'photos');

    // Pergunta: so a pergunta.
    assertEqual(Posts.validateDraft({ kind: 'question', body: 'E bom para criancas?' }).ok, true);
    assertEqual(Posts.validateDraft({ kind: 'question', photos: [{}] }).reason, 'body');
});

test('o trilho e o unico que pede varios campos', () => {
    const base = { kind: 'trail', title: 'Subida ao Monte Verde', body: 'Caminho longo.' };
    assertEqual(Posts.validateDraft(base).reason, 'meta:start');
    assertEqual(Posts.validateDraft(Object.assign({}, base, {
        metadata: { start: 'Praça Nova' }
    })).reason, 'meta:end');
    assertEqual(Posts.validateDraft(Object.assign({}, base, {
        metadata: { start: 'Praça Nova', end: 'Monte Verde' }
    })).ok, true, 'distancia, duracao e dificuldade sao opcionais');
    assertEqual(Posts.validateDraft({
        kind: 'trail', body: 'x', metadata: { start: 'a', end: 'b' }
    }).reason, 'title');
});

test('o lugar precisa de nome e de razao para la ir', () => {
    assertEqual(Posts.validateDraft({ kind: 'place', title: 'Salamansa' }).reason, 'body');
    assertEqual(Posts.validateDraft({ kind: 'place', body: 'Praia calma' }).reason, 'title');
    assertEqual(Posts.validateDraft({ kind: 'place', title: 'Salamansa', body: 'Praia calma' }).ok, true,
        'a fotografia e recomendada, nao obrigatoria');
});

test('o titulo so sobrevive nos tipos que o tem', () => {
    assertEqual(Posts.needsTitle('trail'), true);
    assertEqual(Posts.needsTitle('place'), true);
    assertEqual(Posts.needsTitle('tip'), false);
    assertEqual(Posts.needsTitle('photo'), false);
    assertEqual(Posts.needsTitle('curiosity'), false);
    assertEqual(Posts.needsTitle('question'), false);

    // Escrever um titulo, mudar para Dica e publicar nao leva o
    // titulo velho atras.
    assertEqual(Posts.validateDraft({ kind: 'tip', title: 'sobra', body: 'ok' }).title, '');
    assertEqual(Posts.validateDraft({ kind: 'place', title: '  Salamansa  ', body: 'ok' }).title, 'Salamansa');
});

test('os limites sao os da base de dados', () => {
    assertEqual(POST_CONFIG.TITLE_MAX, 120);
    assertEqual(POST_CONFIG.BODY_MAX, 2000);

    assertEqual(Posts.validateDraft({ kind: 'place', title: 'a'.repeat(121), body: 'x' }).reason, 'title_long');
    assertEqual(Posts.validateDraft({ kind: 'tip', body: 'a'.repeat(2001) }).reason, 'body_long');
});

test('ha um tecto de fotografias', () => {
    const muitas = { kind: 'photo', photos: [1, 2, 3, 4, 5] };
    assertEqual(Posts.validateDraft(muitas).reason, 'photos');
});

test('missingField aponta ao campo que falta, nao a "invalido"', () => {
    assertEqual(Posts.missingField({ kind: 'tip' }), 'body');
    assertEqual(Posts.missingField({ kind: 'photo' }), 'photos');
    assertEqual(Posts.missingField({ kind: 'trail', title: 'x', body: 'y' }), 'meta:start');
    assertEqual(Posts.missingField({ kind: 'tip', body: 'ok' }), null);
});

console.log('\nDescobertas — cada tipo e um formulario\n');

test('os seis tipos tem formularios diferentes', () => {
    const forma = (k) => Posts.formFor(k).map((f) => f.id).join(',');

    assertEqual(forma('tip') === forma('photo'), false);
    assertEqual(forma('photo') === forma('trail'), false);
    assertEqual(forma('trail') === forma('question'), false);

    // A fotografia comeca pela imagem; a pergunta acaba nela.
    assertEqual(Posts.formFor('photo')[0].id, 'photos');
    assertEqual(Posts.formFor('question')[0].id, 'place');
    assertEqual(Posts.formFor('trail')[0].id, 'title');
});

test('todos os campos tem um tipo que a interface sabe desenhar', () => {
    POST_CONFIG.KIND_IDS.forEach((kind) => {
        Posts.formFor(kind).forEach((field) => {
            assertEqual(POST_CONFIG.FIELD_TYPES.indexOf(field.type) !== -1, true,
                kind + '/' + field.id + ' tem tipo "' + field.type + '"');
            assertEqual(typeof field.id === 'string' && field.id.length > 0, true);
        });
    });
});

test('cada tipo tem a sua chamada a accao e a sua confirmacao', () => {
    assertEqual(Posts.ctaKeyFor('tip'), 'composeCtaTip');
    assertEqual(Posts.ctaKeyFor('trail'), 'composeCtaTrail');
    assertEqual(Posts.successKeyFor('question'), 'composeDoneQuestion');

    // Seis tipos, seis chamadas diferentes — nunca so "Publicar".
    const ctas = POST_CONFIG.KIND_IDS.map(Posts.ctaKeyFor);
    assertEqual(new Set(ctas).size, 6);
});

test('cada tipo tem a sua accao social (ponto 62)', () => {
    assertEqual(Posts.primaryActionFor('tip').primary, 'helpful');
    assertEqual(Posts.primaryActionFor('curiosity').primary, 'interesting');
    assertEqual(Posts.primaryActionFor('trail').primary, 'open');
    assertEqual(Posts.primaryActionFor('place').primary, 'save');
    assertEqual(Posts.primaryActionFor('question').primary, 'comment');
});

console.log('\nDescobertas — metadados por tipo\n');

test('so entram as chaves que o tipo declara', () => {
    const meta = Posts.normalizeMetadata('curiosity', { source: 'Livro X', distance: '5 km', lixo: 1 });
    assertEqual(JSON.stringify(meta), JSON.stringify({ source: 'Livro X' }),
        'distance nao pertence a uma curiosidade');

    assertEqual(JSON.stringify(Posts.normalizeMetadata('tip', { source: 'x' })), '{}',
        'uma dica nao tem metadados nenhuns');
});

test('as etiquetas vem de uma lista fechada e sem repetidas', () => {
    const meta = Posts.normalizeMetadata('photo', { tags: ['view', 'view', 'inventada', 'nature'] });
    assertEqual(JSON.stringify(meta.tags), JSON.stringify(['view', 'nature']));

    const demais = Posts.normalizeMetadata('place', { tags: POST_CONFIG.PLACE_TAGS });
    assertEqual(demais.tags.length, POST_CONFIG.MAX_TAGS, 'ha um tecto de etiquetas');
});

test('a dificuldade e uma das tres, ou nenhuma', () => {
    assertEqual(Posts.normalizeMetadata('trail', { difficulty: 'moderate' }).difficulty, 'moderate');
    assertEqual(Posts.normalizeMetadata('trail', { difficulty: 'impossivel' }).difficulty, undefined);
});

test('os textos sao limpos e cortados ao tamanho do campo', () => {
    const meta = Posts.normalizeMetadata('trail', { start: '  Praça Nova  ', end: 'b'.repeat(200) });
    assertEqual(meta.start, 'Praça Nova');
    assertEqual(meta.end.length, POST_CONFIG.META_TEXT_MAX);
});

test('metadados em falta ou corrompidos nao rebentam', () => {
    assertEqual(JSON.stringify(Posts.normalizeMetadata('trail', null)), '{}');
    assertEqual(JSON.stringify(Posts.normalizeMetadata('trail', 'nao e objecto')), '{}');
    assertEqual(JSON.stringify(Posts.normalizeMetadata('inventado', { a: 1 })), '{}');
    assertEqual(JSON.stringify(Posts.normalizeMetadata('photo', { tags: 'nao e lista' })), '{}');
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

console.log('\nDescobertas — procurar por lugar\n');

const LUGARES = [
    { id: 1,  name: 'Palácio do Povo' },
    { id: 2,  name: 'Farol de D. Amélia' },
    { id: 5,  name: 'Torre de Belém (Réplica)' },
    { id: 'centro_historico', name: 'Centro Histórico' },
    { id: 'frente_mar',       name: 'Frente de Mar' },
    { id: 'sao_vicente',      name: 'Mindelo' },
    { id: 'sao_vicente',      name: 'São Vicente' }
];

test('o nome escrito traduz-se nos ids que o servidor percebe', () => {
    assertEqual(Posts.placeIdsFor('Palácio', LUGARES).join(','), '1');
    assertEqual(Posts.placeIdsFor('Centro', LUGARES).join(','), 'centro_historico');
});

test('procurar nao depende de acentos nem de maiusculas', () => {
    assertEqual(Posts.placeIdsFor('palacio', LUGARES).join(','), '1',
        'quem escreve a correr no telemovel nao poe acentos');
    assertEqual(Posts.placeIdsFor('AMELIA', LUGARES).join(','), '2');
    assertEqual(Posts.placeIdsFor('belem', LUGARES).join(','), '5');
});

test('a cidade e a ilha chegam ao mesmo id, e ele nao se repete', () => {
    assertEqual(Posts.placeIdsFor('Mindelo', LUGARES).join(','), 'sao_vicente');
    assertEqual(Posts.placeIdsFor('vicente', LUGARES).join(','), 'sao_vicente',
        'dois nomes para a mesma ilha dao um id so');
});

test('sem termo nao ha filtro de lugar', () => {
    assertEqual(Posts.placeIdsFor('', LUGARES).length, 0);
    assertEqual(Posts.placeIdsFor('   ', LUGARES).length, 0);
    assertEqual(Posts.placeIdsFor(null, LUGARES).length, 0);
});

test('nada corresponde devolve lista vazia, nunca tudo', () => {
    assertEqual(Posts.placeIdsFor('xyzzy', LUGARES).length, 0,
        'uma lista vazia tem de significar "sem lugares", nao "todos"');
});

test('lugares em falta ou corrompidos nao rebentam', () => {
    assertEqual(Posts.placeIdsFor('palacio', null).length, 0);
    assertEqual(Posts.placeIdsFor('palacio', [null, {}, { id: 1 }]).length, 0,
        'um lugar sem nome nao corresponde a nada');
});

console.log('\n' + '-'.repeat(52));
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach((f) => console.log('  ✗ ' + f.name + '\n    ' + f.error.message + '\n'));
    process.exit(1);
}
