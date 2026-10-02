// ============================================================
// Heritage Hunt CV — Descobertas (interface)
//
// O QUE ESTA ABA E: o que a comunidade aprendeu sobre estes
// lugares, escrito para durar.
//
// A DIFERENCA PARA AS CONVERSAS esta em cada decisao de desenho:
// um cartao tem titulo, tipo e autor em destaque; um balao de
// chat nao tem nada disso. Uma publicacao e para ser encontrada
// semanas depois; uma mensagem e para ser lida agora.
//
// E, como no chat: nenhuma string visivel nasce aqui, e nenhum
// caminho leva a `xp.js` — publicar nao da XP (pontos 34 e 35).
// ============================================================

const PostsUI = (function () {
    'use strict';

    let dom = null;
    let deps = null;

    // --- Feed ---------------------------------------------------
    let posts = [];
    let highlights = [];
    let activeKind = null;      // null = Todas
    let query = '';
    let hasMore = false;
    let loading = false;
    let feedRequest = 0;        // invalida paginas de um filtro ja trocado
    let signedPhotos = {};      // path -> url assinado

    // --- Publicacao aberta --------------------------------------
    let current = null;
    let comments = [];
    let commentsHasMore = false;
    let replyTo = null;
    let viewerIndex = null;     // null = visor fechado

    // --- Rascunho -----------------------------------------------
    let draft = null;
    let fieldNodes = {};        // id do campo -> no desenhado
    let photoStrip = null;      // a tira de miniaturas do campo de fotos
    let previewHost = null;     // onde vive a pre-visualizacao
    let offlineNote = null;     // o aviso "precisas de ligacao"

    function t(key, vars) {
        return deps && typeof deps.t === 'function' ? deps.t(key, vars) : key;
    }

    // ==========================================================
    // Arranque
    // ==========================================================

    function init(options) {
        deps = options || {};

        dom = {
            search:      document.getElementById('feedSearch'),
            chips:       document.getElementById('feedChips'),
            high:        document.getElementById('feedHighlights'),
            rail:        document.getElementById('feedHighlightsRail'),
            list:        document.getElementById('feedList'),
            more:        document.getElementById('feedMore'),
            moreBtn:     document.getElementById('feedMoreBtn'),
            fab:         document.getElementById('feedNewBtn'),

            post:        document.getElementById('postScreen'),
            postBack:    document.getElementById('postBackBtn'),
            postMenu:    document.getElementById('postMenuBtn'),
            postScroll:  document.getElementById('postScroll'),
            postHero:    document.getElementById('postHero'),
            postKind:    document.getElementById('postKind'),
            postPlace:   document.getElementById('postPlace'),
            postTitle:   document.getElementById('postTitle'),
            postText:    document.getElementById('postText'),
            postAuthor:  document.getElementById('postAuthor'),
            postActions: document.getElementById('postActions'),
            cmTitle:     document.getElementById('postCommentsTitle'),
            cmList:      document.getElementById('postCommentsList'),
            cmMore:      document.getElementById('postCommentsMore'),
            cmMoreBtn:   document.getElementById('postCommentsMoreBtn'),
            cmForm:      document.getElementById('postCommentForm'),
            cmInput:     document.getElementById('postCommentInput'),
            cmSend:      document.getElementById('postCommentSend'),
            replyBar:    document.getElementById('postReplyBar'),
            replyAuthor: document.getElementById('postReplyAuthor'),
            replyCancel: document.getElementById('postReplyCancel'),

            compose:     document.getElementById('composeScreen'),
            cpHeading:   document.getElementById('composeHeading'),
            cpBack:      document.getElementById('composeBackBtn'),
            cpStepType:  document.getElementById('composeStepType'),
            cpStepForm:  document.getElementById('composeStepForm'),
            cpKinds:     document.getElementById('composeKinds'),
            cpChosen:    document.getElementById('composeChosen'),
            cpChange:    document.getElementById('composeChangeType'),
            cpFields:    document.getElementById('composeFields'),
            cpPublish:   document.getElementById('composePublish'),
            cpInput:     document.getElementById('composePhotoInput'),

            viewer:      document.getElementById('postViewer'),
            viewerImg:   document.getElementById('postViewerImg'),
            viewerCount: document.getElementById('postViewerCount'),
            viewerClose: document.getElementById('postViewerClose'),
            viewerPrev:  document.getElementById('postViewerPrev'),
            viewerNext:  document.getElementById('postViewerNext'),

            sheet:       document.getElementById('postSheet'),
            sheetBody:   document.getElementById('postSheetBody')
        };

        if (!dom.list) return;

        offlineNote = document.getElementById('composeOffline');

        renderChips();
        renderComposeKinds();
        bindEvents();
    }

    function bindEvents() {
        // Procurar espera que a pessoa pare de escrever: uma ida ao
        // servidor por tecla seria uma ida por tecla desperdicada.
        let searchTimer = null;
        dom.search.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                query = dom.search.value;
                load();
            }, 300);
        });

        dom.moreBtn.addEventListener('click', loadMore);
        dom.fab.addEventListener('click', function () { openComposer(); });

        dom.postBack.addEventListener('click', closePost);
        dom.postMenu.addEventListener('click', openPostMenu);
        dom.cmMoreBtn.addEventListener('click', loadMoreComments);
        dom.replyCancel.addEventListener('click', clearReply);

        dom.cmForm.addEventListener('submit', function (event) {
            event.preventDefault();
            sendComment();
        });
        dom.cmInput.addEventListener('input', function () {
            dom.cmInput.style.height = 'auto';
            dom.cmInput.style.height = Math.min(dom.cmInput.scrollHeight, 120) + 'px';
            dom.cmSend.disabled = !Posts.validateComment(dom.cmInput.value).ok || !navigator.onLine;
        });

        // Sem isto, encher o composer offline deixava "Publicar"
        // cinzento mesmo depois de a ligacao voltar — ate se
        // escrever mais uma letra. O chat ja ouve estes eventos
        // pela mesma razao.
        window.addEventListener('online', onConnectivityChange);
        window.addEventListener('offline', onConnectivityChange);

        dom.cpBack.addEventListener('click', closeComposer);
        dom.cpChange.addEventListener('click', askToChangeKind);
        dom.cpInput.addEventListener('change', function (e) { onPhotosChosen(e.target.files); });
        dom.cpPublish.addEventListener('click', publish);

        // Tocar fora fecha. Isto ja ca estava, mas nunca chegava a
        // correr: o fundo tinha `pointer-events: none`, por isso o
        // toque atravessava-o. O CSS passou a deixar passar nesta
        // folha, e agora o fecho funciona mesmo.
        dom.sheet.addEventListener('click', function (event) {
            if (event.target === dom.sheet) closeSheet();
        });

        // E arrastar para baixo, que e o gesto que a pega promete.
        Sheets.enableDrag(dom.sheet, closeSheet);

        // --- Visualizador da fotografia -------------------------
        dom.viewerClose.addEventListener('click', closeViewer);
        dom.viewerPrev.addEventListener('click', function () { stepViewer(-1); });
        dom.viewerNext.addEventListener('click', function () { stepViewer(1); });
        dom.viewer.addEventListener('click', function (event) {
            if (event.target === dom.viewer) closeViewer();
        });

        // Deslizar, como no album: dois pontos e uma subtraccao.
        let touchX = null;
        dom.viewer.addEventListener('touchstart', function (event) {
            touchX = event.changedTouches[0].clientX;
        }, { passive: true });

        dom.viewer.addEventListener('touchend', function (event) {
            if (touchX === null) return;
            const delta = event.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(delta) < 48) return;
            stepViewer(delta < 0 ? 1 : -1);
        }, { passive: true });

        document.addEventListener('keydown', function (event) {
            // O visor esta por cima de tudo o resto, por isso e o
            // primeiro a responder ao Escape e o unico a querer as
            // setas.
            if (isViewerOpen()) {
                if (event.key === 'Escape') closeViewer();
                else if (event.key === 'ArrowLeft') stepViewer(-1);
                else if (event.key === 'ArrowRight') stepViewer(1);
                return;
            }

            if (event.key !== 'Escape') return;
            if (!dom.sheet.classList.contains('hidden')) closeSheet();
            else if (isComposerOpen()) closeComposer();
            else if (isPostOpen()) closePost();
        });
    }

    // ==========================================================
    // Filtros
    // ==========================================================

    function renderChips() {
        dom.chips.innerHTML = '';

        Posts.filterChips().forEach(function (chip) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hh-fd-chip' + (chip.id === activeKind ? ' is-active' : '');
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', chip.id === activeKind ? 'true' : 'false');
            btn.innerHTML = '<i class="fas ' + chip.icon + '" aria-hidden="true"></i>';
            btn.appendChild(document.createTextNode(labelForKind(chip.id)));

            btn.addEventListener('click', function () {
                activeKind = chip.id;
                renderChips();
                load();
            });

            dom.chips.appendChild(btn);
        });
    }

    // O rotulo de um tipo vive no i18n, com a chave derivada do id:
    // 'tip' -> 'postTip'. Assim acrescentar um tipo e acrescentar
    // uma entrada em `Posts.CONFIG.KINDS` e tres traducoes — nunca
    // um `switch` espalhado por tres ficheiros.
    function labelForKind(id) {
        if (!id) return t('feedAll');
        return t('post' + id.charAt(0).toUpperCase() + id.slice(1));
    }

    function hintForKind(id) {
        return t('post' + id.charAt(0).toUpperCase() + id.slice(1) + 'Hint');
    }

    // ==========================================================
    // O feed
    // ==========================================================

    // A pesquisa promete "publicacoes, lugares, pessoas". As
    // pessoas o servidor sabe procurar sozinho — os nomes estao em
    // `profiles`. Os lugares nao: a tabela `monuments` so guarda
    // ids, porque os nomes sao conteudo traduzido e vivem aqui.
    // Entao e aqui que o termo escrito se resolve em ids, e a
    // consulta recebe-os ja prontos.
    function placeIdsForQuery() {
        const term = query.trim();
        if (!term) return [];

        const places = [];

        (deps.monuments() || []).forEach(function (monument) {
            places.push({ id: monument.id, name: deps.monumentName(monument.id) });
        });

        (deps.zones() || []).forEach(function (zone) {
            places.push({ id: zone.id, name: deps.zoneName(zone.id) });
        });

        // A cidade e a ilha respondem pela MESMA coluna
        // (`island_id`): procurar "Mindelo" tem de trazer tudo o
        // que se passa na ilha, incluindo as publicacoes que nao
        // marcaram lugar nenhum.
        if (typeof deps.islandId === 'function') {
            const island = deps.islandId();
            places.push({ id: island, name: deps.cityName() });
            if (typeof deps.islandName === 'function') {
                places.push({ id: island, name: deps.islandName() });
            }
        }

        return Posts.placeIdsFor(term, places);
    }

    async function load() {
        if (!dom.list) return;

        // Cada carregamento tem numero. Trocar de filtro ou escrever
        // na pesquisa enquanto um "Ver mais" esta no ar passava a
        // pagina antiga pelo `mergePosts` da lista nova — e
        // apareciam publicacoes de outros tipos debaixo do filtro.
        const mine = ++feedRequest;

        loading = true;
        const result = await deps.cloud.listPosts({
            kind: activeKind,
            query: query.trim() || null,
            placeIds: placeIdsForQuery(),
            limit: Posts.CONFIG.PAGE_SIZE
        });
        loading = false;

        if (mine !== feedRequest) return;

        if (!result.ok) {
            renderError();
            return;
        }

        posts = Posts.mergePosts([], result.posts || []);
        hasMore = result.hasMore === true;

        await signPhotos(posts);
        renderFeed();
        loadHighlights();
    }

    // Os destaques so fazem sentido sem filtro: com um filtro
    // activo, o que esta em cima da lista ja e uma seleccao.
    async function loadHighlights() {
        if (activeKind || query.trim()) {
            highlights = [];
            dom.high.classList.add('hidden');
            return;
        }

        const result = await deps.cloud.listHighlights(5);
        highlights = result.ok ? (result.highlights || []) : [];

        await signPhotos(highlights);
        renderHighlights();
    }

    async function loadMore() {
        if (loading || !hasMore) return;

        const mine = feedRequest;

        loading = true;
        dom.moreBtn.textContent = t('feedLoading');

        try {
            const result = await deps.cloud.listPosts({
                kind: activeKind,
                query: query.trim() || null,
                placeIds: placeIdsForQuery(),
                before: Posts.oldestAt(posts),
                limit: Posts.CONFIG.PAGE_SIZE
            });

            // Um `load()` novo entretanto: esta pagina e do filtro
            // antigo e nao entra na lista.
            if (mine !== feedRequest) return;

            if (result.ok) {
                posts = Posts.mergePosts(posts, result.posts || []);
                hasMore = result.hasMore === true;
                await signPhotos(posts);
                if (mine !== feedRequest) return;
                renderFeed();
            }
        } finally {
            dom.moreBtn.textContent = t('feedLoadMore');
            loading = false;
        }
    }

    async function signPhotos(rows) {
        const paths = [];
        (rows || []).forEach(function (p) {
            (p.photos || []).forEach(function (path) {
                if (path && !signedPhotos[path] && paths.indexOf(path) === -1) paths.push(path);
            });
        });
        if (!paths.length) return;

        const urls = await deps.cloud.signPostUrls(paths);
        Object.keys(urls).forEach(function (k) { signedPhotos[k] = urls[k]; });
    }

    function renderFeed() {
        dom.list.innerHTML = '';
        dom.more.classList.toggle('hidden', !hasMore);

        if (!posts.length) {
            dom.list.appendChild(emptyState());
            return;
        }

        posts.forEach(function (post) {
            dom.list.appendChild(postCard(post));
        });
    }

    function renderError() {
        dom.list.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'hh-cv-empty';
        p.textContent = navigator.onLine ? t('feedError') : t('chatOffline');
        dom.list.appendChild(p);
    }

    function emptyState() {
        const box = document.createElement('div');
        box.className = 'hh-fd-empty';

        const title = document.createElement('p');
        title.className = 'hh-fd-empty-title';
        title.textContent = query.trim() ? t('feedNoResults', { q: query.trim() }) : t('feedEmpty');
        box.appendChild(title);

        if (!query.trim()) {
            const sub = document.createElement('p');
            sub.className = 'hh-fd-empty-sub';
            sub.textContent = t('feedEmptySub');
            box.appendChild(sub);

            const action = document.createElement('button');
            action.type = 'button';
            action.className = 'hh-chat-empty-btn';
            action.textContent = t('feedNew');
            action.addEventListener('click', function () { openComposer(); });
            box.appendChild(action);
        }

        return box;
    }

    function renderHighlights() {
        dom.rail.innerHTML = '';
        dom.high.classList.toggle('hidden', !highlights.length);

        highlights.forEach(function (post) {
            dom.rail.appendChild(highlightCard(post));
        });
    }

    // O cartao grande do carrossel: fotografia em fundo, tipo em
    // etiqueta, lugar e titulo por cima.
    // A CAPA DO DESTAQUE
    //
    // Neste carrossel a imagem E o cartao: sem ela sobra o
    // degrade, e o que a pessoa ve em maior destaque passa a ser
    // o avatar do autor no rodape — como se o destaque fosse a
    // pessoa e nao a publicacao.
    //
    // Uma dica escrita nao tem fotografia e nem por isso deixa de
    // merecer destaque. Por isso a capa cai para a fotografia do
    // monumento de que a publicacao fala: continua a ser o LUGAR,
    // que e o que este cartao anuncia.
    function coverFor(post) {
        const photo = (post.photos || [])[0];
        if (photo && signedPhotos[photo]) return signedPhotos[photo];

        if (post.monumentId && typeof deps.monumentImage === 'function') {
            return deps.monumentImage(post.monumentId) || null;
        }
        return null;
    }

    function highlightCard(post) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'hh-fd-hl';

        const url = coverFor(post);
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.loading = 'lazy';
            card.appendChild(img);
        } else {
            // Nem publicacao nem monumento com imagem: o cartao
            // assume-se, em vez de parecer uma fotografia que nao
            // carregou.
            card.classList.add('is-coverless');
        }

        const shade = document.createElement('span');
        shade.className = 'hh-fd-hl-shade';
        card.appendChild(shade);

        const body = document.createElement('span');
        body.className = 'hh-fd-hl-body';

        body.appendChild(kindBadge(post.kind, true));

        const place = document.createElement('span');
        place.className = 'hh-fd-hl-place';
        place.textContent = placeLabelFor(post);
        body.appendChild(place);

        const title = document.createElement('span');
        title.className = 'hh-fd-hl-title';
        title.textContent = post.title;
        body.appendChild(title);

        const foot = document.createElement('span');
        foot.className = 'hh-fd-hl-foot';
        foot.appendChild(avatarFor(post.author));

        const name = document.createElement('span');
        name.className = 'hh-fd-hl-name';
        name.textContent = post.author ? post.author.name : '';
        foot.appendChild(name);

        const score = document.createElement('span');
        score.className = 'hh-fd-hl-score';
        score.innerHTML = '<i class="far fa-lightbulb" aria-hidden="true"></i> ' + (post.helpful || 0);
        foot.appendChild(score);

        body.appendChild(foot);
        card.appendChild(body);

        card.addEventListener('click', function () { openPost(post.id); });
        return card;
    }

    // ==========================================================
    // OS CARTOES — UM POR TIPO
    //
    // O cabecalho (autor, tipo, lugar, quando, seguir, menu) e o
    // mesmo em todos: e a moldura. O que muda e o que vai dentro
    // dela e qual e a accao que fica a frente.
    // ==========================================================

    // Uma fotografia pode vir do servidor (caminho assinado) ou
    // do rascunho que ainda nao subiu (blob local, na pre-
    // visualizacao). O cartao nao tem de saber a diferenca.
    function photoUrl(ref) {
        if (!ref) return null;
        if (signedPhotos[ref]) return signedPhotos[ref];
        return /^(blob:|data:|https?:)/.test(ref) ? ref : null;
    }

    function cardPhotos(post) {
        return (post.photos || []).map(photoUrl).filter(Boolean);
    }

    function photoGrid(urls, className) {
        const grid = document.createElement('div');
        grid.className = className || ('hh-fd-card-photos n' + Math.min(urls.length, 4));
        urls.slice(0, 4).forEach(function (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.loading = 'lazy';
            grid.appendChild(img);
        });
        return grid;
    }

    function cardText(post, className) {
        const text = document.createElement('p');
        text.className = className || 'hh-fd-card-text';
        text.textContent = (post.body || '') + (post.truncated ? '…' : '');
        return text;
    }

    function cardTitle(post) {
        const title = document.createElement('p');
        title.className = 'hh-fd-card-title';
        title.textContent = post.title || '';
        return title;
    }

    // As publicacoes escritas ANTES desta mudanca tem todas
    // titulo — era obrigatorio para os seis tipos. Os tipos que
    // agora nao tem titulo nao o pedem a quem escreve, mas
    // tambem nao podem deixar de mostrar o que ja la esta: seria
    // esconder conteudo que alguem escreveu.
    function legacyTitle(open, post) {
        if (post.title) open.insertBefore(cardTitle(post), open.firstChild);
    }

    // DICA — o texto e a materia. Sem titulo (nao tem), com a
    // dica em destaque e a fotografia, se houver, pequena.
    function cardBodyTip(open, post) {
        open.appendChild(cardText(post, 'hh-fd-card-lead'));
        legacyTitle(open, post);
        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls));
    }

    // FOTOGRAFIA — a imagem manda. Vem primeiro, grande, e a
    // legenda vem depois, pequena.
    function cardBodyPhoto(open, post) {
        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls, 'hh-fd-card-photos is-hero n' + Math.min(urls.length, 4)));
        if (post.body) open.appendChild(cardText(post, 'hh-fd-card-caption'));
        legacyTitle(open, post);
    }

    // CURIOSIDADE — editorial. "Sabias que..." a abrir, e a fonte
    // a fechar, se quem escreveu a deu.
    function cardBodyCuriosity(open, post) {
        const lead = document.createElement('p');
        lead.className = 'hh-fd-card-kicker';
        lead.textContent = t('cardCuriosityLead');
        open.appendChild(lead);
        legacyTitle(open, post);

        open.appendChild(cardText(post, 'hh-fd-card-lead'));

        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls));

        const source = (post.metadata || {}).source;
        if (source) {
            const cite = document.createElement('p');
            cite.className = 'hh-fd-card-source';
            cite.textContent = t('cardCuriositySource', { source: source });
            open.appendChild(cite);
        }
    }

    // TRILHO — quem le quer saber se consegue fazer: de onde a
    // onde, quanto tempo, que dificuldade. Tudo isso antes de
    // abrir.
    function cardBodyTrail(open, post) {
        const meta = post.metadata || {};
        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls.slice(0, 1), 'hh-fd-card-photos is-cover n1'));

        open.appendChild(cardTitle(post));

        if (meta.start && meta.end) {
            const route = document.createElement('p');
            route.className = 'hh-fd-card-route';
            route.textContent = t('cardTrailRoute', { start: meta.start, end: meta.end });
            open.appendChild(route);
        }

        const stats = [];
        if (meta.distance) stats.push({ icon: 'fa-route', text: meta.distance });
        if (meta.duration) stats.push({ icon: 'fa-clock', text: meta.duration });
        if (meta.difficulty) {
            stats.push({
                icon: 'fa-mountain',
                text: t('trailLevel' + meta.difficulty.charAt(0).toUpperCase() + meta.difficulty.slice(1))
            });
        }

        if (stats.length) {
            const row = document.createElement('div');
            row.className = 'hh-fd-card-stats';
            stats.forEach(function (stat) {
                const item = document.createElement('span');
                item.className = 'hh-fd-card-stat';
                item.innerHTML = '<i class="fas ' + stat.icon + '" aria-hidden="true"></i>';
                item.appendChild(document.createTextNode(stat.text));
                row.appendChild(item);
            });
            open.appendChild(row);

            // Ponto 12: estes numeros nao sao medidos por ninguem.
            // Dizer de quem sao e a diferenca entre informar e
            // inventar.
            const by = document.createElement('p');
            by.className = 'hh-fd-card-byauthor';
            by.textContent = t('cardTrailByAuthor');
            open.appendChild(by);
        }

        if (post.body) open.appendChild(cardText(post));
    }

    // LUGAR — a fotografia convida, o nome identifica, o texto
    // justifica e as etiquetas dizem para quem e.
    function cardBodyPlace(open, post) {
        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls.slice(0, 1), 'hh-fd-card-photos is-cover n1'));

        open.appendChild(cardTitle(post));
        if (post.body) open.appendChild(cardText(post));

        const tags = (post.metadata || {}).tags || [];
        if (tags.length) {
            const row = document.createElement('div');
            row.className = 'hh-fd-card-tags';
            tags.forEach(function (tag) {
                const chip = document.createElement('span');
                chip.className = 'hh-fd-card-tag';
                chip.textContent = t('tagPlace' + tag.charAt(0).toUpperCase() + tag.slice(1));
                row.appendChild(chip);
            });
            open.appendChild(row);
        }
    }

    // PERGUNTA — a pergunta e tudo, e o que interessa a seguir e
    // se ja foi respondida.
    function cardBodyQuestion(open, post) {
        const ask = document.createElement('p');
        ask.className = 'hh-fd-card-question';
        ask.textContent = (post.body || '') + (post.truncated ? '…' : '');
        open.appendChild(ask);
        legacyTitle(open, post);

        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls));

        const n = post.comments || 0;
        const count = document.createElement('p');
        count.className = 'hh-fd-card-answers';
        count.textContent = n === 0 ? t('cardQuestionNone')
            : (n === 1 ? t('cardQuestionAnswerOne') : t('cardQuestionAnswers', { n: n }));
        open.appendChild(count);
    }

    function cardBodyDefault(open, post) {
        if (post.title) open.appendChild(cardTitle(post));
        if (post.body) open.appendChild(cardText(post));
        const urls = cardPhotos(post);
        if (urls.length) open.appendChild(photoGrid(urls));
    }

    const CARD_BODIES = {
        tip: cardBodyTip,
        photo: cardBodyPhoto,
        curiosity: cardBodyCuriosity,
        trail: cardBodyTrail,
        place: cardBodyPlace,
        question: cardBodyQuestion
    };

    function postCard(post) {
        const card = document.createElement('article');
        card.className = 'hh-fd-card is-' + post.kind;

        // --- cabecalho: autor, tipo, lugar, quando ---
        const head = document.createElement('div');
        head.className = 'hh-fd-card-head';
        head.appendChild(avatarFor(post.author));

        const meta = document.createElement('div');
        meta.className = 'hh-fd-card-meta';

        const line = document.createElement('div');
        line.className = 'hh-fd-card-line';
        line.appendChild(kindBadge(post.kind, false));

        const place = document.createElement('span');
        place.className = 'hh-fd-card-place';
        place.textContent = placeLabelFor(post);
        line.appendChild(place);
        meta.appendChild(line);

        const when = document.createElement('span');
        when.className = 'hh-fd-card-when';
        when.textContent = deps.relativeTime(post.createdAt);
        meta.appendChild(when);

        head.appendChild(meta);

        const menu = document.createElement('button');
        menu.type = 'button';
        menu.className = 'hh-fd-card-menu';
        // Neutro de proposito: o que este botao abre depende de quem
        // escreveu a publicacao — "Denunciar" nas dos outros,
        // "Apagar" nas nossas (ver `openPostMenu`). Prometer uma
        // delas no rotulo enganava metade das vezes.
        menu.setAttribute('aria-label', t('postOptions'));
        menu.innerHTML = '<i class="fas fa-ellipsis-h" aria-hidden="true"></i>';
        menu.addEventListener('click', function (e) { e.stopPropagation(); openPostMenu(null, post); });

        // Ponto 5: um botao por cartao, antes do menu, pequeno.
        // Nao vai nos comentarios do cartao nem na barra de
        // reaccoes — ali a materia e a publicacao, nao a pessoa.
        //
        // Na pre-visualizacao nao entra nenhum dos dois: ninguem
        // se segue a si proprio nem denuncia o que ainda nao
        // publicou.
        if (!post.preview) {
            const follow = FollowsUI.button(post.author, { size: 'sm', variant: 'quiet' });
            if (follow) head.appendChild(follow);
            head.appendChild(menu);
        }

        card.appendChild(head);

        // --- corpo: cada tipo mostra o que importa nele ---
        //
        // Nao basta mudar o formulario (ponto 28). Uma fotografia
        // com a imagem pequena debaixo de um titulo nao e uma
        // fotografia; um trilho sem partida, destino e duracao
        // obriga a abrir para saber se vale a pena.
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'hh-fd-card-open';

        (CARD_BODIES[post.kind] || cardBodyDefault)(open, post);

        if (!post.preview) {
            open.addEventListener('click', function () { openPost(post.id); });
        }
        card.appendChild(open);

        if (!post.preview) card.appendChild(cardActions(post));
        return card;
    }

    // O interior de um botao da barra: o icone e o numero.
    //
    // A PALAVRA NAO VEM, E NAO E POR SER UM ECRA PEQUENO — E
    // ARITMETICA. A app inteira vive num contentor travado em 448px
    // (`max-w-md`), por isso esta barra nunca passa de 414px. Com
    // os quatro nomes por extenso mais os contadores, o conteudo
    // pede 441px: nao cabe na largura maxima da app, quanto mais
    // num telemovel de 390. Escrever os nomes era garantir que o
    // "Guardar" aparecia cortado em todos os aparelhos.
    //
    // Fica o que muda — o numero. O nome vai no `aria-label` do
    // botao (ver `actLabel`), que e o que um leitor de ecra
    // anuncia, e o icone mantem os 44px de alvo tactil.
    function actInner(icon, count) {
        return '<i class="' + icon + '" aria-hidden="true"></i>' +
            (count ? '<span class="hh-fd-act-n">' + count + '</span>' : '');
    }

    // O nome por extenso para quem nao ve o botao.
    function actLabel(label, count) {
        return count ? label + ' ' + count : label;
    }

    // ----------------------------------------------------------
    // A ACCAO DE CADA TIPO (ponto 62)
    //
    // Uma dica pergunta "ajudou?". Um lugar pede para ser
    // guardado. Uma pergunta pede resposta. Um trilho pede para
    // ser visto inteiro.
    //
    // As reaccoes guardadas continuam a ser duas — o que muda e
    // qual delas fica a frente, com rotulo e peso, e quais ficam
    // na barra discreta por baixo.
    // ----------------------------------------------------------
    function cardActions(post) {
        const wrap = document.createElement('div');
        wrap.className = 'hh-fd-actions';

        const action = Posts.primaryActionFor(post.kind);
        const primary = primaryButton(post, action);
        if (primary) wrap.appendChild(primary);

        wrap.appendChild(reactionBar(post, false, action.primary));
        return wrap;
    }

    function primaryButton(post, action) {
        // Nas reaccoes o destaque e dado DENTRO da barra (o botao
        // cresce e ganha rotulo), para nao haver dois sitios a
        // dizer a mesma coisa.
        if (action.primary === 'helpful' || action.primary === 'interesting') return null;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hh-fd-primary';

        const icons = { open: 'fa-person-walking', save: 'fa-bookmark', comment: 'fa-reply' };
        const saved = action.primary === 'save' && post.saved;

        btn.innerHTML = '<i class="fas ' + icons[action.primary] + '" aria-hidden="true"></i>';
        btn.appendChild(document.createTextNode(
            t(saved ? 'cardPlaceSaved' : action.cta)
        ));
        if (saved) btn.classList.add('is-on');

        btn.addEventListener('click', async function (event) {
            event.stopPropagation();

            if (action.primary === 'open') { openPost(post.id); return; }
            if (action.primary === 'comment') { openPost(post.id); return; }

            // Guardar: resposta imediata, servidor a confirmar.
            const next = Posts.toggleSaved(post);
            applyPostUpdate(next, false);

            const result = await deps.cloud.setPostSaved(post.id, next.saved);
            if (!result.ok) applyPostUpdate(post, false);
        });

        return btn;
    }

    // As duas reaccoes do desenho, mais comentar e guardar.
    // `emphasis` diz qual delas e a accao principal DESTE tipo:
    // essa fica com o nome escrito, as outras ficam so com o
    // icone.
    function reactionBar(post, full, emphasis) {
        const bar = document.createElement('div');
        bar.className = 'hh-fd-bar';

        bar.appendChild(reactionButton(post, 'helpful', 'fa-thumbs-up', t('postHelpful'),
            emphasis === 'helpful'));
        bar.appendChild(reactionButton(post, 'interesting', 'fa-lightbulb', t('postInteresting'),
            emphasis === 'interesting'));

        const comment = document.createElement('button');
        comment.type = 'button';
        comment.className = 'hh-fd-act';
        comment.setAttribute('aria-label', actLabel(t('postComment'), post.comments));
        comment.innerHTML = actInner('far fa-comment', post.comments);
        comment.addEventListener('click', function () {
            if (full) dom.cmInput.focus();
            else openPost(post.id);
        });
        bar.appendChild(comment);

        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'hh-fd-act' + (post.saved ? ' is-on' : '');
        save.setAttribute('aria-pressed', post.saved ? 'true' : 'false');
        save.setAttribute('aria-label', t(post.saved ? 'postSaved' : 'postSave'));
        save.innerHTML = actInner((post.saved ? 'fas' : 'far') + ' fa-bookmark', 0);
        save.addEventListener('click', async function () {
            const next = Posts.toggleSaved(post);
            applyPostUpdate(next, full);

            const result = await deps.cloud.setPostSaved(post.id, next.saved);
            if (!result.ok) applyPostUpdate(post, full);   // o servidor recusou: volta atras
        });
        bar.appendChild(save);

        return bar;
    }

    function reactionButton(post, reaction, icon, label, emphasised) {
        const mineKey = reaction === 'helpful' ? 'myHelpful' : 'myInteresting';
        const countKey = reaction === 'helpful' ? 'helpful' : 'interesting';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hh-fd-act' + (post[mineKey] ? ' is-on' : '') +
            (emphasised ? ' is-lead' : '');
        btn.setAttribute('aria-pressed', post[mineKey] ? 'true' : 'false');
        btn.setAttribute('aria-label', actLabel(label, post[countKey]));
        btn.innerHTML = actInner((post[mineKey] ? 'fas' : 'far') + ' ' + icon, post[countKey]);

        // A accao principal deste tipo e a unica que se escreve
        // por extenso. Cabe, porque e uma so.
        if (emphasised) {
            const word = document.createElement('span');
            word.className = 'hh-fd-act-lead';
            word.textContent = label;
            btn.insertBefore(word, btn.querySelector('.hh-fd-act-n'));
        }

        btn.addEventListener('click', async function () {
            // Resposta imediata; o servidor confirma a seguir e, se
            // recusar, o estado anterior volta.
            const optimistic = Posts.toggleReaction(post, reaction);
            const wasFull = current && String(current.id) === String(post.id);
            applyPostUpdate(optimistic, wasFull);

            const result = await deps.cloud.setPostReaction(post.id, reaction, optimistic[mineKey]);
            applyPostUpdate(result.ok && result.post ? result.post : post, wasFull);
        });

        return btn;
    }

    // Uma publicacao pode estar no feed, nos destaques e aberta ao
    // mesmo tempo. Reagir tem de a actualizar nos tres sitios.
    // PONTO 40 — corrigir as copias que este modulo guarda.
    //
    // O feed, os destaques, a publicacao aberta e os comentarios
    // tem todos autores em memoria. Sem isto, seguir alguem no
    // perfil e voltar ao feed mostrava "Seguir" outra vez no
    // proximo redesenho.
    function applyAuthorUpdate(author) {
        if (!author || !author.userId) return;

        function patch(rows) {
            return (Array.isArray(rows) ? rows : []).map(function (row) {
                if (!row || !row.author || row.author.userId !== author.userId) return row;
                return Object.assign({}, row, { author: Object.assign({}, row.author, author) });
            });
        }

        posts = patch(posts);
        highlights = patch(highlights);
        comments = patch(comments);

        if (current && current.author && current.author.userId === author.userId) {
            current = Object.assign({}, current, {
                author: Object.assign({}, current.author, author)
            });
        }

        // Nao se redesenha nada: os botoes ja foram actualizados
        // pelo FollowsUI, e redesenhar o feed inteiro roubava o
        // scroll a quem estava a ler.
    }

    function applyPostUpdate(updated, full) {
        // Do ecra de detalhe vem o corpo INTEIRO — `get_post`
        // devolve tudo, enquanto a lista traz so os primeiros 280
        // caracteres (migration 004). Escrever esse corpo no cartao
        // do feed esticava-o para o texto todo, sem reticencias. O
        // cartao fica com o corpo que ja tinha; o que sobe sao os
        // contadores.
        function ontoList(rows) {
            return (Array.isArray(rows) ? rows : []).map(function (p) {
                if (!p || String(p.id) !== String(updated.id)) return p;

                const merged = Object.assign({}, p, updated);
                if (full) {
                    merged.body = p.body;
                    merged.truncated = p.truncated;
                }
                return merged;
            });
        }

        posts = ontoList(posts);
        highlights = ontoList(highlights);

        if (current && String(current.id) === String(updated.id)) {
            current = Object.assign({}, current, updated);
            if (full) renderPostActions();
        }

        renderFeed();
        renderHighlights();
    }

    function kindBadge(kind, large) {
        const info = Posts.kindInfo(kind);
        const badge = document.createElement('span');
        badge.className = 'hh-fd-badge' + (large ? ' is-large' : '') +
            (info ? ' hh-fd-badge--' + info.accent : '');
        badge.innerHTML = info ? '<i class="fas ' + info.icon + '" aria-hidden="true"></i>' : '';
        badge.appendChild(document.createTextNode(labelForKind(kind)));
        return badge;
    }

    function placeLabelFor(post) {
        if (post.monumentId) {
            const name = deps.monumentName(post.monumentId);
            return name ? name + ' · ' + deps.cityName() : deps.cityName();
        }
        if (post.zoneId) return deps.zoneName(post.zoneId) + ' · ' + deps.cityName();
        return deps.placeLabel();
    }

    function avatarFor(author) {
        const wrap = document.createElement('span');
        wrap.className = 'hh-chat-avatar';

        const url = author && author.avatarPath ? deps.avatarUrl(author.avatarPath) : null;
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.addEventListener('error', function () {
                img.remove();
                wrap.textContent = initialOf(author);
            });
            wrap.appendChild(img);
        } else {
            wrap.textContent = initialOf(author);
        }
        return wrap;
    }

    function initialOf(author) {
        const name = (author && author.name) || '';
        return name.trim() ? name.trim()[0].toUpperCase() : '?';
    }

    // ==========================================================
    // Uma publicacao
    // ==========================================================

    async function openPost(id) {
        const result = await deps.cloud.getPost(id);
        if (!result.ok) {
            deps.toast(t('feedError'));
            return;
        }

        current = result.post;
        comments = [];
        commentsHasMore = false;
        clearReply();

        await signPhotos([current]);
        renderPost();

        dom.post.classList.remove('hidden');
        document.body.classList.add('hh-chat-open');
        dom.postScroll.scrollTop = 0;

        loadComments();
    }

    function renderPost() {
        const post = current;

        // Hero: a primeira fotografia, quando ha. Sem fotografia o
        // cabecalho encolhe em vez de deixar um rectangulo vazio.
        const photos = (post.photos || []).filter(function (p) { return signedPhotos[p]; });
        const url = photos.length ? signedPhotos[photos[0]] : null;
        dom.postHero.classList.toggle('hidden', !url);
        dom.postHero.innerHTML = '';

        if (url) {
            // Um botao, nao uma imagem solta: abrir em ecra inteiro
            // e uma accao, e quem navega por teclado ou leitor de
            // ecra tem de lhe chegar como a qualquer outra.
            const open = document.createElement('button');
            open.type = 'button';
            open.className = 'hh-post-hero-open';
            open.setAttribute('aria-label', t('postPhotoOpen'));

            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            open.appendChild(img);

            // Com mais do que uma, o cabecalho tem de DIZER que ha
            // mais — senao as outras continuam a existir sem que
            // ninguem saiba.
            if (photos.length > 1) {
                const badge = document.createElement('span');
                badge.className = 'hh-post-hero-count';
                badge.setAttribute('aria-hidden', 'true');
                badge.innerHTML = '<i class="fas fa-images"></i>' + photos.length;
                open.appendChild(badge);
            }

            open.addEventListener('click', function () { openViewer(0); });
            dom.postHero.appendChild(open);
        }

        dom.post.classList.toggle('has-hero', !!url);

        dom.postKind.replaceWith(kindBadgeInto(dom.postKind, post.kind));
        dom.postPlace.textContent = placeLabelFor(post);
        dom.postTitle.textContent = post.title;
        dom.postText.textContent = post.body || '';
        dom.postText.classList.toggle('hidden', !post.body);

        renderAuthorRow(post);
        renderPostActions();
    }

    // Substitui o no mantendo o id, para as referencias em `dom`
    // continuarem validas depois de redesenhar.
    function kindBadgeInto(node, kind) {
        const badge = kindBadge(kind, false);
        badge.id = node.id;
        dom.postKind = badge;
        return badge;
    }

    function renderAuthorRow(post) {
        dom.postAuthor.innerHTML = '';

        const row = document.createElement('div');
        row.className = 'hh-post-author-row';
        row.appendChild(avatarFor(post.author));

        const text = document.createElement('div');
        const name = document.createElement('p');
        name.className = 'hh-post-author-name';
        name.textContent = post.author ? post.author.name : '';
        text.appendChild(name);

        const meta = document.createElement('p');
        meta.className = 'hh-post-author-meta';
        meta.textContent = t('postExplorer') + ' · ' + t('chatLevel', { n: deps.levelFor(post.author && post.author.xpTotal) });

        if (post.author && post.author.discovered === true) {
            const seal = document.createElement('span');
            seal.className = 'hh-chat-seal';
            seal.innerHTML = ' <i class="fas fa-check" aria-hidden="true"></i> ' + t('chatDiscovered');
            meta.appendChild(seal);
        }
        text.appendChild(meta);
        row.appendChild(text);

        // Na publicacao ABERTA o botao cresce e vai a margem.
        //
        // No feed e discreto de proposito (ponto 46): ali a materia
        // e a dica, e sao muitos cartoes. Aqui ja se escolheu ler
        // ESTA dica — se ela ajudou, seguir quem a escreveu e a
        // accao seguinte natural, e tem de se alcancar com o
        // polegar sem procurar.
        const follow = FollowsUI.button(post.author, { size: 'md', variant: 'quiet' });
        if (follow) row.appendChild(follow);

        dom.postAuthor.appendChild(row);
    }

    function renderPostActions() {
        dom.postActions.innerHTML = '';
        dom.postActions.appendChild(
            reactionBar(current, true, Posts.primaryActionFor(current.kind).primary)
        );
    }

    function closePost() {
        closeViewer();
        dom.post.classList.add('hidden');
        document.body.classList.remove('hh-chat-open');
        current = null;
        comments = [];
        closeSheet();
    }

    function isPostOpen() {
        return !!dom && !dom.post.classList.contains('hidden');
    }

    // ==========================================================
    // A fotografia em ecra inteiro
    //
    // O cabecalho da publicacao mostra a PRIMEIRA fotografia e mais
    // nenhuma — e um cabecalho, nao uma galeria. Mas as outras
    // existem, e ate aqui nao havia maneira nenhuma de lhes chegar.
    // E aqui que elas aparecem.
    //
    // Sem biblioteca, como no album: uma imagem, um contador, duas
    // setas e um gesto.
    // ==========================================================

    // So entram as que ja tem URL assinado. Uma fotografia por
    // assinar nao e um quadrado vazio no meio da sequencia — e
    // simplesmente ainda nao esta la.
    function viewerPhotos() {
        if (!current) return [];
        return (current.photos || []).filter(function (path) { return signedPhotos[path]; });
    }

    function openViewer(index) {
        const photos = viewerPhotos();
        if (!photos.length) return;

        viewerIndex = Math.max(0, Math.min(index || 0, photos.length - 1));
        dom.viewer.classList.remove('hidden');
        dom.viewer.setAttribute('aria-hidden', 'false');
        renderViewer();
        dom.viewerClose.focus();
    }

    function closeViewer() {
        if (!dom || !dom.viewer) return;

        viewerIndex = null;
        dom.viewer.classList.add('hidden');
        dom.viewer.setAttribute('aria-hidden', 'true');
        // A publicacao continua aberta por tras e e ela que manda no
        // scroll do corpo: nao se desbloqueia nada aqui.
    }

    function isViewerOpen() {
        return !!dom && !!dom.viewer && !dom.viewer.classList.contains('hidden');
    }

    function renderViewer() {
        const photos = viewerPhotos();
        if (viewerIndex === null) return;

        const path = photos[viewerIndex];
        if (!path) { closeViewer(); return; }

        dom.viewerImg.src = signedPhotos[path];
        dom.viewerImg.alt = current ? current.title : '';

        dom.viewerCount.textContent = t('album.photoOf', {
            n: viewerIndex + 1,
            total: photos.length
        });

        const many = photos.length > 1;
        dom.viewerPrev.hidden = !many;
        dom.viewerNext.hidden = !many;
    }

    function stepViewer(delta) {
        const photos = viewerPhotos();
        if (viewerIndex === null || !photos.length) return;

        viewerIndex = (viewerIndex + delta + photos.length) % photos.length;
        renderViewer();
    }

    function openPostMenu(event, post) {
        const target = post || current;
        if (!target) return;

        const options = [];

        if (target.mine) {
            options.push({
                icon: 'fa-trash', label: t('postDelete'), danger: true,
                action: async function () {
                    const result = await deps.cloud.deletePost(target.id);
                    if (!result.ok) return;
                    posts = Posts.removePost(posts, target.id);
                    highlights = Posts.removePost(highlights, target.id);
                    renderFeed();
                    renderHighlights();
                    if (current && String(current.id) === String(target.id)) closePost();
                    deps.toast(t('postDeleted'));
                }
            });
        } else {
            options.push({
                icon: 'fa-flag', label: t('postReport'), danger: true,
                action: function () { openReportSheet(target); }
            });
        }

        openSheet(options);
    }

    function openReportSheet(post) {
        const reasons = [
            ['qr_location', 'chatReportQr'],
            ['incorrect', 'chatReportIncorrect'],
            ['spam', 'chatReportSpam'],
            ['harassment', 'chatReportHarassment'],
            ['other', 'chatReportOther']
        ];

        openSheet(reasons.map(function (pair) {
            return {
                icon: 'fa-flag',
                label: t(pair[1]),
                action: async function () {
                    await deps.cloud.reportPost(post.id, pair[0]);
                    deps.toast(t('chatReportThanks'));
                }
            };
        }), t('chatReportLead'));
    }

    // ==========================================================
    // Comentarios
    // ==========================================================

    async function loadComments() {
        const result = await deps.cloud.listComments(current.id, {
            limit: Posts.CONFIG.COMMENT_PAGE_SIZE
        });
        if (!result.ok) return;

        comments = Posts.mergeComments([], result.comments || []);
        commentsHasMore = result.hasMore === true;
        renderComments();
    }

    async function loadMoreComments() {
        if (!current || !commentsHasMore) return;

        const result = await deps.cloud.listComments(current.id, {
            before: Posts.oldestCommentAt(comments),
            limit: Posts.CONFIG.COMMENT_PAGE_SIZE
        });
        if (!result.ok) return;

        comments = Posts.mergeComments(comments, result.comments || []);
        commentsHasMore = result.hasMore === true;
        renderComments();
    }

    function renderComments() {
        dom.cmTitle.textContent = t('postComments', { n: comments.length });
        dom.cmMore.classList.toggle('hidden', !commentsHasMore);
        dom.cmList.innerHTML = '';

        if (!comments.length) {
            const none = document.createElement('p');
            none.className = 'hh-cv-empty';
            none.textContent = t('postCommentsNone');
            dom.cmList.appendChild(none);
            return;
        }

        comments.forEach(function (comment) {
            dom.cmList.appendChild(commentRow(comment));
        });
    }

    function commentRow(comment) {
        const row = document.createElement('div');
        row.className = 'hh-post-comment';
        row.appendChild(avatarFor(comment.author));

        const body = document.createElement('div');
        body.className = 'hh-post-comment-body';

        const head = document.createElement('div');
        head.className = 'hh-post-comment-head';

        const name = document.createElement('span');
        name.className = 'hh-post-comment-name';
        name.textContent = comment.author ? comment.author.name : '';
        head.appendChild(name);

        const when = document.createElement('span');
        when.className = 'hh-post-comment-when';
        when.textContent = deps.relativeTime(comment.createdAt);
        head.appendChild(when);
        body.appendChild(head);

        if (comment.replyTo) {
            const quote = document.createElement('p');
            quote.className = 'hh-post-comment-reply';
            quote.textContent = t('postReplyingTo', { name: comment.replyTo.author || '' });
            body.appendChild(quote);
        }

        const text = document.createElement('p');
        text.className = 'hh-post-comment-text' + (comment.deleted ? ' is-deleted' : '');
        text.textContent = comment.deleted ? t('postCommentDeleted') : comment.body;
        body.appendChild(text);

        if (!comment.deleted) {
            const actions = document.createElement('div');
            actions.className = 'hh-post-comment-actions';

            const reply = document.createElement('button');
            reply.type = 'button';
            reply.className = 'hh-post-comment-act';
            reply.innerHTML = '<i class="fas fa-reply" aria-hidden="true"></i> ' + t('postReply');
            reply.addEventListener('click', function () { startReply(comment); });
            actions.appendChild(reply);

            const helpful = document.createElement('button');
            helpful.type = 'button';
            helpful.className = 'hh-post-comment-act' + (comment.myHelpful ? ' is-on' : '');
            helpful.setAttribute('aria-pressed', comment.myHelpful ? 'true' : 'false');
            helpful.innerHTML = '<i class="' + (comment.myHelpful ? 'fas' : 'far') +
                ' fa-thumbs-up" aria-hidden="true"></i> ' + (comment.helpful || 0);
            helpful.addEventListener('click', async function () {
                const next = Posts.toggleCommentHelpful(comment);
                comments = Posts.replaceComment(comments, next);
                renderComments();

                const result = await deps.cloud.setCommentHelpful(comment.id, next.myHelpful);
                if (!result.ok) {
                    comments = Posts.replaceComment(comments, comment);
                    renderComments();
                }
            });
            actions.appendChild(helpful);

            if (comment.mine) {
                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'hh-post-comment-act is-danger';
                del.textContent = t('chatDelete');
                del.addEventListener('click', async function () {
                    const result = await deps.cloud.deleteComment(comment.id);
                    if (result.ok) {
                        comments = Posts.replaceComment(comments,
                            Object.assign({}, comment, { deleted: true, body: '' }));
                        renderComments();
                    }
                });
                actions.appendChild(del);
            }

            body.appendChild(actions);
        }

        row.appendChild(body);
        return row;
    }

    function startReply(comment) {
        replyTo = comment;
        dom.replyAuthor.textContent = t('postReplyingTo', {
            name: comment.author ? comment.author.name : ''
        });
        dom.replyBar.classList.remove('hidden');
        dom.cmInput.focus();
    }

    function clearReply() {
        replyTo = null;
        if (dom.replyBar) dom.replyBar.classList.add('hidden');
    }

    async function sendComment() {
        if (!current) return;

        const checked = Posts.validateComment(dom.cmInput.value);
        if (!checked.ok) return;

        dom.cmSend.disabled = true;
        const result = await deps.cloud.addComment(current.id, checked.body, replyTo ? replyTo.id : null);

        if (!result.ok) {
            deps.toast(result.reason === 'rate_limited' ? t('chatRateLimited') : t('chatLoadError'));
            dom.cmSend.disabled = false;
            return;
        }

        comments = Posts.mergeComments(comments, [result.comment]);
        current.comments = (current.comments || 0) + 1;

        dom.cmInput.value = '';
        dom.cmInput.style.height = 'auto';
        clearReply();
        renderComments();
        renderPostActions();
        applyPostUpdate(current, false);
    }

    // ==========================================================
    // Criar uma publicacao
    // ==========================================================

    function renderComposeKinds() {
        dom.cpKinds.innerHTML = '';

        Posts.CONFIG.KINDS.forEach(function (kind) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hh-compose-kind hh-fd-badge--' + kind.accent;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', 'false');
            btn.dataset.kind = kind.id;

            btn.innerHTML =
                '<i class="fas ' + kind.icon + '" aria-hidden="true"></i>' +
                '<b>' + escapeHtml(labelForKind(kind.id)) + '</b>' +
                '<small>' + escapeHtml(hintForKind(kind.id)) + '</small>';

            btn.addEventListener('click', function () { chooseKind(kind.id); });

            dom.cpKinds.appendChild(btn);
        });
    }

    // ==========================================================
    // O COMPOSITOR, EM DOIS PASSOS
    //
    // 1. escolher o que se quer partilhar;
    // 2. o formulario DESSE tipo — e so dele.
    //
    // O passo 2 e desenhado a partir de `Posts.formFor(kind)`.
    // Nao ha aqui nenhum `if (kind === 'trail')`: ha um
    // desenhador por TIPO DE CAMPO, e os campos vem da lista.
    // ==========================================================

    function chooseKind(kind) {
        draft.kind = kind;
        draft.metadata = draft.metadata || {};

        Array.prototype.forEach.call(dom.cpKinds.children, function (btn) {
            const on = btn.dataset.kind === kind;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-checked', on ? 'true' : 'false');
        });

        showFormStep();
    }

    function showFormStep() {
        const info = Posts.CONFIG.KINDS.find(function (k) { return k.id === draft.kind; });

        dom.cpStepType.classList.add('hidden');
        dom.cpStepForm.classList.remove('hidden');
        dom.cpHeading.textContent = t('composeHeadingKind', { kind: labelForKind(draft.kind) });

        dom.cpChosen.className = 'hh-compose-chosen-tag hh-fd-badge--' + (info ? info.accent : 'gold');
        dom.cpChosen.innerHTML = '<i class="fas ' + (info ? info.icon : '') + '" aria-hidden="true"></i>';
        dom.cpChosen.appendChild(document.createTextNode(labelForKind(draft.kind)));

        renderFields();

        // Entrada suave — e nenhuma para quem pediu menos
        // movimento (o CSS trata do `prefers-reduced-motion`).
        dom.cpStepForm.classList.remove('is-in');
        void dom.cpStepForm.offsetWidth;
        dom.cpStepForm.classList.add('is-in');
    }

    function showTypeStep() {
        // Voltar ao passo 1 e voltar a nao ter escolhido nada: o
        // botao de publicar desaparece com o formulario. O que ja
        // foi escrito FICA no rascunho — escolher outra vez o
        // mesmo tipo devolve tudo onde estava.
        draft.kind = null;
        Array.prototype.forEach.call(dom.cpKinds.children, function (btn) {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-checked', 'false');
        });

        dom.cpStepForm.classList.add('hidden');
        dom.cpStepType.classList.remove('hidden');
        dom.cpHeading.textContent = t('composeTitle');
        onDraftChange();
    }

    // Ponto 37: trocar de tipo depois de escrever nao pode deitar
    // fora o que se escreveu sem avisar. Se o rascunho esta vazio
    // nao ha nada a perder e nao se pergunta nada.
    function askToChangeKind() {
        if (!draftHasContent()) { showTypeStep(); return; }

        openSheet([
            { icon: 'fa-rotate', label: t('composeChangeTypeGo'), action: showTypeStep },
            { icon: 'fa-pen', label: t('composeChangeTypeStay'), action: function () {} }
        ], t('composeChangeTypeWarn'));
    }

    function draftHasContent() {
        if (!draft) return false;
        if (String(draft.title || '').trim()) return true;
        if (String(draft.body || '').trim()) return true;
        if ((draft.photos || []).length) return true;
        if (draft.monumentId || draft.zoneId) return true;
        return Object.keys(draft.metadata || {}).some(function (k) {
            const v = draft.metadata[k];
            return Array.isArray(v) ? v.length > 0 : !!v;
        });
    }

    function openComposer(prefill) {
        draft = Object.assign({
            kind: null, title: '', body: '',
            monumentId: null, zoneId: null, photos: [], metadata: {}
        }, prefill || {});

        dom.cpFields.innerHTML = '';
        Array.prototype.forEach.call(dom.cpKinds.children, function (btn) {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-checked', 'false');
        });

        if (draft.kind) chooseKind(draft.kind);
        else showTypeStep();

        dom.compose.classList.remove('hidden');
        document.body.classList.add('hh-chat-open');
    }

    function closeComposer() {
        // Libertar as pre-visualizacoes: sem isto, cada rascunho
        // abandonado deixava blobs presos na memoria do separador.
        (draft && draft.photos ? draft.photos : []).forEach(function (photo) {
            if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
        });

        draft = null;
        dom.compose.classList.add('hidden');
        document.body.classList.remove('hh-chat-open');
        closeSheet();
    }

    function isComposerOpen() {
        return !!dom && !dom.compose.classList.contains('hidden');
    }

    function onConnectivityChange() {
        if (draft) onDraftChange();
        if (dom.cmSend) {
            dom.cmSend.disabled = !Posts.validateComment(dom.cmInput.value).ok || !navigator.onLine;
        }
    }

    // ----------------------------------------------------------
    // Desenhar o formulario do tipo escolhido
    //
    // Um desenhador por TIPO DE CAMPO (sete), nao um por tipo de
    // publicacao (seis). Um setimo tipo de publicacao nao traz
    // codigo novo nenhum — traz uma entrada em `KIND_FORMS`.
    // ----------------------------------------------------------

    const FIELD_RENDERERS = {
        place:    renderPlaceField,
        text:     renderTextField,
        textarea: renderTextareaField,
        photos:   renderPhotosField,
        chips:    renderChipsField,
        choice:   renderChoiceField,
        notice:   renderNoticeField
    };

    // Onde um campo le e escreve no rascunho.
    function readField(id) {
        if (id === 'title') return draft.title || '';
        if (id === 'body') return draft.body || '';
        if (id.indexOf('meta:') === 0) return (draft.metadata || {})[id.slice(5)] || '';
        return null;
    }

    function writeField(id, value) {
        if (id === 'title') draft.title = value;
        else if (id === 'body') draft.body = value;
        else if (id.indexOf('meta:') === 0) {
            draft.metadata = draft.metadata || {};
            draft.metadata[id.slice(5)] = value;
        }
        onDraftChange();
    }

    function fieldId(field) {
        return 'cpField_' + field.id.replace(':', '_');
    }

    function maxFor(field) {
        if (field.max === 'TITLE') return Posts.CONFIG.TITLE_MAX;
        if (field.max === 'BODY') return Posts.CONFIG.BODY_MAX;
        return field.max || null;
    }

    // O rotulo, com "obrigatório" so onde e mesmo obrigatorio.
    function labelFor(field) {
        const label = document.createElement('label');
        label.className = 'hh-compose-label';
        label.setAttribute('for', fieldId(field));
        label.textContent = t(field.label);

        if (field.required) {
            const req = document.createElement('span');
            req.className = 'hh-compose-req';
            req.textContent = t('composeRequired');
            label.appendChild(req);
        }
        return label;
    }

    function renderFields() {
        dom.cpFields.innerHTML = '';
        fieldNodes = {};

        Posts.formFor(draft.kind).forEach(function (field) {
            const render = FIELD_RENDERERS[field.type];
            if (!render) return;

            // Ponto 17: o aviso do QR so existe quando ha um QR
            // para estragar — ou seja, quando a dica ficou
            // amarrada a um monumento. Numa dica sobre a ilha era
            // ruido, e ruido repetido deixa de se ler.
            if (field.when === 'monument' && !draft.monumentId) return;

            const node = render(field);
            if (!node) return;

            node.classList.add('hh-compose-field');
            if (field.half) node.classList.add('is-half');
            fieldNodes[field.id] = node;
            dom.cpFields.appendChild(node);
        });

        renderPreview();
        onDraftChange();
    }

    function renderTextField(field) {
        const wrap = document.createElement('div');
        wrap.appendChild(labelFor(field));

        const input = document.createElement('input');
        input.type = 'text';
        input.id = fieldId(field);
        input.className = 'hh-compose-input';
        input.value = readField(field.id);
        if (field.placeholder) input.placeholder = t(field.placeholder);
        const max = maxFor(field);
        if (max) input.maxLength = max;

        input.addEventListener('input', function () { writeField(field.id, input.value); });
        wrap.appendChild(input);
        return wrap;
    }

    function renderTextareaField(field) {
        const wrap = document.createElement('div');
        wrap.appendChild(labelFor(field));

        const area = document.createElement('textarea');
        area.id = fieldId(field);
        area.className = 'hh-compose-textarea';
        area.rows = field.rows || 4;
        area.value = readField(field.id);
        if (field.placeholder) area.placeholder = t(field.placeholder);
        const max = maxFor(field);
        if (max) area.maxLength = max;

        const count = document.createElement('span');
        count.className = 'hh-compose-count hidden';

        area.addEventListener('input', function () {
            writeField(field.id, area.value);

            // O contador so aparece quando ja interessa: mostra-lo
            // desde o primeiro caracter e meter pressa a quem
            // escreve.
            const left = max - area.value.length;
            count.classList.toggle('hidden', left > 200);
            count.textContent = t('chatCharsLeft', { n: left });
        });

        wrap.appendChild(area);
        wrap.appendChild(count);
        return wrap;
    }

    function renderPlaceField(field) {
        const wrap = document.createElement('div');
        wrap.appendChild(labelFor(field));

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = fieldId(field);
        btn.className = 'hh-compose-input hh-compose-place';
        btn.innerHTML = '<i class="fas fa-location-dot" aria-hidden="true"></i>';

        const text = document.createElement('span');
        text.textContent = placeFieldLabel();
        btn.appendChild(text);

        btn.addEventListener('click', function () {
            openPlacePicker(function () {
                text.textContent = placeFieldLabel();
                onDraftChange();
            });
        });

        wrap.appendChild(btn);
        return wrap;
    }

    function placeFieldLabel() {
        if (draft.monumentId) return deps.monumentName(draft.monumentId);
        if (draft.zoneId) return deps.zoneName(draft.zoneId);
        return t('composeLocationPlaceholder');
    }

    function renderPhotosField(field) {
        const wrap = document.createElement('div');
        if (!field.hero) wrap.appendChild(labelFor(field));

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = fieldId(field);
        // Na fotografia e no lugar a imagem e o assunto: o botao
        // ocupa o lugar que ela vai ocupar.
        btn.className = 'hh-compose-photos' + (field.hero ? ' is-hero' : '');

        // Sem rotulo por cima (`hero`), o botao diz o nome do campo
        // — "Fotografia", "Foto de capa". Com rotulo por cima, diz
        // so a accao, senao a mesma palavra aparecia duas vezes
        // seguidas.
        const word = draft.photos.length ? 'composePhotoMore'
            : (field.hero ? field.label : 'composePhotoAdd');

        btn.innerHTML =
            '<i class="far fa-images" aria-hidden="true"></i>' +
            '<span><b>' + escapeHtml(t(word)) + '</b></span>';
        btn.addEventListener('click', function () { dom.cpInput.click(); });
        wrap.appendChild(btn);

        const strip = document.createElement('div');
        strip.className = 'hh-compose-strip';
        strip.classList.toggle('hidden', !draft.photos.length);
        wrap.appendChild(strip);
        photoStrip = strip;
        renderPhotoStrip();

        return wrap;
    }

    function renderChipsField(field) {
        const wrap = document.createElement('div');
        wrap.appendChild(labelFor(field));

        const row = document.createElement('div');
        row.className = 'hh-compose-chips';
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', t(field.label));

        field.options.forEach(function (option) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'hh-compose-chip';
            chip.textContent = t(field.optionPrefix + option.charAt(0).toUpperCase() + option.slice(1));

            const sync = function () {
                const on = (readField(field.id) || []).indexOf(option) !== -1;
                chip.classList.toggle('is-on', on);
                chip.setAttribute('aria-pressed', on ? 'true' : 'false');
            };

            chip.addEventListener('click', function () {
                const current = (readField(field.id) || []).slice();
                const at = current.indexOf(option);

                if (at !== -1) current.splice(at, 1);
                else if (current.length < (field.max || 4)) current.push(option);
                else return;   // o tecto e silencioso: o chip so nao liga

                writeField(field.id, current);
                Array.prototype.forEach.call(row.children, function (c) { c.__sync && c.__sync(); });
            });

            chip.__sync = sync;
            sync();
            row.appendChild(chip);
        });

        wrap.appendChild(row);
        return wrap;
    }

    function renderChoiceField(field) {
        const wrap = document.createElement('div');
        wrap.appendChild(labelFor(field));

        const row = document.createElement('div');
        row.className = 'hh-compose-choice';
        row.setAttribute('role', 'radiogroup');
        row.setAttribute('aria-label', t(field.label));

        field.options.forEach(function (option) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hh-compose-chip';
            btn.setAttribute('role', 'radio');
            btn.textContent = t(field.optionPrefix + option.charAt(0).toUpperCase() + option.slice(1));

            const sync = function () {
                const on = readField(field.id) === option;
                btn.classList.toggle('is-on', on);
                btn.setAttribute('aria-checked', on ? 'true' : 'false');
            };

            btn.addEventListener('click', function () {
                // Voltar a tocar na escolha feita desmarca-a: a
                // dificuldade e opcional, e nao havia outra forma
                // de voltar atras.
                writeField(field.id, readField(field.id) === option ? '' : option);
                Array.prototype.forEach.call(row.children, function (c) { c.__sync && c.__sync(); });
            });

            btn.__sync = sync;
            sync();
            row.appendChild(btn);
        });

        wrap.appendChild(row);
        return wrap;
    }

    function renderNoticeField(field) {
        const wrap = document.createElement('div');
        wrap.className = 'hh-compose-notice is-' + (field.tone || 'quiet');
        wrap.setAttribute('role', 'note');

        wrap.innerHTML = '<i class="fas ' +
            (field.tone === 'gold' ? 'fa-shield-halved' : 'fa-circle-info') +
            '" aria-hidden="true"></i>';

        const body = document.createElement('div');
        if (field.title) {
            const strong = document.createElement('p');
            strong.className = 'hh-compose-notice-title';
            strong.textContent = t(field.title);
            body.appendChild(strong);
        }
        const text = document.createElement('p');
        text.className = 'hh-compose-notice-text';
        text.textContent = t(field.text);
        body.appendChild(text);
        wrap.appendChild(body);

        return wrap;
    }

    // Ponto 27: ver antes de publicar, onde faz diferenca — uma
    // fotografia, um lugar ou um trilho sao conteudo visual, e o
    // que se vai ver nao e obvio a partir dos campos.
    function renderPreview() {
        const kind = draft.kind;
        if (['photo', 'place', 'trail'].indexOf(kind) === -1) return;

        const wrap = document.createElement('div');
        wrap.className = 'hh-compose-field hh-compose-preview';

        const label = document.createElement('p');
        label.className = 'hh-compose-label';
        label.textContent = t('composePreview');
        wrap.appendChild(label);

        const host = document.createElement('div');
        host.className = 'hh-compose-preview-host';
        wrap.appendChild(host);

        previewHost = host;
        dom.cpFields.appendChild(wrap);
        syncPreview();
    }

    function syncPreview() {
        if (!previewHost || !draft) return;

        // O MESMO cartao do feed, com o rascunho a fazer de
        // publicacao. Um preview desenhado a parte seria um
        // segundo desenho para manter — e o que se veria aqui
        // deixaria de ser o que aparece la.
        previewHost.innerHTML = '';
        previewHost.appendChild(postCard({
            id: '__preview__',
            kind: draft.kind,
            title: draft.title,
            body: draft.body,
            metadata: Posts.normalizeMetadata(draft.kind, draft.metadata),
            monumentId: draft.monumentId,
            zoneId: draft.zoneId,
            photos: draft.photos.map(function (p) { return p.previewUrl; }),
            author: deps.me ? deps.me() : null,
            helpful: 0, interesting: 0, comments: 0,
            createdAt: new Date().toISOString(),
            preview: true
        }));
    }

    function onDraftChange() {
        if (!draft) return;

        const checked = Posts.validateDraft(draft);

        // O botao diz o que vai fazer: "Partilhar dica", "Publicar
        // trilho", "Perguntar à comunidade" (ponto 19).
        dom.cpPublish.querySelector('span').textContent =
            t(draft.kind ? Posts.ctaKeyFor(draft.kind) : 'composePublish');

        dom.cpPublish.disabled = !checked.ok || !navigator.onLine;
        dom.cpPublish.classList.toggle('hidden', !draft.kind);

        // Ponto 42: dizer porque e que o botao esta desligado.
        const offline = !navigator.onLine;
        if (offlineNote) offlineNote.classList.toggle('hidden', !offline);

        syncPreview();
    }

    async function onPhotosChosen(files) {
        if (!draft || !files || !files.length) return;

        const room = Posts.CONFIG.MAX_PHOTOS - draft.photos.length;
        if (room <= 0) {
            deps.toast(t('composeTooManyPhotos', { n: Posts.CONFIG.MAX_PHOTOS }));
            return;
        }

        const chosen = Array.prototype.slice.call(files, 0, room);
        for (let i = 0; i < chosen.length; i++) {
            const compressed = await deps.compressImage(chosen[i]);
            if (!compressed || !compressed.blob) continue;

            draft.photos.push({
                blob: compressed.blob,
                previewUrl: URL.createObjectURL(compressed.blob),
                extension: compressed.extension,
                contentType: compressed.contentType
            });
        }

        dom.cpInput.value = '';
        // Redesenha o formulario: o botao passa a dizer "Adicionar
        // outra" e a pre-visualizacao ganha a imagem.
        renderFields();
    }

    function renderPhotoStrip() {
        if (!photoStrip) return;
        photoStrip.innerHTML = '';
        photoStrip.classList.toggle('hidden', !draft.photos.length);

        draft.photos.forEach(function (photo, index) {
            const cell = document.createElement('div');
            cell.className = 'hh-compose-thumb';

            const img = document.createElement('img');
            img.src = photo.previewUrl;
            img.alt = '';
            cell.appendChild(img);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'hh-chat-icon-btn';
            remove.setAttribute('aria-label', t('chatCancel'));
            remove.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            remove.addEventListener('click', function () {
                URL.revokeObjectURL(photo.previewUrl);
                draft.photos.splice(index, 1);
                renderFields();
            });
            cell.appendChild(remove);

            photoStrip.appendChild(cell);
        });
    }

    // Associar a publicacao a um lugar que a app ja conhece — e o
    // que permite "Ver no mapa" levar a algum lado.
    // "Geral" (sem lugar) e a primeira opcao e nao a ultima: numa
    // pergunta e a escolha mais comum, e numa dica e uma escolha
    // legitima. Nada e associado sozinho — o lugar so entra na
    // publicacao quando a pessoa o escolhe (pontos 15 e 43).
    function openPlacePicker(onPicked) {
        const pick = function (monumentId, zoneId) {
            return function () {
                draft.monumentId = monumentId;
                draft.zoneId = zoneId;
                if (onPicked) onPicked();
                // O aviso do QR aparece e desaparece com o lugar.
                renderFields();
            };
        };

        const options = [{
            icon: 'fa-ban',
            label: t('composeLocationNone'),
            action: pick(null, null)
        }];

        deps.zones().forEach(function (zone) {
            options.push({
                icon: 'fa-location-dot',
                label: deps.zoneName(zone.id),
                action: pick(null, zone.id)
            });
        });

        deps.monuments().forEach(function (monument) {
            options.push({
                icon: 'fa-landmark',
                label: monument.name,
                action: pick(String(monument.id), null)
            });
        });

        openSheet(options, t('composeLocation'));
    }

    // Ponto 39: validar, desligar o botao, subir as imagens,
    // persistir, confirmar — e so depois voltar a Comunidade. Em
    // nenhum momento a publicacao aparece como feita antes de
    // existir no servidor.
    //
    // Ponto 41: se falhar, O FORMULARIO FICA. Perder o que se
    // escreveu por causa de uma rede fraca e a pior maneira de
    // perder um contributo.
    async function publish() {
        const checked = Posts.validateDraft(draft);
        if (!checked.ok) {
            pointAtMissingField(checked.reason);
            return;
        }

        dom.cpPublish.disabled = true;
        const label = dom.cpPublish.querySelector('span');

        // As fotografias sobem primeiro. Se alguma falhar, nada e
        // publicado — melhor do que uma publicacao a que falta
        // metade do que a pessoa escolheu.
        const uploaded = [];
        for (let i = 0; i < draft.photos.length; i++) {
            label.textContent = t('composeUploading', { n: i + 1, total: draft.photos.length });

            const photo = draft.photos[i];
            const path = deps.cloud.postPhotoPath(photo.extension);
            const result = await deps.cloud.uploadPostImage(path, photo.blob, photo.contentType);

            if (!result.ok) { failPublish(); return; }
            uploaded.push({ path: path });
        }

        label.textContent = t('composePublishing');

        const result = await deps.cloud.createPost({
            kind: checked.kind,
            title: checked.title,
            body: checked.body,
            monumentId: checked.monumentId,
            zoneId: checked.zoneId,
            photos: uploaded,
            metadata: checked.metadata
        });

        if (!result.ok) {
            failPublish(result.reason === 'rate_limited' ? t('composeRateLimited') : null);
            return;
        }

        const kind = checked.kind;

        // Antes de fechar: o composer e reaproveitado, e sem isto
        // o botao ficava a dizer "A publicar..." em todas as
        // publicacoes seguintes da sessao.
        resetPublishButton();

        closeComposer();
        await load();

        // "Dica partilhada.", "Trilho publicado." — curto, e do
        // tipo certo (ponto 40).
        deps.toast(t(Posts.successKeyFor(kind)));
        openPost(result.post.id);
    }

    function failPublish(message) {
        deps.toast(message || t('composeFailed'));
        resetPublishButton();
        // O botao passa a dizer "Tentar novamente" ate se mexer
        // outra vez no formulario.
        dom.cpPublish.querySelector('span').textContent = t('composeRetry');
        dom.cpPublish.disabled = !navigator.onLine;
    }

    // Em vez de "invalido": leva ao campo que falta e poe-lhe o
    // foco. `validateDraft` devolve o id do campo precisamente
    // para isto ser possivel.
    function pointAtMissingField(reason) {
        if (reason === 'kind') { deps.toast(t('composeNeedKind')); return; }

        const node = fieldNodes[reason];
        if (!node) { deps.toast(t('composeFailed')); return; }

        node.classList.add('is-missing');
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });

        const input = node.querySelector('input, textarea, button');
        if (input) input.focus({ preventScroll: true });

        setTimeout(function () { node.classList.remove('is-missing'); }, 1600);
    }

    function resetPublishButton() {
        if (draft) onDraftChange();
        else dom.cpPublish.querySelector('span').textContent = t('composePublish');
    }

    // ==========================================================
    // Folha partilhada
    // ==========================================================

    function openSheet(options, lead) {
        dom.sheetBody.innerHTML = '';

        if (lead) {
            const p = document.createElement('p');
            p.className = 'hh-chat-sheet-lead';
            p.textContent = lead;
            dom.sheetBody.appendChild(p);
        }

        options.forEach(function (option) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hh-chat-sheet-item' + (option.danger ? ' is-danger' : '');
            btn.innerHTML = '<i class="fas ' + option.icon + '" aria-hidden="true"></i>';
            btn.appendChild(document.createTextNode(option.label));
            btn.addEventListener('click', function () {
                closeSheet();
                option.action();
            });
            dom.sheetBody.appendChild(btn);
        });

        dom.sheet.classList.remove('hidden');
        requestAnimationFrame(function () { dom.sheet.classList.add('is-open'); });
    }

    function closeSheet() {
        if (!dom.sheet) return;
        dom.sheet.classList.remove('is-open');
        dom.sheet.classList.add('hidden');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // O botao de criar so pertence a aba Descobertas.
    function setFabVisible(visible) {
        if (dom && dom.fab) dom.fab.classList.toggle('hidden', !visible);
    }

    return {
        init: init,
        load: load,
        renderFeed: renderFeed,
        openPost: openPost,
        applyAuthorUpdate: applyAuthorUpdate,
        openComposer: openComposer,
        closePost: closePost,
        closeComposer: closeComposer,
        isPostOpen: isPostOpen,
        isComposerOpen: isComposerOpen,
        setFabVisible: setFabVisible,

        // As Pistas reaproveitam esta folha em vez de trazerem uma
        // terceira igual ao ecra.
        openSheet: openSheet
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PostsUI: PostsUI };
}
