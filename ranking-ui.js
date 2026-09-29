// ============================================================
// Heritage Hunt CV — Ranking de exploradores (interface)
//
// O QUE ESTE ECRA E: uma camada social. Mostra que mais alguem
// esta la fora a descobrir os mesmos lugares.
//
// E uma VISTA, nao um modal: tem aba propria na navegacao, por
// isso a barra de baixo tem de continuar visivel por cima dela.
//
// As descobertas aparecem ao lado do XP de proposito: sem elas o
// ranking seria "quem juntou mais pontos"; com elas percebe-se que
// aqueles pontos sao lugares onde a pessoa esteve mesmo.
// ============================================================

const RankingUI = (function () {
    'use strict';

    const TOP_LIMIT = 20;
    const LAST_WEEK_KEY = 'heritageRankingWeek';

    let dom = null;
    let deps = null;
    let loading = false;

    function init(options) {
        deps = options || {};

        dom = {
            view:       document.getElementById('rankingView'),
            body:       document.getElementById('rankingBody'),
            subtitle:   document.getElementById('rankingSubtitle'),
            skeleton:   document.getElementById('rankingSkeleton'),
            error:      document.getElementById('rankingError'),
            empty:      document.getElementById('rankingEmpty'),
            emptyText:  document.getElementById('rankingEmptyText'),
            content:    document.getElementById('rankingContent'),
            notice:     document.getElementById('rankingNotice'),
            optOut:     document.getElementById('rankingOptOutNote'),
            podium:     document.getElementById('rankingPodium'),
            list:       document.getElementById('rankingList'),
            standings:  document.getElementById('rankingStandings'),
            retry:      document.getElementById('rankingRetry'),
            explore:    document.getElementById('rankingExploreBtn'),

            infoBtn:    document.getElementById('rankingInfoBtn'),
            infoModal:  document.getElementById('rankingInfoModal'),
            infoClose:  document.getElementById('closeRankingInfo'),
            infoToggle: document.getElementById('rankingOptInSheetToggle')
        };

        if (!dom.view) return;

        dom.retry.addEventListener('click', load);
        dom.explore.addEventListener('click', function () {
            if (deps.onExplore) deps.onExplore();
        });

        dom.infoBtn.addEventListener('click', openInfo);
        dom.infoClose.addEventListener('click', closeInfo);
        dom.infoModal.addEventListener('click', function (event) {
            if (event.target === dom.infoModal) closeInfo();
        });

        dom.infoToggle.addEventListener('change', function (event) {
            if (deps.onOptInChange) deps.onOptInChange(event.target.checked);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isInfoOpen()) closeInfo();
        });
    }

    // --- O painel de privacidade ---------------------------------

    function isInfoOpen() {
        return !!dom && !!dom.infoModal && !dom.infoModal.classList.contains('hidden');
    }

    function openInfo() {
        if (!dom || !dom.infoModal) return;
        syncOptIn(deps.isOptedIn ? deps.isOptedIn() : true);
        dom.infoModal.classList.remove('hidden');
        document.body.classList.add('hh-modal-open');
    }

    function closeInfo() {
        if (!dom || !dom.infoModal) return;
        dom.infoModal.classList.add('hidden');
        document.body.classList.remove('hh-modal-open');
    }

    // O interruptor existe em dois sitios — aqui e nas definicoes —
    // e os dois tem de contar sempre a mesma verdade.
    function syncOptIn(value) {
        if (dom && dom.infoToggle) dom.infoToggle.checked = value !== false;
    }

    // --- Carregamento --------------------------------------------

    function isVisible() {
        return !!dom && !!dom.view && !dom.view.classList.contains('hidden');
    }

    function showOnly(section) {
        ['skeleton', 'error', 'empty', 'content'].forEach(function (name) {
            if (dom[name]) dom[name].classList.toggle('hidden', name !== section);
        });
    }

    async function load() {
        if (!dom || !dom.view || loading) return;

        loading = true;
        // Nunca se mostra "0 XP" ou "#0" a espera de dados: enquanto
        // nao se sabe, mostra-se a forma, nao um numero errado.
        showOnly('skeleton');
        dom.standings.classList.add('hidden');

        const result = await deps.fetchRanking(TOP_LIMIT, deps.islandId || null);

        loading = false;

        // A pessoa pode ter mudado de aba durante o pedido.
        if (!isVisible()) return;

        if (!result || !result.ok) {
            showOnly('error');
            return;
        }

        render(result);
    }

    // --- Desenho -------------------------------------------------

    function render(payload) {
        renderNotice(payload);
        renderOptOutNote(payload);
        syncOptIn(payload.optedIn);

        const kind = Ranking.emptyState(payload.participants, payload.me);

        if (kind === 'waiting') {
            dom.emptyText.textContent = deps.t('rankingEmptyWaiting');
            showOnly('empty');
            return;
        }

        showOnly('content');

        dom.subtitle.textContent = kind === 'alone'
            ? deps.t('rankingAloneSub')
            : deps.t('rankingSubtitle');

        renderPodium(Ranking.podiumLayout(payload.top));
        renderList(Ranking.rest(payload.top));
        renderStandings(payload);

        hydrateAvatars();
    }

    // Uma semana nova nunca e uma perda: e um recomeco.
    function renderNotice(payload) {
        let lastSeen = null;
        try {
            lastSeen = localStorage.getItem(LAST_WEEK_KEY);
        } catch (e) {
            lastSeen = null;
        }

        const fresh = Ranking.isNewWeek(payload.weekStart, lastSeen);

        dom.notice.textContent = fresh ? deps.t('rankingNewWeek') : '';
        dom.notice.classList.toggle('hidden', !fresh);

        try {
            localStorage.setItem(LAST_WEEK_KEY, payload.weekStart);
        } catch (e) {
            // Sem espaco para a preferencia, o aviso repete-se. Nao e grave.
        }
    }

    function renderOptOutNote(payload) {
        const participating = payload.optedIn !== false;
        dom.optOut.textContent = participating ? '' : deps.t('rankingOptedOutNote');
        dom.optOut.classList.toggle('hidden', participating);
    }

    function renderPodium(entries) {
        dom.podium.innerHTML = '';

        entries.forEach(function (entry) {
            const medal = Ranking.medalFor(entry.position);

            const card = document.createElement('div');
            card.className = 'hh-rk-pod' +
                (entry.position === 1 ? ' is-first' : '') +
                (medal ? ' is-' + medal : '') +
                (entry.isMe ? ' is-me' : '');

            // Uma coroa pequena, a escala de quem poe tres retratos
            // em cima da lareira — nao a de um jogo de arcada.
            const crown = document.createElement('span');
            crown.className = 'hh-rk-crown';
            crown.setAttribute('aria-hidden', 'true');
            crown.innerHTML = '<i class="fas fa-crown"></i>';
            card.appendChild(crown);

            const avatar = avatarNode(entry, 'hh-rk-pod-avatar');

            const pos = document.createElement('span');
            pos.className = 'hh-rk-pod-pos';
            pos.textContent = entry.position;
            avatar.appendChild(pos);

            card.appendChild(avatar);

            const name = document.createElement('p');
            name.className = 'hh-rk-pod-name';
            name.textContent = Ranking.shortName(entry.displayName) || deps.t('rankingExplorer');
            card.appendChild(name);

            const xp = document.createElement('p');
            xp.className = 'hh-rk-pod-xp';
            xp.textContent = deps.t('rankingWeeklyXp', { xp: entry.weeklyXp });
            card.appendChild(xp);

            const finds = document.createElement('p');
            finds.className = 'hh-rk-pod-finds';
            finds.textContent = discoveriesText(entry.discoveries);
            card.appendChild(finds);

            dom.podium.appendChild(card);
        });
    }

    function renderList(entries) {
        dom.list.innerHTML = '';
        entries.forEach(function (entry) {
            dom.list.appendChild(rowNode(entry, false));
        });
    }

    // A barra so aparece a quem nao se ve na lista — quem ja esta no
    // ecra nao precisa de ser lembrado de onde esta.
    function renderStandings(payload) {
        const needed = Ranking.needsStandingsBar(payload.me, payload.top);

        dom.standings.innerHTML = '';
        dom.standings.classList.toggle('hidden', !needed);

        if (needed) dom.standings.appendChild(rowNode(payload.me, true));
    }

    function rowNode(entry, isBar) {
        const row = document.createElement('div');
        row.className = 'hh-rk-row' + (entry.isMe ? ' is-me' : '') + (isBar ? ' is-bar' : '');

        const pos = document.createElement('span');
        pos.className = 'hh-rk-pos';
        pos.textContent = isBar ? '#' + entry.position : entry.position;
        row.appendChild(pos);

        row.appendChild(avatarNode(entry, 'hh-rk-avatar'));

        const text = document.createElement('div');
        text.className = 'hh-rk-text';

        const name = document.createElement('p');
        name.className = 'hh-rk-name';
        name.textContent = Ranking.shortName(entry.displayName) || deps.t('rankingExplorer');

        if (entry.isMe) {
            const tag = document.createElement('span');
            tag.className = 'hh-rk-you';
            tag.textContent = '(' + deps.t('rankingYou') + ')';
            name.appendChild(tag);
        }

        text.appendChild(name);
        row.appendChild(text);

        const numbers = document.createElement('div');
        numbers.className = 'hh-rk-numbers';

        const xp = document.createElement('p');
        xp.className = 'hh-rk-xp';
        xp.textContent = deps.t('rankingWeeklyXp', { xp: entry.weeklyXp });
        numbers.appendChild(xp);

        // As descobertas explicam o que aqueles pontos representam:
        // lugares onde a pessoa esteve, e nao pontos acumulados.
        const finds = document.createElement('p');
        finds.className = 'hh-rk-finds';
        finds.textContent = discoveriesText(entry.discoveries);
        numbers.appendChild(finds);

        row.appendChild(numbers);

        return row;
    }

    function discoveriesText(count) {
        const n = Number(count) || 0;
        return n === 1 ? deps.t('rankingDiscoveryOne') : deps.t('rankingDiscoveryMany', { n: n });
    }

    function avatarNode(entry, className) {
        const wrap = document.createElement('div');
        wrap.className = className + ' hh-rk-ava';

        if (entry.avatarPath) {
            const img = document.createElement('img');
            img.alt = '';
            img.dataset.avatar = entry.avatarPath;
            wrap.appendChild(img);
        } else {
            const initial = document.createElement('span');
            initial.className = 'hh-rk-ava-initial';
            initial.textContent = Ranking.initialFor(entry.displayName);
            wrap.appendChild(initial);
        }

        return wrap;
    }

    // Os avatares vivem num bucket privado: cada um precisa de um
    // link assinado. Pedem-se todos de uma vez, depois de a lista ja
    // estar no ecra — ninguem espera por fotografias.
    async function hydrateAvatars() {
        const nodes = dom.view.querySelectorAll('img[data-avatar]');
        if (!nodes.length) return;

        const paths = [];
        nodes.forEach(function (img) {
            if (paths.indexOf(img.dataset.avatar) === -1) paths.push(img.dataset.avatar);
        });

        const urls = await deps.signAvatars(paths);

        nodes.forEach(function (img) {
            const url = urls[img.dataset.avatar];
            // Sem link assinado, a inicial e melhor que um quadrado partido.
            if (!url) {
                const wrap = img.parentNode;
                const initial = document.createElement('span');
                initial.className = 'hh-rk-ava-initial';
                initial.textContent = '?';
                img.remove();
                wrap.insertBefore(initial, wrap.firstChild);
                return;
            }
            img.src = url;
        });
    }

    return {
        init: init,
        load: load,
        reload: load,
        syncOptIn: syncOptIn,
        closeInfo: closeInfo,
        isInfoOpen: isInfoOpen,
        isVisible: isVisible,

        TOP_LIMIT: TOP_LIMIT
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RankingUI: RankingUI };
}
