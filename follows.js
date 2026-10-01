// ============================================================
// Heritage Hunt CV — Seguir exploradores (dominio)
//
// Aqui nao ha DOM nem rede. Ha as regras de quando um botao diz
// "Seguir", "A seguir" ou "Seguir de volta", e o que acontece ao
// estado quando a pessoa toca e quando o servidor responde.
//
// O ESTADO NAO E UM BOOLEANO
//
// Tentar guardar isto num `isFollowing` leva a um bug certo: com
// um booleano so, "Seguir" e "Seguir de volta" ficam iguais, e a
// pessoa que ja me segue deixa de se distinguir de um
// desconhecido. Sao precisas DUAS verdades — eu sigo, ela
// segue-me — e e delas que sai o terceiro estado (ponto 17).
//
// SEM XP, SEM POPULARIDADE
//
// Nenhuma funcao deste ficheiro devolve posicoes, medalhas ou
// pontuacoes de seguidores, e nenhuma chama `xp.js` (pontos 30 e
// 31). Os numeros que saem daqui sao dois contadores e nada mais.
//
//   node follows.test.js
// ============================================================

const FOLLOW_CONFIG = {
    // Quantas pessoas vem por pagina nas listas (ponto 19).
    PAGE_SIZE: 30,

    // Acima disto o contador escreve-se abreviado. Nao e vaidade:
    // e largura de ecra a 320 px.
    COMPACT_FROM: 1000
};

