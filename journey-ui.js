// ============================================================
// Heritage Hunt CV — Jornada cultural (componentes visuais)
//
// Desenha o resumo do percurso (ecra principal) e o caminho
// completo (folha "Jornada de Mindelo").
//
// Nao decide ordem nem estados: tudo isso vive em journey.js.
// Nao atribui XP, nao calcula niveis, nao mexe na sequencia.
// Aqui so se le e se desenha.
// ============================================================

const JourneyUI = (function () {
    'use strict';

    const handlers = {
        onOpenMonument: null,   // (monumentId) -> abre o album existente
        onShowOnMap: null,      // (monument)   -> leva ao mapa existente
        getDistanceTo: null     // (monument)   -> metros | null
    };

    let elements = {};
    // Monumento acabado de descobrir: anima uma unica vez, no
    // primeiro desenho do caminho completo (ponto 54).
    let pendingHighlight = null;

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function prefersReducedMotion() {
        return typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Mesmo formato usado pela sequencia de exploracao
    function formatDistance(meters) {
        if (typeof meters !== 'number' || !isFinite(meters)) return null;
        if (meters >= 1000) return (meters / 1000).toFixed(1).replace('.', ',') + ' km';
        return Math.round(meters) + ' m';
    }

    // So mostramos distancia quando ela ja existe e e fiavel.
    // Nunca pedimos localizacao so para desenhar o caminho (ponto 56).
    function distanceText(monument) {
        if (!handlers.getDistanceTo) return '';
        const meters = handlers.getDistanceTo(monument);
        const text = formatDistance(meters);
        return text || '';
    }

    function stateIcon(state) {
        if (state === Journey.STATE.DISCOVERED) return 'fas fa-check';
        if (state === Journey.STATE.CURRENT) return 'fas fa-location-dot';
        return 'fas fa-lock';
    }

    // O estado nunca depende so da cor (ponto 40)
    function stateLabel(state) {
        if (state === Journey.STATE.DISCOVERED) return t('journeyDiscovered');
        if (state === Journey.STATE.CURRENT) return t('journeyCurrent');
        return t('journeyUpcoming');
    }

    function imageHtml(step) {
        const monument = step.monument;
        if (!monument || !monument.image) return '';

        // Descoberto: imagem nitida. Por descobrir: desfocada,
        // para o monumento continuar a ser uma descoberta (ponto 39).
        return '<span class="hh-jp-thumb" aria-hidden="true">' +
            '<img src="' + escapeHtml(monument.image) + '" alt=""' +
            ' onerror="this.src=\'imagens/placeholder.jpg\'; this.onerror=null;">' +
            '</span>';
    }

    // ==========================================================
    // Etapa do caminho
    // ==========================================================
    function stepHtml(step, isLastOfGroup) {
        const monument = step.monument;
        const discovered = step.state === Journey.STATE.DISCOVERED;
        const current = step.state === Journey.STATE.CURRENT;

        const classes = ['hh-jp-step', 'is-' + step.state];
        if (isLastOfGroup) classes.push('is-last');
        if (pendingHighlight !== null && step.monumentId === pendingHighlight) {
            classes.push('is-just-found');
        }

        // A linha que sai desta etapa acende quando ela ja foi
        // percorrida (ponto 19)
        const linkClass = 'hh-jp-link' + (discovered ? ' is-on' : '');

        const reward = t('xpAmount', { n: monument.points });
        const distance = current ? distanceText(monument) : '';

        const meta = discovered
            ? '<span class="hh-jp-reward">' + escapeHtml(t('journeyEarned', { n: monument.points })) + '</span>'
            : '<span class="hh-jp-reward">' + escapeHtml(reward) + '</span>' +
              (distance ? '<span class="hh-jp-distance"><i class="fas fa-location-arrow" aria-hidden="true"></i> ' + escapeHtml(distance) + '</span>' : '');

        // A etapa actual nao e um botao inteiro (o cartao e um div),
        // por isso o botao do mapa pode viver dentro dele.
        const action = current
            ? '<button type="button" class="hh-jp-map-btn" data-journey-map="' + step.monumentId + '">' +
                  escapeHtml(t('journeyViewMap')) +
                  '<i class="fas fa-arrow-right" aria-hidden="true"></i>' +
              '</button>'
            : '';

        // Descoberto abre o album; a etapa actual leva ao mapa; as
        // seguintes nao sao interactivas (nao ha nada por abrir).
        const tag = discovered ? 'button' : 'div';
        const attrs = discovered
            ? ' type="button" data-journey-monument="' + step.monumentId + '"'
            : '';

        return '' +
            '<div class="' + classes.join(' ') + '">' +
                '<div class="hh-jp-rail" aria-hidden="true">' +
                    '<span class="hh-jp-node"><i class="' + stateIcon(step.state) + '"></i></span>' +
                    '<span class="' + linkClass + '"></span>' +
                '</div>' +
                '<' + tag + ' class="hh-jp-card"' + attrs + '>' +
                    imageHtml(step) +
                    '<span class="hh-jp-body">' +
                        '<span class="hh-jp-name">' + escapeHtml(monument.name) + '</span>' +
                        '<span class="hh-jp-state">' +
                            '<i class="' + stateIcon(step.state) + '" aria-hidden="true"></i> ' +
                            escapeHtml(stateLabel(step.state)) +
                        '</span>' +
                        '<span class="hh-jp-meta">' + meta + '</span>' +
                        action +
                    '</span>' +
                    (discovered ? '<i class="fas fa-chevron-right hh-jp-chevron" aria-hidden="true"></i>' : '') +
                '</' + tag + '>' +
            '</div>';
    }

    // ==========================================================
    // Separador de zona (pontos 28, 29 e 30)
    // ==========================================================
    function groupHtml(group) {
        const name = group.zoneId ? zoneName(group.zoneId) : t('journeyOtherZone');

        const state = group.isComplete
            ? '<span class="hh-jp-zone-done"><i class="fas fa-check" aria-hidden="true"></i> ' +
                  escapeHtml(t('zoneDone')) + '</span>'
            : '<span class="hh-jp-zone-count">' +
                  escapeHtml(t('zoneProgress', { done: group.discovered, total: group.total })) +
              '</span>';

        const steps = group.steps.map(function (step, index) {
            return stepHtml(step, index === group.steps.length - 1);
        }).join('');

        return '' +
            '<section class="hh-jp-group' + (group.isComplete ? ' is-complete' : '') + '">' +
                '<header class="hh-jp-zone">' +
                    '<div class="hh-jp-zone-head">' +
                        '<p class="hh-jp-zone-name">' + escapeHtml(name) + '</p>' +
                        state +
                    '</div>' +
                    '<div class="hh-jp-zone-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                        ' aria-valuenow="' + group.percent + '"' +
                        ' aria-label="' + escapeHtml(name) + '">' +
                        '<div class="hh-jp-zone-fill" style="width: ' + group.percent + '%"></div>' +
                    '</div>' +
                '</header>' +
                '<div class="hh-jp-steps">' + steps + '</div>' +
            '</section>';
    }

    // ==========================================================
    // Cabecalho do caminho: progresso global (pontos 15 e 16)
    // ==========================================================
    function headHtml(progress) {
        const remaining = progress.remaining === 1
            ? t('journeyRemainingOne')
            : t('journeyRemaining', { n: progress.remaining });

        const note = progress.isCompleted
            ? '<p class="hh-jp-note is-done">' + escapeHtml(t('journeyCompleteNote')) + '</p>'
            : '<p class="hh-jp-note">' + escapeHtml(remaining) + '</p>';

        return '' +
            '<div class="hh-jp-head">' +
                '<p class="hh-jp-count">' +
                    escapeHtml(t('journeyProgress', { done: progress.discovered, total: progress.total })) +
                '</p>' +
                '<div class="hh-jp-bar-row">' +
                    '<div class="hh-jp-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                        ' aria-valuenow="' + progress.percent + '"' +
                        ' aria-label="' + escapeHtml(t('journeyProgressAria')) + '">' +
                        '<div class="hh-jp-fill" style="width: ' + progress.percent + '%"></div>' +
                    '</div>' +
                    '<span class="hh-jp-percent">' + progress.percent + '%</span>' +
                '</div>' +
                note +
            '</div>';
    }

    function completeBannerHtml() {
        return '' +
            '<div class="hh-jp-complete">' +
                '<span class="hh-jp-complete-mark" aria-hidden="true"><i class="fas fa-crown"></i></span>' +
                '<p class="hh-jp-complete-title">' + escapeHtml(t('journeyCompleteTitle')) + '</p>' +
            '</div>';
    }

    // ==========================================================
    // Caminho completo
    // ==========================================================
    function renderPath() {
        if (!elements.path) return;

        const journey = Journey.getJourney();
        if (!journey) {
            elements.path.innerHTML = '';
            return;
        }

        const progress = Journey.getJourneyProgress();

        elements.path.innerHTML =
            headHtml(progress) +
            (progress.isCompleted ? completeBannerHtml() : '') +
            journey.groups.map(groupHtml).join('');

        bindPath(elements.path);

        if (elements.modalTitle) {
            elements.modalTitle.textContent = journeyName(journey.id);
        }
        if (elements.modalSub) {
            elements.modalSub.textContent = journeySubtitle(journey.id);
        }

        // A animacao de descoberta corre uma unica vez
        if (pendingHighlight !== null) {
            const node = elements.path.querySelector('.is-just-found');
            if (node && !prefersReducedMotion() && typeof node.scrollIntoView === 'function') {
                node.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            pendingHighlight = null;
        }
    }

    function bindPath(scope) {
        scope.querySelectorAll('[data-journey-monument]').forEach(function (element) {
            element.addEventListener('click', function () {
                const id = Number(element.dataset.journeyMonument);
                closeJourney();
                if (handlers.onOpenMonument) handlers.onOpenMonument(id);
            });
        });

        scope.querySelectorAll('[data-journey-map]').forEach(function (element) {
            element.addEventListener('click', function (event) {
                event.stopPropagation();
                const id = Number(element.dataset.journeyMap);
                const step = Journey.getSteps().filter(function (entry) {
                    return entry.monumentId === id;
                })[0];
                closeJourney();
                if (step && handlers.onShowOnMap) handlers.onShowOnMap(step.monument);
            });
        });
    }

    // ==========================================================
    // Resumo no ecra principal (pontos 33, 34, 35 e 36)
    // ==========================================================
    function dotsHtml(steps) {
        return '<div class="hh-jp-dots" aria-hidden="true">' +
            steps.map(function (step) {
                return '<span class="hh-jp-dot is-' + step.state + '"></span>';
            }).join('') +
            '</div>';
    }

    function summaryHtml() {
        const journey = Journey.getJourney();
        if (!journey || !journey.steps.length) return '';

        const progress = Journey.getJourneyProgress();
        const current = Journey.getCurrentJourneyStep();

        const bar = '' +
            '<div class="hh-jp-bar-row">' +
                '<div class="hh-jp-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                    ' aria-valuenow="' + progress.percent + '"' +
                    ' aria-label="' + escapeHtml(t('journeyProgressAria')) + '">' +
                    '<div class="hh-jp-fill" style="width: ' + progress.percent + '%"></div>' +
                '</div>' +
                '<span class="hh-jp-percent">' + progress.percent + '%</span>' +
            '</div>';

        const count = '<p class="hh-jp-count">' +
            escapeHtml(t('journeyProgress', { done: progress.discovered, total: progress.total })) +
            '</p>';

        // Jornada concluida: nao ha proxima etapa por procurar
        if (progress.isCompleted) {
            return '' +
                '<div class="hh-jp-sum">' +
                    count + bar +
                    '<div class="hh-jp-complete is-compact">' +
                        '<span class="hh-jp-complete-mark" aria-hidden="true"><i class="fas fa-crown"></i></span>' +
                        '<div>' +
                            '<p class="hh-jp-complete-title">' + escapeHtml(t('journeyCompleteTitle')) + '</p>' +
                            '<p class="hh-jp-sum-note">' + escapeHtml(t('journeyCompleteNote')) + '</p>' +
                        '</div>' +
                    '</div>' +
                    dotsHtml(journey.steps) +
                    '<button type="button" class="hh-jp-cta" data-journey-action="open">' +
                        '<span>' + escapeHtml(t('journeyViewPath')) + '</span>' +
                        '<i class="fas fa-chevron-right" aria-hidden="true"></i>' +
                    '</button>' +
                '</div>';
        }

        const label = progress.isEmpty ? t('journeyFirstStep') : t('journeyCurrent');
        const intro = progress.isEmpty
            ? '<p class="hh-jp-sum-note">' + escapeHtml(t('journeyEmptyTitle')) + '</p>'
            : '';

        const distance = current ? distanceText(current.monument) : '';

        const next = current
            ? '<div class="hh-jp-next">' +
                  '<span class="hh-jp-next-icon" aria-hidden="true"><i class="fas fa-location-dot"></i></span>' +
                  '<div class="hh-jp-next-text">' +
                      '<p class="hh-jp-next-label">' + escapeHtml(label) + '</p>' +
                      '<p class="hh-jp-next-name">' + escapeHtml(current.monument.name) + '</p>' +
                      (distance ? '<p class="hh-jp-next-distance">' + escapeHtml(distance) + '</p>' : '') +
                  '</div>' +
                  '<button type="button" class="hh-jp-next-btn" data-journey-action="map" data-journey-map-id="' + current.monumentId + '">' +
                      escapeHtml(t('journeyViewMap')) +
                  '</button>' +
              '</div>'
            : '';

        return '' +
            '<div class="hh-jp-sum">' +
                count + bar + intro +
                dotsHtml(journey.steps) +
                next +
                '<button type="button" class="hh-jp-cta" data-journey-action="open">' +
                    '<span>' + escapeHtml(progress.isEmpty ? t('journeyViewPath') : t('journeyContinue')) + '</span>' +
                    '<i class="fas fa-chevron-right" aria-hidden="true"></i>' +
                '</button>' +
            '</div>';
    }

    function renderSummary() {
        if (!elements.summary) return;

        // O nome da jornada vem dos dados, nunca fixo no HTML (ponto 31)
        const journeyId = Journey.getDefaultJourneyId();
        if (elements.summaryTitle) elements.summaryTitle.textContent = journeyName(journeyId);
        if (elements.summarySub) elements.summarySub.textContent = journeySubtitle(journeyId);

        elements.summary.innerHTML = summaryHtml();

        const open = elements.summary.querySelector('[data-journey-action="open"]');
        if (open) open.addEventListener('click', openJourney);

        const mapBtn = elements.summary.querySelector('[data-journey-action="map"]');
        if (mapBtn) {
            mapBtn.addEventListener('click', function () {
                const id = Number(mapBtn.dataset.journeyMapId);
                const step = Journey.getSteps().filter(function (entry) {
                    return entry.monumentId === id;
                })[0];
                if (step && handlers.onShowOnMap) handlers.onShowOnMap(step.monument);
            });
        }
    }

    // ==========================================================
    // Desenho completo
    // ==========================================================
    function render() {
        renderSummary();
        if (isJourneyOpen()) renderPath();
    }

    // Chamado depois de uma descoberta: a proxima vez que o
    // caminho completo for desenhado, esta etapa anima (ponto 54).
    function markDiscovery(monumentId) {
        pendingHighlight = monumentId === undefined || monumentId === null ? null : monumentId;
    }

    // ==========================================================
    // Folha do caminho completo
    // ==========================================================
    function openJourney() {
        if (!elements.modal) return;
        renderPath();
        elements.modal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
    }

    function closeJourney() {
        if (!elements.modal) return;
        elements.modal.classList.add('hidden');
        document.body.classList.remove('hh-no-scroll');
    }

    function isJourneyOpen() {
        return !!elements.modal && !elements.modal.classList.contains('hidden');
    }

    // ==========================================================
    // Arranque
    // ==========================================================
    function init(options) {
        const config = options || {};
        handlers.onOpenMonument = config.onOpenMonument || null;
        handlers.onShowOnMap = config.onShowOnMap || null;
        handlers.getDistanceTo = config.getDistanceTo || null;

        elements = {
            summary: document.getElementById('journeySummary'),
            summaryTitle: document.getElementById('journeySummaryTitle'),
            summarySub: document.getElementById('journeySummarySub'),
            modal: document.getElementById('journeyModal'),
            modalTitle: document.getElementById('journeyModalTitle'),
            modalSub: document.getElementById('journeyModalSub'),
            path: document.getElementById('journeyPath'),
            close: document.getElementById('closeJourney'),
            openFromMap: document.getElementById('openJourneyFromMap')
        };

        if (elements.close) elements.close.addEventListener('click', closeJourney);
        if (elements.openFromMap) elements.openFromMap.addEventListener('click', openJourney);
        if (elements.modal) {
            elements.modal.addEventListener('click', function (event) {
                if (event.target === elements.modal) closeJourney();
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isJourneyOpen()) closeJourney();
        });
    }

    return {
        init: init,
        render: render,
        renderSummary: renderSummary,
        renderPath: renderPath,
        markDiscovery: markDiscovery,
        openJourney: openJourney,
        closeJourney: closeJourney,
        isJourneyOpen: isJourneyOpen
    };
})();
