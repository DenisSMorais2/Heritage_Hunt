// ============================================================
// Heritage Hunt CV — Pistas (interface)
//
// O QUE ESTA ABA E: o sitio onde quem ja descobriu ajuda quem
// ainda nao descobriu, sem estragar a descoberta.
//
// E a peca que fecha o ciclo do produto:
//
//   PISTAS (nao chegaram) -> "Perguntar a comunidade" -> CHAT
//   -> dica -> DESCOBERTA -> "Deixar uma pista" -> PISTAS
//
// Os dois extremos desse ciclo vivem neste ficheiro: o botao que
// manda para a conversa, e o que convida a devolver a ajuda.
//
// NENHUM NUMERO COMPETITIVO (pontos 34 e 35). "Ajudou-me" nao e
// uma pontuacao: e um sinal para quem le a seguir decidir em que
// pista confiar primeiro.
// ============================================================

const CluesUI = (function () {
    'use strict';

    let dom = null;
    let deps = null;

    let index = [];          // o indice da aba (monumento por linha)
    let monumentId = null;   // o monumento aberto
    let clues = [];
    let info = { canWrite: false, hasMine: false };

    function t(key, vars) {
        return deps && typeof deps.t === 'function' ? deps.t(key, vars) : key;
    }

    // ==========================================================
    // Arranque
    // ==========================================================

    function init(options) {
        deps = options || {};

        dom = {
            index:     document.getElementById('cluesIndex'),
            indexLead: document.getElementById('cluesIndexLead'),

            screen:    document.getElementById('cluesScreen'),
            back:      document.getElementById('cluesBackBtn'),
            hero:      document.getElementById('cluesHero'),
            monument:  document.getElementById('cluesMonument'),
            place:     document.getElementById('cluesMonumentPlace'),
            count:     document.getElementById('cluesCount'),
            leave:     document.getElementById('cluesLeaveBtn'),
            list:      document.getElementById('cluesList'),
            locked:    document.getElementById('cluesLocked'),
            ask:       document.getElementById('cluesAskBtn'),

            composer:  document.getElementById('cluesComposer'),
            input:     document.getElementById('cluesInput'),
            reveal:    document.getElementById('cluesRevealWarning'),
            counter:   document.getElementById('cluesCounter'),
            cancel:    document.getElementById('cluesCancelBtn'),
            publish:   document.getElementById('cluesPublishBtn')
        };

        if (!dom.index) return;
        bindEvents();
    }

    function bindEvents() {
        dom.back.addEventListener('click', close);
        dom.leave.addEventListener('click', openComposer);
        dom.cancel.addEventListener('click', closeComposer);
        dom.publish.addEventListener('click', publish);
        dom.input.addEventListener('input', onDraftChange);

        // Ponto 16: as pistas nao chegaram, a conversa daquele
        // monumento abre com a pergunta ja escrita — por enviar.
        dom.ask.addEventListener('click', function () {
            const id = monumentId;
            close();
            deps.onAskCommunity(id);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape' || !isOpen()) return;
            if (!dom.composer.classList.contains('hidden')) closeComposer();
            else close();
        });
    }

    // ==========================================================
    // O indice da aba
    // ==========================================================

    async function load() {
        const result = await deps.cloud.listClueMonuments();

        if (!result.ok) {
            dom.index.innerHTML = '';
            const p = document.createElement('p');
            p.className = 'hh-cv-empty';
            p.textContent = navigator.onLine ? t('cluesError') : t('chatOffline');
            dom.index.appendChild(p);
            return;
        }

        index = Clues.sortMonuments(result.monuments || []);
        renderIndex();
    }

    function renderIndex() {
        // A linha de cima nao conta pistas: conta o que EU posso
        // fazer. E o que torna a aba um convite em vez de um
        // arquivo.
        const canHelp = Clues.monumentsICanHelp(index);
        dom.indexLead.textContent = canHelp === 0
            ? t('cluesIndexNoneToHelp')
            : (canHelp === 1 ? t('cluesIndexCanHelpOne') : t('cluesIndexCanHelp', { n: canHelp }));

        dom.index.innerHTML = '';
        index.forEach(function (row) {
            dom.index.appendChild(indexRow(row));
        });
    }

    function indexRow(row) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'hh-cl-row' + (row.clues ? '' : ' is-empty');

        const icon = document.createElement('span');
        icon.className = 'hh-cv-card-icon';
        icon.innerHTML = '<i class="fas fa-landmark" aria-hidden="true"></i>';
        card.appendChild(icon);

        const body = document.createElement('span');
        body.className = 'hh-cv-card-body';

        const top = document.createElement('span');
        top.className = 'hh-cv-card-top';

        const name = document.createElement('span');
        name.className = 'hh-cv-card-name';
        name.textContent = deps.monumentName(row.monumentId);
        top.appendChild(name);

        if (row.discovered) {
            const seal = document.createElement('span');
            seal.className = 'hh-chat-seal hh-cl-row-seal';
            seal.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
            seal.title = t('cluesIndexDiscovered');
            top.appendChild(seal);
        }
        body.appendChild(top);

        const sub = document.createElement('span');
        sub.className = 'hh-cv-card-preview';
        sub.textContent = row.clues === 0
            ? t('cluesIndexEmpty')
            : (row.clues === 1 ? t('cluesIndexCountOne') : t('cluesIndexCount', { n: row.clues }));
        body.appendChild(sub);

        card.appendChild(body);

        // Um ponto dourado onde EU ainda posso deixar a minha.
        if (row.discovered && !row.hasMine) {
            const dot = document.createElement('span');
            dot.className = 'hh-cl-row-dot';
            dot.setAttribute('aria-label', t('cluesLeave'));
            card.appendChild(dot);
        }

        card.addEventListener('click', function () { open(row.monumentId); });
        return card;
    }

    // ==========================================================
    // As pistas de um monumento
    // ==========================================================

    async function open(id) {
        monumentId = String(id);

        dom.monument.textContent = deps.monumentName(monumentId);
        dom.place.textContent = deps.placeFor(monumentId);
        renderHero();

        // O ecra abre ANTES de a rede responder. Sem limpar aqui, um
        // `reload` que falhe deixava a lista do monumento anterior
        // debaixo do nome deste — e, pior, o "Deixar uma pista"
        // do anterior num monumento que talvez eu nao tenha
        // descoberto.
        clues = [];
        info = { canWrite: false, hasMine: false };
        renderPending();

        dom.screen.classList.remove('hidden');
        document.body.classList.add('hh-chat-open');
        closeComposer();

        await reload();
    }

    // A lista vazia enquanto se espera, sem o cartao "ainda nao ha
    // pistas": esse e uma resposta, e ainda nao ha resposta.
    function renderPending() {
        dom.count.textContent = '';
        dom.list.innerHTML = '';
        dom.leave.classList.add('hidden');
        dom.locked.classList.add('hidden');
    }

    function renderHero() {
        const image = deps.monumentImage(monumentId);
        dom.hero.innerHTML = '';
        dom.hero.classList.toggle('hidden', !image);
        dom.screen.classList.toggle('has-hero', !!image);

        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = '';
            dom.hero.appendChild(img);
        }
    }

    async function reload() {
        const result = await deps.cloud.listClues(monumentId);
        if (!result.ok) {
            deps.toast(t('cluesError'));
            return;
        }

        clues = Clues.sortByHelpful(result.clues || []);
        info = { canWrite: result.canWrite === true, hasMine: result.hasMine === true };
        renderClues();
    }

    function renderClues() {
        dom.count.textContent = t('cluesCount', { n: clues.length });
        dom.list.innerHTML = '';

        if (!clues.length) {
            const box = document.createElement('div');
            box.className = 'hh-fd-empty';

            const title = document.createElement('p');
            title.className = 'hh-fd-empty-title';
            title.textContent = t('cluesNone');
            box.appendChild(title);

            const sub = document.createElement('p');
            sub.className = 'hh-fd-empty-sub';
            sub.textContent = t('cluesNoneSub');
            box.appendChild(sub);

            dom.list.appendChild(box);
        } else {
            clues.forEach(function (clue) { dom.list.appendChild(clueRow(clue)); });
        }

        // Ponto 19: tres estados possiveis, decididos num sitio so.
        const state = Clues.writeState(info);
        dom.leave.classList.toggle('hidden', state !== 'write');
        dom.locked.classList.toggle('hidden', state !== 'locked');
    }

    function clueRow(clue) {
        const row = document.createElement('article');
        row.className = 'hh-cl-card' + (clue.mine ? ' is-mine' : '');

        const head = document.createElement('div');
        head.className = 'hh-cl-card-head';
        head.appendChild(avatarFor(clue.author));

        const meta = document.createElement('div');
        meta.className = 'hh-cl-card-meta';

        const name = document.createElement('p');
        name.className = 'hh-cl-card-name';
        name.textContent = clue.mine ? t('cluesMine') : (clue.author ? clue.author.name : '');
        meta.appendChild(name);

        const sub = document.createElement('p');
        sub.className = 'hh-cl-card-sub';
        // O selo "Descobriu" vale sempre nas pistas — so quem
        // descobriu escreve — e e precisamente por isso que se
        // mostra: diz a quem le que a frase vem de quem esteve la.
        sub.innerHTML = '<span class="hh-chat-seal"><i class="fas fa-check" aria-hidden="true"></i> ' +
            escapeHtml(t('chatDiscovered')) + '</span>';
        sub.appendChild(document.createTextNode(' · ' + deps.relativeTime(clue.createdAt)));
        meta.appendChild(sub);

        head.appendChild(meta);

        // Faz sentido aqui: quem deixou uma pista util e
        // exactamente a pessoa que vale a pena acompanhar. Na
        // minha propria pista o botao nao nasce (ponto 8).
        const follow = FollowsUI.button(clue.author, { size: 'sm', variant: 'quiet' });
        if (follow) head.appendChild(follow);

        const menu = document.createElement('button');
        menu.type = 'button';
        menu.className = 'hh-fd-card-menu';
        menu.setAttribute('aria-label', t('cluesReport'));
        menu.innerHTML = '<i class="fas fa-ellipsis-h" aria-hidden="true"></i>';
        menu.addEventListener('click', function () { openMenu(clue); });
        head.appendChild(menu);

        row.appendChild(head);

        const text = document.createElement('p');
        text.className = 'hh-cl-card-text';
        text.textContent = clue.body;
        row.appendChild(text);

        row.appendChild(helpfulButton(clue));
        return row;
    }

    function helpfulButton(clue) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hh-cl-helpful' + (clue.myHelpful ? ' is-on' : '');
        btn.setAttribute('aria-pressed', clue.myHelpful ? 'true' : 'false');
        btn.innerHTML = '<i class="' + (clue.myHelpful ? 'fas' : 'far') + ' fa-lightbulb" aria-hidden="true"></i><span>' +
            escapeHtml(t('cluesHelpful')) + (clue.helpful ? ' ' + clue.helpful : '') + '</span>';

        // A propria pista nao se agradece a si mesma.
        if (clue.mine) {
            btn.disabled = true;
            return btn;
        }

        btn.addEventListener('click', async function () {
            const next = Clues.toggleHelpful(clue);
            clues = Clues.sortByHelpful(Clues.replaceClue(clues, next));
            renderClues();

            const result = await deps.cloud.setClueHelpful(clue.id, next.myHelpful);
            if (!result.ok) {
                clues = Clues.sortByHelpful(Clues.replaceClue(clues, clue));
                renderClues();
            }
        });

        return btn;
    }

    function openMenu(clue) {
        const options = [];

        if (clue.mine) {
            options.push({
                icon: 'fa-pen', label: t('cluesEdit'),
                action: function () { openComposer(clue); }
            });
            options.push({
                icon: 'fa-trash', label: t('cluesDelete'), danger: true,
                action: async function () {
                    const result = await deps.cloud.deleteClue(clue.id);
                    if (!result.ok) return;
                    clues = Clues.removeClue(clues, clue.id);
                    info.hasMine = false;
                    renderClues();
                    deps.toast(t('cluesDeleted'));
                    load();
                }
            });
        } else {
            [['qr_location', 'chatReportQr'],
             ['incorrect', 'chatReportIncorrect'],
             ['spam', 'chatReportSpam'],
             ['harassment', 'chatReportHarassment'],
             ['other', 'chatReportOther']].forEach(function (pair) {
                options.push({
                    icon: 'fa-flag', label: t(pair[1]), danger: pair[0] === 'qr_location',
                    action: async function () {
                        await deps.cloud.reportClue(clue.id, pair[0]);
                        deps.toast(t('chatReportThanks'));
                    }
                });
            });
        }

        deps.openSheet(options, clue.mine ? null : t('chatReportLead'));
    }

    // ==========================================================
    // Escrever a minha pista
    // ==========================================================

    let editing = null;

    function openComposer(clue) {
        editing = clue && clue.id ? clue : null;

        dom.input.value = editing ? editing.body : '';
        dom.composer.classList.remove('hidden');
        dom.leave.classList.add('hidden');
        onDraftChange();
        dom.input.focus();
    }

    function closeComposer() {
        editing = null;
        dom.composer.classList.add('hidden');
        dom.input.value = '';
        dom.reveal.classList.add('hidden');
        if (dom.leave) dom.leave.classList.toggle('hidden', Clues.writeState(info) !== 'write');
    }

    function onDraftChange() {
        const text = dom.input.value;

        dom.input.style.height = 'auto';
        dom.input.style.height = Math.min(dom.input.scrollHeight, 140) + 'px';

        const show = Clues.shouldShowCounter(text);
        dom.counter.classList.toggle('hidden', !show);
        if (show) dom.counter.textContent = t('chatCharsLeft', { n: Clues.remainingChars(text) });

        // O aviso aparece enquanto se escreve, e nao bloqueia nada:
        // quem escreve e que decide (ponto 55 — nada de moderacao
        // automatica). Um aviso no momento certo evita mais
        // estragos do que uma denuncia depois.
        dom.reveal.classList.toggle('hidden', !Clues.soundsRevealing(text));

        dom.publish.disabled = !Clues.validateDraft(text).ok || !navigator.onLine;
    }

    async function publish() {
        const checked = Clues.validateDraft(dom.input.value);
        if (!checked.ok) return;

        dom.publish.disabled = true;

        const result = editing
            ? await deps.cloud.editClue(editing.id, checked.body)
            : await deps.cloud.addClue(monumentId, checked.body);

        if (!result.ok) {
            deps.toast(t(
                result.reason === 'not_discovered' ? 'cluesNotDiscovered' :
                result.reason === 'invalid_clue' ? 'cluesTooLong' : 'cluesFailed'
            ));
            dom.publish.disabled = false;
            return;
        }

        const saved = !editing;
        closeComposer();
        await reload();
        load();

        if (saved) deps.toast(t('cluesSaved'));
    }

    // ==========================================================
    // Comum
    // ==========================================================

    // PONTO 40 — a copia que este modulo guarda.
    function applyAuthorUpdate(author) {
        if (!author || !author.userId) return;

        clues = (clues || []).map(function (clue) {
            if (!clue || !clue.author || clue.author.userId !== author.userId) return clue;
            return Object.assign({}, clue, { author: Object.assign({}, clue.author, author) });
        });
    }

    function close() {
        dom.screen.classList.add('hidden');
        document.body.classList.remove('hh-chat-open');
        closeComposer();
        monumentId = null;
        clues = [];
        info = { canWrite: false, hasMine: false };
        renderPending();
    }

    function isOpen() {
        return !!dom && !dom.screen.classList.contains('hidden');
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

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return {
        init: init,
        load: load,
        open: open,
        close: close,
        applyAuthorUpdate: applyAuthorUpdate,
        isOpen: isOpen,
        getIndex: function () { return index.slice(); }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CluesUI: CluesUI };
}