const Follows = (function () {
    'use strict';

    // ==========================================================
    // O estado do botao
    // ==========================================================

    // Quatro respostas possiveis, e uma delas nao e um botao:
    //
    //   'self'       — sou eu. O ecra nao desenha nada (ponto 8)
    //   'follow'     — nao sigo, nao me segue
    //   'followBack' — nao sigo, mas ela segue-me (ponto 17)
    //   'following'  — ja sigo
    //
    // `isMe` vem antes de tudo: mesmo que a base de dados se
    // contradissesse, o proprio perfil nunca mostra botao.
    function buttonState(author) {
        if (!author || !author.userId) return 'self';
        if (author.isMe === true) return 'self';

        if (author.isFollowing === true) return 'following';
        if (author.followsYou === true) return 'followBack';

        return 'follow';
    }

    // A projeccao devolve `null` nestes campos quando nao sabe
    // quem esta a ver (ver migration 006). `null` nao e `false`:
    // e "nao perguntei". Sem isto, um autor vindo de uma chamada
    // antiga desenhava "Seguir" a toda a gente, incluindo a mim.
    function isKnown(author) {
        return !!author
            && author.isMe !== null && author.isMe !== undefined
            && author.isFollowing !== null && author.isFollowing !== undefined;
    }

    // Nunca a mim proprio, e nunca sem id. A base de dados tem o
    // mesmo CHECK — isto so evita a ida a rede.
    function canFollow(author) {
        return !!author && !!author.userId && author.isMe !== true;
    }

    // ==========================================================
    // Tocar no botao
    // ==========================================================

    // O que o botao passa a dizer ANTES de o servidor responder
    // (ponto 39). Devolve o autor novo, sem mexer no antigo — e o
    // antigo que serve para desfazer se a rede falhar.
    function optimistic(author, wantFollow) {
        if (!author) return author;

        const next = Object.assign({}, author, { isFollowing: !!wantFollow });

        // Os contadores do PERFIL movem-se com o botao. Quem ganha
        // ou perde um seguidor e a pessoa que estou a ver.
        if (typeof author.followers === 'number') {
            next.followers = Math.max(0, author.followers + (wantFollow ? 1 : -1));
        }

        return next;
    }

    // A resposta do servidor manda sempre. Os contadores vem de la
    // ja contados (migration 006), por isso nao se somam aqui:
    // substituem-se.
    function applyServer(author, result) {
        if (!author || !result || result.ok !== true) return author;

        const next = Object.assign({}, author);

        if (typeof result.isFollowing === 'boolean') next.isFollowing = result.isFollowing;
        if (typeof result.followsYou === 'boolean') next.followsYou = result.followsYou;
        if (typeof result.followers === 'number') next.followers = result.followers;
        if (typeof result.following === 'number') next.following = result.following;

        return next;
    }

    // Falhou: volta ao que era. Nao se tenta adivinhar um estado
    // intermedio — o ecra nunca fica a dizer o que nao e verdade
    // (ponto 39).
    function rollback(previous) {
        return previous ? Object.assign({}, previous) : previous;
    }

    // Sem rede nao se segue (ponto 41). Nao ha fila: seguir e um
    // gesto de agora, e uma fila que dispara uma hora depois e uma
    // accao que a pessoa ja nao esta a fazer.
    function offlineReason(online) {
        return online ? null : 'followNeedsConnection';
    }

    // ==========================================================
    // Contadores
    // ==========================================================

    // 0, 1, 42, 1.2 mil. Acima de mil ninguem le o numero exacto,
    // e a 320 px ele empurra o resto da linha.
    function compactCount(value) {
        const n = Math.max(0, Math.floor(Number(value) || 0));
        if (n < FOLLOW_CONFIG.COMPACT_FROM) return String(n);

        const milhares = n / 1000;
        return (milhares >= 10 ? Math.round(milhares) : Math.round(milhares * 10) / 10) + 'k';
    }

    // ==========================================================
    // As listas
    // ==========================================================

    // Juntar sem duplicar, mantendo a ordem do servidor (relacao
    // mais recente primeiro). A pagina seguinte pode trazer alguem
    // que ja la estava se entretanto houve um follow novo.
    function mergeExplorers(current, incoming) {
        const rows = Array.isArray(current) ? current.slice() : [];
        const vistos = {};

        rows.forEach(function (row) {
            if (row && row.author && row.author.userId) vistos[row.author.userId] = true;
        });

        (Array.isArray(incoming) ? incoming : []).forEach(function (row) {
            if (!row || !row.author || !row.author.userId) return;
            if (vistos[row.author.userId]) return;

            vistos[row.author.userId] = true;
            rows.push(row);
        });

        return rows;
    }

    // O cursor da pagina seguinte e a relacao mais ANTIGA que ja
    // tenho — nao a data do perfil, que nao tem nada que ver.
    function oldestAt(rows) {
        let oldest = null;

        (Array.isArray(rows) ? rows : []).forEach(function (row) {
            if (!row || !row.createdAt) return;
            if (oldest === null || toTime(row.createdAt) < toTime(oldest)) oldest = row.createdAt;
        });

        return oldest;
    }

    // Trocar o estado de uma pessoa dentro de uma lista aberta: o
    // botao da linha muda sem recarregar a lista toda.
    function replaceAuthor(rows, author) {
        if (!author || !author.userId) return Array.isArray(rows) ? rows.slice() : [];

        return (Array.isArray(rows) ? rows : []).map(function (row) {
            if (!row || !row.author || row.author.userId !== author.userId) return row;
            return Object.assign({}, row, { author: Object.assign({}, row.author, author) });
        });
    }

    function toTime(value) {
        if (!value) return 0;
        const ms = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isFinite(ms) ? ms : 0;
    }

    // ==========================================================
    // Razoes que o servidor nomeia
    // ==========================================================

    // As mesmas que a migration 006 devolve. Ter a lista aqui
    // evita que o ecra invente uma razao que o servidor nunca
    // manda.
    const REASONS = [
        'not_authenticated',
        'cannot_follow_self',
        'unknown_explorer',
        'rate_limited'
    ];

    function isValidReason(reason) {
        return REASONS.indexOf(String(reason)) !== -1;
    }

    return {
        buttonState: buttonState,
        isKnown: isKnown,
        canFollow: canFollow,

        optimistic: optimistic,
        applyServer: applyServer,
        rollback: rollback,
        offlineReason: offlineReason,

        compactCount: compactCount,

        mergeExplorers: mergeExplorers,
        oldestAt: oldestAt,
        replaceAuthor: replaceAuthor,

        isValidReason: isValidReason,
        REASONS: REASONS,
        CONFIG: FOLLOW_CONFIG
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Follows: Follows, FOLLOW_CONFIG: FOLLOW_CONFIG };
}
