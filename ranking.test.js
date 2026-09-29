// ============================================================
// Heritage Hunt CV — testes do ranking de exploradores
//
//   node ranking.test.js
// ============================================================

const { Ranking } = require('./ranking.js');

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

// Uma classificação como a que o Postgres devolve
function entry(position, name, xp, discoveries, isMe) {
    return {
        position: position,
        displayName: name,
        weeklyXp: xp,
        discoveries: discoveries,
        isMe: !!isMe,
        avatarPath: null
    };
}

const CLASSIFICACAO = [
    entry(1, 'Ana', 420, 5),
    entry(2, 'Carlos', 380, 4),
    entry(3, 'Maria', 350, 3),
    entry(4, 'Dénis', 315, 4, true),
    entry(5, 'João', 280, 2)
];

console.log('\n--- Pódio e lista ---');

test('o pódio leva os três primeiros lugares', () => {
    const top = Ranking.podium(CLASSIFICACAO);
    assertEqual(top.length, 3);
    assertEqual(top[0].displayName, 'Ana');
    assertEqual(top[2].displayName, 'Maria');
});

test('a lista começa no quarto lugar', () => {
    const lista = Ranking.rest(CLASSIFICACAO);
    assertEqual(lista.length, 2);
    assertEqual(lista[0].displayName, 'Dénis');
});

test('um empate no pódio leva as duas pessoas ao destaque', () => {
    const empatados = [
        entry(1, 'Ana', 420, 5),
        entry(1, 'Carlos', 420, 5),
        entry(3, 'Maria', 350, 3),
        entry(4, 'João', 200, 1)
    ];
    const top = Ranking.podium(empatados);
    assertEqual(top.length, 3, 'três lugares, ainda que #1 seja partilhado');
    assertEqual(Ranking.rest(empatados).length, 1);
});

test('o desenho põe o segundo à esquerda e o primeiro ao centro', () => {
    const ordem = Ranking.podiumLayout(CLASSIFICACAO).map(e => e.displayName);
    assertEqual(ordem.join(' '), 'Carlos Ana Maria');
});

test('a ordem visual nunca altera a posição real', () => {
    const desenho = Ranking.podiumLayout(CLASSIFICACAO);
    const centro = desenho[1];
    assertEqual(centro.position, 1, 'quem está ao centro é mesmo o primeiro');
});

test('com menos de três pessoas o pódio não inventa lugares', () => {
    const duas = [entry(1, 'Ana', 100, 1), entry(2, 'Carlos', 50, 1)];
    assertEqual(Ranking.podium(duas).length, 2);
    assertEqual(Ranking.podiumLayout(duas).length, 2);
    assertEqual(Ranking.rest(duas).length, 0);
});

test('uma classificação vazia não rebenta', () => {
    assertEqual(Ranking.podium([]).length, 0);
    assertEqual(Ranking.podiumLayout(null).length, 0);
    assertEqual(Ranking.rest(undefined).length, 0);
});

console.log('\n--- Barra com a minha posição ---');

test('quem já se vê na lista não precisa da barra', () => {
    const eu = entry(4, 'Dénis', 315, 4, true);
    assert(!Ranking.needsStandingsBar(eu, CLASSIFICACAO),
        'estou no top visível, a barra seria repetição');
});

test('quem está fora do top visível precisa da barra', () => {
    // Em #37 eu não apareço na lista visível — por isso ela não
    // pode conter nenhuma entrada minha.
    const topSemMim = CLASSIFICACAO.map(e => Object.assign({}, e, { isMe: false }));
    const eu = entry(37, 'Dénis', 125, 1, true);
    assert(Ranking.needsStandingsBar(eu, topSemMim),
        'em #37 com um top 20 no ecrã, tenho de saber onde estou');
});

test('sem posição minha não há barra nenhuma', () => {
    assert(!Ranking.needsStandingsBar(null, CLASSIFICACAO),
        'ainda não ganhei XP esta semana');
});

console.log('\n--- O que dizer quando há pouca gente ---');

test('ninguém ainda: a comunidade está a chegar', () => {
    assertEqual(Ranking.emptyState(0, null), 'waiting');
});

