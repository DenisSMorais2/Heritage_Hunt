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
        REPORT_REASONS: ['qr_location', 'incorrect', 'spam', 'harassment', 'other'],

        // Preenchidos depois das listas fechadas, que vivem mais
        // abaixo com os formularios.
        FIELD_TYPES: null,
        PHOTO_TAGS: null,
        PLACE_TAGS: null,
        DIFFICULTIES: null,
        META_TEXT_MAX: null,
        META_SOURCE_MAX: null,
        MAX_TAGS: null
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
    // CADA TIPO E UM FORMULARIO
    //
    // Uma dica nao e uma fotografia; uma fotografia nao e um
    // trilho. Ate aqui os seis tipos partilhavam o mesmo
    // formulario — titulo, descricao, foto, local — e escolher o
    // tipo nao mudava nada a seguir. Mudava a etiqueta.
    //
    // O QUE ESTA AQUI E A FORMA DE CADA UM, EM DADOS. Nao ha um
    // `if (kind === 'trail')` em lado nenhum: ha uma lista de
    // campos por tipo, e a interface desenha-a. Acrescentar um
    // setimo tipo e acrescentar uma entrada aqui e as traducoes —
    // nunca um ramo novo espalhado por tres ficheiros.
    //
    // E A MESMA LISTA QUE VALIDA. `validateDraft` le estes campos
    // para saber o que e obrigatorio, por isso o formulario e as
    // regras nao podem discordar: sao a mesma coisa lida duas
    // vezes.
    // ==========================================================

    // Cada campo diz onde vive no rascunho:
    //   'title' | 'body' | 'place' | 'photos' | 'meta:<chave>'
    //
    // E o `type` diz como se desenha — e ha um desenhador por
    // TIPO DE CAMPO (sete), nao um por tipo de publicacao (seis).
    const FIELD_TYPES = ['place', 'text', 'textarea', 'photos', 'chips', 'choice', 'notice'];

    // Listas fechadas, como os tipos: sem elas, "Vista" e "vista"
    // seriam duas etiquetas ao fim de um mes.
    const PHOTO_TAGS = ['history', 'view', 'architecture', 'nature', 'sunset', 'culture'];
    const PLACE_TAGS = ['view', 'photo', 'history', 'nature', 'family', 'sunset', 'culture'];
    const DIFFICULTIES = ['easy', 'moderate', 'hard'];

    const META_TEXT_MAX = 80;    // partida, destino, distancia, duracao
    const META_SOURCE_MAX = 200; // fonte de uma curiosidade
    const MAX_TAGS = 4;

    const KIND_FORMS = {
        // DICA — ajudar outro explorador, depressa. O contexto vem
        // primeiro porque uma dica sem lugar ajuda menos, e o aviso
        // do QR so aparece quando ha um monumento para estragar.
        tip: [
            { id: 'place',  type: 'place',    label: 'composeTipPlace', recommended: true },
            { id: 'body',   type: 'textarea', label: 'composeTipBody',
              placeholder: 'composeTipBodyPlaceholder', required: true, max: 'BODY', rows: 4 },
            { id: 'photos', type: 'photos',   label: 'composePhotoOptional' },
            { id: 'qr',     type: 'notice',   when: 'monument', tone: 'gold',
              title: 'composeQrTitle', text: 'composeQrBody' }
        ],

        // FOTOGRAFIA — a imagem e o assunto, por isso vem primeiro
        // e e o unico campo obrigatorio. Sem titulo: a imagem e a
        // legenda ja dizem o que ha a dizer.
        photo: [
            { id: 'photos', type: 'photos',   label: 'composePhotoAdd', required: true, hero: true },
            { id: 'body',   type: 'textarea', label: 'composePhotoCaption',
              placeholder: 'composePhotoCaptionPlaceholder', max: 'BODY', rows: 3 },
            { id: 'place',  type: 'place',    label: 'composePhotoWhere' },
            { id: 'meta:tags', type: 'chips', label: 'composePhotoMoment',
              options: PHOTO_TAGS, optionPrefix: 'tagPhoto', max: MAX_TAGS }
        ],

        // CURIOSIDADE — conhecimento. A fonte e opcional mas esta
        // la, e o aviso de que a comunidade nao e uma enciclopedia
        // verificada tambem.
        curiosity: [
            { id: 'place',  type: 'place',    label: 'composeCuriosityPlace', recommended: true },
            { id: 'body',   type: 'textarea', label: 'composeCuriosityBody',
              placeholder: 'composeCuriosityBodyPlaceholder', required: true, max: 'BODY', rows: 5 },
            { id: 'meta:source', type: 'text', label: 'composeCuriositySource',
              placeholder: 'composeCuriositySourcePlaceholder', max: META_SOURCE_MAX },
            { id: 'photos', type: 'photos',   label: 'composePhotoOptional' },
            { id: 'note',   type: 'notice',   tone: 'quiet', text: 'composeCuriosityNote' }
        ],

        // TRILHO — o unico que precisa mesmo de varios campos: um
        // percurso sem partida, destino e descricao nao se segue.
        // Os numeros sao do AUTOR, nao calculados: esta app nao faz
        // routing e nao vai fingir que faz.
        trail: [
            { id: 'title',  type: 'text',     label: 'composeTrailName',
              placeholder: 'composeTrailNamePlaceholder', required: true, max: 'TITLE' },
            { id: 'photos', type: 'photos',   label: 'composeTrailCover' },
            { id: 'meta:start', type: 'text', label: 'composeTrailStart',
              placeholder: 'composeTrailStartPlaceholder', required: true, max: META_TEXT_MAX },
            { id: 'meta:end',   type: 'text', label: 'composeTrailEnd',
              placeholder: 'composeTrailEndPlaceholder', required: true, max: META_TEXT_MAX },
            { id: 'meta:distance', type: 'text', label: 'composeTrailDistance',
              placeholder: 'composeTrailDistancePlaceholder', max: META_TEXT_MAX, half: true },
            { id: 'meta:duration', type: 'text', label: 'composeTrailDuration',
              placeholder: 'composeTrailDurationPlaceholder', max: META_TEXT_MAX, half: true },
            { id: 'meta:difficulty', type: 'choice', label: 'composeTrailDifficulty',
              options: DIFFICULTIES, optionPrefix: 'trailLevel' },
            { id: 'body',   type: 'textarea', label: 'composeTrailBody',
              placeholder: 'composeTrailBodyPlaceholder', required: true, max: 'BODY', rows: 5 },
            { id: 'place',  type: 'place',    label: 'composeTrailZone' },
            { id: 'note',   type: 'notice',   tone: 'quiet', text: 'composeTrailNote' }
        ],

        // LUGAR — sugerir. Aqui o titulo existe e tem nome proprio:
        // e o nome do lugar, nao um "titulo da publicacao".
        place: [
            { id: 'photos', type: 'photos',   label: 'composePlacePhoto', hero: true },
            { id: 'title',  type: 'text',     label: 'composePlaceName',
              placeholder: 'composePlaceNamePlaceholder', required: true, max: 'TITLE' },
            { id: 'place',  type: 'place',    label: 'composePlaceWhere' },
            { id: 'body',   type: 'textarea', label: 'composePlaceWhy',
              placeholder: 'composePlaceWhyPlaceholder', required: true, max: 'BODY', rows: 4 },
            { id: 'meta:tags', type: 'chips', label: 'composePlaceGoodFor',
              options: PLACE_TAGS, optionPrefix: 'tagPlace', max: MAX_TAGS }
        ],

        // PERGUNTA — o mais curto de todos, de proposito. Quem tem
        // uma duvida quer perguntar, nao preencher.
        question: [
            { id: 'place',  type: 'place',    label: 'composeQuestionAbout' },
            { id: 'body',   type: 'textarea', label: 'composeQuestionBody',
              placeholder: 'composeQuestionBodyPlaceholder', required: true, max: 'BODY', rows: 4 },
            { id: 'photos', type: 'photos',   label: 'composePhotoOptional' }
        ]
    };

    // A ACCAO PRINCIPAL DE CADA TIPO (ponto 62). Uma dica pergunta
    // "ajudou?"; um lugar pede para ser guardado; uma pergunta pede
    // resposta. As reaccoes guardadas continuam a ser duas
    // (`helpful` e `interesting`) — o que muda e qual delas o
    // cartao poe a frente.
    const KIND_ACTIONS = {
        tip:       { primary: 'helpful' },
        photo:     { primary: 'interesting' },
        curiosity: { primary: 'interesting' },
        trail:     { primary: 'open',    cta: 'cardTrailOpen' },
        place:     { primary: 'save',    cta: 'cardPlaceSave' },
        question:  { primary: 'comment', cta: 'cardQuestionAnswer' }
    };

    POST_CONFIG.FIELD_TYPES = FIELD_TYPES;
    POST_CONFIG.PHOTO_TAGS = PHOTO_TAGS;
    POST_CONFIG.PLACE_TAGS = PLACE_TAGS;
    POST_CONFIG.DIFFICULTIES = DIFFICULTIES;
    POST_CONFIG.META_TEXT_MAX = META_TEXT_MAX;
    POST_CONFIG.META_SOURCE_MAX = META_SOURCE_MAX;
    POST_CONFIG.MAX_TAGS = MAX_TAGS;

    function formFor(kind) {
        const form = KIND_FORMS[kind];
        return form ? form.slice() : [];
    }

    // O titulo existe onde tem nome proprio — "Nome do percurso",
    // "Que lugar descobriste?" — e em mais lado nenhum. Obrigar uma
    // dica a ter titulo era obrigar a escrever duas vezes a mesma
    // coisa.
    function needsTitle(kind) {
        return formFor(kind).some(function (f) { return f.id === 'title'; });
    }

    function primaryActionFor(kind) {
        return KIND_ACTIONS[kind] || KIND_ACTIONS.tip;
    }

    // A chave do botao de publicar, por tipo: "Partilhar dica",
    // "Publicar trilho", "Perguntar à comunidade". Nunca so
    // "Publicar" (ponto 19).
    function ctaKeyFor(kind) {
        return isValidKind(kind)
            ? 'composeCta' + kind.charAt(0).toUpperCase() + kind.slice(1)
            : 'composePublish';
    }

    function successKeyFor(kind) {
        return isValidKind(kind)
            ? 'composeDone' + kind.charAt(0).toUpperCase() + kind.slice(1)
            : 'composeDone';
    }

    // ==========================================================
    // Metadados
    //
    // Um so sitio para os dados proprios de cada tipo, mas NAO um
    // saco: so entram as chaves que o formulario daquele tipo
    // declara, com o tipo e o tamanho certos. O que vier a mais e
    // deitado fora aqui, antes de chegar a rede — e o servidor faz
    // a mesma limpeza outra vez, porque o cliente nao e de
    // confianca.
    // ==========================================================

    function metaKeysFor(kind) {
        return formFor(kind)
            .filter(function (f) { return f.id.indexOf('meta:') === 0; })
            .map(function (f) { return f.id.slice(5); });
    }

    function fieldFor(kind, id) {
        return formFor(kind).find(function (f) { return f.id === id; }) || null;
    }

    function cleanText(value, max) {
        return String(value == null ? '' : value).trim().slice(0, max);
    }

    function cleanTags(value, allowed, max) {
        if (!Array.isArray(value)) return [];
        const out = [];
        value.forEach(function (tag) {
            const id = String(tag);
            if (allowed.indexOf(id) === -1) return;   // fora da lista fechada
            if (out.indexOf(id) !== -1) return;       // repetida
            if (out.length >= max) return;
            out.push(id);
        });
        return out;
    }

    function normalizeMetadata(kind, metadata) {
        const source = metadata && typeof metadata === 'object' ? metadata : {};
        const out = {};

        metaKeysFor(kind).forEach(function (key) {
            const field = fieldFor(kind, 'meta:' + key);
            const raw = source[key];

            if (field.type === 'chips') {
                const tags = cleanTags(raw, field.options, field.max || MAX_TAGS);
                if (tags.length) out[key] = tags;
                return;
            }

            if (field.type === 'choice') {
                if (field.options.indexOf(String(raw)) !== -1) out[key] = String(raw);
                return;
            }

            const text = cleanText(raw, field.max || META_TEXT_MAX);
            if (text) out[key] = text;
        });

        return out;
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
    // AS REGRAS SAO O FORMULARIO, LIDO OUTRA VEZ. Nenhuma regra
    // esta escrita aqui a mao: percorre-se a lista de campos do
    // tipo e exige-se o que estiver marcado `required`. Uma
    // fotografia sem imagem falha porque o campo `photos` da
    // fotografia e obrigatorio — nao porque alguem se lembrou de
    // escrever um `if` para o caso.
    //
    // A razao devolvida e o ID DO CAMPO, para o ecra poder apontar
    // ao sitio certo em vez de dizer "invalido".
    function validateDraft(draft) {
        const d = draft || {};

        if (!isValidKind(d.kind)) return { ok: false, reason: 'kind' };

        const title = String(d.title == null ? '' : d.title).trim();
        const body = String(d.body == null ? '' : d.body);
        const photos = d.photos || [];
        const metadata = normalizeMetadata(d.kind, d.metadata);

        if (title.length > POST_CONFIG.TITLE_MAX) return { ok: false, reason: 'title_long' };
        if (body.length > POST_CONFIG.BODY_MAX) return { ok: false, reason: 'body_long' };
        if (photos.length > POST_CONFIG.MAX_PHOTOS) return { ok: false, reason: 'photos' };

        // Um titulo escrito num tipo que nao tem titulo nao e um
        // erro — e lixo de uma troca de tipo. Deita-se fora.
        const keepTitle = needsTitle(d.kind) ? title : '';

        const fields = formFor(d.kind);
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (!field.required) continue;

            let filled;
            if (field.id === 'title') filled = !!keepTitle;
            else if (field.id === 'body') filled = !!body.trim();
            else if (field.id === 'photos') filled = photos.length > 0;
            else if (field.id === 'place') filled = !!(d.monumentId || d.zoneId);
            else filled = !!metadata[field.id.slice(5)];

            if (!filled) return { ok: false, reason: field.id };
        }

        return {
            ok: true,
            kind: d.kind,
            title: keepTitle,
            body: body.trim(),
            monumentId: d.monumentId || null,
            zoneId: d.zoneId || null,
            photos: photos.slice(0, POST_CONFIG.MAX_PHOTOS),
            metadata: metadata
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
    // Procurar por lugar
    // ==========================================================

    // O servidor nao sabe como os lugares se chamam: a tabela
    // `monuments` so guarda ids, porque os nomes sao conteudo
    // traduzido e vivem no cliente. Entao e aqui que o nome
    // escrito se traduz nos ids que o servidor percebe, e a
    // consulta recebe-os ja resolvidos.
    //
    // Sem acentos e sem maiusculas: quem escreve "palacio" a
    // correr no telemovel espera encontrar o "Palácio do Povo".
    function normalizeTerm(value) {
        return String(value == null ? '' : value)
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }

    // places: [{ id, name }] — monumentos, zonas, cidade, ilha.
    // Devolve os ids cujo nome contem o termo.
    function placeIdsFor(term, places) {
        const needle = normalizeTerm(term);
        if (!needle) return [];

        const ids = [];
        (places || []).forEach(function (place) {
            if (!place || place.id === undefined || place.id === null) return;
            if (normalizeTerm(place.name).indexOf(needle) === -1) return;

            const id = String(place.id);
            if (ids.indexOf(id) === -1) ids.push(id);
        });

        return ids;
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

        // Cada tipo e um formulario
        formFor: formFor,
        fieldFor: fieldFor,
        needsTitle: needsTitle,
        metaKeysFor: metaKeysFor,
        normalizeMetadata: normalizeMetadata,
        primaryActionFor: primaryActionFor,
        ctaKeyFor: ctaKeyFor,
        successKeyFor: successKeyFor,

        // Procurar
        normalizeTerm: normalizeTerm,
        placeIdsFor: placeIdsFor,

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
