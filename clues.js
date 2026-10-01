// ============================================================
// Heritage Hunt CV — Pistas (camada de dominio)
//
// Uma pista e uma frase que aponta uma direccao sem dizer o
// sitio. E o terceiro conceito social da app, e o unico com uma
// credencial: so escreve quem ja descobriu (ponto 19).
//
// Regras deste ficheiro, como nos irmaos:
//   - nao toca no DOM;
//   - nao toca na rede;
//   - nao traduz nada.
//
// SEM XP (pontos 34 e 35). Deixar uma pista nao da pontos — daria
// uma corrida a escrever doze frases inuteis, uma por monumento.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Clues = api.Clues;
        root.CLUE_CONFIG = api.CLUE_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const CLUE_CONFIG = {
        // Espelha o CHECK `clues_body_length` da migration 005.
        //
        // 400 e nao 1000: uma pista curta aponta; uma pista longa
        // descreve. Descrever e exactamente o que estraga a
        // descoberta (ponto 17), por isso o limite faz parte do
        // desenho, nao e um detalhe tecnico.
        MAX_LENGTH: 400,
        COUNTER_FROM: 280,

        REPORT_REASONS: ['qr_location', 'incorrect', 'spam', 'harassment', 'other']
    };

    // Palavras que quase sempre precedem a localizacao exacta.
    //
    // NAO sao um filtro: nada e bloqueado por causa delas. Servem
    // para um aviso suave enquanto a pessoa escreve — "isto soa a
    // revelar de mais" — porque um aviso no momento certo evita
    // mais estragos do que uma denuncia depois.
    //
    // Moderacao automatica complexa esta fora desta versao (ponto
    // 55); isto e o contrario disso: uma ajuda, sem poder nenhum.
    //
    // Guardadas como RAIZ, sem a preposicao final: "atras d"
    // apanha "atras de", "atras da" e "atras do" de uma vez. Com a
    // forma completa, "atras de" nao encontrava "atras da porta" —
    // que e exactamente a frase que interessa apanhar.
    const REVEALING_HINTS = [
        'atras d', 'por tras d',
        'debaixo d', 'por baixo d', 'dentro d',
        'ao lado d', 'em cima d',
        'terceira', 'quarta', 'quinta',
        'passos', 'metros', 'centimetros',
        'behind', 'under', 'inside', 'next to', 'steps', 'meters'
    ];

    function toTime(value) {
        if (!value) return 0;
        const ms = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isFinite(ms) ? ms : 0;
    }

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase();
    }

    // ==========================================================
    // Escrever uma pista
    // ==========================================================

    function validateDraft(text) {
        const body = String(text == null ? '' : text).trim();

        if (!body) return { ok: false, reason: 'empty' };
        if (body.length > CLUE_CONFIG.MAX_LENGTH) return { ok: false, reason: 'too_long' };

        return { ok: true, body: body };
    }

    function remainingChars(text) {
        return CLUE_CONFIG.MAX_LENGTH - String(text == null ? '' : text).length;
    }

    function shouldShowCounter(text) {
        return String(text == null ? '' : text).length >= CLUE_CONFIG.COUNTER_FROM;
    }

    // Soa a revelar de mais? Devolve true/false e nada mais — nao
    // bloqueia, nao pontua, nao guarda. Quem escreve decide.
    function soundsRevealing(text) {
        const body = normalize(text);
        if (!body) return false;
        return REVEALING_HINTS.some(function (hint) {
            return body.indexOf(normalize(hint)) !== -1;
        });
    }

    // ==========================================================
    // Quem pode escrever
    // ==========================================================

    // O estado do botao, num sitio so. O ecra tem tres caras
    // possiveis e nenhuma delas deve ser decidida no meio do HTML:
    //
    //   'write'       descobri e ainda nao deixei a minha
    //   'already'     descobri e ja deixei (uma por explorador)
    //   'locked'      ainda nao descobri este monumento
    function writeState(info) {
        const i = info || {};
        if (!i.canWrite) return 'locked';
        if (i.hasMine) return 'already';
        return 'write';
    }

    function canWrite(info) {
        return writeState(info) === 'write';
    }

    // ==========================================================
    // A lista
    // ==========================================================

    // O servidor ja devolve por utilidade. Esta funcao existe para
    // a lista se reordenar depois de alguem carregar em
    // "Ajudou-me" sem ter de voltar a pedir tudo.
    //
    // A ordem e por utilidade, nao por novidade: numa lista de
    // pistas, a que resolveu o problema a dezoito pessoas vale
    // mais acima do que a que chegou ha cinco minutos. E o
    // contrario do feed das Descobertas, e de proposito.
    function sortByHelpful(clues) {
        return (Array.isArray(clues) ? clues.slice() : []).sort(function (a, b) {
            const d = (b.helpful || 0) - (a.helpful || 0);
            if (d !== 0) return d;
            const t = toTime(b.createdAt) - toTime(a.createdAt);
            return t !== 0 ? t : String(a.id).localeCompare(String(b.id));
        });
    }

    function replaceClue(clues, updated) {
        if (!updated || !updated.id) return Array.isArray(clues) ? clues.slice() : [];
        return (Array.isArray(clues) ? clues : []).map(function (c) {
            return c && String(c.id) === String(updated.id) ? updated : c;
        });
    }

    function removeClue(clues, id) {
        return (Array.isArray(clues) ? clues : []).filter(function (c) {
            return !(c && String(c.id) === String(id));
        });
    }

    function toggleHelpful(clue) {
        if (!clue) return clue;
        const next = !clue.myHelpful;
        return Object.assign({}, clue, {
            myHelpful: next,
            helpful: Math.max(0, (clue.helpful || 0) + (next ? 1 : -1))
        });
    }

    // ==========================================================
    // O indice da aba
    // ==========================================================

    // Os monumentos com pistas primeiro, e dentro desses os que eu
    // ainda nao descobri — sao esses que me interessam quando
    // estou perdido a frente de um.
    //
    // Os que nao tem pista nenhuma vao para o fim, mas nao
    // desaparecem: sao o convite para quem ja descobriu deixar a
    // primeira.
    function sortMonuments(rows) {
        return (Array.isArray(rows) ? rows.slice() : []).sort(function (a, b) {
            const ac = (a.clues || 0) > 0;
            const bc = (b.clues || 0) > 0;
            if (ac !== bc) return ac ? -1 : 1;

            if (ac) {
                // Entre os que tem pistas: os por descobrir primeiro.
                if (a.discovered !== b.discovered) return a.discovered ? 1 : -1;
                return (b.clues || 0) - (a.clues || 0);
            }

            // Entre os que nao tem: os que EU posso ajudar primeiro.
            if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
            return String(a.monumentId).localeCompare(String(b.monumentId), undefined, { numeric: true });
        });
    }

    // Quantos monumentos ainda esperam pela primeira pista de
    // alguem que ja os descobriu. E o numero que torna a aba um
    // convite em vez de um arquivo.
    function monumentsICanHelp(rows) {
        return (Array.isArray(rows) ? rows : []).filter(function (m) {
            return m && m.discovered && !m.hasMine;
        }).length;
    }

    function totalClues(rows) {
        return (Array.isArray(rows) ? rows : []).reduce(function (sum, m) {
            return sum + (m && m.clues > 0 ? m.clues : 0);
        }, 0);
    }

    function isValidReportReason(reason) {
        return CLUE_CONFIG.REPORT_REASONS.indexOf(String(reason)) !== -1;
    }

    const Clues = {
        // Escrever
        validateDraft: validateDraft,
        remainingChars: remainingChars,
        shouldShowCounter: shouldShowCounter,
        soundsRevealing: soundsRevealing,

        // Permissao
        writeState: writeState,
        canWrite: canWrite,

        // Lista
        sortByHelpful: sortByHelpful,
        replaceClue: replaceClue,
        removeClue: removeClue,
        toggleHelpful: toggleHelpful,

        // Indice
        sortMonuments: sortMonuments,
        monumentsICanHelp: monumentsICanHelp,
        totalClues: totalClues,

        // Moderacao
        isValidReportReason: isValidReportReason,
        REVEALING_HINTS: REVEALING_HINTS,

        CONFIG: CLUE_CONFIG
    };

    return { Clues: Clues, CLUE_CONFIG: CLUE_CONFIG };
});
