// ============================================================
// Heritage Hunt CV — testes das Conversas
//
// O projecto nao usa npm nem framework de testes, por isso este
// runner e propositadamente minimo e sem dependencias.
//
//   node conversations.test.js
// ============================================================

const { Conversations, CONVERSATION_CONFIG } = require('./conversations.js');

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

// --- Fabricas -----------------------------------------------

let clock = Date.parse('2026-10-01T10:00:00Z');

function at(offsetMs) {
    return new Date(clock + offsetMs).toISOString();
}

function msg(overrides) {
    return Object.assign({
        id: 'm' + Math.random().toString(36).slice(2),
        kind: 'text',
        body: 'olá',
        createdAt: at(0),
        deleted: false,
        mine: false,
        author: { userId: 'u1', name: 'Ana', avatarPath: null, xpTotal: 300, discovered: true },
        helpfulCount: 0,
        helpfulByMe: false,
        replyTo: null
    }, overrides || {});
}

function conv(overrides) {
    return Object.assign({
        id: 'c' + Math.random().toString(36).slice(2),
        kind: 'monument',
        monumentId: '5',
        zoneId: null,
        islandId: 'sao_vicente',
        lastAt: at(0),
        lastMessage: null,
        unread: 0,
        joined: false
    }, overrides || {});
}

console.log('\nConversas — lista\n');

test('separa as minhas conversas das que ainda posso explorar', () => {
    const joined = conv({ joined: true, monumentId: '1' });
    const unread = conv({ unread: 3, monumentId: '2' });
    const other = conv({ monumentId: '3' });

    const split = Conversations.splitConversations([other, joined, unread]);

    assertEqual(split.mine.length, 2, 'participei numa e tenho novidades noutra');
    assertEqual(split.explore.length, 1);
    assertEqual(split.explore[0].monumentId, '3');
});

test('uma conversa por ler conta como minha mesmo sem eu nunca a ter aberto', () => {
    const never = conv({ joined: false, unread: 1 });
    const split = Conversations.splitConversations([never]);

    assertEqual(split.mine.length, 1, 'ha coisas novas: ja me diz respeito');
    assertEqual(split.explore.length, 0);
});

test('as minhas ordenam-se pela actividade mais recente', () => {
    const velha = conv({ joined: true, monumentId: '1', lastAt: at(0) });
    const nova = conv({ joined: true, monumentId: '2', lastAt: at(60000) });

    const split = Conversations.splitConversations([velha, nova]);
    assertEqual(split.mine[0].monumentId, '2');
});

test('o catalogo ordena-se por tipo: geral, zonas, monumentos', () => {
    const mon = conv({ kind: 'monument', monumentId: '1' });
    const geral = conv({ kind: 'general', monumentId: null });
    const zona = conv({ kind: 'zone', monumentId: null, zoneId: 'colinas' });

    const split = Conversations.splitConversations([mon, zona, geral]);
    assertEqual(split.explore.map((c) => c.kind).join(','), 'general,zone,monument');
});

test('procurar ignora acentos e maiusculas', () => {
    const rows = [conv({ monumentId: '1' }), conv({ monumentId: '2' })];
    const label = (c) => (c.monumentId === '1' ? 'Centro Histórico' : 'Frente de Mar');

    assertEqual(Conversations.filterConversations(rows, 'historico', label).length, 1);
    assertEqual(Conversations.filterConversations(rows, 'HISTÓRICO', label).length, 1);
    assertEqual(Conversations.filterConversations(rows, 'mar', label).length, 1);
});

test('procura vazia devolve tudo', () => {
    const rows = [conv({}), conv({})];
    assertEqual(Conversations.filterConversations(rows, '   ', () => 'x').length, 2);
});

test('encontra a conversa de um monumento sem id escrito a mao', () => {
    const rows = [
        conv({ kind: 'general', monumentId: null }),
        conv({ kind: 'monument', monumentId: '7' })
    ];

    const found = Conversations.findConversation(rows, { kind: 'monument', monumentId: '7' });
    assert(found && found.monumentId === '7', 'encontrou pelo monumento');

    const geral = Conversations.findConversation(rows, { kind: 'general' });
    assert(geral && geral.kind === 'general', 'a geral descobre-se pelo tipo');

    assertEqual(Conversations.findConversation(rows, { kind: 'monument', monumentId: '99' }), null);
});

test('soma as nao lidas de todas as conversas', () => {
    assertEqual(Conversations.totalUnread([conv({ unread: 2 }), conv({ unread: 3 }), conv({})]), 5);
});

console.log('\nConversas — mensagens\n');

test('juntar paginas nao duplica mensagens repetidas', () => {
    const a = msg({ id: 'x1', createdAt: at(0) });
    const b = msg({ id: 'x2', createdAt: at(1000) });

    const merged = Conversations.mergeMessages([a, b], [b, msg({ id: 'x3', createdAt: at(2000) })]);
    assertEqual(merged.length, 3, 'x2 chegou duas vezes e conta uma');
    assertEqual(merged.map((m) => m.id).join(','), 'x1,x2,x3');
});

