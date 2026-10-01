// ============================================================
// Heritage Hunt CV — Conversas (interface)
//
// O QUE ESTE ECRA E: o caminho de uma duvida ate uma descoberta.
//
//   DUVIDA -> CONVERSA -> DICA -> DESCOBERTA -> EXPERIENCIA REAL
//
// E por isso que quase todas as mensagens tem uma saida para o
// mundo: uma referencia a um monumento traz "Ver no mapa", e o
// cabecalho de uma conversa de monumento leva ao monumento. Uma
// conversa que so leva a mais conversa falhou o proposito.
//
// O QUE ESTE ECRA NAO E: um clone do WhatsApp. Nao ha bolhas
// azuis, nao ha check azuis, nao ha "a escrever...". O que
// distingue a minha mensagem da dos outros e um contorno dourado
// sobre navy — a mesma linguagem dos cartoes do resto da app.
//
// TEXTO: nenhuma string visivel nasce aqui. Tudo passa por `t()`.
// ============================================================

const ConversationsUI = (function () {
    'use strict';

    const QR_SEEN_KEY = 'heritageChatQrSeen';

    let dom = null;
    let deps = null;

    // --- Estado do ecra aberto ---------------------------------
    //
    // Uma conversa de cada vez. Fechar limpa tudo, incluindo o
    // canal de tempo real: um canal esquecido continuaria a receber
    // mensagens de uma conversa que ninguem esta a ver.
    let catalog = [];          // todas as conversas (do servidor)
    let current = null;        // a conversa aberta
    let messages = [];         // as mensagens dessa conversa
    let channel = null;        // canal de tempo real
    let hasMore = false;
    let loadingPage = false;
    let replyTo = null;        // mensagem a que estou a responder
    let pendingPhoto = null;   // { blob, previewUrl, extension, contentType }
    let missedCount = 0;       // para o aviso "N novas mensagens"
    let pulling = false;       // um `pullNew` de cada vez (ver abaixo)
    let profileRequest = 0;    // invalida um perfil ja substituido
    let searchQuery = '';
    let signedPhotos = {};     // mediaPath -> url assinado

    function t(key, vars) {
        return deps && typeof deps.t === 'function' ? deps.t(key, vars) : key;
    }

    // ==========================================================
    // Arranque
    // ==========================================================

    function init(options) {
        deps = options || {};

        dom = {
            // Lista
            list:        document.getElementById('conversationsList'),
            search:      document.getElementById('conversationSearch'),

            // Ecra de conversa
            screen:      document.getElementById('chatScreen'),
            hero:        document.getElementById('chatHeroImg'),
            title:       document.getElementById('chatTitle'),
            subtitle:    document.getElementById('chatSubtitle'),
            back:        document.getElementById('chatBackBtn'),
            about:       document.getElementById('chatAboutBtn'),

            notice:      document.getElementById('chatQrNotice'),
            noticeOk:    document.getElementById('chatQrNoticeOk'),

            scroll:      document.getElementById('chatScroll'),
            msgs:        document.getElementById('chatMessages'),
            empty:       document.getElementById('chatEmpty'),
            earlier:     document.getElementById('chatEarlier'),
            earlierBtn:  document.getElementById('chatEarlierBtn'),
            jump:        document.getElementById('chatJumpBtn'),

            replyBar:    document.getElementById('chatReplyBar'),
            replyAuthor: document.getElementById('chatReplyAuthor'),
            replyText:   document.getElementById('chatReplyText'),
            replyCancel: document.getElementById('chatReplyCancel'),

            pendPhoto:   document.getElementById('chatPendingPhoto'),
            pendPhotoImg: document.getElementById('chatPendingPhotoImg'),
            pendPhotoX:  document.getElementById('chatPendingPhotoCancel'),

            form:        document.getElementById('chatForm'),
            input:       document.getElementById('chatInput'),
            counter:     document.getElementById('chatCounter'),
            send:        document.getElementById('chatSendBtn'),
            attach:      document.getElementById('chatAttachBtn'),
            offline:     document.getElementById('chatOfflineNote'),

            photoInput:  document.getElementById('chatPhotoInput'),
            cameraInput: document.getElementById('chatCameraInput'),

            msgSheet:    document.getElementById('chatMsgSheet'),
            msgSheetBody: document.getElementById('chatMsgSheetBody'),
            profSheet:   document.getElementById('chatProfileSheet'),
            profBody:    document.getElementById('chatProfileBody')
        };

        if (!dom.list || !dom.screen) return;

        bindEvents();
        updateOfflineNote();
    }

    function bindEvents() {
        dom.search.addEventListener('input', function () {
            searchQuery = dom.search.value;
            renderList();
        });

        dom.back.addEventListener('click', close);
        dom.about.addEventListener('click', openAbout);
        dom.noticeOk.addEventListener('click', dismissQrNotice);
        dom.earlierBtn.addEventListener('click', loadEarlier);
        dom.jump.addEventListener('click', function () {
            scrollToBottom();
            hideJump();
        });

        dom.replyCancel.addEventListener('click', clearReply);
        dom.pendPhotoX.addEventListener('click', clearPendingPhoto);

        dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            submit();
        });

        // Enter envia, Shift+Enter muda de linha — mas so no
        // computador. No telemovel Enter tem de continuar a ser uma
        // nova linha, senao escrever duas frases e impossivel.
        dom.input.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' || event.shiftKey) return;
            if (isCoarsePointer()) return;
            event.preventDefault();
            submit();
        });

        dom.input.addEventListener('input', onDraftChange);

        dom.attach.addEventListener('click', openAttachMenu);
        dom.photoInput.addEventListener('change', function (e) { onPhotoChosen(e.target.files[0]); });
        dom.cameraInput.addEventListener('change', function (e) { onPhotoChosen(e.target.files[0]); });

        // Ponto 29: quem volta ao fundo deixa de precisar do aviso.
        dom.scroll.addEventListener('scroll', function () {
            if (Conversations.isAtBottom(dom.scroll)) hideJump();
        });

        [dom.msgSheet, dom.profSheet].forEach(function (sheet) {
            sheet.addEventListener('click', function (event) {
                if (event.target === sheet) closeSheets();
            });

            // Arrastar para baixo fecha, como a pega promete. Era o
            // unico gesto disponivel num telemovel: o toque fora
            // nao chegava ao fundo (pointer-events) e Escape nao
            // existe la.
            Sheets.enableDrag(sheet, closeSheets);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            if (!dom.msgSheet.classList.contains('hidden') || !dom.profSheet.classList.contains('hidden')) {
                closeSheets();
            } else if (isOpen()) {
                close();
            }
        });

        window.addEventListener('online', onConnectivityChange);
        window.addEventListener('offline', onConnectivityChange);
    }

    function isCoarsePointer() {
        return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    }

    // ==========================================================
    // O catalogo
    // ==========================================================

    async function load() {
        const result = await deps.cloud.listConversations();
        if (!result.ok) {
            renderListError();
            return { ok: false };
        }

        catalog = result.conversations || [];
        renderList();
        notifyUnread();
        return { ok: true };
    }

    function notifyUnread() {
        if (typeof deps.onUnreadChange === 'function') {
            deps.onUnreadChange(Conversations.totalUnread(catalog));
        }
    }

    // O nome de uma conversa nunca vem da base de dados: vem do
    // i18n, que ja traduz zonas e monumentos em tres idiomas.
    // Guardar titulos na tabela seria uma quarta copia por traduzir.
    function titleFor(conversation) {
        if (!conversation) return '';
        if (conversation.kind === 'general') return t('chatGeneralTitle');
        if (conversation.kind === 'zone') return deps.zoneName(conversation.zoneId);
        return deps.monumentName(conversation.monumentId);
    }

    function subtitleFor(conversation) {
        if (!conversation) return '';
        if (conversation.kind === 'general') return t('chatGeneralSub');

        if (conversation.kind === 'zone') {
            return t('chatZoneConversation') + ' · ' + deps.placeLabel();
        }

        const zone = deps.monumentZone(conversation.monumentId);
        return t('chatMonumentConversation') + (zone ? ' · ' + deps.zoneName(zone) : '');
    }

    function renderList() {
        if (!dom.list) return;

        const labelFor = function (c) { return titleFor(c) + ' ' + subtitleFor(c); };
        const visible = Conversations.filterConversations(catalog, searchQuery, labelFor);
        const split = Conversations.splitConversations(visible);

        dom.list.innerHTML = '';

        if (!visible.length) {
            const empty = document.createElement('p');
            empty.className = 'hh-cv-empty';
            empty.textContent = searchQuery.trim()
                ? t('chatNoResults', { q: searchQuery.trim() })
                : t('chatNoConversations');
            dom.list.appendChild(empty);
            return;
        }

        if (split.mine.length) {
            dom.list.appendChild(sectionTitle(t('chatYourConversations')));
            split.mine.forEach(function (c) { dom.list.appendChild(conversationCard(c)); });
        }

        if (split.explore.length) {
            dom.list.appendChild(sectionTitle(t('chatExplore')));
            split.explore.forEach(function (c) { dom.list.appendChild(conversationCard(c)); });
        }
    }

    function renderListError() {
        dom.list.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'hh-cv-empty';
        p.textContent = navigator.onLine ? t('chatLoadError') : t('chatOffline');
        dom.list.appendChild(p);
    }

    function sectionTitle(text) {
        const h = document.createElement('h3');
        h.className = 'hh-cv-section';
        h.textContent = text;
        return h;
    }

    function conversationCard(conversation) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'hh-cv-card';
        card.setAttribute('aria-label', t('chatOpenConversation') + ': ' + titleFor(conversation));

        const icon = document.createElement('span');
        icon.className = 'hh-cv-card-icon hh-cv-card-icon--' + conversation.kind;
        icon.innerHTML = '<i class="fas ' + iconFor(conversation.kind) + '" aria-hidden="true"></i>';
        card.appendChild(icon);

        const body = document.createElement('span');
        body.className = 'hh-cv-card-body';

        const top = document.createElement('span');
        top.className = 'hh-cv-card-top';

        const name = document.createElement('span');
        name.className = 'hh-cv-card-name';
        name.textContent = titleFor(conversation);
        top.appendChild(name);

        if (conversation.lastAt) {
            const when = document.createElement('span');
            when.className = 'hh-cv-card-when';
            when.textContent = deps.relativeTime(conversation.lastAt);
            top.appendChild(when);
        }
        body.appendChild(top);

        const preview = document.createElement('span');
        preview.className = 'hh-cv-card-preview';
        preview.textContent = previewText(conversation);
        body.appendChild(preview);

        card.appendChild(body);

        if (conversation.unread > 0) {
            const badge = document.createElement('span');
            badge.className = 'hh-cv-card-badge';
            badge.textContent = conversation.unread > 99 ? '99+' : String(conversation.unread);
            badge.setAttribute('aria-label', t('chatUnreadAria', { n: conversation.unread }));
            card.appendChild(badge);
        }

        card.addEventListener('click', function () { openConversation(conversation); });
        return card;
    }

    function iconFor(kind) {
        if (kind === 'general') return 'fa-users';
        if (kind === 'zone') return 'fa-location-dot';
        return 'fa-landmark';
    }

    function previewText(conversation) {
        const last = conversation.lastMessage;
        if (!last) return subtitleFor(conversation);

        // O preview de uma imagem ou de uma referencia nao tem texto:
        // o servidor manda o TIPO e a palavra escreve-se aqui, no
        // idioma de quem le.
        let body = last.body;
        if (last.kind === 'image') body = t('chatPhoto');
        else if (last.kind === 'reference') body = t('chatSharedPlace');
        else if (!body) body = t('chatDeleted');

        return last.author ? last.author + ': ' + body : body;
    }

    // ==========================================================
    // Abrir uma conversa
    // ==========================================================

    // Abrir pelo contexto, sem nunca escrever um id (ponto 50).
    async function openForMonument(monumentId, prefillKey) {
        if (!catalog.length) await load();

        const conversation = Conversations.findConversation(catalog, {
            kind: 'monument', monumentId: String(monumentId)
        });

        if (!conversation) return { ok: false };
        await openConversation(conversation);

        // Ponto 16: o texto e proposto, NUNCA enviado sozinho.
        if (prefillKey) {
            dom.input.value = t(prefillKey);
            onDraftChange();
            dom.input.focus();
        }

        return { ok: true };
    }

    async function openGeneral() {
        if (!catalog.length) await load();
        const conversation = Conversations.findConversation(catalog, { kind: 'general' });
        if (conversation) await openConversation(conversation);
    }

    async function openConversation(conversation) {
        current = conversation;
        messages = [];
        hasMore = false;
        missedCount = 0;
        signedPhotos = {};
        clearReply();
        clearPendingPhoto();

        dom.title.textContent = titleFor(conversation);
        dom.subtitle.textContent = subtitleFor(conversation);
        renderHero(conversation);

        dom.screen.classList.remove('hidden');
        document.body.classList.add('hh-chat-open');
        hideJump();
        dom.input.value = '';
        onDraftChange();
        updateOfflineNote();

        // Ponto 17: o aviso aparece ao ENTRAR, uma vez por monumento.
        maybeShowQrNotice(conversation);

        renderMessages();
        await loadLatest();

        // Marcar como lida so depois de termos mostrado alguma coisa:
        // marcar antes seria apagar o badge de mensagens que a pessoa
        // ainda nao chegou a ver.
        await deps.cloud.markConversationRead(conversation.id);
        conversation.unread = 0;
        conversation.joined = true;
        renderList();
        notifyUnread();

        subscribe();
    }

    function renderHero(conversation) {
        // Ponto 42: uma fotografia discreta, nunca um cabecalho que
        // come o ecra. So faz sentido num monumento.
        const image = conversation.kind === 'monument'
            ? deps.monumentImage(conversation.monumentId)
            : null;

        if (image) {
            dom.hero.src = image;
            dom.hero.classList.remove('hidden');
            dom.screen.classList.add('has-hero');
        } else {
            dom.hero.removeAttribute('src');
            dom.hero.classList.add('hidden');
            dom.screen.classList.remove('has-hero');
        }
    }

    function close() {
        unsubscribe();
        dom.screen.classList.add('hidden');
        document.body.classList.remove('hh-chat-open');
        closeSheets();
        current = null;
        messages = [];
        // Voltar da conversa tem de mostrar a lista ja actualizada:
        // a ultima mensagem e o badge mudaram enquanto la estivemos.
        load();
    }

    function isOpen() {
        return !!dom && !dom.screen.classList.contains('hidden');
    }

    function openAbout() {
        if (!current) return;
        if (current.kind === 'monument' && typeof deps.onOpenMonument === 'function') {
            close();
            deps.onOpenMonument(current.monumentId);
        }
    }

    // ==========================================================
    // Carregar mensagens
    // ==========================================================

    async function loadLatest() {
        if (!current) return;

        const result = await deps.cloud.getMessages(current.id, {
            limit: Conversations.CONFIG.PAGE_SIZE
        });

        if (!result.ok) {
            renderMessages();
            return;
        }

        messages = Conversations.mergeMessages([], result.messages || []);
        hasMore = result.hasMore === true;

        await signPhotos();
        renderMessages();
        scrollToBottom();
    }

    async function loadEarlier() {
        if (!current || loadingPage || !hasMore) return;

        loadingPage = true;
        dom.earlierBtn.textContent = t('chatLoading');

        // Guardar a altura antes de acrescentar: depois repomos a
        // posicao para a pagina nova crescer PARA CIMA e a pessoa
        // continuar a ler a mesma linha.
        const before = dom.scroll.scrollHeight;

        const result = await deps.cloud.getMessages(current.id, {
            before: Conversations.oldestAt(messages),
            limit: Conversations.CONFIG.PAGE_SIZE
        });

        if (result.ok) {
            messages = Conversations.mergeMessages(messages, result.messages || []);
            hasMore = result.hasMore === true;
            await signPhotos();
            renderMessages();
            dom.scroll.scrollTop = dom.scroll.scrollHeight - before;
        }

        dom.earlierBtn.textContent = t('chatLoadEarlier');
        loadingPage = false;
    }

    // Chamado quando o Realtime avisa. O evento e so o aviso: as
    // mensagens vem montadas, ja com autor (ver cloud.js).
    async function pullNew() {
        // A conversa fica presa numa constante: entre os `await`
        // daqui para baixo a pessoa pode fechar o chat, e `current`
        // passa a null (ver `close`).
        const conv = current;
        if (!conv) return;

        // `p_after` e exclusivo e sai de `messages`, que so e
        // actualizado no fim. Dois avisos do Realtime seguidos
        // partiriam do mesmo cursor, traziam a mesma linha e
        // somavam-na duas vezes ao aviso "N novas mensagens".
        if (pulling) return;
        pulling = true;

        try {
            const after = Conversations.latestAt(messages);
            const result = await deps.cloud.getMessages(conv.id, { after: after, limit: 100 });
            if (!result.ok || !result.messages || !result.messages.length) return;
            if (current !== conv) return;

            const atBottom = Conversations.isAtBottom(dom.scroll);
            const fromOthers = result.messages.filter(function (m) { return !m.mine; });

            messages = Conversations.mergeMessages(messages, result.messages);
            await signPhotos();
            if (current !== conv) return;
            renderMessages();

            if (atBottom) {
                scrollToBottom();
            } else if (fromOthers.length) {
                // Ponto 29: nao roubar o scroll a quem le para tras.
                missedCount += fromOthers.length;
                showJump();
            }

            await deps.cloud.markConversationRead(conv.id);
        } finally {
            pulling = false;
        }
    }

    async function signPhotos() {
        const paths = messages
            .filter(function (m) { return m.kind === 'image' && m.mediaPath && !signedPhotos[m.mediaPath]; })
            .map(function (m) { return m.mediaPath; });

        if (!paths.length) return;
        const urls = await deps.cloud.signChatUrls(paths);
        Object.keys(urls).forEach(function (p) { signedPhotos[p] = urls[p]; });
    }

    // ==========================================================
    // Tempo real
    // ==========================================================

    function subscribe() {
        unsubscribe();
        if (!current) return;
        channel = deps.cloud.subscribeToConversation(current.id, function () { pullNew(); });
    }

    function unsubscribe() {
        if (channel) {
            deps.cloud.unsubscribe(channel);
            channel = null;
        }
    }

    // ==========================================================
    // Desenhar mensagens
    // ==========================================================

    function renderMessages() {
        dom.msgs.innerHTML = '';
        dom.earlier.classList.toggle('hidden', !hasMore);

        if (!messages.length) {
            renderEmpty();
            return;
        }
        dom.empty.classList.add('hidden');

        const groups = Conversations.groupMessages(messages);
        groups.forEach(function (group) {
            dom.msgs.appendChild(renderGroup(group));
        });
    }

    function renderEmpty() {
        const monument = current && current.kind === 'monument';

        dom.empty.innerHTML = '';
        dom.empty.classList.remove('hidden');

        const title = document.createElement('p');
        title.className = 'hh-chat-empty-title';
        title.textContent = t(monument ? 'chatEmptyMonumentTitle' : 'chatEmptyTitle');

        const sub = document.createElement('p');
        sub.className = 'hh-chat-empty-sub';
        sub.textContent = t(monument ? 'chatEmptyMonumentSub' : 'chatEmptySub');

        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'hh-chat-empty-btn';
        action.textContent = t('chatEmptyAction');
        action.addEventListener('click', function () { dom.input.focus(); });

        dom.empty.appendChild(title);
        dom.empty.appendChild(sub);
        dom.empty.appendChild(action);
    }

    function renderGroup(group) {
        const wrap = document.createElement('div');
        wrap.className = 'hh-chat-group' + (group.mine ? ' is-mine' : '');

        // Ponto 10: avatar e nome uma vez por bloco, nao por mensagem.
        if (!group.mine && group.author) {
            wrap.appendChild(renderAuthorRow(group.author));
        }

        group.messages.forEach(function (message) {
            wrap.appendChild(renderMessage(message, group.mine));
        });

        return wrap;
    }

    function renderAuthorRow(author) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'hh-chat-author';

        row.appendChild(avatarFor(author));

        const text = document.createElement('span');
        text.className = 'hh-chat-author-text';

        const name = document.createElement('span');
        name.className = 'hh-chat-author-name';
        name.textContent = author.name || t('chatProfileTitle');
        text.appendChild(name);

        const meta = document.createElement('span');
        meta.className = 'hh-chat-author-meta';
        meta.textContent = t('chatLevel', { n: deps.levelFor(author.xpTotal) });

        // Ponto 20: quem descobriu este monumento provavelmente sabe
        // do que fala. Um selo discreto, nunca um destaque.
        if (author.discovered === true) {
            const seal = document.createElement('span');
            seal.className = 'hh-chat-seal';
            seal.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
            seal.appendChild(document.createTextNode(' ' + t('chatDiscovered')));
            meta.appendChild(document.createTextNode(' · '));
            meta.appendChild(seal);
        }

        text.appendChild(meta);
        row.appendChild(text);

        row.addEventListener('click', function () { openProfile(author); });
        return row;
    }

    function avatarFor(author) {
        const wrap = document.createElement('span');
        wrap.className = 'hh-chat-avatar';

        const url = author && author.avatarPath ? deps.avatarUrl(author.avatarPath) : null;
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            // Um avatar que nao carrega cai para a inicial, nunca
            // deixa um quadrado partido no meio da conversa.
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

    function renderMessage(message, mine) {
        const row = document.createElement('div');
        row.className = 'hh-chat-msg' + (mine ? ' is-mine' : '');
        row.dataset.id = message.id;

        if (message.deleted) {
            row.classList.add('is-deleted');
            const gone = document.createElement('p');
            gone.className = 'hh-chat-text';
            gone.textContent = t('chatDeleted');
            row.appendChild(gone);
            return row;
        }

        if (message.replyTo) row.appendChild(renderQuote(message.replyTo));

        if (message.kind === 'image') {
            row.appendChild(renderImage(message));
        } else if (message.kind === 'reference') {
            row.appendChild(renderReference(message));
        }

        if (message.body) {
            const text = document.createElement('p');
            text.className = 'hh-chat-text';
            text.textContent = message.body;
            row.appendChild(text);
        }

        row.appendChild(renderMeta(message, mine));

        // Premir e manter abre o menu (ponto 18). No computador, o
        // clique direito faz o mesmo.
        attachLongPress(row, function () { openMessageSheet(message); });

        return row;
    }

    function renderQuote(quote) {
        const box = document.createElement('div');
        box.className = 'hh-chat-quote';

        const author = document.createElement('span');
        author.className = 'hh-chat-quote-author';
        author.textContent = quote.author || '';
        box.appendChild(author);

        const text = document.createElement('span');
        text.className = 'hh-chat-quote-text';
        text.textContent = quote.deleted ? t('chatDeleted') : quote.body;
        box.appendChild(text);

        return box;
    }

    function renderImage(message) {
        const figure = document.createElement('figure');
        figure.className = 'hh-chat-photo';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = t('chatPhoto');
        img.src = message.mediaPreview || signedPhotos[message.mediaPath] || '';
        figure.appendChild(img);

        return figure;
    }

    // Ponto 14 e 54: uma referencia e uma saida para o mundo real.
    function renderReference(message) {
        const card = document.createElement('div');
        card.className = 'hh-chat-ref';

        const name = document.createElement('p');
        name.className = 'hh-chat-ref-name';
        name.textContent = message.referenceKind === 'zone'
            ? deps.zoneName(message.referenceId)
            : deps.monumentName(message.referenceId);
        card.appendChild(name);

        const place = document.createElement('p');
        place.className = 'hh-chat-ref-place';
        const zone = message.referenceKind === 'monument' ? deps.monumentZone(message.referenceId) : null;
        place.textContent = zone ? deps.zoneName(zone) : deps.placeLabel();
        card.appendChild(place);

        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'hh-chat-ref-btn';
        action.textContent = t('chatViewOnMap');
        action.addEventListener('click', function (event) {
            event.stopPropagation();
            if (typeof deps.onViewOnMap === 'function') {
                close();
                deps.onViewOnMap(message.referenceId, message.referenceKind);
            }
        });
        card.appendChild(action);

        return card;
    }

    function renderMeta(message, mine) {
        const meta = document.createElement('div');
        meta.className = 'hh-chat-meta';

        const time = document.createElement('span');
        time.className = 'hh-chat-time';
        time.textContent = deps.clockTime(message.createdAt);
        meta.appendChild(time);

        if (message.editedAt) {
            const edited = document.createElement('span');
            edited.className = 'hh-chat-edited';
            edited.textContent = t('chatEdited');
            meta.appendChild(edited);
        }

        // Ponto 26: o estado de envio e sempre visivel, e falhar
        // oferece sempre uma saida.
        if (message.pending) {
            const state = document.createElement('span');
            state.className = 'hh-chat-state is-' + message.status;
            state.textContent = t(message.status === 'failed' ? 'chatFailed' : 'chatSending');
            meta.appendChild(state);

            if (message.status === 'failed') {
                const retry = document.createElement('button');
                retry.type = 'button';
                retry.className = 'hh-chat-retry';
                retry.textContent = t('chatRetry');
                retry.addEventListener('click', function () { retrySend(message); });
                meta.appendChild(retry);
            }
            return meta;
        }

        // Ponto 37: uma reaccao so, e so onde ajuda mesmo — os
        // chats de monumento. "Ajudou-me" nao e um gosto.
        if (!mine && current && current.kind === 'monument') {
            meta.appendChild(helpfulButton(message));
        } else if (message.helpfulCount > 0) {
            const count = document.createElement('span');
            count.className = 'hh-chat-helpful-count';
            count.innerHTML = '<i class="far fa-lightbulb" aria-hidden="true"></i> ' + message.helpfulCount;
            meta.appendChild(count);
        }

        return meta;
    }

    function helpfulButton(message) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hh-chat-helpful' + (message.helpfulByMe ? ' is-on' : '');
        btn.setAttribute('aria-pressed', message.helpfulByMe ? 'true' : 'false');
        btn.setAttribute('aria-label', t('chatHelpfulAria'));
        btn.innerHTML = '<i class="far fa-lightbulb" aria-hidden="true"></i><span>' +
            t('chatHelpful') + (message.helpfulCount ? ' ' + message.helpfulCount : '') + '</span>';

        btn.addEventListener('click', async function (event) {
            event.stopPropagation();
            const next = !message.helpfulByMe;

            // Resposta imediata; o servidor corrige se for preciso.
            const hadByMe = message.helpfulByMe;
            const hadCount = message.helpfulCount || 0;

            message.helpfulByMe = next;
            message.helpfulCount = Math.max(0, hadCount + (next ? 1 : -1));
            renderMessages();

            const result = await deps.cloud.setMessageHelpful(message.id, next);
            if (result.ok) {
                message.helpfulCount = result.helpfulCount;
                message.helpfulByMe = result.helpfulByMe;
            } else {
                // Sem rede ou recusado: desfazer. Deixar o numero
                // inflacionado seria mentir ate reabrir a conversa
                // — as pistas e as publicacoes ja desfazem.
                message.helpfulByMe = hadByMe;
                message.helpfulCount = hadCount;
            }
            renderMessages();
        });

        return btn;
    }

    // ==========================================================
    // Escrever
    // ==========================================================

    function onDraftChange() {
        const text = dom.input.value;

        // A caixa cresce com o texto, ate um tecto. Sem o tecto, uma
        // mensagem longa empurrava as mensagens todas para fora.
        dom.input.style.height = 'auto';
        dom.input.style.height = Math.min(dom.input.scrollHeight, 132) + 'px';

        const show = Conversations.shouldShowCounter(text);
        dom.counter.classList.toggle('hidden', !show);
        if (show) dom.counter.textContent = t('chatCharsLeft', { n: Conversations.remainingChars(text) });

        const canSend = (Conversations.validateDraft(text).ok || !!pendingPhoto) && navigator.onLine;
        dom.send.disabled = !canSend;
    }

    async function submit() {
        if (!current) return;

        if (!navigator.onLine) {
            updateOfflineNote();
            return;
        }

        const text = dom.input.value;
        const checked = Conversations.validateDraft(text);

        if (!checked.ok && !pendingPhoto) return;

        // Com fotografia o botao fica activo seja qual for a
        // legenda — mas uma legenda longa de mais nao pode ser
        // deitada fora sem dizer nada (ponto 26).
        if (!checked.ok && checked.reason === 'too_long') {
            deps.toast(t('chatTooLong'));
            return;
        }

        const draft = {
            kind: pendingPhoto ? 'image' : 'text',
            body: checked.ok ? checked.body : '',
            replyTo: replyTo ? replyTo.id : null,
            mediaPreview: pendingPhoto ? pendingPhoto.previewUrl : null
        };

        // Ponto 26: aparece ja, marcada como "a enviar".
        const pending = Conversations.createPending(draft, deps.myAuthor());
        if (!pending) return;

        // A citacao tem de aparecer na mensagem optimista tambem,
        // senao a resposta "salta" quando o servidor confirma.
        if (replyTo) {
            pending.replyTo = {
                id: replyTo.id,
                body: (replyTo.body || '').slice(0, 140),
                deleted: replyTo.deleted === true,
                author: replyTo.author ? replyTo.author.name : ''
            };
        }

        const photo = pendingPhoto;
        messages = Conversations.mergeMessages(messages, [pending]);

        dom.input.value = '';
        clearReply();
        clearPendingPhoto(true);
        onDraftChange();
        renderMessages();
        scrollToBottom();

        await deliver(pending, photo);
    }

    async function deliver(pending, photo) {
        let mediaPath = pending.mediaPath;

        // O id da conversa fica preso aqui. Subir uma fotografia
        // demora, e tocar em "voltar" a meio punha `current` a null
        // — a linha seguinte rebentava e a mensagem ficava
        // eternamente "a enviar", sem [tentar novamente]. O envio
        // continua: a mensagem e da pessoa, nao do ecra.
        const conv = current;
        if (!conv) return;

        // A fotografia sobe primeiro. Se falhar, a mensagem fica
        // por enviar com [tentar novamente] — nunca sobe uma
        // mensagem de imagem sem imagem.
        if (photo && !mediaPath) {
            const path = deps.cloud.chatPhotoPath(conv.id, photo.extension);
            const upload = await deps.cloud.uploadChatImage(path, photo.blob, photo.contentType);

            if (!upload.ok) {
                pending.photo = photo;
                failPending(pending);
                return;
            }
            mediaPath = path;
            pending.mediaPath = path;
        }

        const result = await deps.cloud.sendMessage(conv.id, {
            kind: pending.kind,
            body: pending.body,
            mediaPath: mediaPath,
            replyTo: pending.replyTo ? pending.replyTo.id : null,
            referenceKind: pending.referenceKind,
            referenceId: pending.referenceId
        });

        if (!result.ok) {
            pending.photo = photo;
            failPending(pending, result.reason);
            return;
        }

        // Entregue. Se o chat ja fechou nao ha nada para desenhar
        // — reabrir traz a mensagem do servidor.
        if (current !== conv) { load(); return; }

        messages = Conversations.reconcilePending(messages, pending.localId, result.message);
        await signPhotos();
        renderMessages();
        scrollToBottom();

        // A lista de conversas tambem mudou: a ultima mensagem e
        // agora esta.
        load();
    }

    function failPending(pending, reason) {
        messages = Conversations.markFailed(messages, pending.localId);
        renderMessages();

        if (reason === 'rate_limited') deps.toast(t('chatRateLimited'));
        else if (reason === 'too_long') deps.toast(t('chatTooLong'));
    }

    async function retrySend(message) {
        // `markSending` devolve COPIAS: continuar a usar `message`
        // escrevia o `mediaPath` num objecto ja fora da lista, e a
        // tentativa seguinte voltava a subir a mesma fotografia,
        // deixando a anterior orfa no bucket.
        messages = Conversations.markSending(messages, message.localId);
        renderMessages();

        const pending = messages.filter(function (m) {
            return m && m.localId === message.localId;
        })[0];
        if (!pending) return;

        if (!pending.photo && message.photo) pending.photo = message.photo;
        await deliver(pending, pending.photo || null);
    }

    // ==========================================================
    // Responder, fotografia, referencia
    // ==========================================================

    function startReply(message) {
        replyTo = message;
        dom.replyAuthor.textContent = message.author ? message.author.name : '';
        dom.replyText.textContent = message.deleted ? t('chatDeleted') : (message.body || t('chatPhoto'));
        dom.replyBar.classList.remove('hidden');
        dom.input.focus();
    }

    function clearReply() {
        replyTo = null;
        if (dom.replyBar) dom.replyBar.classList.add('hidden');
    }

    function openAttachMenu() {
        openSheet(dom.msgSheet, dom.msgSheetBody, [
            { icon: 'fa-camera', label: t('chatAttachPhoto'), action: function () { dom.cameraInput.click(); } },
            { icon: 'fa-image', label: t('chatPhoto'), action: function () { dom.photoInput.click(); } },
            { icon: 'fa-landmark', label: t('chatAttachMonument'), action: openMonumentPicker }
        ]);
    }

    async function onPhotoChosen(file) {
        if (!file) return;

        // Ponto 13: a mesma compressao do album. Nunca sobe o
        // original pesado, e nunca ha Base64 em lado nenhum.
        const compressed = await deps.compressImage(file);
        if (!compressed || !compressed.blob) return;

        clearPendingPhoto();
        pendingPhoto = {
            blob: compressed.blob,
            previewUrl: URL.createObjectURL(compressed.blob),
            extension: compressed.extension,
            contentType: compressed.contentType
        };

        dom.pendPhotoImg.src = pendingPhoto.previewUrl;
        dom.pendPhoto.classList.remove('hidden');
        onDraftChange();

        dom.photoInput.value = '';
        dom.cameraInput.value = '';
    }

    function clearPendingPhoto(keepUrl) {
        // A pre-visualizacao fica viva enquanto a mensagem optimista
        // a mostra; so se revoga o URL quando ninguem a usa.
        if (pendingPhoto && pendingPhoto.previewUrl && !keepUrl) {
            URL.revokeObjectURL(pendingPhoto.previewUrl);
        }
        pendingPhoto = null;
        if (dom.pendPhoto) {
            dom.pendPhoto.classList.add('hidden');
            dom.pendPhotoImg.removeAttribute('src');
        }
        onDraftChange();
    }

    function openMonumentPicker() {
        const options = deps.discoveredMonuments().map(function (m) {
            return {
                icon: 'fa-landmark',
                label: deps.monumentName(m.id),
                action: function () { shareMonument(m.id); }
            };
        });

        if (!options.length) {
            deps.toast(t('chatEmptySub'));
            return;
        }
        openSheet(dom.msgSheet, dom.msgSheetBody, options);
    }

    async function shareMonument(monumentId) {
        const pending = Conversations.createPending({
            kind: 'reference',
            body: '',
            referenceKind: 'monument',
            referenceId: String(monumentId)
        }, deps.myAuthor());

        messages = Conversations.mergeMessages(messages, [pending]);
        renderMessages();
        scrollToBottom();
        await deliver(pending, null);
    }

    // ==========================================================
    // Menu de mensagem, denuncia e perfil
    // ==========================================================

    function openMessageSheet(message) {
        if (message.pending) return;

        const options = [];

        if (!message.deleted) {
            options.push({ icon: 'fa-reply', label: t('chatReply'), action: function () { startReply(message); } });

            if (message.body) {
                options.push({
                    icon: 'fa-copy', label: t('chatCopy'), action: function () {
                        navigator.clipboard.writeText(message.body).then(function () {
                            deps.toast(t('chatCopied'));
                        }, function () { /* sem permissao: nao ha nada a dizer */ });
                    }
                });
            }
        }

        if (message.mine && !message.deleted) {
            options.push({
                icon: 'fa-trash', label: t('chatDelete'), danger: true,
                action: async function () {
                    const result = await deps.cloud.deleteMessage(message.id);
                    if (result.ok) {
                        message.deleted = true;
                        message.body = '';
                        renderMessages();
                    }
                }
            });
        } else if (!message.mine) {
            options.push({
                icon: 'fa-flag', label: t('chatReport'), danger: true,
                action: function () { openReportSheet(message); }
            });
        }

        // Na minha propria mensagem ja apagada nao sobra accao
        // nenhuma: responder e copiar estao fora, apagar tambem, e
        // denunciar e so para as dos outros. Uma folha vazia a
        // subir nao diz nada a ninguem.
        if (!options.length) return;

        openSheet(dom.msgSheet, dom.msgSheetBody, options);
    }

    function openReportSheet(message) {
        const reasons = [
            ['qr_location', 'chatReportQr'],
            ['incorrect', 'chatReportIncorrect'],
            ['spam', 'chatReportSpam'],
            ['harassment', 'chatReportHarassment'],
            ['other', 'chatReportOther']
        ];

        const options = reasons.map(function (pair) {
            return {
                icon: 'fa-flag',
                label: t(pair[1]),
                action: async function () {
                    await deps.cloud.reportMessage(message.id, pair[0]);
                    // Ponto 48: agradecer e dizer que vai ser vista.
                    // Nunca prometer que foi removida.
                    deps.toast(t('chatReportThanks'));
                }
            };
        });

        openSheet(dom.msgSheet, dom.msgSheetBody, options, t('chatReportLead'));
    }

    // Ponto 38: perfil publico, e so o que o ponto 22 permite.
    // O PERFIL PUBLICO (pontos 6, 45 e 27)
    //
    // Abre JA com o que o autor traz consigo — nome, avatar,
    // nivel — e preenche os numeros quando o servidor responder.
    // Esperar pela rede para mostrar um nome que ja esta em
    // memoria seria um ecra vazio sem motivo.
    //
    // A ORDEM E A MENSAGEM (ponto 7): monumentos, pistas, ajuda e
    // memorias em cima; seguidores e a seguir numa linha pequena
    // por baixo. Nunca o contrario.
    //
    // Nao sai daqui nada que o `public_author` nao de: sem email,
    // sem localizacao, sem album privado (ponto 27).
    async function openProfile(rawAuthor) {
        const author = FollowsUI.reconcile(rawAuthor);
        if (!author || !author.userId) return;

        const pedido = ++profileRequest;

        dom.profBody.innerHTML = '';

        const head = document.createElement('div');
        head.className = 'hh-chat-prof-head';
        head.appendChild(avatarFor(author));

        const text = document.createElement('div');
        const name = document.createElement('p');
        name.className = 'hh-chat-prof-name';
        name.textContent = author.name || t('chatProfileTitle');
        text.appendChild(name);

        const level = document.createElement('p');
        level.className = 'hh-chat-prof-level';
        level.textContent = t('chatLevel', { n: deps.levelFor(author.xpTotal) });
        text.appendChild(level);

        head.appendChild(text);
        dom.profBody.appendChild(head);

        dom.profSheet.classList.remove('hidden');
        requestAnimationFrame(function () { dom.profSheet.classList.add('is-open'); });

        const result = await deps.cloud.getExplorer(author.userId);

        // Outro perfil foi aberto entretanto, ou a folha fechou:
        // o que vem agora ja nao e sobre quem esta no ecra.
        if (pedido !== profileRequest) return;
        if (dom.profSheet.classList.contains('hidden')) return;
        if (!result.ok) return;

        // A ORDEM IMPORTA. Isto veio agora do servidor — e a
        // verdade mais fresca que ha. Reconciliar primeiro deixava
        // a cache ANTIGA sobrepor-se a resposta NOVA: depois de
        // deixar de seguir noutro aparelho, o perfil reabria a
        // dizer "A seguir". Guarda-se primeiro, usa-se tal e qual.
        FollowsUI.remember(result.author);
        const explorer = Object.assign({}, result);

        dom.profBody.appendChild(FollowsUI.statsFor(explorer));

        const actions = document.createElement('div');
        actions.className = 'hh-chat-prof-actions';
        const follow = FollowsUI.button(explorer.author, { size: 'md', variant: 'solid' });
        if (follow) actions.appendChild(follow);
        dom.profBody.appendChild(actions);

        dom.profBody.appendChild(FollowsUI.countersFor(explorer));
    }

    // PONTO 40 — as copias que este modulo guarda.
    function applyAuthorUpdate(author) {
        if (!author || !author.userId) return;

        messages = (messages || []).map(function (m) {
            if (!m || !m.author || m.author.userId !== author.userId) return m;
            return Object.assign({}, m, { author: Object.assign({}, m.author, author) });
        });
    }

    function openSheet(sheet, body, options, lead) {
        body.innerHTML = '';

        if (lead) {
            const p = document.createElement('p');
            p.className = 'hh-chat-sheet-lead';
            p.textContent = lead;
            body.appendChild(p);
        }

        options.forEach(function (option) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hh-chat-sheet-item' + (option.danger ? ' is-danger' : '');
            btn.innerHTML = '<i class="fas ' + option.icon + '" aria-hidden="true"></i>';
            btn.appendChild(document.createTextNode(option.label));
            btn.addEventListener('click', function () {
                closeSheets();
                option.action();
            });
            body.appendChild(btn);
        });

        sheet.classList.remove('hidden');
        requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    }

    function closeSheets() {
        profileRequest++;
        if (typeof FollowsUI !== 'undefined') FollowsUI.forgetCounters();

        [dom.msgSheet, dom.profSheet].forEach(function (sheet) {
            if (!sheet) return;
            sheet.classList.remove('is-open');
            sheet.classList.add('hidden');
        });
    }

    // ==========================================================
    // Aviso das pistas
    // ==========================================================

    function maybeShowQrNotice(conversation) {
        const seen = readQrSeen();
        const show = Conversations.shouldWarnAboutQr(conversation, seen);
        dom.notice.classList.toggle('hidden', !show);
    }

    function dismissQrNotice() {
        dom.notice.classList.add('hidden');
        if (current && current.kind === 'monument') {
            writeQrSeen(Conversations.rememberQrWarning(readQrSeen(), current.monumentId));
        }
    }

    function readQrSeen() {
        try {
            const raw = localStorage.getItem(QR_SEEN_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function writeQrSeen(list) {
        try {
            localStorage.setItem(QR_SEEN_KEY, JSON.stringify(list));
        } catch (e) { /* sem espaco: o aviso volta a aparecer, e aceitavel */ }
    }

    // ==========================================================
    // Scroll, ligacao e gestos
    // ==========================================================

    function scrollToBottom() {
        requestAnimationFrame(function () {
            dom.scroll.scrollTop = dom.scroll.scrollHeight;
        });
    }

    function showJump() {
        dom.jump.textContent = missedCount === 1
            ? t('chatNewMessages', { n: 1 })
            : t('chatNewMessagesPlural', { n: missedCount });
        dom.jump.classList.remove('hidden');
    }

    function hideJump() {
        missedCount = 0;
        if (dom.jump) dom.jump.classList.add('hidden');
    }

    // Ponto 27: o chat exige ligacao. Nao ha fila de mensagens
    // offline — o que havia carregado continua a ler-se, mas
    // escrever espera pela rede.
    function onConnectivityChange() {
        updateOfflineNote();
        onDraftChange();
        if (navigator.onLine && current) pullNew();
    }

    function updateOfflineNote() {
        if (!dom.offline) return;
        dom.offline.classList.toggle('hidden', navigator.onLine);
    }

    function attachLongPress(element, handler) {
        let timer = null;

        element.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            handler();
        });

        element.addEventListener('touchstart', function () {
            timer = setTimeout(handler, 500);
        }, { passive: true });

        ['touchend', 'touchmove', 'touchcancel'].forEach(function (name) {
            element.addEventListener(name, function () {
                if (timer) { clearTimeout(timer); timer = null; }
            }, { passive: true });
        });
    }

    return {
        init: init,
        load: load,
        renderList: renderList,
        openConversation: openConversation,
        openForMonument: openForMonument,
        openGeneral: openGeneral,
        close: close,
        isOpen: isOpen,
        openProfile: openProfile,
        applyAuthorUpdate: applyAuthorUpdate,
        getCatalog: function () { return catalog.slice(); },
        totalUnread: function () { return Conversations.totalUnread(catalog); }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConversationsUI: ConversationsUI };
}
