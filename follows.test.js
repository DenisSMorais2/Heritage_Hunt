// ============================================================
// Heritage Hunt CV — testes de Seguir exploradores
//
//   node follows.test.js
// ============================================================

const { Follows, FOLLOW_CONFIG } = require('./follows.js');

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

function assertDeep(actual, expected, message) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error((message || 'estruturas diferentes') +
            '\n      esperado: ' + e + '\n      obtido:   ' + a);
    }
}

function autor(extra) {
    return Object.assign({
        userId: 'u-ana', name: 'Ana Silva', avatarPath: null, xpTotal: 640,
        isMe: false, isFollowing: false, followsYou: false
    }, extra || {});
}

// ------------------------------------------------------------
console.log('\nOS TRES ESTADOS DO BOTAO\n');

test('nao sigo e nao me segue: Seguir', function () {
    assertEqual(Follows.buttonState(autor()), 'follow');
});

test('ja sigo: A seguir', function () {
    assertEqual(Follows.buttonState(autor({ isFollowing: true })), 'following');
});

test('ela segue-me e eu nao: Seguir de volta', function () {
    assertEqual(Follows.buttonState(autor({ followsYou: true })), 'followBack');
});

test('seguimo-nos os dois: continua a dizer A seguir', function () {
    // Nao ha quarto estado para o follow mutuo: isso seria
    // amizade, e amizade nao existe neste projecto.
    assertEqual(Follows.buttonState(autor({ isFollowing: true, followsYou: true })), 'following');
});

test('o meu proprio perfil nao tem botao', function () {
    assertEqual(Follows.buttonState(autor({ isMe: true })), 'self');
});

test('isMe ganha a tudo o resto', function () {
    assertEqual(
        Follows.buttonState(autor({ isMe: true, isFollowing: true, followsYou: true })),
        'self'
    );
});

test('sem autor nao se desenha botao nenhum', function () {
    assertEqual(Follows.buttonState(null), 'self');
    assertEqual(Follows.buttonState({}), 'self');
});

// ------------------------------------------------------------
console.log('\nNULL NAO E FALSE\n');

test('um autor sem viewer nao e conhecido', function () {
    // A projeccao antiga devolve null nestes campos. Desenhar
    // "Seguir" a partir disso mostrava o botao ate no meu perfil.
    assertEqual(Follows.isKnown({ userId: 'u-ana', isMe: null, isFollowing: null }), false);
});

test('um autor com viewer e conhecido', function () {
    assertEqual(Follows.isKnown(autor()), true);
});

test('false e um estado conhecido, undefined nao', function () {
    assertEqual(Follows.isKnown(autor({ isFollowing: false })), true);
    assertEqual(Follows.isKnown({ userId: 'u-ana', isMe: false }), false);
});

// ------------------------------------------------------------
console.log('\nNUNCA SEGUIR-ME A MIM PROPRIO\n');

test('canFollow recusa o proprio utilizador', function () {
    assertEqual(Follows.canFollow(autor({ isMe: true })), false);
});

test('canFollow recusa autor sem id', function () {
    assertEqual(Follows.canFollow({ name: 'Ana' }), false);
    assertEqual(Follows.canFollow(null), false);
});

test('canFollow aceita outro explorador', function () {
    assertEqual(Follows.canFollow(autor()), true);
});

// ------------------------------------------------------------
console.log('\nOPTIMISTIC UI E ROLLBACK\n');

test('seguir muda o estado logo, sem esperar pelo servidor', function () {
    const antes = autor({ followers: 41 });
    const depois = Follows.optimistic(antes, true);

    assertEqual(depois.isFollowing, true);
    assertEqual(depois.followers, 42);
    assertEqual(Follows.buttonState(depois), 'following');
});

test('deixar de seguir desce o contador', function () {
    const depois = Follows.optimistic(autor({ isFollowing: true, followers: 42 }), false);
    assertEqual(depois.isFollowing, false);
    assertEqual(depois.followers, 41);
});

test('o contador nunca desce abaixo de zero', function () {
    const depois = Follows.optimistic(autor({ isFollowing: true, followers: 0 }), false);
    assertEqual(depois.followers, 0);
});

test('o optimismo nao muta o autor original', function () {
    const antes = autor({ followers: 41 });
    Follows.optimistic(antes, true);

    assertEqual(antes.isFollowing, false, 'o original tem de ficar intacto para o rollback');
    assertEqual(antes.followers, 41);
});

test('sem contador conhecido nao se inventa um', function () {
    const depois = Follows.optimistic(autor(), true);
    assertEqual(depois.followers, undefined);
});

test('rollback devolve exactamente o estado anterior', function () {
    const antes = autor({ followers: 41 });
    const optimista = Follows.optimistic(antes, true);
    const revertido = Follows.rollback(antes);

    assertEqual(optimista.isFollowing, true);
    assertEqual(revertido.isFollowing, false);
    assertEqual(revertido.followers, 41);
    assertEqual(Follows.buttonState(revertido), 'follow');
});

test('o servidor manda sobre o optimismo', function () {
    const optimista = Follows.optimistic(autor({ followers: 41 }), true);
    const final = Follows.applyServer(optimista, {
        ok: true, isFollowing: true, followsYou: true, followers: 99, following: 7
    });

    assertEqual(final.followers, 99, 'o contador vem contado do servidor, nao somado aqui');
    assertEqual(final.followsYou, true);
    assertEqual(final.following, 7);
});

test('uma resposta falhada nao mexe no estado', function () {
    const atual = autor({ isFollowing: true });
    const depois = Follows.applyServer(atual, { ok: false, reason: 'rate_limited' });
    assertDeep(depois, atual);
});

// ------------------------------------------------------------
console.log('\nSEGUIR DE VOLTA\n');

