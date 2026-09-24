// ============================================================
// Heritage Hunt CV — Celebração de descoberta (interface)
//
// Desenha a celebração a partir do resultado já construído por
// discovery.js. Não decide recompensas, não lê o estado da
// aplicação e não grava nada: recebe o que mostrar e mostra.
//
// Uma celebração de cada vez: enquanto esta folha está aberta,
// nenhum outro modal é aberto por cima (a fila de conquistas
// fica suspensa em script.js).
// ============================================================

const DiscoveryUI = (function () {
    'use strict';

    // Entrada da folha e revelação do monumento (pontos 6 e 7)
    const REVEAL_DELAY = 90;
    const COUNT_DURATION = 900;
    const BAR_DELAY = 260;
    const STEP_STAGGER = 70;

    // Vibração muito subtil, só na descoberta (ponto 32)
    const HAPTIC_MS = 30;

    const handlers = {
        onOpenAlbum: null,
        onContinueJourney: null,
        onShowOnMap: null,
        onClosed: null
    };

    let elements = {};
    let current = null;
    let countTimer = null;
    let stepTimers = [];
    let lastFocused = null;

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function prefersReducedMotion() {
        return typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ==========================================================
    // Blocos
    //
    // Cada bloco devolve '' quando não se aplica: a celebração
    // nunca mostra uma linha vazia (ponto 23).
    // ==========================================================

    function kickerFor(result) {
        if (result.variant === 'complete') return t('discovery.journeyComplete');
        if (result.variant === 'first') return t('discovery.firstDiscovery');
        return t('discovery.newMonument');
    }

    function heroHtml(result) {
        const place = placeLabel(result.journey.cityId, result.journey.islandId);
        const isComplete = result.variant === 'complete';

        const crest = isComplete
            ? '<span class="hh-dc-crown" aria-hidden="true"><i class="fas fa-crown"></i></span>'
            : '';

        return '' +
            '<div class="hh-dc-hero">' +
                '<img class="hh-dc-hero-img" id="discoveryHeroImage" src="' + escapeHtml(result.monument.image) + '"' +
                    ' alt="" aria-hidden="true"' +
                    ' onerror="this.src=\'imagens/placeholder.jpg\'; this.onerror=null;">' +
                '<span class="hh-dc-hero-shade" aria-hidden="true"></span>' +
                crest +
                '<div class="hh-dc-hero-text">' +
                    '<p class="hh-dc-kicker">' + escapeHtml(kickerFor(result)) + '</p>' +
                    '<h2 class="hh-dc-name" id="discoveryTitle">' + escapeHtml(result.monument.name) + '</h2>' +
                    (place ? '<p class="hh-dc-place">' + escapeHtml(place) + '</p>' : '') +
                '</div>' +
            '</div>';
    }

    // XP — sempre o valor que o domínio atribuiu (ponto 47)
    function xpHtml(result) {
        const xp = result.xp;
        if (xp.earned <= 0 && !xp.total) return '';

        const wallet = '<p class="hh-dc-xp-wallet">' +
            escapeHtml(t('discovery.xpWallet', { n: xp.total })) +
        '</p>';

        // Sem bónus de zona basta um número grande
        if (!xp.hasZoneBonus) {
            return '' +
                '<div class="hh-dc-xp" data-dc-step>' +
                    '<p class="hh-dc-xp-main">' +
                        '<span class="hh-dc-xp-value" data-dc-count="' + xp.earned + '">0</span>' +
                        '<span class="hh-dc-xp-unit">' + escapeHtml(t('xpLabel')) + '</span>' +
                    '</p>' +
                    wallet +
                '</div>';
        }

        // Com zona, os dois valores aparecem separados e depois somados
        return '' +
            '<div class="hh-dc-xp is-split" data-dc-step>' +
                '<div class="hh-dc-xp-rows">' +
                    '<p class="hh-dc-xp-row">' +
                        '<span class="hh-dc-xp-row-label">' +
                            '<i class="fas fa-landmark" aria-hidden="true"></i> ' +
                            escapeHtml(t('discovery.xpMonument')) +
                        '</span>' +
                        '<b>' + escapeHtml(xpAmountText(xp.monument)) + '</b>' +
                    '</p>' +
                    '<p class="hh-dc-xp-row">' +
                        '<span class="hh-dc-xp-row-label">' +
                            '<i class="fas fa-map-marked-alt" aria-hidden="true"></i> ' +
                            escapeHtml(t('discovery.xpZone')) +
                        '</span>' +
                        '<b>' + escapeHtml(xpAmountText(xp.zone)) + '</b>' +
                    '</p>' +
                '</div>' +
                '<div class="hh-dc-xp-total">' +
                    '<span class="hh-dc-xp-total-label">' + escapeHtml(t('discovery.xpTotalEarned')) + '</span>' +
                    '<p class="hh-dc-xp-main">' +
                        '<span class="hh-dc-xp-value" data-dc-count="' + xp.earned + '">0</span>' +
                        '<span class="hh-dc-xp-unit">' + escapeHtml(t('xpLabel')) + '</span>' +
                    '</p>' +
                '</div>' +
                wallet +
            '</div>';
    }

    // Sequência — só quando esta descoberta abriu o dia (ponto 15)
    function streakHtml(result) {
        if (!result.streak) return '';

        const title = result.streak.isNewStreak
            ? t('discovery.streakStarted')
            : t('discovery.streakKept');

        return '' +
            '<div class="hh-dc-streak" data-dc-step>' +
                '<span class="hh-dc-streak-flame" aria-hidden="true"><i class="fas fa-fire"></i></span>' +
                '<span class="hh-dc-streak-text">' +
                    '<b>' + escapeHtml(title) + '</b>' +
                    '<span>' + escapeHtml(streakDaysText(result.streak.current)) + '</span>' +
                '</span>' +
            '</div>';
    }

    // Progresso — a barra anima do valor anterior (pontos 10 e 11)
    function progressHtml(result) {
        const progress = result.progress;
        if (!progress.total) return '';

        const journey = journeyName(result.journey.id);

        return '' +
            '<div class="hh-dc-progress" data-dc-step>' +
                '<div class="hh-dc-progress-head">' +
                    '<p class="hh-dc-progress-journey">' + escapeHtml(journey) + '</p>' +
                    '<span class="hh-dc-progress-percent" id="discoveryPercent">' + progress.previousPercent + '%</span>' +
                '</div>' +
                '<p class="hh-dc-progress-count">' +
                    escapeHtml(t('discovery.progress', { done: progress.discovered, total: progress.total })) +
                '</p>' +
                '<div class="hh-dc-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                    ' aria-valuenow="' + progress.percent + '"' +
                    ' aria-label="' + escapeHtml(t('journeyProgressAria')) + '"' +
                    ' aria-valuetext="' + escapeHtml(t('levelProgressPercent', { n: progress.percent })) + '">' +
                    '<div class="hh-dc-fill" id="discoveryFill" style="width: ' + progress.previousPercent + '%"></div>' +
                '</div>' +
                '<p class="hh-dc-tone">' + escapeHtml(t('discovery.tone.' + result.tone)) + '</p>' +
            '</div>';
    }

    // --- Blocos especiais, pela ordem de destaque do domínio ---

    function levelUpHtml(result) {
        const level = result.levelUp;
        const description = levelDescription(level.id);

        return '' +
            '<div class="hh-dc-special is-level" data-dc-step>' +
                '<span class="hh-dc-special-mark is-' + escapeHtml(level.accent || 'gold') + '" aria-hidden="true">' +
                    '<i class="' + escapeHtml(level.icon || 'fas fa-compass') + '"></i>' +
                '</span>' +
                '<div class="hh-dc-special-text">' +
                    '<p class="hh-dc-special-kicker">' + escapeHtml(t('discovery.newLevel')) + '</p>' +
                    '<p class="hh-dc-special-title">' + escapeHtml(levelName(level.id)) + '</p>' +
                    '<p class="hh-dc-special-sub">' + escapeHtml(levelRankText(level.level)) + '</p>' +
                    (description ? '<p class="hh-dc-special-note">' + escapeHtml(description) + '</p>' : '') +
                '</div>' +
            '</div>';
    }

    function zoneHtml(result) {
        const zone = result.zone;
        const counts = zone.total
            ? t('discovery.zoneProgress', { done: zone.discovered, total: zone.total })
            : '';

        return '' +
            '<div class="hh-dc-special is-zone" data-dc-step>' +
                '<span class="hh-dc-special-mark is-zone" aria-hidden="true">' +
                    '<i class="fas fa-check"></i>' +
                '</span>' +
                '<div class="hh-dc-special-text">' +
                    '<p class="hh-dc-special-kicker">' + escapeHtml(t('discovery.zoneCompleted')) + '</p>' +
                    '<p class="hh-dc-special-title">' + escapeHtml(zoneName(zone.id)) + '</p>' +
                    (counts ? '<p class="hh-dc-special-sub">' + escapeHtml(counts) + '</p>' : '') +
                '</div>' +
                '<span class="hh-dc-special-xp">' + escapeHtml(xpAmountText(zone.xp)) + '</span>' +
            '</div>';
    }

    function badgesHtml(result) {
        return result.badges.map(function (badge) {
            return '' +
                '<div class="hh-dc-special is-badge" data-dc-step>' +
                    '<span class="hh-dc-special-mark is-badge" aria-hidden="true">' +
                        '<i class="' + escapeHtml(badge.icon) + '"></i>' +
                    '</span>' +
                    '<div class="hh-dc-special-text">' +
                        '<p class="hh-dc-special-kicker">' + escapeHtml(t('discovery.newBadge')) + '</p>' +
                        '<p class="hh-dc-special-title">' + escapeHtml(badge.name) + '</p>' +
                        (badge.description
                            ? '<p class="hh-dc-special-sub">' + escapeHtml(badge.description) + '</p>'
                            : '') +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function specialsHtml(result) {
        if (!result.hasSpecials) return '';

        const builders = {
            levelUp: levelUpHtml,
            zone: zoneHtml,
            badge: badgesHtml
        };

        const blocks = result.specialOrder.map(function (key) {
            return builders[key] ? builders[key](result) : '';
        }).join('');

        return blocks ? '<div class="hh-dc-specials">' + blocks + '</div>' : '';
    }

    // Jornada concluída: em vez da próxima etapa, o fecho do percurso
    function completeHtml(result) {
        if (result.variant !== 'complete') return '';

        return '' +
            '<div class="hh-dc-complete" data-dc-step>' +
                '<p class="hh-dc-complete-kicker">' + escapeHtml(t('discovery.completeEmblem')) + '</p>' +
                '<p class="hh-dc-complete-count">' +
                    escapeHtml(t('discovery.progress', {
                        done: result.progress.discovered,
                        total: result.progress.total
                    })) +
                '</p>' +
                '<p class="hh-dc-complete-note">' + escapeHtml(t('discovery.completeNote')) + '</p>' +
            '</div>';
    }

    // Próxima etapa (ponto 17): a recompensa vira intenção de voltar
    function nextHtml(result) {
        if (!result.next) return '';

        return '' +
            '<div class="hh-dc-next" data-dc-step>' +
                '<span class="hh-dc-next-icon" aria-hidden="true"><i class="fas fa-location-dot"></i></span>' +
                '<div class="hh-dc-next-text">' +
                    '<p class="hh-dc-next-kicker">' + escapeHtml(t('discovery.nextStory')) + '</p>' +
                    '<p class="hh-dc-next-name">' + escapeHtml(result.next.name) + '</p>' +
                    (result.next.points
                        ? '<p class="hh-dc-next-xp">' + escapeHtml(xpAmountText(result.next.points)) + '</p>'
                        : '') +
                '</div>' +
                '<button type="button" class="hh-dc-next-btn" data-dc-action="map">' +
                    escapeHtml(t('journeyViewMap')) +
                '</button>' +
            '</div>';
    }

    // CTAs (pontos 18, 19 e 20). O principal leva sempre ao álbum.
    function actionsHtml(result) {
        const isComplete = result.variant === 'complete';

        const primaryLabel = isComplete ? t('discovery.viewAlbum') : t('discovery.addToAlbum');
        const primaryIcon = isComplete ? 'fas fa-images' : 'fas fa-camera';

        const secondaryLabel = isComplete ? t('discovery.reviewJourney') : t('journeyContinue');
        const secondaryIcon = isComplete ? 'fas fa-route' : 'fas fa-chevron-right';

        return '' +
            '<button type="button" class="hh-dc-cta" data-dc-action="album">' +
                '<i class="' + primaryIcon + '" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(primaryLabel) + '</span>' +
            '</button>' +
            '<button type="button" class="hh-dc-cta is-ghost" data-dc-action="continue">' +
                '<span>' + escapeHtml(secondaryLabel) + '</span>' +
                '<i class="' + secondaryIcon + '" aria-hidden="true"></i>' +
            '</button>' +
            '<button type="button" class="hh-dc-dismiss" data-dc-action="close">' +
                escapeHtml(t('discovery.notNow')) +
            '</button>';
    }

    // ==========================================================
    // Animações (pontos 6, 7, 8, 11 e 43)
    //
    // Com `prefers-reduced-motion` tudo abre já no valor final: a
    // informação é exactamente a mesma, sem movimento.
    // ==========================================================
    function clearTimers() {
        if (countTimer) {
            cancelAnimationFrame(countTimer);
            countTimer = null;
        }
        stepTimers.forEach(clearTimeout);
        stepTimers = [];
    }

    function animateCount(element, to) {
        const target = Number(to) || 0;

        element.textContent = '+' + target;
        if (prefersReducedMotion() || target <= 0) return;

        const start = performance.now();
        element.textContent = '+0';

        function step(now) {
            const progress = Math.min(1, (now - start) / COUNT_DURATION);
            // Desaceleração suave: nada de saltos no fim
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = '+' + Math.round(target * eased);

            if (progress < 1) {
                countTimer = requestAnimationFrame(step);
            } else {
                countTimer = null;
                element.textContent = '+' + target;
            }
        }

        countTimer = requestAnimationFrame(step);
    }

    function animateBar(result) {
        const fill = document.getElementById('discoveryFill');
        const label = document.getElementById('discoveryPercent');
        if (!fill) return;

        const to = result.progress.percent;

        if (prefersReducedMotion()) {
            fill.style.width = to + '%';
            if (label) label.textContent = to + '%';
            return;
        }

        // A barra abre onde estava e só depois cresce (ponto 11)
        stepTimers.push(setTimeout(function () {
            fill.classList.add('is-animated');
            fill.style.width = to + '%';
            if (label) {
                label.textContent = to + '%';
                label.classList.add('is-bumped');
            }
        }, BAR_DELAY));
    }

    function revealHero() {
        const image = document.getElementById('discoveryHeroImage');
        if (!image) return;

        if (prefersReducedMotion()) {
            image.classList.add('is-revealed');
            return;
        }

        // Desfocado -> nítido: a fotografia "descobre-se" (ponto 7)
        stepTimers.push(setTimeout(function () {
            image.classList.add('is-revealed');
        }, REVEAL_DELAY));
    }

    function revealSteps() {
        const steps = elements.body
            ? Array.prototype.slice.call(elements.body.querySelectorAll('[data-dc-step]'))
            : [];

        if (prefersReducedMotion()) {
            steps.forEach(function (step) { step.classList.add('is-in'); });
            return;
        }

        steps.forEach(function (step, index) {
            stepTimers.push(setTimeout(function () {
                step.classList.add('is-in');
            }, REVEAL_DELAY + index * STEP_STAGGER));
        });
    }

    function haptic() {
        if (prefersReducedMotion()) return;
        if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
        try {
            navigator.vibrate(HAPTIC_MS);
        } catch (e) {
            // Um dispositivo que recuse vibrar nunca estraga a celebração
        }
    }

    // ==========================================================
    // Acessibilidade (ponto 42)
    // ==========================================================
    function focusable() {
        if (!elements.sheet) return [];
        return Array.prototype.slice.call(
            elements.sheet.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
        ).filter(function (node) {
            return node.offsetParent !== null || node === document.activeElement;
        });
    }

    // O foco não sai da celebração enquanto ela estiver aberta
    function trapFocus(event) {
        if (event.key !== 'Tab') return;

        const nodes = focusable();
        if (!nodes.length) return;

        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    // ==========================================================
    // Abrir e fechar
    // ==========================================================
    function bindActions() {
        if (!elements.modal) return;

        elements.modal.querySelectorAll('[data-dc-action]').forEach(function (button) {
            button.addEventListener('click', function () {
                run(button.dataset.dcAction);
            });
        });
    }

    // Cada acção fecha a celebração antes de fazer o que faz: nunca
    // fica um modal aberto por baixo de outro (ponto 28).
    function run(action) {
        const result = current;
        if (!result) return;

        if (action === 'album') {
            close();
            if (handlers.onOpenAlbum) handlers.onOpenAlbum(result.monument.id);
            return;
        }

        if (action === 'map') {
            close();
            if (handlers.onShowOnMap && result.next) handlers.onShowOnMap(result.next.monumentId);
            return;
        }

        if (action === 'continue') {
            close();
            if (handlers.onContinueJourney) handlers.onContinueJourney(result);
            return;
        }

        close();
    }

    // Desenha a celebração. `animate` distingue a abertura (com
    // revelação e contagem) de um redesenho — mudar de idioma não
    // volta a contar o XP do zero.
    function render(result, animate) {
        elements.modal.dataset.variant = result.variant;
        elements.body.innerHTML = '' +
            heroHtml(result) +
            '<div class="hh-dc-content">' +
                xpHtml(result) +
                streakHtml(result) +
                progressHtml(result) +
                specialsHtml(result) +
                completeHtml(result) +
                nextHtml(result) +
            '</div>';

        if (elements.actions) elements.actions.innerHTML = actionsHtml(result);

        bindActions();

        const counter = elements.body.querySelector('[data-dc-count]');

        if (animate) {
            if (counter) animateCount(counter, counter.dataset.dcCount);
            revealHero();
            revealSteps();
            animateBar(result);
            return;
        }

        // Redesenho: tudo abre já no estado final
        if (counter) counter.textContent = '+' + (Number(counter.dataset.dcCount) || 0);

        const image = document.getElementById('discoveryHeroImage');
        if (image) image.classList.add('is-revealed');

        elements.body.querySelectorAll('[data-dc-step]').forEach(function (step) {
            step.classList.add('is-in');
        });

        const fill = document.getElementById('discoveryFill');
        const label = document.getElementById('discoveryPercent');
        if (fill) fill.style.width = result.progress.percent + '%';
        if (label) label.textContent = result.progress.percent + '%';
    }

    function show(result) {
        if (!result || !elements.modal || !elements.body) return false;

        clearTimers();
        current = result;
        lastFocused = document.activeElement;

        render(result, true);

        elements.modal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
        if (elements.sheet) elements.sheet.scrollTop = 0;

        haptic();

        // O leitor de ecrã anuncia o título; o foco fica no CTA principal
        const primary = elements.modal.querySelector('[data-dc-action="album"]');
        if (primary) primary.focus();

        return true;
    }

    // Volta a desenhar a celebração aberta a partir do MESMO resultado.
    // Usado quando o idioma muda a meio (ponto 41).
    function refresh() {
        if (!current || !elements.body) return;

        const scroll = elements.sheet ? elements.sheet.scrollTop : 0;
        clearTimers();
        render(current, false);
        if (elements.sheet) elements.sheet.scrollTop = scroll;
    }

    function close() {
        if (!elements.modal || !current) return;

        clearTimers();
        current = null;

        elements.modal.classList.add('hidden');
        document.body.classList.remove('hh-no-scroll');

        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
        lastFocused = null;

        // Devolve o lugar à fila de conquistas (ponto 28)
        if (handlers.onClosed) handlers.onClosed();
    }

    function isOpen() {
        return !!current;
    }

    function init(options) {
        const config = options || {};
        handlers.onOpenAlbum = config.onOpenAlbum || null;
        handlers.onContinueJourney = config.onContinueJourney || null;
        handlers.onShowOnMap = config.onShowOnMap || null;
        handlers.onClosed = config.onClosed || null;

        elements = {
            modal: document.getElementById('discoveryModal'),
            sheet: document.getElementById('discoverySheet'),
            body: document.getElementById('discoveryBody'),
            actions: document.getElementById('discoveryActions')
        };

        if (elements.modal) {
            // Tocar fora da folha fecha, como nos restantes modais
            elements.modal.addEventListener('click', function (event) {
                if (event.target === elements.modal) close();
            });
            elements.modal.addEventListener('keydown', trapFocus);
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isOpen()) close();
        });
    }

    return {
        init: init,
        show: show,
        refresh: refresh,
        close: close,
        isOpen: isOpen
    };
})();