test('a versao mais recente de uma mensagem substitui a antiga', () => {
    const antes = msg({ id: 'x1', body: 'original' });
    const depois = msg({ id: 'x1', body: 'editada', editedAt: at(5000) });

    const merged = Conversations.mergeMessages([antes], [depois]);
    assertEqual(merged.length, 1);
    assertEqual(merged[0].body, 'editada');
});

test('mensagens ficam sempre por ordem de leitura', () => {
    const merged = Conversations.mergeMessages(
        [msg({ id: 'c', createdAt: at(3000) })],
        [msg({ id: 'a', createdAt: at(1000) }), msg({ id: 'b', createdAt: at(2000) })]
    );
    assertEqual(merged.map((m) => m.id).join(','), 'a,b,c');
});

test('empate no mesmo milissegundo resolve-se de forma estavel', () => {
    const um = Conversations.mergeMessages([], [msg({ id: 'b', createdAt: at(0) }), msg({ id: 'a', createdAt: at(0) })]);
    const dois = Conversations.mergeMessages([], [msg({ id: 'a', createdAt: at(0) }), msg({ id: 'b', createdAt: at(0) })]);
    assertEqual(um.map((m) => m.id).join(','), dois.map((m) => m.id).join(','), 'a ordem nao depende da chegada');
});

test('agrupa mensagens seguidas da mesma pessoa', () => {
    const groups = Conversations.groupMessages([
        msg({ id: '1', createdAt: at(0) }),
        msg({ id: '2', createdAt: at(1000) }),
        msg({ id: '3', createdAt: at(2000) })
    ]);

    assertEqual(groups.length, 1, 'tres mensagens, um so cabecalho');
    assertEqual(groups[0].messages.length, 3);
});

test('uma pausa longa recomeca o grupo', () => {
    const gap = CONVERSATION_CONFIG.GROUP_GAP_MS + 1000;
    const groups = Conversations.groupMessages([
        msg({ id: '1', createdAt: at(0) }),
        msg({ id: '2', createdAt: at(gap) })
    ]);

    assertEqual(groups.length, 2, 'passada a pausa, o nome volta a aparecer');
});

test('autores diferentes nunca se agrupam', () => {
    const groups = Conversations.groupMessages([
        msg({ id: '1', author: { userId: 'u1', name: 'Ana' } }),
        msg({ id: '2', author: { userId: 'u2', name: 'Carlos' }, createdAt: at(1000) })
    ]);
    assertEqual(groups.length, 2);
});

test('uma mensagem removida nunca entra no bloco de ninguem', () => {
    const groups = Conversations.groupMessages([
        msg({ id: '1', createdAt: at(0) }),
        msg({ id: '2', createdAt: at(1000), deleted: true }),
        msg({ id: '3', createdAt: at(2000) })
    ]);
    assertEqual(groups.length, 3, 'a lapide fica sozinha dos dois lados');
});

test('cursores ignoram mensagens ainda por enviar', () => {
    const confirmada = msg({ id: 'x1', createdAt: at(0) });
    const pendente = Conversations.createPending({ body: 'ainda nao subiu' }, null);

    const lista = [confirmada, pendente];
    assertEqual(Conversations.oldestAt(lista), confirmada.createdAt);
    assertEqual(Conversations.latestAt(lista), confirmada.createdAt, 'o pendente nao existe para o servidor');
});

test('sem mensagens nao ha cursor', () => {
    assertEqual(Conversations.oldestAt([]), null);
    assertEqual(Conversations.latestAt(null), null);
});

console.log('\nConversas — escrever\n');

test('texto vazio nao e mensagem', () => {
    assertEqual(Conversations.validateDraft('').ok, false);
    assertEqual(Conversations.validateDraft('    ').reason, 'empty');
});

test('o texto e limpo nas pontas', () => {
    assertEqual(Conversations.validateDraft('  olá  ').body, 'olá');
});

test('o tecto de comprimento e o mesmo da base de dados', () => {
    const limite = CONVERSATION_CONFIG.MAX_LENGTH;
    assertEqual(limite, 1000, 'espelha o CHECK messages_body_length');

    assertEqual(Conversations.validateDraft('a'.repeat(limite)).ok, true);
    assertEqual(Conversations.validateDraft('a'.repeat(limite + 1)).reason, 'too_long');
});

test('o contador so aparece perto do limite', () => {
    assertEqual(Conversations.shouldShowCounter('a'.repeat(10)), false);
    assertEqual(Conversations.shouldShowCounter('a'.repeat(CONVERSATION_CONFIG.COUNTER_FROM)), true);
    assertEqual(Conversations.remainingChars('a'.repeat(999)), 1);
});

