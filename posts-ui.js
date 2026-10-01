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

    // --- Rascunho -----------------------------------------------
    let draft = null;

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
            cpBack:      document.getElementById('composeBackBtn'),
            cpKinds:     document.getElementById('composeKinds'),
            cpTitle:     document.getElementById('composeTitleInput'),
            cpTitleCount: document.getElementById('composeTitleCount'),
            cpBody:      document.getElementById('composeBodyInput'),
            cpBodyCount: document.getElementById('composeBodyCount'),
            cpPhotosBtn: document.getElementById('composePhotosBtn'),
            cpStrip:     document.getElementById('composePhotoStrip'),
            cpPlace:     document.getElementById('composePlace'),
            cpPlaceText: document.getElementById('composePlaceText'),
            cpWarning:   document.getElementById('composeQrWarning'),
            cpPublish:   document.getElementById('composePublish'),
            cpInput:     document.getElementById('composePhotoInput'),

            sheet:       document.getElementById('postSheet'),
            sheetBody:   document.getElementById('postSheetBody')
        };

        if (!dom.list) return;

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
        dom.cpTitle.addEventListener('input', onDraftChange);
        dom.cpBody.addEventListener('input', onDraftChange);
        dom.cpPhotosBtn.addEventListener('click', function () { dom.cpInput.click(); });
        dom.cpInput.addEventListener('change', function (e) { onPhotosChosen(e.target.files); });
        dom.cpPlace.addEventListener('click', openPlacePicker);
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

        document.addEventListener('keydown', function (event) {
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

    function postCard(post) {
        const card = document.createElement('article');
        card.className = 'hh-fd-card';

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
        menu.setAttribute('aria-label', t('postReport'));
        menu.innerHTML = '<i class="fas fa-ellipsis-h" aria-hidden="true"></i>';
        menu.addEventListener('click', function (e) { e.stopPropagation(); openPostMenu(null, post); });

        // Ponto 5: um botao por cartao, antes do menu, pequeno.
        // Nao vai nos comentarios do cartao nem na barra de
        // reaccoes — ali a materia e a publicacao, nao a pessoa.
        const follow = FollowsUI.button(post.author, { size: 'sm', variant: 'quiet' });
        if (follow) head.appendChild(follow);

        head.appendChild(menu);

        card.appendChild(head);

        // --- corpo ---
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'hh-fd-card-open';

        const title = document.createElement('p');
        title.className = 'hh-fd-card-title';
        title.textContent = post.title;
        open.appendChild(title);

        if (post.body) {
            const text = document.createElement('p');
            text.className = 'hh-fd-card-text';
            text.textContent = post.body + (post.truncated ? '…' : '');
            open.appendChild(text);
        }

        const photos = (post.photos || []).filter(function (p) { return signedPhotos[p]; });
        if (photos.length) {
            const grid = document.createElement('div');
            grid.className = 'hh-fd-card-photos n' + Math.min(photos.length, 4);
            photos.slice(0, 4).forEach(function (path) {
                const img = document.createElement('img');
                img.src = signedPhotos[path];
                img.alt = '';
                img.loading = 'lazy';
                grid.appendChild(img);
            });
            open.appendChild(grid);
        }

        open.addEventListener('click', function () { openPost(post.id); });
        card.appendChild(open);

        card.appendChild(reactionBar(post, false));
        return card;
    }

    // As duas reaccoes do desenho, mais comentar e guardar.
    function reactionBar(post, full) {
        const bar = document.createElement('div');
        bar.className = 'hh-fd-bar';

        bar.appendChild(reactionButton(post, 'helpful', 'fa-thumbs-up', t('postHelpful')));
        bar.appendChild(reactionButton(post, 'interesting', 'fa-lightbulb', t('postInteresting')));

        const comment = document.createElement('button');
        comment.type = 'button';
        comment.className = 'hh-fd-act';
        comment.innerHTML = '<i class="far fa-comment" aria-hidden="true"></i><span>' +
            t('postComment') + (post.comments ? ' ' + post.comments : '') + '</span>';
        comment.addEventListener('click', function () {
            if (full) dom.cmInput.focus();
            else openPost(post.id);
        });
        bar.appendChild(comment);

        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'hh-fd-act' + (post.saved ? ' is-on' : '');
        save.setAttribute('aria-pressed', post.saved ? 'true' : 'false');
        save.innerHTML = '<i class="' + (post.saved ? 'fas' : 'far') + ' fa-bookmark" aria-hidden="true"></i><span>' +
            t(post.saved ? 'postSaved' : 'postSave') + '</span>';
        save.addEventListener('click', async function () {
            const next = Posts.toggleSaved(post);
            applyPostUpdate(next, full);

            const result = await deps.cloud.setPostSaved(post.id, next.saved);
            if (!result.ok) applyPostUpdate(post, full);   // o servidor recusou: volta atras
        });
        bar.appendChild(save);

        return bar;
    }

    function reactionButton(post, reaction, icon, label) {
        const mineKey = reaction === 'helpful' ? 'myHelpful' : 'myInteresting';
        const countKey = reaction === 'helpful' ? 'helpful' : 'interesting';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hh-fd-act' + (post[mineKey] ? ' is-on' : '');
        btn.setAttribute('aria-pressed', post[mineKey] ? 'true' : 'false');
        btn.innerHTML = '<i class="' + (post[mineKey] ? 'fas' : 'far') + ' ' + icon + '" aria-hidden="true"></i><span>' +
            label + (post[countKey] ? ' ' + post[countKey] : '') + '</span>';

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
        const photo = (post.photos || [])[0];
        const url = photo ? signedPhotos[photo] : null;
        dom.postHero.classList.toggle('hidden', !url);
        dom.postHero.innerHTML = '';
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            dom.postHero.appendChild(img);
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
        dom.postActions.appendChild(reactionBar(current, true));
    }

    function closePost() {
        dom.post.classList.add('hidden');
        document.body.classList.remove('hh-chat-open');
        current = null;
        comments = [];
        closeSheet();
    }

    function isPostOpen() {
        return !!dom && !dom.post.classList.contains('hidden');
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

            btn.addEventListener('click', function () {
                draft.kind = kind.id;
                syncKindSelection();
                onDraftChange();
            });

            dom.cpKinds.appendChild(btn);
        });
    }

    function syncKindSelection() {
        Array.prototype.forEach.call(dom.cpKinds.children, function (btn) {
            const on = btn.dataset.kind === draft.kind;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-checked', on ? 'true' : 'false');
        });
    }

    function openComposer(prefill) {
        draft = Object.assign({
            kind: null, title: '', body: '',
            monumentId: null, zoneId: null, photos: []
        }, prefill || {});

        dom.cpTitle.value = draft.title;
        dom.cpBody.value = draft.body;
        dom.cpStrip.innerHTML = '';
        dom.cpStrip.classList.add('hidden');
        syncKindSelection();
        syncPlaceLabel();
        onDraftChange();

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

    function onDraftChange() {
        if (!draft) return;

        draft.title = dom.cpTitle.value;
        draft.body = dom.cpBody.value;

        const titleLeft = Posts.remainingTitle(draft.title);
        dom.cpTitleCount.classList.toggle('hidden', titleLeft > 20);
        dom.cpTitleCount.textContent = t('chatCharsLeft', { n: titleLeft });

        const bodyLeft = Posts.remainingBody(draft.body);
        dom.cpBodyCount.classList.toggle('hidden', bodyLeft > 200);
        dom.cpBodyCount.textContent = t('chatCharsLeft', { n: bodyLeft });

        // Ponto 17 do lado de quem escreve.
        dom.cpWarning.classList.toggle('hidden', !Posts.shouldWarnAboutQr(draft));

        dom.cpPublish.disabled = !Posts.validateDraft(draft).ok || !navigator.onLine;
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
        renderPhotoStrip();
        onDraftChange();
    }

    function renderPhotoStrip() {
        dom.cpStrip.innerHTML = '';
        dom.cpStrip.classList.toggle('hidden', !draft.photos.length);

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
                renderPhotoStrip();
                onDraftChange();
            });
            cell.appendChild(remove);

            dom.cpStrip.appendChild(cell);
        });
    }

    // Associar a publicacao a um lugar que a app ja conhece — e o
    // que permite "Ver no mapa" levar a algum lado.
    function openPlacePicker() {
        const options = [{
            icon: 'fa-ban',
            label: t('composeLocationNone'),
            action: function () {
                draft.monumentId = null;
                draft.zoneId = null;
                syncPlaceLabel();
                onDraftChange();
            }
        }];

        deps.zones().forEach(function (zone) {
            options.push({
                icon: 'fa-location-dot',
                label: deps.zoneName(zone.id),
                action: function () {
                    draft.zoneId = zone.id;
                    draft.monumentId = null;
                    syncPlaceLabel();
                    onDraftChange();
                }
            });
        });

        deps.monuments().forEach(function (monument) {
            options.push({
                icon: 'fa-landmark',
                label: monument.name,
                action: function () {
                    draft.monumentId = String(monument.id);
                    draft.zoneId = null;
                    syncPlaceLabel();
                    onDraftChange();
                }
            });
        });

        openSheet(options, t('composeLocation'));
    }

    function syncPlaceLabel() {
        if (draft.monumentId) dom.cpPlaceText.textContent = deps.monumentName(draft.monumentId);
        else if (draft.zoneId) dom.cpPlaceText.textContent = deps.zoneName(draft.zoneId);
        else dom.cpPlaceText.textContent = t('composeLocationPlaceholder');
    }

    async function publish() {
        const checked = Posts.validateDraft(draft);
        if (!checked.ok) {
            deps.toast(t(checked.reason === 'kind' ? 'composeNeedKind' : 'composeNeedTitle'));
            return;
        }

        dom.cpPublish.disabled = true;
        dom.cpPublish.querySelector('span').textContent = t('composePublishing');

        // As fotografias sobem primeiro. Se alguma falhar, nada e
        // publicado — melhor do que uma publicacao a que falta
        // metade do que a pessoa escolheu.
        const uploaded = [];
        for (let i = 0; i < draft.photos.length; i++) {
            const photo = draft.photos[i];
            const path = deps.cloud.postPhotoPath(photo.extension);
            const result = await deps.cloud.uploadPostImage(path, photo.blob, photo.contentType);

            if (!result.ok) {
                deps.toast(t('composeFailed'));
                resetPublishButton();
                return;
            }
            uploaded.push({ path: path });
        }

        const result = await deps.cloud.createPost({
            kind: checked.kind,
            title: checked.title,
            body: checked.body,
            monumentId: checked.monumentId,
            zoneId: checked.zoneId,
            photos: uploaded
        });

        if (!result.ok) {
            deps.toast(result.reason === 'rate_limited' ? t('composeRateLimited') : t('composeFailed'));
            resetPublishButton();
            return;
        }

        // Antes de fechar: o composer e reaproveitado, e sem isto
        // o botao ficava a dizer "A publicar..." em todas as
        // publicacoes seguintes da sessao.
        resetPublishButton();

        closeComposer();
        await load();
        openPost(result.post.id);
    }

    function resetPublishButton() {
        dom.cpPublish.querySelector('span').textContent = t('composePublish');
        onDraftChange();
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
