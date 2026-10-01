// ============================================================
// Heritage Hunt CV — Seguir exploradores (interface)
//
// UM BOTAO, UMA VERDADE
//
// O botao de seguir aparece no feed, na publicacao aberta, nos
// comentarios, nas pistas, no chat e nas listas. Isso sao seis
// sitios a desenhar a mesma coisa — e seis sitios onde o estado
// pode divergir (ponto 40).
//
// Divergem porque cada um guarda a sua copia do autor: o feed tem
// `posts`, a conversa tem `messages`, a lista tem as suas linhas.
// Seguir alguem no feed nao toca nas outras copias, e ao abrir a
// conversa o botao diz "Seguir" sobre quem ja sigo.
//
// A solucao aqui tem duas partes:
//
//   1. UM REGISTO DE VERDADE (`truth`). Sempre que o servidor
//      responde, a verdade sobre aquela pessoa fica guardada. Um
//      botao desenhado a partir de um autor velho consulta o
//      registo primeiro — a copia velha perde.
//
//   2. UM AVISO (`onChange`). Os modulos que guardam listas
//      proprias corrigem-nas quando algo muda, para um
//      redesenho nao trazer o estado antigo de volta.
//
// Nao ha framework para invalidar queries: sao 40 linhas que
// fazem o mesmo trabalho e que se leem de uma vez.
//
// O BOTAO NAO E O PROTAGONISTA
//
// Ponto 46: pequeno, discreto, ao lado do nome. O que tem de
// saltar a vista num cartao e a dica e o lugar, nao quem a
// escreveu — e muito menos um convite a coleccionar gente.
// ============================================================

