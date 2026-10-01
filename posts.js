// ============================================================
// Heritage Hunt CV — Descobertas (camada de dominio)
//
// As publicacoes da Comunidade: o que alguem viu, soube ou
// aprendeu num lugar, escrito para ficar.
//
// Regras deste ficheiro, como em `xp.js` e `conversations.js`:
//   - nao toca no DOM;
//   - nao toca na rede;
//   - nao traduz nada.
//
// PUBLICACAO NAO E MENSAGEM (ponto 33). A diferenca aparece ja
// aqui: uma publicacao tem titulo obrigatorio e um tipo de uma
// lista fechada, e `validateDraft` recusa qualquer uma das duas
// coisas em falta. Uma mensagem de chat nao tem nem uma nem
// outra.
//
// SEM XP (pontos 34 e 35). Nenhum caminho daqui leva a `xp.js`.
// Publicar muito nao e publicar bem.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Posts = api.Posts;
        root.POST_CONFIG = api.POST_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // Os seis tipos do desenho. Lista FECHADA: sem ela, "dica" e
    // "Dica" passavam a ser dois filtros ao fim de um mes.
    //
    // A ordem e a da grelha do ecra de criar, e o `icon` viaja com
    // o tipo para o cartao e o selector nunca discordarem.
    const POST_KINDS = [
        { id: 'tip',       icon: 'fa-lightbulb',  accent: 'gold' },
        { id: 'photo',     icon: 'fa-image',      accent: 'blue' },
        { id: 'curiosity', icon: 'fa-compass',    accent: 'violet' },
        { id: 'trail',     icon: 'fa-person-walking', accent: 'green' },
        { id: 'place',     icon: 'fa-location-dot',   accent: 'gold' },
        { id: 'question',  icon: 'fa-circle-question', accent: 'blue' }
    ];

    const POST_CONFIG = {
        TITLE_MAX: 120,
        BODY_MAX: 2000,
        COMMENT_MAX: 1000,

        // Espelha o `left(p.body, 280)` de `private.post_json`.
        EXCERPT: 280,

        PAGE_SIZE: 20,
        COMMENT_PAGE_SIZE: 30,

        // Quantas fotografias cabem numa publicacao. Mais do que
        // isto deixa de ser uma publicacao e passa a ser um album —
        // e album ja existe, por monumento.
        MAX_PHOTOS: 4,

        KINDS: POST_KINDS,
        KIND_IDS: POST_KINDS.map(function (k) { return k.id; }),

        REACTIONS: ['helpful', 'interesting'],
        REPORT_REASONS: ['qr_location', 'incorrect', 'spam', 'harassment', 'other']
    };

    function toTime(value) {
        if (!value) return 0;
        const ms = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isFinite(ms) ? ms : 0;
    }

    // ==========================================================
    // Tipos
    // ==========================================================

    function kindInfo(id) {
        return POST_KINDS.find(function (k) { return k.id === id; }) || null;
    }

    function isValidKind(id) {
        return POST_CONFIG.KIND_IDS.indexOf(String(id)) !== -1;
    }

    // Os filtros do desenho: "Todas" primeiro, depois um por tipo.
    // `null` representa Todas — e o mesmo valor que `list_posts`
    // espera quando nao ha filtro, por isso nao ha traducao pelo
    // caminho.
    function filterChips() {
        return [{ id: null, icon: 'fa-layer-group' }].concat(POST_KINDS);
    }

    // ==========================================================
    // O feed
    // ==========================================================

    // Como nas conversas: juntar paginas sem duplicar e manter a
    // ordem, que aqui e a inversa — as mais recentes primeiro.
    function mergePosts(existing, incoming) {
        const byId = new Map();

        (Array.isArray(existing) ? existing : []).forEach(function (p) {
            if (p && p.id) byId.set(String(p.id), p);
        });
        (Array.isArray(incoming) ? incoming : []).forEach(function (p) {
            if (p && p.id) byId.set(String(p.id), p);
        });

        return Array.from(byId.values()).sort(function (a, b) {
            const d = toTime(b.createdAt) - toTime(a.createdAt);
            return d !== 0 ? d : String(b.id).localeCompare(String(a.id));
        });
    }

    // O cursor do "carregar mais": a data da publicacao mais
    // antiga que ja temos.
    function oldestAt(posts) {
        const rows = (Array.isArray(posts) ? posts : []).filter(function (p) { return p && !p.pending; });
        if (!rows.length) return null;
        return rows.reduce(function (min, p) {
            return toTime(p.createdAt) < toTime(min) ? p.createdAt : min;
        }, rows[0].createdAt);
    }

    // Substituir uma publicacao depois de reagir ou guardar, sem
    // redesenhar o feed todo a partir do servidor.
    function replacePost(posts, updated) {
        if (!updated || !updated.id) return Array.isArray(posts) ? posts.slice() : [];
        return (Array.isArray(posts) ? posts : []).map(function (p) {
            return p && String(p.id) === String(updated.id) ? updated : p;
        });
    }

    function removePost(posts, id) {
        return (Array.isArray(posts) ? posts : []).filter(function (p) {
            return !(p && String(p.id) === String(id));
        });
    }

    // Resposta imediata ao toque, antes de o servidor confirmar.
    // Devolve uma COPIA: mutar a linha do feed faria o botao mudar
    // em sitios onde o estado ainda nao foi confirmado.
    function toggleReaction(post, reaction) {
        if (!post || POST_CONFIG.REACTIONS.indexOf(reaction) === -1) return post;

        const mineKey = reaction === 'helpful' ? 'myHelpful' : 'myInteresting';
        const countKey = reaction === 'helpful' ? 'helpful' : 'interesting';
        const next = !post[mineKey];

        const copy = Object.assign({}, post);
        copy[mineKey] = next;
        copy[countKey] = Math.max(0, (post[countKey] || 0) + (next ? 1 : -1));
        return copy;
    }

    function toggleSaved(post) {
        if (!post) return post;
        return Object.assign({}, post, { saved: !post.saved });
    }

    // ==========================================================
    // Escrever uma publicacao
    // ==========================================================

    // Espelho local do que `create_post` verifica. Recusar aqui
    // poupa uma ida a rede; o servidor volta a verificar porque
    // isto corre no browser de quem escreve.
    function validateDraft(draft) {
        const d = draft || {};
        const title = String(d.title == null ? '' : d.title).trim();
        const body = String(d.body == null ? '' : d.body);

        if (!isValidKind(d.kind)) return { ok: false, reason: 'kind' };
        if (!title) return { ok: false, reason: 'title' };
        if (title.length > POST_CONFIG.TITLE_MAX) return { ok: false, reason: 'title_long' };
        if (body.length > POST_CONFIG.BODY_MAX) return { ok: false, reason: 'body_long' };

        if ((d.photos || []).length > POST_CONFIG.MAX_PHOTOS) {
            return { ok: false, reason: 'photos' };
        }

        return {
            ok: true,
            kind: d.kind,
            title: title,
            body: body.trim(),
            monumentId: d.monumentId || null,
            zoneId: d.zoneId || null,
            photos: (d.photos || []).slice(0, POST_CONFIG.MAX_PHOTOS)
        };
    }

    // Que campo esta a travar o botao Publicar. Serve para apontar
    // ao sitio certo em vez de dizer so "invalido".
    function missingField(draft) {
        const checked = validateDraft(draft);
        return checked.ok ? null : checked.reason;
    }

    function remainingTitle(text) {
        return POST_CONFIG.TITLE_MAX - String(text == null ? '' : text).length;
    }

    function remainingBody(text) {
        return POST_CONFIG.BODY_MAX - String(text == null ? '' : text).length;
    }

    // ==========================================================
    // Comentarios
    // ==========================================================

    function validateComment(text) {
        const body = String(text == null ? '' : text).trim();
        if (!body) return { ok: false, reason: 'empty' };
        if (body.length > POST_CONFIG.COMMENT_MAX) return { ok: false, reason: 'too_long' };
        return { ok: true, body: body };
    }

    // Os comentarios chegam do mais recente para o mais antigo (e
    // a ordem do desenho, e a inversa da do chat). Juntar paginas
    // mantem essa ordem.
    function mergeComments(existing, incoming) {
        const byId = new Map();

        (Array.isArray(existing) ? existing : []).forEach(function (c) {
            if (c && c.id) byId.set(String(c.id), c);
        });
        (Array.isArray(incoming) ? incoming : []).forEach(function (c) {
            if (c && c.id) byId.set(String(c.id), c);
        });

        return Array.from(byId.values()).sort(function (a, b) {
            const d = toTime(b.createdAt) - toTime(a.createdAt);
            return d !== 0 ? d : String(b.id).localeCompare(String(a.id));
        });
    }

    function oldestCommentAt(comments) {
        const rows = Array.isArray(comments) ? comments : [];
        if (!rows.length) return null;
        return rows.reduce(function (min, c) {
            return toTime(c.createdAt) < toTime(min) ? c.createdAt : min;
        }, rows[0].createdAt);
    }

    function replaceComment(comments, updated) {
        if (!updated || !updated.id) return Array.isArray(comments) ? comments.slice() : [];
        return (Array.isArray(comments) ? comments : []).map(function (c) {
            return c && String(c.id) === String(updated.id) ? updated : c;
        });
    }

    function toggleCommentHelpful(comment) {
        if (!comment) return comment;
        const next = !comment.myHelpful;
        return Object.assign({}, comment, {
            myHelpful: next,
            helpful: Math.max(0, (comment.helpful || 0) + (next ? 1 : -1))
        });
    }

    // ==========================================================
    // Pistas sem estragar a descoberta
    // ==========================================================

    // Ponto 17, aplicado a quem escreve: o aviso aparece no ecra
    // de criar quando a publicacao fica AMARRADA A UM MONUMENTO,
    // porque e so ai que ha um QR para estragar.
    //
    // Uma curiosidade sobre a ilha nao precisa do aviso, e mostra-
    // lo sempre era garantir que ninguem o lia.
    function shouldWarnAboutQr(draft) {
        const d = draft || {};
        if (!d.monumentId) return false;
        return d.kind === 'tip' || d.kind === 'question' || d.kind === 'place';
    }

    function isValidReportReason(reason) {
        return POST_CONFIG.REPORT_REASONS.indexOf(String(reason)) !== -1;
    }

    const Posts = {
        // Tipos
        kindInfo: kindInfo,
        isValidKind: isValidKind,
        filterChips: filterChips,

        // Feed
        mergePosts: mergePosts,
        oldestAt: oldestAt,
        replacePost: replacePost,
        removePost: removePost,
        toggleReaction: toggleReaction,
        toggleSaved: toggleSaved,

        // Escrever
        validateDraft: validateDraft,
        missingField: missingField,
        remainingTitle: remainingTitle,
        remainingBody: remainingBody,

        // Comentarios
        validateComment: validateComment,
        mergeComments: mergeComments,
        oldestCommentAt: oldestCommentAt,
        replaceComment: replaceComment,
        toggleCommentHelpful: toggleCommentHelpful,

        // Pistas e moderacao
        shouldWarnAboutQr: shouldWarnAboutQr,
        isValidReportReason: isValidReportReason,

        CONFIG: POST_CONFIG
    };

    return { Posts: Posts, POST_CONFIG: POST_CONFIG };
});