test('seguir de volta passa a A seguir, e ela continua a seguir-me', function () {
    const carlos = autor({ userId: 'u-carlos', followsYou: true });
    assertEqual(Follows.buttonState(carlos), 'followBack');

    const depois = Follows.applyServer(
        Follows.optimistic(carlos, true),
        { ok: true, isFollowing: true, followsYou: true, followers: 1, following: 1 }
    );

    assertEqual(Follows.buttonState(depois), 'following');
    assertEqual(depois.followsYou, true, 'deixar de ser "de volta" nao apaga que ela me segue');
});

// ------------------------------------------------------------
console.log('\nSEM REDE\n');

test('offline tem uma razao propria, nao um erro generico', function () {
    assertEqual(Follows.offlineReason(false), 'followNeedsConnection');
});

test('online nao tem razao nenhuma', function () {
    assertEqual(Follows.offlineReason(true), null);
});

// ------------------------------------------------------------
console.log('\nCONTADORES\n');

test('numeros pequenos escrevem-se por extenso', function () {
    assertEqual(Follows.compactCount(0), '0');
    assertEqual(Follows.compactCount(1), '1');
    assertEqual(Follows.compactCount(999), '999');
});

test('a partir de mil abreviam-se', function () {
    assertEqual(Follows.compactCount(1000), '1k');
    assertEqual(Follows.compactCount(1200), '1.2k');
    assertEqual(Follows.compactCount(15400), '15k');
});

test('lixo conta como zero', function () {
    assertEqual(Follows.compactCount(null), '0');
    assertEqual(Follows.compactCount(-5), '0');
    assertEqual(Follows.compactCount('abc'), '0');
});

// ------------------------------------------------------------
console.log('\nAS LISTAS\n');

function linha(id, quando) {
    return { author: autor({ userId: id }), createdAt: quando };
}

test('juntar paginas mantem a ordem e nao duplica', function () {
    const pagina1 = [linha('a', '2026-10-01T10:00:00Z'), linha('b', '2026-10-01T09:00:00Z')];
    const pagina2 = [linha('b', '2026-10-01T09:00:00Z'), linha('c', '2026-10-01T08:00:00Z')];

    const juntas = Follows.mergeExplorers(pagina1, pagina2);
    assertEqual(juntas.length, 3);
    assertDeep(juntas.map(r => r.author.userId), ['a', 'b', 'c']);
});

test('o cursor e a relacao mais antiga que ja tenho', function () {
    const rows = [linha('a', '2026-10-01T10:00:00Z'), linha('b', '2026-10-01T08:00:00Z')];
    assertEqual(Follows.oldestAt(rows), '2026-10-01T08:00:00Z');
});

test('lista vazia nao tem cursor', function () {
    assertEqual(Follows.oldestAt([]), null);
    assertEqual(Follows.oldestAt(null), null);
});

test('seguir alguem dentro da lista muda so essa linha', function () {
    const rows = [linha('a', '2026-10-01T10:00:00Z'), linha('b', '2026-10-01T09:00:00Z')];
    const depois = Follows.replaceAuthor(rows, { userId: 'b', isFollowing: true });

    assertEqual(Follows.buttonState(depois[0].author), 'follow');
    assertEqual(Follows.buttonState(depois[1].author), 'following');
    assertEqual(rows[1].author.isFollowing, false, 'o original nao se altera');
});

test('substituir alguem que nao esta na lista nao parte nada', function () {
    const rows = [linha('a', '2026-10-01T10:00:00Z')];
    const depois = Follows.replaceAuthor(rows, { userId: 'z', isFollowing: true });
    assertEqual(depois.length, 1);
    assertEqual(depois[0].author.userId, 'a');
});

test('a pagina tem tamanho definido num sitio so', function () {
    assertEqual(FOLLOW_CONFIG.PAGE_SIZE, Follows.CONFIG.PAGE_SIZE);
    assertEqual(typeof Follows.CONFIG.PAGE_SIZE, 'number');
});

// ------------------------------------------------------------
console.log('\nRAZOES DO SERVIDOR\n');

test('as razoes sao as que a migration 006 devolve', function () {
    assertEqual(Follows.isValidReason('cannot_follow_self'), true);
    assertEqual(Follows.isValidReason('rate_limited'), true);
    assertEqual(Follows.isValidReason('unknown_explorer'), true);
});

test('uma razao inventada nao passa', function () {
    assertEqual(Follows.isValidReason('nao_gosto_de_ti'), false);
    assertEqual(Follows.isValidReason(''), false);
});

// ------------------------------------------------------------
console.log('\nO QUE ESTE MODULO NAO FAZ\n');

test('nao ha nada que ordene pessoas por seguidores', function () {
    const nomes = Object.keys(Follows).join(' ').toLowerCase();
    const proibidos = ['rank', 'top', 'popular', 'influen'];
    proibidos.forEach(function (palavra) {
        if (nomes.indexOf(palavra) !== -1) {
            throw new Error('o modulo expoe "' + palavra + '" — ponto 31');
        }
    });
});

test('nao ha nada que atribua XP', function () {
    // Os comentarios saem primeiro: o cabecalho do modulo FALA de
    // xp.js para dizer que nao lhe toca, e isso nao e codigo.
    const fonte = require('fs').readFileSync(__dirname + '/follows.js', 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n').filter(function (linha) { return !/^\s*\/\//.test(linha); }).join('\n');

    if (/XP\.|awardXp|award_xp|xp\.js/i.test(fonte)) {
        throw new Error('o modulo toca em XP — ponto 30');
    }
});

// ------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('----------------------------------------------------\n');

if (failed) {
    failures.forEach(function (f) { console.log('  ✗ ' + f.name); });
    process.exit(1);
}