const FollowsUI = (function () {
    'use strict';

    let deps = null;

    // userId -> { isFollowing, followsYou }
    //
    // So guarda o que o SERVIDOR confirmou. Um valor optimista
    // nunca entra aqui: se entrasse, uma falha de rede deixava a
    // mentira a contaminar todos os outros ecras.
    let truth = {};

    // Botoes vivos, para os actualizar todos de uma vez.
    // userId -> [ { el, author, options } ]
    let mounted = {};

    // A linha "X seguidores · Y a seguir" do perfil aberto. Nao e
    // um botao, mas move-se com ele: seguir alguem e ver o
    // contador ficar parado em 0 faz duvidar se resultou.
    let counters = null;

    let listeners = [];

    // Estado das listas (seguidores / a seguir)
    let listState = {
        userId: null,
        mode: 'followers',
        rows: [],
        hasMore: false,
        loading: false,
        request: 0
    };

    let dom = null;

    function init(options) {
        deps = options || {};

        dom = {
            screen:   document.getElementById('explorersScreen'),
            back:     document.getElementById('explorersBackBtn'),
            title:    document.getElementById('explorersTitle'),
            sub:      document.getElementById('explorersSubtitle'),
            list:     document.getElementById('explorersList'),
            more:     document.getElementById('explorersMore'),
            moreBtn:  document.getElementById('explorersMoreBtn')
        };

        if (dom.back) dom.back.addEventListener('click', closeList);
        if (dom.moreBtn) dom.moreBtn.addEventListener('click', loadMoreExplorers);

        // Sem rede nao se segue (ponto 41). Os botoes nao se
        // escondem — ficam visiveis e explicam-se quando tocados.
        window.addEventListener('online', refreshAll);
        window.addEventListener('offline', refreshAll);
    }

    // ==========================================================
    // A verdade partilhada
    // ==========================================================

    function remember(author) {
        if (!author || !author.userId) return;
        if (!Follows.isKnown(author)) return;

        truth[author.userId] = {
            isFollowing: author.isFollowing === true,
            followsYou: author.followsYou === true
        };
    }

    // Um autor vindo de uma lista velha passa por aqui antes de
    // desenhar: o que o servidor ja confirmou ganha.
    //
    // REGRA DE ORDEM, e e facil de enganar: isto so serve copias
    // LOCAIS. Uma resposta acabada de chegar do servidor nunca se
    // reconcilia — guarda-se com `remember` e usa-se tal e qual.
    // Ao contrario, a cache antiga sobrepoe-se ao que e novo, e o
    // perfil reabre a dizer "A seguir" depois de ja nao seguir.
    function reconcile(author) {
        if (!author || !author.userId) return author;

        const known = truth[author.userId];
        if (!known) return author;

        return Object.assign({}, author, {
            isFollowing: known.isFollowing,
            followsYou: known.followsYou
        });
    }

    // Os modulos que guardam listas proprias (feed, conversa,
    // pistas) inscrevem-se para corrigir o que tem em memoria.
    function onChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    function announce(author) {
        listeners.forEach(function (fn) {
            try { fn(author); } catch (e) { /* um ouvinte partido nao para os outros */ }
        });
    }

    // ==========================================================
    // O componente
    // ==========================================================

    // Devolve o botao pronto, ou `null` quando nao ha botao a
    // desenhar — o meu proprio perfil, ou um autor que veio sem
    // viewer e de quem nao sabemos o estado (ponto 8).
    //
    // options:
    //   size: 'sm' (feed, listas) | 'md' (perfil)
    //   variant: 'quiet' (ao lado do nome) | 'solid' (perfil)
    function button(author, options) {
        const opts = options || {};
        const resolved = reconcile(author);

        if (!Follows.canFollow(resolved)) return null;
        if (!Follows.isKnown(resolved)) return null;

        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hh-follow'
            + ' hh-follow--' + (opts.size === 'md' ? 'md' : 'sm')
            + ' hh-follow--' + (opts.variant === 'solid' ? 'solid' : 'quiet');

        el.addEventListener('click', function (event) {
            event.stopPropagation();
            onPress(el);
        });

        register(el, resolved, opts);
        paint(el);

        return el;
    }

    function register(el, author, opts) {
        el.__follow = { author: author, options: opts || {}, busy: false };

        const id = author.userId;
        if (!mounted[id]) mounted[id] = [];
        mounted[id].push(el);

        // Um botao que saiu do DOM nao precisa de ser avisado.
        // Sem esta limpeza, um feed recarregado cem vezes deixava
        // cem botoes mortos a receber actualizacoes.
        mounted[id] = mounted[id].filter(function (other) {
            return other === el || other.isConnected;
        });
    }

    function paint(el) {
        const data = el.__follow;
        if (!data) return;

        const state = Follows.buttonState(data.author);

        const rotulo = state === 'following' ? deps.t('followingState')
                     : state === 'followBack' ? deps.t('followBack')
                     : deps.t('followAction');

        el.classList.toggle('is-following', state === 'following');
        el.classList.toggle('is-back', state === 'followBack');
        el.disabled = data.busy;

        // O estado nao depende so da cor (ponto 49): "A seguir"
        // leva visto, e o `aria-pressed` anuncia-o a quem ouve.
        el.setAttribute('aria-pressed', state === 'following' ? 'true' : 'false');
        el.setAttribute('aria-label', rotulo + ' · ' + (data.author.name || ''));

        el.innerHTML = '';
        if (state === 'following') {
            const visto = document.createElement('i');
            visto.className = 'fas fa-check';
            visto.setAttribute('aria-hidden', 'true');
            el.appendChild(visto);
        }
        el.appendChild(document.createTextNode(rotulo));

        if (data.busy) {
            el.classList.add('is-busy');
        } else {
            el.classList.remove('is-busy');
        }
    }

    // ==========================================================
    // Seguir e deixar de seguir
    // ==========================================================

    async function onPress(el) {
        const data = el.__follow;
        if (!data || data.busy) return;   // ponto 16: um de cada vez

        const offline = Follows.offlineReason(navigator.onLine);
        if (offline) {
            deps.toast(deps.t(offline));
            return;
        }

        const antes = data.author;
        const estado = Follows.buttonState(antes);

        // Ponto 47: deixar de seguir passa por um toque a mais,
        // numa folha pequena — nunca por um modal pesado, e nunca
        // por engano num botao que se toca para o contrario.
        if (estado === 'following') {
            openUnfollowSheet(antes);
            return;
        }

        await apply(el, antes, true);
    }

    async function apply(el, antes, wantFollow) {
        const data = el.__follow;

        // Optimista: o ecra responde ja (ponto 39).
        data.busy = true;
        data.author = Follows.optimistic(antes, wantFollow);
        syncAll(data.author, { busy: true });

        const result = wantFollow
            ? await deps.cloud.followExplorer(antes.userId)
            : await deps.cloud.unfollowExplorer(antes.userId);

        if (!result.ok) {
            // Rollback. O registo de verdade nao chegou a ser
            // tocado, por isso nao ha mentira a limpar.
            data.busy = false;
            data.author = Follows.rollback(antes);
            syncAll(data.author, { busy: false });

            deps.toast(deps.t(
                result.reason === 'rate_limited' ? 'followRateLimited'
              : wantFollow ? 'followFailed' : 'unfollowFailed'
            ));
            return;
        }

        const confirmado = Follows.applyServer(data.author, result);

        data.busy = false;
        data.author = confirmado;

        remember(confirmado);
        syncAll(confirmado, { busy: false });
        announce(confirmado);
    }

    // Todos os botoes daquela pessoa mudam juntos — o do feed, o
    // do perfil, o da lista (ponto 40).
    function syncAll(author, flags) {
        const lista = mounted[author.userId] || [];

        mounted[author.userId] = lista.filter(function (el) { return el.isConnected || el.__follow; });

        mounted[author.userId].forEach(function (el) {
            if (!el.__follow) return;
            el.__follow.author = Object.assign({}, el.__follow.author, author);
            if (flags && typeof flags.busy === 'boolean') el.__follow.busy = flags.busy;
            paint(el);
        });

        // A lista aberta tambem e uma copia.
        listState.rows = Follows.replaceAuthor(listState.rows, author);

        // E a linha de contadores do perfil, se for desta pessoa.
        if (counters && counters.userId === author.userId) {
            if (typeof author.followers === 'number') counters.explorer.followers = author.followers;
            if (typeof author.following === 'number') counters.explorer.following = author.following;
            paintCounters();
        }
    }

    function refreshAll() {
        Object.keys(mounted).forEach(function (id) {
            (mounted[id] || []).forEach(function (el) { if (el.__follow) paint(el); });
        });
    }

    function openUnfollowSheet(author) {
        const options = [{
            icon: 'fa-user-minus',
            label: deps.t('unfollowAction'),
            danger: true,
            action: function () {
                const el = (mounted[author.userId] || [])[0];
                if (el) apply(el, el.__follow.author, false);
            }
        }];

        // Reaproveita a folha que as Descobertas e as Pistas ja
        // usam, em vez de trazer uma terceira igual.
        if (deps.openSheet) deps.openSheet(options, author.name || '');
    }

    // ==========================================================
    // As listas: quem me segue, quem eu sigo
    // ==========================================================

    function openFollowers(userId, name) { openList(userId, 'followers', name); }
    function openFollowing(userId, name) { openList(userId, 'following', name); }

    async function openList(userId, mode, name) {
        if (!dom || !dom.screen) return;

        listState.userId = userId;
        listState.mode = mode;
        listState.rows = [];
        listState.hasMore = false;
        listState.loading = false;
        const pedido = ++listState.request;

        dom.title.textContent = deps.t(mode === 'followers' ? 'followersTitle' : 'followingTitle');
        dom.sub.textContent = name || '';

        // Limpar ANTES de esperar pela rede: sem isto a lista da
        // pessoa anterior ficava debaixo do nome desta.
        dom.list.innerHTML = '';
        dom.more.classList.add('hidden');

        dom.screen.classList.remove('hidden');
        document.body.classList.add('hh-chat-open');

        const result = mode === 'followers'
            ? await deps.cloud.listFollowers(userId, { limit: Follows.CONFIG.PAGE_SIZE })
            : await deps.cloud.listFollowing(userId, { limit: Follows.CONFIG.PAGE_SIZE });

        if (pedido !== listState.request) return;

        if (!result.ok) {
            renderListError();
            return;
        }

        listState.rows = Follows.mergeExplorers([], result.explorers || []);
        listState.hasMore = result.hasMore === true;
        (listState.rows || []).forEach(function (row) { remember(row.author); });

        renderList();
    }

    async function loadMoreExplorers() {
        if (listState.loading || !listState.hasMore) return;

        const pedido = listState.request;
        listState.loading = true;
        dom.moreBtn.textContent = deps.t('feedLoading');

        try {
            const options = {
                before: Follows.oldestAt(listState.rows),
                limit: Follows.CONFIG.PAGE_SIZE
            };

            const result = listState.mode === 'followers'
                ? await deps.cloud.listFollowers(listState.userId, options)
                : await deps.cloud.listFollowing(listState.userId, options);

            if (pedido !== listState.request) return;
            if (!result.ok) return;

            listState.rows = Follows.mergeExplorers(listState.rows, result.explorers || []);
            listState.hasMore = result.hasMore === true;
            (result.explorers || []).forEach(function (row) { remember(row.author); });

            renderList();
        } finally {
            dom.moreBtn.textContent = deps.t('feedLoadMore');
            listState.loading = false;
        }
    }

    function renderList() {
        dom.list.innerHTML = '';

        if (!listState.rows.length) {
            dom.list.appendChild(emptyList());
            dom.more.classList.add('hidden');
            return;
        }

        listState.rows.forEach(function (row) {
            dom.list.appendChild(explorerRow(row.author));
        });

        dom.more.classList.toggle('hidden', !listState.hasMore);
    }

    function renderListError() {
        dom.list.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'hh-cv-empty';
        p.textContent = navigator.onLine ? deps.t('followListError') : deps.t('chatOffline');
        dom.list.appendChild(p);
    }

    // Ponto 42: o vazio explica o que ganha quem seguir, sem
    // repreender quem ainda nao seguiu ninguem.
    function emptyList() {
        const box = document.createElement('div');
        box.className = 'hh-fd-empty';

        const title = document.createElement('p');
        title.className = 'hh-fd-empty-title';
        title.textContent = deps.t(listState.mode === 'followers' ? 'noFollowers' : 'notFollowingAnyone');
        box.appendChild(title);

        const sub = document.createElement('p');
        sub.className = 'hh-fd-empty-sub';
        sub.textContent = deps.t(listState.mode === 'followers' ? 'noFollowersSub' : 'notFollowingAnyoneSub');
        box.appendChild(sub);

        return box;
    }

    // Uma linha de explorador: avatar, nome, nivel e o botao. E o
    // mesmo cartao nas duas listas e nas sugestoes.
    function explorerRow(rawAuthor) {
        const author = reconcile(rawAuthor);

        const row = document.createElement('article');
        row.className = 'hh-ex-row';

        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'hh-ex-open';
        open.appendChild(deps.avatarFor(author));

        const text = document.createElement('span');
        text.className = 'hh-ex-text';

        const name = document.createElement('span');
        name.className = 'hh-ex-name';
        name.textContent = author.name || deps.t('chatProfileTitle');
        text.appendChild(name);

        const level = document.createElement('span');
        level.className = 'hh-ex-level';
        level.textContent = deps.t('chatLevel', { n: deps.levelFor(author.xpTotal) });
        text.appendChild(level);

        open.appendChild(text);
        open.addEventListener('click', function () { openExplorer(author); });
        row.appendChild(open);

        const btn = button(author, { size: 'sm', variant: 'quiet' });
        if (btn) row.appendChild(btn);

        return row;
    }

    function closeList() {
        if (!dom || !dom.screen) return;

        listState.request++;
        listState.rows = [];
        listState.hasMore = false;

        dom.list.innerHTML = '';
        dom.more.classList.add('hidden');
        dom.screen.classList.add('hidden');

        // Pode haver um perfil por baixo: so se solta o corpo se
        // nao ficar nada aberto.
        if (!deps.anySheetOpen || !deps.anySheetOpen()) {
            document.body.classList.remove('hh-chat-open');
        }
    }

    function isListOpen() {
        return !!dom && !!dom.screen && !dom.screen.classList.contains('hidden');
    }

    // ==========================================================
    // O perfil publico
    // ==========================================================

    // Delegado para quem souber desenhar a folha. O perfil vive
    // no `conversations-ui`, que ja tem a folha montada; aqui so
    // se pede que a abra com dados frescos.
    function openExplorer(author) {
        if (typeof deps.openExplorer === 'function') deps.openExplorer(author);
    }

    // Os numeros do perfil (ponto 6 e 45). A ORDEM E A MENSAGEM:
    // descobertas e ajuda primeiro, seguidores depois e mais
    // pequenos (ponto 7).
    function statsFor(explorer) {
        const wrap = document.createElement('div');
        wrap.className = 'hh-ex-stats';

        [
            ['discoveries', 'profileDiscoveries'],
            ['clues', 'profileClues'],
            ['helpfulReceived', 'profileHelped'],
            ['posts', 'profileMemories']
        ].forEach(function (pair) {
            const valor = explorer[pair[0]] || 0;

            const cell = document.createElement('div');
            cell.className = 'hh-ex-stat';

            const n = document.createElement('span');
            n.className = 'hh-ex-stat-n';
            n.textContent = String(valor);
            cell.appendChild(n);

            const label = document.createElement('span');
            label.className = 'hh-ex-stat-label';
            label.textContent = deps.t(pair[1]);
            cell.appendChild(label);

            wrap.appendChild(cell);
        });

        return wrap;
    }

    // Seguidores e a seguir: uma linha so, pequena, por baixo de
    // tudo. Nao e o placar do perfil (ponto 7).
    function countersFor(explorer) {
        const line = document.createElement('p');
        line.className = 'hh-ex-counts';

        const seguidores = document.createElement('button');
        seguidores.type = 'button';
        seguidores.className = 'hh-ex-count';
        seguidores.addEventListener('click', function () {
            openFollowers(explorer.author.userId, explorer.author.name);
        });
        line.appendChild(seguidores);

        line.appendChild(document.createTextNode(' · '));

        const aSeguir = document.createElement('button');
        aSeguir.type = 'button';
        aSeguir.className = 'hh-ex-count';
        aSeguir.addEventListener('click', function () {
            openFollowing(explorer.author.userId, explorer.author.name);
        });
        line.appendChild(aSeguir);

        counters = {
            userId: explorer.author.userId,
            explorer: { followers: explorer.followers || 0, following: explorer.following || 0 },
            seguidores: seguidores,
            aSeguir: aSeguir
        };
        paintCounters();

        return line;
    }

    // Singular e plural como no resto do projecto: duas chaves,
    // escolhidas aqui. A decisao usa o numero CRU — `1.2k` nao se
    // compara com 1.
    function paintCounters() {
        if (!counters) return;

        const f = counters.explorer.followers;
        const g = counters.explorer.following;

        counters.seguidores.textContent = (f === 1)
            ? deps.t('followersCountOne')
            : deps.t('followersCount', { n: Follows.compactCount(f) });

        counters.aSeguir.textContent = (g === 1)
            ? deps.t('followingCountOne')
            : deps.t('followingCount', { n: Follows.compactCount(g) });
    }

    // A folha fechou: a linha que la estava deixa de existir, e
    // nao deve continuar a receber actualizacoes.
    function forgetCounters() {
        counters = null;
    }

    return {
        init: init,

        // O componente e a sua verdade
        button: button,
        reconcile: reconcile,
        remember: remember,
        onChange: onChange,

        // O perfil
        statsFor: statsFor,
        countersFor: countersFor,
        forgetCounters: forgetCounters,
        explorerRow: explorerRow,

        // As listas
        openFollowers: openFollowers,
        openFollowing: openFollowing,
        closeList: closeList,
        isListOpen: isListOpen
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FollowsUI: FollowsUI };
}
