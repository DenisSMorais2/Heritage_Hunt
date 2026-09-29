// ============================================================
// Heritage Hunt CV — Ranking de exploradores (camada de dominio)
//
// O QUE ESTE FICHEIRO NAO FAZ, e de proposito:
//
//   - nao calcula XP. O XP semanal e somado no Postgres, a partir
//     de eventos validados no servidor. Aqui nunca se soma nada;
//   - nao toca no DOM;
//   - nao fala com a rede.
//
// O que faz e decidir COMO se apresenta uma classificacao que ja
// veio pronta: quem vai ao podio, quem fica na lista, quando e
// preciso a barra fixa com a minha posicao, e o que dizer quando
// ainda quase nao ha ninguem.
//
// Estas decisoes tem regras, e regras merecem testes — e por isso
// que vivem aqui e nao dentro da interface.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Ranking = api.Ranking;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // Tres lugares em destaque. Nao e um podio de arcada: e o mesmo
    // gesto de quem poe tres fotografias em cima da lareira.
    const PODIUM_SIZE = 3;

    const MEDAL = {
        1: 'gold',
        2: 'silver',
        3: 'bronze'
    };

    function asList(entries) {
        return Array.isArray(entries) ? entries : [];
    }

    // Os tres primeiros LUGARES, nao as tres primeiras linhas: com
    // um empate no primeiro lugar, ha duas pessoas em #1, e as duas
    // pertencem ao destaque.
    function podium(entries) {
        return asList(entries).filter(function (entry) {
            return entry && entry.position <= PODIUM_SIZE;
        });
    }

    function rest(entries) {
        return asList(entries).filter(function (entry) {
            return entry && entry.position > PODIUM_SIZE;
        });
    }

    /**
     * A ordem em que os tres primeiros sao DESENHADOS: segundo a
     * esquerda, primeiro ao centro, terceiro a direita.
     *
     * A ordem visual nunca muda a ordem real — a posicao vai em cada
     * entrada e e ela que manda.
     */
    function podiumLayout(entries) {
        const top = podium(entries);
        const first = top.filter(function (e) { return e.position === 1; });
        const second = top.filter(function (e) { return e.position === 2; });
        const third = top.filter(function (e) { return e.position === 3; });

        return [].concat(second, first, third);
    }

    /**
     * Preciso da barra fixa com a minha posicao?
     *
     * So quando eu existo na classificacao e NAO apareco na lista
     * visivel. Quem ja se ve a si proprio no ecra nao precisa de ser
     * lembrado de onde esta.
     */
    function needsStandingsBar(me, entries) {
        if (!me) return false;

        const visible = asList(entries).some(function (entry) {
            return entry && entry.isMe;
        });

        return !visible;
    }

    /**
     * Que historia contar quando ha pouca gente.
     *
     *   'waiting'  ninguem ganhou XP esta semana ainda
     *   'alone'    so eu — a pagina fala do meu proprio percurso
     *   'ranked'   ha comunidade que mostrar
     *
     * Nunca se mostra uma pagina que pareca um fracasso: uma app
     * nova tem poucos explorodores, e isso e normal.
     */
    function emptyState(participants, me) {
        const total = Number(participants) || 0;

        if (total <= 0) return 'waiting';
        if (total === 1 && me) return 'alone';
        return 'ranked';
    }

    /**
     * Comecou uma semana nova desde a ultima vez que aqui estive?
     *
     * Quem nunca ca veio NAO recebe o aviso: nao se anuncia uma
     * pagina virada a alguem que nunca viu a anterior.
     */
    function isNewWeek(weekStart, lastSeenWeekStart) {
        if (!weekStart || !lastSeenWeekStart) return false;
        return String(weekStart) !== String(lastSeenWeekStart);
    }

    function medalFor(position) {
        return MEDAL[position] || null;
    }

    // A primeira letra do nome, para quando nao ha fotografia.
    // Melhor uma inicial com cuidado do que uma silhueta cinzenta.
    function initialFor(displayName) {
        const name = typeof displayName === 'string' ? displayName.trim() : '';
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    }

    // O primeiro nome chega, e evita que um nome comprido parta a
    // linha num telemovel estreito.
    function shortName(displayName) {
        const name = typeof displayName === 'string' ? displayName.trim() : '';
        if (!name) return '';
        return name.split(/\s+/)[0];
    }

    const Ranking = {
        podium: podium,
        rest: rest,
        podiumLayout: podiumLayout,
        needsStandingsBar: needsStandingsBar,
        emptyState: emptyState,
        isNewWeek: isNewWeek,
        medalFor: medalFor,
        initialFor: initialFor,
        shortName: shortName,

        PODIUM_SIZE: PODIUM_SIZE
    };

    return { Ranking: Ranking };
});
