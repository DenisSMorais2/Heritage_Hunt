// ============================================================
// Heritage Hunt CV — Niveis (componentes visuais)
//
// Desenha a identificacao no perfil, o cartao "A tua jornada",
// a folha com todos os niveis e a celebracao de novo nivel.
//
// Nao decide limiares nem calcula progresso: isso vive em
// levels.js. Aqui so se le e se desenha.
// ============================================================

const LevelsUI = (function () {
    'use strict';

    const handlers = {
        getTotalXP: null,   // injectado: a UI nunca guarda XP
        onLevelUpClosed: null
    };

    let elements = {};
    // Ultima percentagem desenhada, para a barra poder animar a
    // partir do valor anterior em vez de saltar.
    let lastPercent = null;

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

    function totalXP() {
        return handlers.getTotalXP ? handlers.getTotalXP() : 0;
    }

    // Retrato da progressao para um total de XP
    function progressFor(displayXP) {
        return Levels.getProgress(displayXP === undefined ? totalXP() : displayXP);
    }

    function markHtml(level, extraClass) {
        return '<span class="hh-level-mark is-' + escapeHtml(level.accent) +
            (extraClass ? ' ' + extraClass : '') + '" aria-hidden="true">' +
            '<i class="' + escapeHtml(level.icon) + '"></i>' +
            '</span>';
    }

    // ==========================================================
    // Identificacao no perfil (ponto 23)
    //
    //   Dénis
    //   Conhecedor · Nível 3
    // ==========================================================
    function renderIdentity(info) {
        if (elements.levelName) {
            elements.levelName.textContent = levelName(info.currentLevel.id);
        }
        if (elements.levelRank) {
            elements.levelRank.textContent = levelRankText(info.currentLevel.level);
        }
        if (elements.levelLine) {
            elements.levelLine.dataset.accent = info.currentLevel.accent;
            elements.levelLine.setAttribute('title', t('levelViewJourney'));
        }
    }

    // ==========================================================
    // Cartao "A tua jornada" (ponto 9)
    // ==========================================================
    function cardHtml(info) {
        const name = levelName(info.currentLevel.id);
        const rank = levelRankText(info.currentLevel.level);
        const description = levelDescription(info.currentLevel.id);

        // A barra abre no valor ja desenhado e so depois anima para
        // o novo (ponto 39). Na primeira vez abre no valor final.
        const from = lastPercent === null ? info.percent : lastPercent;

        const footer = info.isMaxLevel
            ? '<p class="hh-level-next is-max">' +
                  '<i class="fas fa-crown" aria-hidden="true"></i> ' +
                  escapeHtml(t('levelMaxLabel')) +
              '</p>' +
              '<p class="hh-level-max-note">' + escapeHtml(t('levelMaxNote')) + '</p>'
            : '<p class="hh-level-next">' +
                  escapeHtml(t('levelRemaining', {
                      n: info.xpRemaining,
                      name: levelName(info.nextLevel.id)
                  })) +
              '</p>';

        return '' +
            '<button type="button" class="hh-level-head" data-level-action="journey">' +
                markHtml(info.currentLevel) +
                '<span class="hh-level-head-text">' +
                    '<span class="hh-level-name">' + escapeHtml(name) + '</span>' +
                    '<span class="hh-level-rank">' + escapeHtml(rank) + '</span>' +
                '</span>' +
                '<i class="fas fa-chevron-right hh-level-chevron" aria-hidden="true"></i>' +
            '</button>' +
            (description ? '<p class="hh-level-desc">' + escapeHtml(description) + '</p>' : '') +
            '<div class="hh-level-xp">' +
                '<span class="hh-level-xp-value">' + escapeHtml(
                    info.isMaxLevel ? t('levelMaxXp', { n: info.currentLevel.minXP }) : info.totalXP
                ) + '</span>' +
                (info.isMaxLevel ? '' : '<span class="hh-level-xp-unit">' + escapeHtml(t('xpLabel')) + '</span>') +
            '</div>' +
            '<div class="hh-level-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                ' aria-valuenow="' + info.percent + '"' +
                ' aria-label="' + escapeHtml(t('levelProgressAria')) + '"' +
                ' aria-valuetext="' + escapeHtml(t('levelProgressPercent', { n: info.percent })) + '">' +
                '<div class="hh-level-fill is-' + escapeHtml(info.currentLevel.accent) + '" style="width: ' + from + '%"></div>' +
            '</div>' +
            footer;
    }

    function renderCard(info) {
        if (!elements.cardBody) return;

        elements.cardBody.innerHTML = cardHtml(info);

        if (elements.cardCrest) {
            elements.cardCrest.innerHTML = '<i class="' + escapeHtml(info.currentLevel.icon) + '"></i>';
            elements.cardCrest.dataset.accent = info.currentLevel.accent;
        }

        const head = elements.cardBody.querySelector('[data-level-action="journey"]');
        if (head) head.addEventListener('click', openJourney);

        const fill = elements.cardBody.querySelector('.hh-level-fill');
        if (!fill) return;

        // Anima do valor anterior para o novo. A transicao vive no CSS
        // e respeita prefers-reduced-motion.
        if (lastPercent !== null && lastPercent !== info.percent && !prefersReducedMotion() &&
            typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    fill.style.width = info.percent + '%';
                });
            });
        } else {
            fill.style.width = info.percent + '%';
        }

        lastPercent = info.percent;
    }

    // ==========================================================
    // Desenho completo
    //
    // `displayXP` permite desenhar com o total ANTERIOR, para a
    // barra poder animar a partir dele.
    // ==========================================================
    function render(displayXP) {
        const info = progressFor(displayXP);
        renderIdentity(info);
        renderCard(info);
        if (isJourneyOpen()) renderJourney();
    }

    // Reage a uma mudanca de XP (ponto 39)
    function applyChange(batch) {
        if (!batch || batch.previousXP === batch.currentXP) {
            render();
            return;
        }

        // Desenha no estado anterior e deixa a barra correr ate ao novo
        lastPercent = Levels.getProgress(batch.previousXP).percent;
        render(batch.currentXP);
    }

    // ==========================================================
    // Nota curta de progresso (ponto 42)
    //
    //   "170 XP para Conhecedor"
    //
    // Devolve '' no nivel maximo: nao ha nada por dizer.
    // ==========================================================
    function nextLevelHint() {
        const info = progressFor();
        if (info.isMaxLevel) return '';
        return t('levelRemaining', {
            n: info.xpRemaining,
            name: levelName(info.nextLevel.id)
        });
    }

    // Linha discreta no cartao da descoberta
    function renderDiscoveryNote(target) {
        const element = target || elements.scannerNote;
        if (!element) return;

        const hint = nextLevelHint();
        if (!hint) {
            element.classList.add('hidden');
            element.textContent = '';
            return;
        }

        element.textContent = hint;
        element.classList.remove('hidden');
    }

    function clearDiscoveryNote(target) {
        const element = target || elements.scannerNote;
        if (!element) return;
        element.classList.add('hidden');
        element.textContent = '';
    }

    // ==========================================================
    // Folha "A tua jornada" (pontos 24, 25 e 26)
    // ==========================================================
    function detailHtml(info) {
        const rows = [
            { label: t('xpTotalLabel'), value: t('levelXpValue', { n: info.totalXP }) }
        ];

        if (info.isMaxLevel) {
            rows.push({ label: t('levelNextLabel'), value: t('levelMaxLabel') });
        } else {
            rows.push({ label: t('levelNextLabel'), value: levelName(info.nextLevel.id) });
            rows.push({ label: t('levelRequired', { n: info.nextLevel.minXP }), value: '', full: true });
            rows.push({ label: t('levelRemainingShort', { n: info.xpRemaining }), value: '', full: true });
        }
        rows.push({ label: t('levelProgressPercent', { n: info.percent }), value: '', full: true });

        return '' +
            '<div class="hh-level-detail">' +
                '<div class="hh-level-detail-head">' +
                    markHtml(info.currentLevel) +
                    '<span class="hh-level-head-text">' +
                        '<span class="hh-level-name">' + escapeHtml(levelName(info.currentLevel.id)) + '</span>' +
                        '<span class="hh-level-rank">' + escapeHtml(levelRankText(info.currentLevel.level)) + '</span>' +
                    '</span>' +
                '</div>' +
                '<div class="hh-level-detail-rows">' +
                    rows.map(function (row) {
                        return '<p class="hh-level-detail-row' + (row.full ? ' is-full' : '') + '">' +
                            '<span>' + escapeHtml(row.label) + '</span>' +
                            (row.value ? '<strong>' + escapeHtml(row.value) + '</strong>' : '') +
                        '</p>';
                    }).join('') +
                '</div>' +
            '</div>';
    }

    function stateLabel(state) {
        if (state === 'done') return t('levelJourneyDone');
        if (state === 'current') return t('levelJourneyCurrent');
        return t('levelJourneyLocked');
    }

    function stateIcon(state) {
        if (state === 'done') return 'fas fa-check';
        if (state === 'current') return 'fas fa-circle';
        return 'fas fa-lock';
    }

    function journeyRowHtml(level) {
        return '' +
            '<div class="hh-level-step is-' + escapeHtml(level.state) + '">' +
                markHtml(level, level.state === 'locked' ? 'is-locked' : '') +
                '<div class="hh-level-step-body">' +
                    '<p class="hh-level-step-name">' + escapeHtml(levelName(level.id)) + '</p>' +
                    '<p class="hh-level-step-sub">' +
                        escapeHtml(levelRankText(level.level)) + ' · ' +
                        escapeHtml(t('levelXpValue', { n: level.minXP })) +
                    '</p>' +
                    '<p class="hh-level-step-desc">' + escapeHtml(levelDescription(level.id)) + '</p>' +
                '</div>' +
                '<span class="hh-level-step-state">' +
                    '<i class="' + stateIcon(level.state) + '" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(stateLabel(level.state)) + '</span>' +
                '</span>' +
            '</div>';
    }

    function renderJourney() {
        if (!elements.journeyList) return;

        const xp = totalXP();
        const info = Levels.getProgress(xp);

        elements.journeyList.innerHTML =
            detailHtml(info) +
            Levels.getJourney(xp).map(journeyRowHtml).join('');
    }

    function openJourney() {
        if (!elements.journeyModal) return;
        renderJourney();
        elements.journeyModal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
    }

    function closeJourney() {
        if (!elements.journeyModal) return;
        elements.journeyModal.classList.add('hidden');
        if (!isLevelUpOpen()) document.body.classList.remove('hh-no-scroll');
    }

    function isJourneyOpen() {
        return !!elements.journeyModal && !elements.journeyModal.classList.contains('hidden');
    }

    // ==========================================================
    // Celebracao de novo nivel (ponto 15)
    //
    // Quem decide SE deve ser mostrada e o script.js: aqui so se
    // desenha o que ja foi decidido.
    // ==========================================================
    function showLevelUp(level) {
        if (!elements.levelUpModal || !level) return;

        if (elements.levelUpMark) {
            elements.levelUpMark.className = 'hh-level-celebration-mark is-' + level.accent;
            elements.levelUpMark.innerHTML = '<i class="' + level.icon + '"></i>';
        }
        if (elements.levelUpKicker) elements.levelUpKicker.textContent = t('levelUpKicker');
        if (elements.levelUpName) elements.levelUpName.textContent = levelName(level.id);
        if (elements.levelUpRank) elements.levelUpRank.textContent = levelRankText(level.level);
        if (elements.levelUpDesc) elements.levelUpDesc.textContent = levelDescription(level.id);
        if (elements.levelUpUnlocked) {
            elements.levelUpUnlocked.innerHTML =
                '<i class="fas fa-check" aria-hidden="true"></i> ' + escapeHtml(t('levelUpUnlocked'));
        }

        elements.levelUpModal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
    }

    function closeLevelUp() {
        if (!elements.levelUpModal) return;
        elements.levelUpModal.classList.add('hidden');
        if (!isJourneyOpen()) document.body.classList.remove('hh-no-scroll');
        if (handlers.onLevelUpClosed) handlers.onLevelUpClosed();
    }

    function isLevelUpOpen() {
        return !!elements.levelUpModal && !elements.levelUpModal.classList.contains('hidden');
    }

    // ==========================================================
    // Arranque
    // ==========================================================
    function init(options) {
        const config = options || {};
        handlers.getTotalXP = config.getTotalXP || null;
        handlers.onLevelUpClosed = config.onLevelUpClosed || null;

        elements = {
            levelLine: document.getElementById('userLevelLine'),
            levelName: document.getElementById('userLevelName'),
            levelRank: document.getElementById('userLevel'),
            cardBody: document.getElementById('levelCardBody'),
            cardCrest: document.getElementById('levelCardCrest'),
            journeyModal: document.getElementById('levelJourneyModal'),
            journeyList: document.getElementById('levelJourneyList'),
            journeyClose: document.getElementById('closeLevelJourney'),
            levelUpModal: document.getElementById('levelUpModal'),
            levelUpMark: document.getElementById('levelUpMark'),
            levelUpKicker: document.getElementById('levelUpKicker'),
            levelUpName: document.getElementById('levelUpName'),
            levelUpRank: document.getElementById('levelUpRank'),
            levelUpDesc: document.getElementById('levelUpDesc'),
            levelUpUnlocked: document.getElementById('levelUpUnlocked'),
            levelUpClose: document.getElementById('closeLevelUp'),
            scannerNote: document.getElementById('scannerLevelNote')
        };

        if (elements.levelLine) elements.levelLine.addEventListener('click', openJourney);
        if (elements.journeyClose) elements.journeyClose.addEventListener('click', closeJourney);
        if (elements.journeyModal) {
            elements.journeyModal.addEventListener('click', function (event) {
                if (event.target === elements.journeyModal) closeJourney();
            });
        }
        if (elements.levelUpClose) elements.levelUpClose.addEventListener('click', closeLevelUp);

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            if (isLevelUpOpen()) closeLevelUp();
            else if (isJourneyOpen()) closeJourney();
        });
    }

    return {
        init: init,
        render: render,
        applyChange: applyChange,
        nextLevelHint: nextLevelHint,
        renderDiscoveryNote: renderDiscoveryNote,
        clearDiscoveryNote: clearDiscoveryNote,
        openJourney: openJourney,
        closeJourney: closeJourney,
        isJourneyOpen: isJourneyOpen,
        showLevelUp: showLevelUp,
        closeLevelUp: closeLevelUp,
        isLevelUpOpen: isLevelUpOpen
    };
})();