test('a mensagem optimista nasce marcada como a enviar', () => {
    const pending = Conversations.createPending({ body: 'olá' }, { userId: 'me', name: 'Eu' });

    assertEqual(pending.pending, true);
    assertEqual(pending.status, 'sending');
    assertEqual(pending.mine, true);
    assert(pending.id.indexOf('pending:') === 0, 'o id local nunca colide com um uuid');
});

test('uma mensagem de texto vazia nao chega a ser optimista', () => {
    assertEqual(Conversations.createPending({ body: '   ', kind: 'text' }, null), null);
});

test('falhar guarda a mensagem em vez de a perder', () => {
    const pending = Conversations.createPending({ body: 'olá' }, null);
    const lista = Conversations.markFailed([pending], pending.localId);

    assertEqual(lista.length, 1, 'ponto 26: nunca perder em silencio');
    assertEqual(lista[0].status, 'failed');
});

test('tentar novamente volta ao estado de envio', () => {
    const pending = Conversations.createPending({ body: 'olá' }, null);
    const falhou = Conversations.markFailed([pending], pending.localId);
    const outra = Conversations.markSending(falhou, pending.localId);

    assertEqual(outra[0].status, 'sending');
});

test('a confirmacao substitui a optimista, nao a duplica', () => {
    const pending = Conversations.createPending({ body: 'olá' }, null);
    const confirmada = msg({ id: 'real-1', body: 'olá', mine: true, createdAt: at(1000) });

    const lista = Conversations.reconcilePending([pending], pending.localId, confirmada);

    assertEqual(lista.length, 1, 'uma mensagem, nao duas');
    assertEqual(lista[0].id, 'real-1');
    assertEqual(lista[0].pending, undefined);
});

test('reconciliar sem confirmacao apenas remove a pendente', () => {
    const pending = Conversations.createPending({ body: 'olá' }, null);
    assertEqual(Conversations.reconcilePending([pending], pending.localId, null).length, 0);
});

console.log('\nConversas — scroll e pistas\n');

test('uma mensagem de outra pessoa nao rouba o scroll a quem le para tras', () => {
    const aLer = { scrollHeight: 5000, scrollTop: 100, clientHeight: 800 };
    assertEqual(Conversations.shouldFollow(aLer, msg({ mine: false })), false, 'mostra "1 nova mensagem"');
});

test('a minha propria mensagem leva sempre o ecra ao fundo', () => {
    const aLer = { scrollHeight: 5000, scrollTop: 100, clientHeight: 800 };
    assertEqual(Conversations.shouldFollow(aLer, msg({ mine: true })), true);
});

test('quem ja esta no fundo acompanha a conversa', () => {
    const noFundo = { scrollHeight: 5000, scrollTop: 4200, clientHeight: 800 };
    assertEqual(Conversations.isAtBottom(noFundo), true);
    assertEqual(Conversations.shouldFollow(noFundo, msg({ mine: false })), true);
});

test('o aviso das pistas so aparece em conversas de monumento', () => {
    assertEqual(Conversations.shouldWarnAboutQr(conv({ kind: 'general', monumentId: null }), []), false);
    assertEqual(Conversations.shouldWarnAboutQr(conv({ kind: 'zone', monumentId: null, zoneId: 'colinas' }), []), false);
    assertEqual(Conversations.shouldWarnAboutQr(conv({ kind: 'monument', monumentId: '5' }), []), true);
});

test('o aviso nao se repete no mesmo monumento', () => {
    const c = conv({ kind: 'monument', monumentId: '5' });
    const visto = Conversations.rememberQrWarning([], '5');

    assertEqual(Conversations.shouldWarnAboutQr(c, visto), false, 'ponto 17: primeira vez, nao sempre');
    assertEqual(Conversations.shouldWarnAboutQr(conv({ monumentId: '6' }), visto), true, 'outro monumento, outro aviso');
});

test('lembrar o aviso duas vezes nao duplica', () => {
    let visto = Conversations.rememberQrWarning([], '5');
    visto = Conversations.rememberQrWarning(visto, '5');
    assertEqual(visto.length, 1);
});

test('as razoes de denuncia sao as da base de dados', () => {
    assertEqual(Conversations.isValidReportReason('qr_location'), true, 'a razao que existe por causa deste jogo');
    assertEqual(Conversations.isValidReportReason('spam'), true);
    assertEqual(Conversations.isValidReportReason('qualquer_coisa'), false);
    assertEqual(Conversations.REPORT_REASONS.length, 5);
});

// --- Resultado ----------------------------------------------

console.log('\n' + '-'.repeat(52));
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('-'.repeat(52) + '\n');

if (failed > 0) {
    failures.forEach((f) => console.log('  ✗ ' + f.name + '\n    ' + f.error.message + '\n'));
    process.exit(1);
}