test('só eu: a página fala do meu percurso', () => {
    assertEqual(Ranking.emptyState(1, entry(1, 'Dénis', 50, 1, true)), 'alone');
});

test('uma pessoa que não sou eu ainda é comunidade', () => {
    assertEqual(Ranking.emptyState(1, null), 'ranked');
});

test('com gente, mostra-se a classificação', () => {
    assertEqual(Ranking.emptyState(5, entry(4, 'Dénis', 315, 4, true)), 'ranked');
});

test('um total inválido conta como vazio', () => {
    assertEqual(Ranking.emptyState(undefined, null), 'waiting');
    assertEqual(Ranking.emptyState(-3, null), 'waiting');
});

console.log('\n--- Estado da vista ---');

test('quem optou por não participar vê o estado desativado', () => {
    assertEqual(Ranking.viewState({ optedIn: false, participants: 42, me: null }), 'disabled',
        'a escolha de não participar vence tudo o resto');
});

test('o desativado vence mesmo com comunidade cheia', () => {
    assertEqual(Ranking.viewState({
        optedIn: false,
        participants: 120,
        me: entry(3, 'Dénis', 300, 3, true)
    }), 'disabled');
});

test('a participar, mostra-se a classificação', () => {
    assertEqual(Ranking.viewState({
        optedIn: true, participants: 5, me: entry(4, 'Dénis', 315, 4, true)
    }), 'ranked');
});

test('a participar mas sem ninguém, espera-se pela comunidade', () => {
    assertEqual(Ranking.viewState({ optedIn: true, participants: 0, me: null }), 'waiting');
});

test('a participar e sozinho, a página fala do meu percurso', () => {
    assertEqual(Ranking.viewState({
        optedIn: true, participants: 1, me: entry(1, 'Dénis', 50, 1, true)
    }), 'alone');
});

test('sem resposta nenhuma não se assume desativado', () => {
    assertEqual(Ranking.viewState(null), 'waiting',
        'desativado é uma escolha deliberada, não uma falha de rede');
});

test('optedIn em falta conta como a participar', () => {
    assertEqual(Ranking.viewState({ participants: 3, me: null }), 'ranked',
        'só um false explícito desativa');
});

console.log('\n--- Semana nova ---');

test('semana diferente da última vista é semana nova', () => {
    assert(Ranking.isNewWeek('2026-09-28T01:00:00Z', '2026-09-21T01:00:00Z'));
});

test('a mesma semana não é novidade', () => {
    assert(!Ranking.isNewWeek('2026-09-28T01:00:00Z', '2026-09-28T01:00:00Z'));
});

test('quem nunca cá veio não recebe aviso de semana nova', () => {
    assert(!Ranking.isNewWeek('2026-09-28T01:00:00Z', null),
        'não se anuncia uma página virada a quem nunca viu a anterior');
});

console.log('\n--- Apresentação ---');

test('medalhas só nos três primeiros', () => {
    assertEqual(Ranking.medalFor(1), 'gold');
    assertEqual(Ranking.medalFor(2), 'silver');
    assertEqual(Ranking.medalFor(3), 'bronze');
    assertEqual(Ranking.medalFor(4), null);
});

test('a inicial serve quando não há fotografia', () => {
    assertEqual(Ranking.initialFor('ana monteiro'), 'A');
    assertEqual(Ranking.initialFor('  Dénis'), 'D');
});

test('um nome em falta não deixa a inicial vazia', () => {
    assertEqual(Ranking.initialFor(''), '?');
    assertEqual(Ranking.initialFor(null), '?');
});

test('mostra-se o primeiro nome, para não partir a linha', () => {
    assertEqual(Ranking.shortName('Ana Maria Monteiro Silva'), 'Ana');
    assertEqual(Ranking.shortName('  Dénis  Morais '), 'Dénis');
    assertEqual(Ranking.shortName(''), '');
});

console.log('\n----------------------------------------------------');
console.log(passed + ' testes passaram, ' + failed + ' falharam');
console.log('----------------------------------------------------\n');

if (failed > 0) {
    failures.forEach(f => console.log('  ✗ ' + f.name + ': ' + f.error.message));
    process.exit(1);
}
