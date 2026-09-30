// ============================================================
// Heritage Hunt CV — Loop de descoberta (interface)
//
// O componente reutilizavel "PROXIMA DESCOBERTA" (ponto 6), a
// linha "QUASE LA" (ponto 8) e as barras de zona (ponto 16).
//
// Desenha a partir do que engagement.js decidiu. Nao escolhe
// monumentos, nao mede progresso e nao grava nada: recebe o que
// mostrar e mostra.
//
// O mesmo cartao serve o Mapa, o Scanner, o resumo da Jornada e a
// celebracao de descoberta — e por isso que os construtores de HTML
// sao publicos: quem precisa dele pede-o, em vez de o copiar
// (ponto 7: nunca cinco cartoes iguais no mesmo ecra).
//
// Identidade visual: os cartoes existentes, os tokens existentes e
// os icones da biblioteca que a app ja carrega. Nunca emojis na UI
// final (pontos 6 e 46).
// ============================================================

const EngagementUI = (function () {
    'use strict';

    const handlers = {
        onShowOnMap: null,
        onOpenAlbum: null,
        onOpenJourney: null,
        onOpenMemories: null,
        onMissionContinue: null,
        // Analytics: chamado quando o cartao leva mesmo a alguma coisa
        onNextDiscoveryClick: null
    };

    let elements = {};

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Mesmo formato usado pela jornada e pela sequencia
    function formatDistance(meters) {
        if (typeof meters !== 'number' || !isFinite(meters)) return null;
        if (meters >= 1000) return (meters / 1000).toFixed(1).replace('.', ',') + ' km';
        return Math.round(meters) + ' m';
    }

    // ==========================================================
    // QUASE LA (pontos 8 e 9)
    //
    // Uma linha, nunca duas. O dominio escolheu a regra; aqui so se
    // traduz. As zonas e os niveis entram pelos nomes traduzidos
    // que ja existem (zoneName, levelName).
    // ==========================================================
    function almostText(almost) {
        if (!almost) return '';

        const vars = Object.assign({}, almost.vars || {});
        if (vars.zone) vars.zone = zoneName(vars.zone);
        if (vars.level) vars.level = levelName(vars.level);

        return t('engagement.almost.' + almost.rule, vars);
    }

    function almostHtml(almost) {
        const text = almostText(almost);
        if (!text) return '';

        return '' +
            '<p class="hh-eng-almost' + (almost.isMajor ? ' is-major' : '') + '" data-eng-step>' +
                '<i class="fas fa-bullseye" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(text) + '</span>' +
            '</p>';
    }

    // ==========================================================
    // Barra de uma zona (ponto 16)
    // ==========================================================
    function zoneBarHtml(zone) {
        if (!zone || !zone.total) return '';

        const label = zone.isComplete
            ? t('engagement.zoneComplete')
            : t('engagement.zoneProgress', { done: zone.discovered, total: zone.total });

        return '' +
            '<div class="hh-eng-zone' + (zone.isComplete ? ' is-complete' : '') + '" data-eng-step>' +
                '<div class="hh-eng-zone-head">' +
                    '<p class="hh-eng-zone-name">' + escapeHtml(zoneName(zone.zoneId)) + '</p>' +
                    '<span class="hh-eng-zone-count">' + zone.discovered + ' / ' + zone.total + '</span>' +
                '</div>' +
                '<div class="hh-eng-zone-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                    ' aria-valuenow="' + zone.percent + '"' +
                    ' aria-label="' + escapeHtml(zoneName(zone.zoneId)) + '"' +
                    ' aria-valuetext="' + escapeHtml(label) + '">' +
                    '<div class="hh-eng-zone-fill" style="width: ' + zone.percent + '%"></div>' +
                '</div>' +
                '<p class="hh-eng-zone-note">' + escapeHtml(label) + '</p>' +
            '</div>';
    }

    // ==========================================================
    // PROXIMA DESCOBERTA (pontos 4, 6 e 37)
    //
    // `variant`:
    //   'full'     cartao com fotografia (Mapa, Scanner)
    //   'compact'  linha com icone (celebracao, resumo da jornada)
    //
    // A 11/12 o cartao ganha peso proprio: e o momento mais
    // importante da jornada antes do fim (ponto 37).
    // ==========================================================
    function kickerFor(next) {
        if (next.reason === Engagement.REASON.LAST_IN_JOURNEY) return t('engagement.lastDiscovery');
        if (next.reason === Engagement.REASON.FIRST) return t('engagement.firstDiscovery');
        return t('engagement.nextDiscovery');
    }

    function reasonText(next) {
        const vars = {
            zone: next.zoneId ? zoneName(next.zoneId) : '',
            journey: journeyName(Journey.getDefaultJourneyId())
        };
        return t('engagement.reason.' + next.reason, vars);
    }

    function metaHtml(next) {
        const zone = next.zoneId ? zoneName(next.zoneId) : '';
        const distance = formatDistance(next.distance);

        const parts = [];
        if (zone) {
            parts.push('<span class="hh-eng-next-zone">' + escapeHtml(zone) + '</span>');
        }
        // Sem localizacao nao ha distancia, e o cartao mostra-se na
        // mesma — nunca se pede a localizacao por causa disto (ponto 49)
        if (distance) {
            parts.push(
                '<span class="hh-eng-next-distance">' +
                    '<i class="fas fa-location-dot" aria-hidden="true"></i> ' +
                    escapeHtml(distance) +
                '</span>'
            );
        }

        return parts.length ? '<p class="hh-eng-next-meta">' + parts.join('') + '</p>' : '';
    }

    function mapButtonHtml(next) {
        return '' +
            '<button type="button" class="hh-eng-next-btn" data-eng-action="map"' +
                ' data-eng-monument="' + escapeHtml(next.monumentId) + '">' +
                '<i class="fas fa-map-location-dot" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(t('engagement.viewOnMap')) + '</span>' +
            '</button>';
    }

    function nextCardHtml(next, options) {
        if (!next) return '';

        const config = options || {};
        const compact = config.variant === 'compact';
        const isMajor = next.reason === Engagement.REASON.LAST_IN_JOURNEY;

        const classes = ['hh-eng-next'];
        if (compact) classes.push('is-compact');
        if (isMajor) classes.push('is-major');

        const reason = config.hideReason ? '' : reasonText(next);

        // Variante compacta: sem fotografia, para nao competir com a
        // fotografia do monumento que acabou de ser descoberto.
        if (compact) {
            return '' +
                '<div class="' + classes.join(' ') + '" data-eng-step>' +
                    '<span class="hh-eng-next-icon" aria-hidden="true">' +
                        '<i class="fas fa-location-dot"></i>' +
                    '</span>' +
                    '<div class="hh-eng-next-text">' +
                        '<p class="hh-eng-next-kicker">' + escapeHtml(kickerFor(next)) + '</p>' +
                        '<p class="hh-eng-next-name">' + escapeHtml(next.title) + '</p>' +
                        metaHtml(next) +
                        (reason ? '<p class="hh-eng-next-reason">' + escapeHtml(reason) + '</p>' : '') +
                    '</div>' +
                    mapButtonHtml(next) +
                '</div>';
        }

        return '' +
            '<div class="' + classes.join(' ') + '" data-eng-step>' +
                '<p class="hh-eng-next-kicker">' + escapeHtml(kickerFor(next)) + '</p>' +
                '<div class="hh-eng-next-body">' +
                    '<div class="hh-eng-next-shot">' +
                        '<img src="' + escapeHtml(next.image) + '" alt="" aria-hidden="true"' +
                            ' onerror="this.src=\'imagens/placeholder.jpg\'; this.onerror=null;">' +
                    '</div>' +
                    '<div class="hh-eng-next-text">' +
                        '<p class="hh-eng-next-name">' + escapeHtml(next.title) + '</p>' +
                        metaHtml(next) +
                        (reason ? '<p class="hh-eng-next-reason">' + escapeHtml(reason) + '</p>' : '') +
                    '</div>' +
                '</div>' +
                mapButtonHtml(next) +
            '</div>';
    }

    // ==========================================================
    // Primeira descoberta (ponto 35)
    //
    // Zero monumentos: um objectivo, uma frase, um botao. Nada de
    // percentagens vazias, medalhas por desbloquear ou ranking.
    // ==========================================================
    function firstRunHtml(next) {
        return '' +
            '<div class="hh-eng-first" data-eng-step>' +
                '<span class="hh-eng-first-crest" aria-hidden="true">' +
                    '<i class="fas fa-compass"></i>' +
                '</span>' +
                '<p class="hh-eng-first-kicker">' + escapeHtml(t('engagement.firstDiscovery')) + '</p>' +
                '<p class="hh-eng-first-note">' + escapeHtml(t('engagement.firstDiscoveryNote')) + '</p>' +
                (next ? mapButtonHtml(next) : '') +
            '</div>';
    }

    // ==========================================================
    // Jornada concluida (ponto 38)
    //
    // A app nao pode parecer terminada: mostra-se o que foi
    // construido e diz-se que a exploracao continua (ponto 39).
    // ==========================================================
    function completeHtml(summary) {
        const stat = function (value, label, icon) {
            return '' +
                '<div class="hh-eng-done-stat">' +
                    '<i class="' + icon + '" aria-hidden="true"></i>' +
                    '<b>' + value + '</b>' +
                    '<span>' + escapeHtml(label) + '</span>' +
                '</div>';
        };

        return '' +
            '<div class="hh-eng-done" data-eng-step>' +
                '<span class="hh-eng-done-crest" aria-hidden="true">' +
                    '<i class="fas fa-crown"></i>' +
                '</span>' +
                '<p class="hh-eng-done-kicker">' + escapeHtml(t('engagement.journeyCompleted')) + '</p>' +
                '<p class="hh-eng-done-count">' + summary.monuments + ' / ' + summary.monumentsTotal + '</p>' +
                '<p class="hh-eng-done-title">' + escapeHtml(t('engagement.guardian')) + '</p>' +
                '<p class="hh-eng-done-note">' + escapeHtml(t('engagement.completeNote')) + '</p>' +
                '<div class="hh-eng-done-stats">' +
                    stat(summary.monuments, t('engagement.statMonuments'), 'fas fa-landmark') +
                    stat(summary.zones, t('engagement.statZones'), 'fas fa-map-marked-alt') +
                    stat(summary.photos, t('engagement.statPhotos'), 'fas fa-camera') +
                    stat(summary.experiences, t('engagement.statMemories'), 'fas fa-pen') +
                '</div>' +
                '<button type="button" class="hh-eng-next-btn" data-eng-action="memories">' +
                    '<i class="fas fa-images" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(t('engagement.viewMemories')) + '</span>' +
                '</button>' +
                '<p class="hh-eng-done-onward">' + escapeHtml(t('engagement.explorationContinues')) + '</p>' +
            '</div>';
    }

    // ==========================================================
    // Ligacao dos botoes
    // ==========================================================
    function bind(container) {
        if (!container) return;

        container.querySelectorAll('[data-eng-action]').forEach(function (button) {
            button.addEventListener('click', function () {
                run(button.dataset.engAction, button.dataset.engMonument);
            });
        });
    }

    function run(action, rawId) {
        if (action === 'map') {
            // O id volta a ser numero quando o monumento o tem: os
            // ids do Heritage Hunt sao numericos e os `dataset` sao
            // sempre texto.
            const id = rawId !== undefined && rawId !== '' && !isNaN(Number(rawId))
                ? Number(rawId)
                : rawId;

            if (handlers.onNextDiscoveryClick) handlers.onNextDiscoveryClick(id);
            if (handlers.onShowOnMap) handlers.onShowOnMap(id);
            return;
        }

        if (action === 'memories' && handlers.onOpenMemories) {
            handlers.onOpenMemories();
            return;
        }

        if (action === 'journey' && handlers.onOpenJourney) {
            handlers.onOpenJourney();
        }
    }

    // Uma microinteraccao so: o cartao entra suavemente (ponto 47).
    // Com prefers-reduced-motion aparece ja no lugar.
    function reveal(container) {
        if (!container) return;

        const steps = Array.prototype.slice.call(container.querySelectorAll('[data-eng-step]'));
        const reduced = typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduced) {
            steps.forEach(function (step) { step.classList.add('is-in'); });
            return;
        }

        steps.forEach(function (step, index) {
            setTimeout(function () { step.classList.add('is-in'); }, 60 + index * 70);
        });
    }

    function paint(container, html) {
        if (!container) return false;

        container.innerHTML = html;
        container.classList.toggle('hidden', !html);

        if (!html) return false;

        bind(container);
        reveal(container);
        return true;
    }

    // ==========================================================
    // O cartao do Mapa (ponto 7.3)
    // ==========================================================
    function renderMap() {
        const next = Engagement.getNextDiscovery();
        if (!next) {
            paint(elements.map, '');
            return;
        }

        paint(elements.map, nextCardHtml(next, { variant: 'full' }) + almostHtml(Engagement.getAlmostThere()));
    }

    // ==========================================================
    // O cartao de regresso (pontos 33, 34, 35 e 38)
    //
    // UMA coisa no topo do Scanner, nunca sete a competir:
    //   missao por terminar  ->  missao
    //   sem missao           ->  proxima descoberta
    //   0 descobertas        ->  a primeira descoberta
    //   12/12                ->  o fecho da jornada
    //
    // A missao e desenhada por missions-ui.js: aqui so se decide
    // que e a ela que o lugar pertence.
    // ==========================================================
    function renderFocus(missionStatus) {
        const container = elements.focus;
        if (!container) return;

        const focus = Engagement.getFocus(missionStatus);

        if (focus.type === 'mission') {
            // O cartao e desenhado aqui porque o lugar e este, mas o
            // botao pertence a quem sabe para onde ele leva.
            if (paint(container, MissionsUI.cardHtml(focus.mission))) {
                MissionsUI.bindCard(container, focus.mission);
            }
            return;
        }

        if (focus.type === 'journeyComplete') {
            paint(container, completeHtml(focus.summary));
            return;
        }

        if (focus.type === 'nextDiscovery') {
            const next = focus.next;

            // Ainda sem nenhuma descoberta: o convite e outro
            if (focus.journeyState === Engagement.JOURNEY_STATE.EMPTY) {
                paint(container, firstRunHtml(next));
                return;
            }

            paint(container, nextCardHtml(next, { variant: 'full' }) + almostHtml(Engagement.getAlmostThere()));
            return;
        }

        paint(container, '');
    }

    function render(missionStatus) {
        renderFocus(missionStatus);
        renderMap();
    }

    function init(options) {
        const config = options || {};
        handlers.onShowOnMap = config.onShowOnMap || null;
        handlers.onOpenAlbum = config.onOpenAlbum || null;
        handlers.onOpenJourney = config.onOpenJourney || null;
        handlers.onOpenMemories = config.onOpenMemories || null;
        handlers.onMissionContinue = config.onMissionContinue || null;
        handlers.onNextDiscoveryClick = config.onNextDiscoveryClick || null;

        elements = {
            focus: document.getElementById('engagementFocus'),
            map: document.getElementById('engagementMapCard')
        };
    }

    return {
        init: init,
        render: render,
        renderFocus: renderFocus,
        renderMap: renderMap,

        // Construtores reutilizaveis (ponto 6)
        nextCardHtml: nextCardHtml,
        almostHtml: almostHtml,
        almostText: almostText,
        zoneBarHtml: zoneBarHtml,
        completeHtml: completeHtml,
        firstRunHtml: firstRunHtml,
        formatDistance: formatDistance,

        // Para quem desenha HTML proprio e precisa de ligar os botoes
        bind: bind,
        reveal: reveal
    };
})();
