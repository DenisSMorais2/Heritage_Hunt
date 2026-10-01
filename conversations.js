// ============================================================
// Heritage Hunt CV — Conversas (camada de dominio)
//
// "Exploradores ajudam exploradores a descobrir Cabo Verde."
//
// Regras deste ficheiro, as mesmas de `xp.js`:
//   - nao toca no DOM;
//   - nao toca na rede;
//   - nao sabe traduzir nada (recebe um rotulador quando precisa
//     de comparar texto que o utilizador ve).
//
// O que vive aqui e a ARITMETICA do chat: o que conta como por
// ler, que mensagens se agrupam, o que e uma mensagem valida,
// como uma pagina antiga se junta a uma novidade do Realtime sem
// duplicar nada, e quando o ecra pode saltar para o fundo.
//
// POR QUE NAO HA XP NESTE FICHEIRO
//
// Pontos 34 e 35. Conversar nao da XP e nao ha aqui nenhum
// caminho que leve a `xp.js`. Se um dia alguem quiser recompensar
// ajuda, o sitio e a reputacao — uma coisa qualitativa e lenta —
// nunca um numero que sobe por mensagem enviada.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Conversations = api.Conversations;
        root.CONVERSATION_CONFIG = api.CONVERSATION_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const CONVERSATION_CONFIG = {
        // Espelha o CHECK `messages_body_length` da migration 003.
        // O servidor e que decide; isto existe para a contagem no
        // ecra e para nao gastar uma ida a rede com algo que ja se
        // sabe recusado.
        MAX_LENGTH: 1000,

        // A partir de quando o contador de caracteres aparece. Antes
        // disto seria ruido: ninguem escreve 1000 caracteres sem dar
        // por isso.
        COUNTER_FROM: 800,

        // Tamanho de pagina (ponto 28).
        PAGE_SIZE: 40,

        // Duas mensagens seguidas da mesma pessoa agrupam-se — mas
        // so se forem mesmo seguidas no tempo. Passada esta pausa, a
        // conversa recomeca e o nome volta a aparecer (ponto 10).
        GROUP_GAP_MS: 5 * 60 * 1000,

        // Quao perto do fundo e "estar no fundo". Acima disto, uma
        // mensagem nova nao rouba o scroll a quem esta a ler para
        // tras (ponto 29).
        BOTTOM_SLACK_PX: 120,

        // Ordem do catalogo em "Explorar conversas": a geral
        // primeiro, depois as zonas, depois os monumentos.
        KIND_ORDER: { general: 0, zone: 1, monument: 2 }
    };

    const REPORT_REASONS = ['qr_location', 'incorrect', 'spam', 'harassment', 'other'];

    // ==========================================================
    // Tempo
    // ==========================================================

    function toTime(value) {
        if (!value) return 0;
        const ms = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isFinite(ms) ? ms : 0;
    }

    // ==========================================================
    // A lista de conversas
    // ==========================================================

    // O ponto 7 divide a lista em duas: as que ja me dizem respeito
    // e as que ainda posso descobrir.
    //
    // "Minha" nao e so ter escrito la dentro: uma conversa onde ha
    // mensagens por ler tambem ja me diz respeito, mesmo que eu
    // nunca tenha aberto. E o que faz uma pergunta no monumento
    // onde estive aparecer-me sem eu ter de a procurar.
    function splitConversations(list) {
        const rows = Array.isArray(list) ? list.slice() : [];

        const mine = rows.filter((c) => c && (c.joined === true || (c.unread || 0) > 0));
        const explore = rows.filter((c) => c && !(c.joined === true || (c.unread || 0) > 0));

        mine.sort((a, b) => toTime(b.lastAt) - toTime(a.lastAt));

        // O catalogo nao se ordena por actividade: ordena-se por
        // tipo, para o sitio de cada conversa ser sempre o mesmo.
        explore.sort((a, b) => {
            const ka = CONVERSATION_CONFIG.KIND_ORDER[a.kind];
            const kb = CONVERSATION_CONFIG.KIND_ORDER[b.kind];
            if (ka !== kb) return (ka === undefined ? 99 : ka) - (kb === undefined ? 99 : kb);
            return toTime(b.lastAt) - toTime(a.lastAt);
        });

        return { mine: mine, explore: explore };
    }

    // Ponto 40: procura por monumento, zona ou nome da conversa.
    // NAO procura dentro das mensagens — isso e outra feature, com
    // outro custo.
    //
    // `labelFor` traduz uma conversa no texto que a pessoa ve, para
    // que procurar "Centro" encontre `centro_historico` no idioma
    // em que ela esta a ler.
    function filterConversations(list, query, labelFor) {
        const rows = Array.isArray(list) ? list : [];
        const needle = normalizeForSearch(query);
        if (!needle) return rows.slice();

        return rows.filter((c) => {
            const label = typeof labelFor === 'function' ? labelFor(c) : '';
            return normalizeForSearch(label).indexOf(needle) !== -1;
        });
    }

    // Sem acentos e sem maiusculas: procurar "belem" tem de
    // encontrar "Belem", e "Historico" tem de encontrar "Historico"
    // escrito com acento.
    function normalizeForSearch(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }

    function totalUnread(list) {
        return (Array.isArray(list) ? list : [])
            .reduce((sum, c) => sum + (c && c.unread > 0 ? c.unread : 0), 0);
    }

    // Encontrar a conversa de um sitio sem nunca escrever um id no
    // frontend (ponto 50). O catalogo ja veio do servidor; isto so
    // escolhe a linha certa.
    function findConversation(list, criteria) {
        const rows = Array.isArray(list) ? list : [];
        const want = criteria || {};

        return rows.find((c) => {
            if (!c || c.kind !== want.kind) return false;
            if (want.kind === 'monument') return String(c.monumentId) === String(want.monumentId);
            if (want.kind === 'zone') return String(c.zoneId) === String(want.zoneId);
            return true;
        }) || null;
    }

    // ==========================================================
    // Mensagens
    // ==========================================================

    // Juntar o que ja estava com o que chegou, sem duplicados e
    // sempre por ordem de leitura.
    //
    // Isto e chamado de tres sitios que podem trazer a mesma
    // mensagem: a pagina inicial, o "carregar anteriores" e o aviso
    // do Realtime. Deduplicar por `id` e o que torna indiferente
    // qual deles chega primeiro — e o que faz a mensagem optimista
    // ser SUBSTITUIDA pela versao do servidor em vez de aparecer
    // duas vezes (ver `reconcilePending`).
    function mergeMessages(existing, incoming) {
        const byId = new Map();

        (Array.isArray(existing) ? existing : []).forEach((m) => {
            if (m && m.id) byId.set(String(m.id), m);
        });
        (Array.isArray(incoming) ? incoming : []).forEach((m) => {
            if (m && m.id) byId.set(String(m.id), m);
        });

        return Array.from(byId.values())
            .sort((a, b) => {
                const d = toTime(a.createdAt) - toTime(b.createdAt);
                // Duas mensagens no mesmo milissegundo: desempate
                // estavel pelo id, para a ordem nao dancar entre
                // dois desenhos do mesmo ecra.
                return d !== 0 ? d : String(a.id).localeCompare(String(b.id));
            });
    }

    // A data da mensagem mais antiga — o cursor do "carregar
    // anteriores" (ponto 28).
    function oldestAt(messages) {
        const rows = (Array.isArray(messages) ? messages : []).filter((m) => m && !m.pending);
        if (!rows.length) return null;
        return rows.reduce((min, m) => (toTime(m.createdAt) < toTime(min) ? m.createdAt : min), rows[0].createdAt);
    }

    // A data da mais recente ja confirmada — e por aqui que se
    // retoma depois de uma falha de rede ou de um aviso do
    // Realtime. Mensagens por enviar nao contam: ainda nao existem
    // para o servidor.
    function latestAt(messages) {
        const rows = (Array.isArray(messages) ? messages : []).filter((m) => m && !m.pending);
        if (!rows.length) return null;
        return rows.reduce((max, m) => (toTime(m.createdAt) > toTime(max) ? m.createdAt : max), rows[0].createdAt);
    }

    // Ponto 10: nao repetir avatar e nome em mensagens seguidas da
    // mesma pessoa. Uma mensagem removida quebra sempre o grupo —
    // juntar uma lapide ao bloco de alguem seria atribuir-lhe o que
    // ela nao disse.
    function groupMessages(messages) {
        const rows = Array.isArray(messages) ? messages : [];
        const groups = [];

        rows.forEach((m) => {
            if (!m) return;

            const last = groups[groups.length - 1];
            const authorId = m.author && m.author.userId ? String(m.author.userId) : '';
            const gap = last ? toTime(m.createdAt) - toTime(last.lastAt) : Infinity;

            const continues = last &&
                !last.deleted && !m.deleted &&
                last.authorId === authorId &&
                gap >= 0 && gap <= CONVERSATION_CONFIG.GROUP_GAP_MS;

            if (continues) {
                last.messages.push(m);
                last.lastAt = m.createdAt;
                return;
            }

            groups.push({
                authorId: authorId,
                author: m.author || null,
                mine: m.mine === true,
                deleted: m.deleted === true,
                lastAt: m.createdAt,
                messages: [m]
            });
        });

        return groups;
    }

    // ==========================================================
    // Escrever
    // ==========================================================

    // Espelho local do que o servidor vai verificar. Recusar aqui
    // poupa uma ida a rede; o servidor volta a verificar porque
    // este codigo corre no browser de quem escreve.
    function validateDraft(text) {
        const body = String(text == null ? '' : text).trim();

        if (!body) return { ok: false, reason: 'empty' };
        if (body.length > CONVERSATION_CONFIG.MAX_LENGTH) return { ok: false, reason: 'too_long' };

        return { ok: true, body: body };
    }

    function remainingChars(text) {
        return CONVERSATION_CONFIG.MAX_LENGTH - String(text == null ? '' : text).length;
    }

    function shouldShowCounter(text) {
        return String(text == null ? '' : text).length >= CONVERSATION_CONFIG.COUNTER_FROM;
    }

    // Ponto 26: a mensagem aparece imediatamente, mas marcada. O id
    // local comeca por `pending:` para nunca colidir com um uuid do
    // servidor.
    //
    // `status` e a maquina de estados inteira:
    //   'sending' -> 'sent'   (o servidor confirmou)
    //              -> 'failed' (e fica, com [tentar novamente])
    //
    // Nunca ha um quarto estado em que a mensagem desaparece sem
    // dizer nada — e a regra do ponto 26.
    function createPending(draft, author) {
        const checked = validateDraft(draft && draft.body);
        if (!checked.ok && draft && draft.kind === 'text') return null;

        const localId = 'pending:' + Math.random().toString(36).slice(2) + Date.now().toString(36);

        return {
            id: localId,
            localId: localId,
            pending: true,
            status: 'sending',
            kind: (draft && draft.kind) || 'text',
            body: checked.ok ? checked.body : ((draft && draft.body) || ''),
            mediaPath: (draft && draft.mediaPath) || null,
            mediaPreview: (draft && draft.mediaPreview) || null,
            referenceKind: (draft && draft.referenceKind) || null,
            referenceId: (draft && draft.referenceId) || null,
            replyTo: (draft && draft.replyTo) || null,
            createdAt: new Date().toISOString(),
            editedAt: null,
            deleted: false,
            mine: true,
            author: author || null,
            helpfulCount: 0,
            helpfulByMe: false
        };
    }

    function markFailed(messages, localId) {
        return (Array.isArray(messages) ? messages : []).map((m) => (
            m && m.localId === localId ? Object.assign({}, m, { status: 'failed' }) : m
        ));
    }

    function markSending(messages, localId) {
        return (Array.isArray(messages) ? messages : []).map((m) => (
            m && m.localId === localId ? Object.assign({}, m, { status: 'sending' }) : m
        ));
    }

    // A confirmacao do servidor substitui a mensagem optimista.
    //
    // Repara que isto corre ANTES de `mergeMessages`: primeiro
    // tira-se a linha local, depois junta-se a verdadeira. Se fosse
    // ao contrario, a conversa mostrava as duas por um instante.
    function reconcilePending(messages, localId, confirmed) {
        const rows = (Array.isArray(messages) ? messages : []).filter((m) => !(m && m.localId === localId));
        return confirmed ? mergeMessages(rows, [confirmed]) : rows;
    }

    function pendingMessages(messages) {
        return (Array.isArray(messages) ? messages : []).filter((m) => m && m.pending);
    }

    // ==========================================================
    // Scroll
    // ==========================================================

    // Ponto 29: quem esta a ler mensagens antigas nao e arrastado
    // para o fundo quando chega uma nova. Em vez disso aparece o
    // aviso "1 nova mensagem".
    //
    // A propria mensagem de quem escreve e a excepcao: enviar e
    // sempre motivo para ir ver o que se enviou.
    function shouldFollow(view, message) {
        if (message && message.mine) return true;
        return isAtBottom(view);
    }

    function isAtBottom(view) {
        if (!view) return true;
        const distance = view.scrollHeight - view.scrollTop - view.clientHeight;
        return distance <= CONVERSATION_CONFIG.BOTTOM_SLACK_PX;
    }

    // ==========================================================
    // Pistas sem estragar a descoberta
    // ==========================================================

    // Ponto 17: o aviso aparece ao ENTRAR numa conversa de
    // monumento, e so na primeira vez para aquele monumento. Nao se
    // repete a cada mensagem — um aviso que aparece sempre deixa de
    // ser lido.
    function shouldWarnAboutQr(conversation, seenIds) {
        if (!conversation || conversation.kind !== 'monument') return false;
        const seen = Array.isArray(seenIds) ? seenIds : [];
        return seen.indexOf(String(conversation.monumentId)) === -1;
    }

    function rememberQrWarning(seenIds, monumentId) {
        const seen = Array.isArray(seenIds) ? seenIds.slice() : [];
        const id = String(monumentId);
        if (id && seen.indexOf(id) === -1) seen.push(id);
        return seen;
    }

    function isValidReportReason(reason) {
        return REPORT_REASONS.indexOf(String(reason)) !== -1;
    }

    const Conversations = {
        // Lista
        splitConversations: splitConversations,
        filterConversations: filterConversations,
        findConversation: findConversation,
        totalUnread: totalUnread,
        normalizeForSearch: normalizeForSearch,

        // Mensagens
        mergeMessages: mergeMessages,
        groupMessages: groupMessages,
        oldestAt: oldestAt,
        latestAt: latestAt,

        // Escrever
        validateDraft: validateDraft,
        remainingChars: remainingChars,
        shouldShowCounter: shouldShowCounter,
        createPending: createPending,
        markFailed: markFailed,
        markSending: markSending,
        reconcilePending: reconcilePending,
        pendingMessages: pendingMessages,

        // Scroll
        shouldFollow: shouldFollow,
        isAtBottom: isAtBottom,

        // Pistas
        shouldWarnAboutQr: shouldWarnAboutQr,
        rememberQrWarning: rememberQrWarning,

        // Moderacao
        isValidReportReason: isValidReportReason,
        REPORT_REASONS: REPORT_REASONS,

        CONFIG: CONVERSATION_CONFIG
    };

    return { Conversations: Conversations, CONVERSATION_CONFIG: CONVERSATION_CONFIG };
});
