// ============================================================
// Heritage Hunt CV — Comunidade (interface)
//
// A casa do social. Tres abas:
//
//   Descobertas  — as publicacoes da comunidade
//   Pistas       — pistas por monumento, so de quem descobriu
//   Conversas    — o chat
//
// CADA ABA CARREGA QUANDO E VISTA, nao quando a Comunidade abre.
// Sao duas chamadas a rede que nao se fazem a quem so queria ver
// uma delas.
//
// O RANKING NAO E UMA ABA, E JA NAO VIVE AQUI
//
// Chegou a abrir-se por um trofeu no cabecalho desta seccao. Nao
// chega: o Ranking e uma vista propria, com cabecalho em
// fotografia ate ao topo, e esconde-lo dentro da Comunidade fazia
// dele um detalhe de uma coisa de que nao faz parte.
//
// Voltou a barra de baixo, entre a Comunidade e o Perfil. Esta
// seccao deixou de saber que ele existe.
// ============================================================

const CommunityUI = (function () {
    'use strict';

    const TAB_KEY = 'heritageCommunityTab';

    let dom = null;
    let deps = null;
    let activeTab = 'conversations';
    let loadedOnce = false;

    function init(options) {
        deps = options || {};

        dom = {
            view:    document.getElementById('communityView'),
            tabs:    Array.prototype.slice.call(document.querySelectorAll('[data-cm-tab]')),
            panels:  Array.prototype.slice.call(document.querySelectorAll('[data-cm-panel]')),
            navDot:  document.getElementById('navCommunityDot')
        };

        if (!dom.view) return;

        dom.tabs.forEach(function (tab) {
            tab.addEventListener('click', function () { setTab(tab.dataset.cmTab); });
        });

        // A aba escolhida sobrevive a recarregar a pagina: voltar a
        // Comunidade devolve a pessoa onde ela estava.
        setTab(readTab(), { silent: true });
    }

    // Abrir a seccao. A primeira vez carrega o catalogo; as
    // seguintes refrescam-no, porque o que mudou foram as mensagens
    // e os badges, nao a estrutura.
    function show() {
        if (!dom || !dom.view) return;

        dom.view.classList.remove('hidden');

        if (activeTab === 'conversations') {
            ConversationsUI.load();
            loadedOnce = true;
        } else if (activeTab === 'discoveries') {
            PostsUI.load();
            loadedOnce = true;
        } else if (activeTab === 'clues') {
            CluesUI.load();
            loadedOnce = true;
        }

        if (typeof PostsUI !== 'undefined') PostsUI.setFabVisible(activeTab === 'discoveries');
    }

    function hide() {
        if (dom && dom.view) dom.view.classList.add('hidden');
    }

    function isVisible() {
        return !!dom && !!dom.view && !dom.view.classList.contains('hidden');
    }

    function setTab(name, options) {
        const wanted = ['discoveries', 'clues', 'conversations'].indexOf(name) !== -1
            ? name
            : 'conversations';

        activeTab = wanted;
        writeTab(wanted);

        dom.tabs.forEach(function (tab) {
            const on = tab.dataset.cmTab === wanted;
            tab.classList.toggle('is-active', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });

        dom.panels.forEach(function (panel) {
            panel.classList.toggle('hidden', panel.dataset.cmPanel !== wanted);
        });

        // O botao de criar pertence so as Descobertas: nas
        // Conversas escreve-se dentro da conversa.
        if (typeof PostsUI !== 'undefined') PostsUI.setFabVisible(wanted === 'discoveries');

        const silent = options && options.silent;
        if (silent) return;

        // Cada aba carrega quando e vista pela primeira vez. Carregar
        // as tres ao abrir a Comunidade seria pagar por duas que
        // ninguem pediu.
        if (wanted === 'conversations') ConversationsUI.load();
        else if (wanted === 'discoveries') PostsUI.load();
        else if (wanted === 'clues') CluesUI.load();
    }

    // O ponto vermelho na barra de baixo. Nao traz numero: na
    // navegacao interessa que HA novidades, nao quantas — o numero
    // exacto esta no cartao de cada conversa (ponto 30).
    function setUnread(total) {
        if (!dom || !dom.navDot) return;
        dom.navDot.classList.toggle('hidden', !(total > 0));
    }

    function readTab() {
        try {
            return localStorage.getItem(TAB_KEY) || 'conversations';
        } catch (e) {
            return 'conversations';
        }
    }

    function writeTab(name) {
        try {
            localStorage.setItem(TAB_KEY, name);
        } catch (e) { /* sem espaco: volta a abrir nas Conversas */ }
    }

    return {
        init: init,
        show: show,
        hide: hide,
        isVisible: isVisible,
        setTab: setTab,
        setUnread: setUnread,
        getTab: function () { return activeTab; }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CommunityUI: CommunityUI };
}
