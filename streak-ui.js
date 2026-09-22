// ============================================================
// Heritage Hunt CV — Streak de Exploracao (componentes visuais)
//
// Desenha o cartao do perfil, a semana, a folha de detalhe do dia
// e a celebracao. Nao contem regras de streak: tudo o que e calculo
// vem de ExplorationStreak (streak.js).
// ============================================================

const StreakUI = (function () {
    'use strict';

    const ACTIVITY = ExplorationStreak.ACTIVITY;

    // Ligacoes com a app, preenchidas em StreakUI.init()
    const handlers = {
        onExplore: null,        // CTA "Explorar monumentos"
        onMilestone: null,      // toque numa conquista desbloqueada
        resolveMonument: null,  // id -> objecto do monumento
        getNextStory: null      // () -> { monument, distance } | null
    };

    let elements = {};

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDistance(meters) {
        if (typeof meters !== 'number' || !isFinite(meters)) return null;
        if (meters >= 1000) return (meters / 1000).toFixed(1).replace('.', ',') + ' km';
        return Math.round(meters) + ' m';
    }

    function monumentName(monumentId) {
        if (monumentId === null || monumentId === undefined) return '';
        const monument = handlers.resolveMonument ? handlers.resolveMonument(monumentId) : null;
        return monument ? monument.name : '';
    }

    // ==========================================================
    // Cartao principal (perfil)
    // ==========================================================
    function heroHtml(status) {
        // Ponto 12 — ainda nao existe sequencia
        if (status.current === 0) {
            return '' +
                '<div class="hh-streak-hero is-empty">' +
                    '<span class="hh-streak-flame is-off"><i class="fas fa-fire"></i></span>' +
                    '<div class="hh-streak-hero-text">' +
                        '<p class="hh-streak-count">' + escapeHtml(t('streakEmptyTitle')) + '</p>' +
                        '<p class="hh-streak-state">' + escapeHtml(t('streakEmptySub')) + '</p>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="hh-streak-cta" data-streak-action="explore">' +
                    '<i class="fas fa-map-marked-alt"></i>' +
                    '<span>' + escapeHtml(t('streakEmptyCta')) + '</span>' +
                '</button>';
        }

        // Ponto 13 — ja explorou hoje / Ponto 14 — ainda nao
        const stateLine = status.exploredToday
            ? '<p class="hh-streak-state is-done"><i class="fas fa-check"></i> ' + escapeHtml(t('streakTodayDone')) + '</p>' +
              '<p class="hh-streak-note-line">' + escapeHtml(t('streakTomorrow')) + '</p>'
            : '<p class="hh-streak-state">' + escapeHtml(t('streakJourneyContinues')) + '</p>' +
              '<p class="hh-streak-note-line">' + escapeHtml(t('streakContinueToday')) + '</p>';

        return '' +
            '<div class="hh-streak-hero">' +
                '<span class="hh-streak-flame' + (status.exploredToday ? ' is-lit' : '') + '"><i class="fas fa-fire"></i></span>' +
                '<div class="hh-streak-hero-text">' +
                    '<p class="hh-streak-count">' + escapeHtml(streakDaysText(status.current)) + '</p>' +
                    stateLine +
                '</div>' +
            '</div>';
    }

    function weekHtml(week) {
        const labels = weekdayShortLabels();

        const days = week.days.map(function (day, index) {
            const classes = ['hh-streak-day'];
            if (day.explored) classes.push('is-on');
            if (day.isToday) classes.push('is-today');
            if (day.isFuture) classes.push('is-future');

            const interactive = day.explored && day.activityCount > 0;
            const label = escapeHtml(labels[index] || '');

            return '' +
                '<button type="button" class="' + classes.join(' ') + '"' +
                    ' data-streak-day="' + escapeHtml(day.date) + '"' +
                    (interactive ? '' : ' disabled aria-disabled="true"') +
                    ' aria-label="' + escapeHtml(formatDayMonth(day.date)) + '">' +
                    '<span class="hh-streak-dot"></span>' +
                    '<span class="hh-streak-dow">' + label + '</span>' +
                '</button>';
        }).join('');

        return '' +
            '<div class="hh-streak-week">' +
                '<p class="hh-streak-week-title">' + escapeHtml(t('streakThisWeek')) + '</p>' +
                '<div class="hh-streak-days">' + days + '</div>' +
            '</div>';
    }

    function statsHtml(status) {
        const tiles = [
            { variant: 'is-gold', icon: 'fas fa-fire', value: status.current, label: t('streakCurrentLabel') },
            { variant: 'is-trophy', icon: 'fas fa-trophy', value: status.best, label: t('streakBestLabel') },
            { variant: 'is-blue', icon: 'fas fa-calendar-alt', value: status.totalExplorationDays, label: t('streakTotalLabel') }
        ];

        const cells = tiles.map(function (tile) {
            return '' +
                '<div class="hh-streak-stat ' + tile.variant + '">' +
                    '<p class="hh-streak-stat-value">' +
                        '<i class="' + tile.icon + '"></i>' +
                        '<b>' + tile.value + '</b>' +
                        '<span>' + escapeHtml(t(tile.value === 1 ? 'streakUnitDay' : 'streakUnitDays')) + '</span>' +
                    '</p>' +
                    '<p class="hh-streak-stat-label">' + escapeHtml(tile.label) + '</p>' +
                '</div>';
        }).join('');

        return '<div class="hh-streak-stats">' + cells + '</div>';
    }

    // Ponto 14 — proxima historia, so quando ha distancia fiavel
    function nextStoryHtml(status) {
        if (!status.isActive || status.exploredToday) return '';
        if (!handlers.getNextStory) return '';

        const next = handlers.getNextStory();
        if (!next || !next.monument) return '';

        const distance = formatDistance(next.distance);
        const line = distance
            ? t('streakNextStory', { d: distance })
            : t('streakContinueToday');

        return '' +
            '<div class="hh-streak-next">' +
                '<span class="hh-streak-next-icon"><i class="fas fa-map-marker-alt"></i></span>' +
                '<div class="hh-streak-next-text">' +
                    '<p class="hh-streak-next-label">' + escapeHtml(line) + '</p>' +
                    '<p class="hh-streak-next-name">' + escapeHtml(next.monument.name) + '</p>' +
                '</div>' +
                '<button type="button" class="hh-streak-next-btn" data-streak-action="explore">' +
                    escapeHtml(t('streakExplore')) +
                '</button>' +
            '</div>';
    }

    // Ponto 16 — conquistas de sequencia
    function milestonesHtml() {
        const milestones = ExplorationStreak.getMilestoneStatus();

        const chips = milestones.map(function (milestone) {
            const name = streakBadgeText(milestone.id, 'short') || streakBadgeText(milestone.id, 'name');
            return '' +
                '<button type="button" class="hh-streak-badge' + (milestone.unlocked ? ' is-on' : '') + '"' +
                    ' data-streak-milestone="' + escapeHtml(milestone.id) + '"' +
                    (milestone.unlocked ? '' : ' disabled aria-disabled="true"') +
                    ' title="' + escapeHtml(streakBadgeText(milestone.id, 'name')) + '">' +
                    '<i class="' + milestone.icon + '"></i>' +
                    '<b>' + milestone.days + '</b>' +
                    '<span>' + escapeHtml(name) + '</span>' +
                '</button>';
        }).join('');

        return '' +
            '<div class="hh-streak-badges-block">' +
                '<p class="hh-streak-week-title">' + escapeHtml(t('streakBadgesTitle')) + '</p>' +
                '<div class="hh-streak-badges">' + chips + '</div>' +
            '</div>';
    }

    function renderCard() {
        const container = elements.card;
        if (!container) return;

        const status = ExplorationStreak.getStreakStatus();
        const week = ExplorationStreak.getWeekExplorationStatus();

        container.innerHTML =
            heroHtml(status) +
            weekHtml(week) +
            nextStoryHtml(status) +
            statsHtml(status) +
            milestonesHtml();

        container.querySelectorAll('[data-streak-action="explore"]').forEach(function (button) {
            button.addEventListener('click', function () {
                if (handlers.onExplore) handlers.onExplore();
            });
        });

        container.querySelectorAll('[data-streak-day]').forEach(function (button) {
            if (button.disabled) return;
            button.addEventListener('click', function () {
                openDay(button.dataset.streakDay);
            });
        });

        container.querySelectorAll('[data-streak-milestone]').forEach(function (button) {
            if (button.disabled) return;
            button.addEventListener('click', function () {
                if (handlers.onMilestone) handlers.onMilestone(button.dataset.streakMilestone);
            });
        });
    }

    // ==========================================================
    // Ponto 11 — folha de detalhe de um dia
    // ==========================================================

    // Agrupa as actividades do dia em linhas legiveis
    function summariseDay(activities) {
        const rows = [];
        let photoCount = 0;
        let experienceCount = 0;
        let missionCount = 0;

        activities.forEach(function (activity) {
            if (activity.type === ACTIVITY.MONUMENT_DISCOVERY) {
                const name = monumentName(activity.monumentId) || t('streakActivityDiscovery');
                const points = activity.metadata && activity.metadata.points;
                rows.push({
                    icon: 'fas fa-map-marker-alt',
                    variant: 'is-gold',
                    title: name,
                    meta: typeof points === 'number' ? t('streakXp', { n: points }) : t('streakActivityDiscovery')
                });
            } else if (activity.type === ACTIVITY.PHOTO_ADDED) {
                photoCount++;
            } else if (activity.type === ACTIVITY.EXPERIENCE_SAVED) {
                experienceCount++;
            } else if (activity.type === ACTIVITY.MISSION_COMPLETED) {
                missionCount++;
            }
        });

        if (photoCount > 0) {
            rows.push({
                icon: 'fas fa-camera',
                variant: 'is-blue',
                title: photoCount === 1
                    ? t('streakActivityPhotoOne')
                    : t('streakActivityPhotoMany', { n: photoCount }),
                meta: ''
            });
        }

        if (experienceCount > 0) {
            rows.push({
                icon: 'fas fa-pen',
                variant: 'is-green',
                title: t('streakActivityExperience'),
                meta: ''
            });
        }

        if (missionCount > 0) {
            rows.push({
                icon: 'fas fa-flag',
                variant: 'is-gold',
                title: t('streakActivityMission'),
                meta: ''
            });
        }

        return rows;
    }

    function openDay(dateKey) {
        if (!elements.dayModal) return;

        const activities = ExplorationStreak.getDayActivities(dateKey);
        const rows = summariseDay(activities);

        elements.dayTitle.textContent = formatDayMonth(dateKey);

        if (!rows.length) {
            elements.dayList.innerHTML = '<p class="hh-empty">' + escapeHtml(t('streakDayEmpty')) + '</p>';
        } else {
            elements.dayList.innerHTML = rows.map(function (row) {
                return '' +
                    '<div class="hh-streak-act">' +
                        '<span class="hh-streak-act-icon ' + row.variant + '"><i class="' + row.icon + '"></i></span>' +
                        '<div class="hh-streak-act-body">' +
                            '<p class="hh-streak-act-name">' + escapeHtml(row.title) + '</p>' +
                            (row.meta ? '<p class="hh-streak-act-meta">' + escapeHtml(row.meta) + '</p>' : '') +
                        '</div>' +
                    '</div>';
            }).join('');
        }

        elements.dayModal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
    }

    function closeDay() {
        if (!elements.dayModal) return;
        elements.dayModal.classList.add('hidden');
        if (!isCelebrationOpen()) document.body.classList.remove('hh-no-scroll');
    }

    function isDayOpen() {
        return !!elements.dayModal && !elements.dayModal.classList.contains('hidden');
    }

    // ==========================================================
    // Pontos 8 e 13 — celebracao da sequencia
    // ==========================================================
    function celebrationTexts(result) {
        return {
            kicker: result.isNewStreak ? t('streakNew') : t('streakKept'),
            count: streakDaysText(result.current),
            note: t('streakCelebrationNote')
        };
    }

    // Bloco compacto mostrado dentro do cartao de descoberta do scanner
    function renderDiscoveryNote(target, result) {
        if (!target) return;

        if (!result || !result.isNewDay) {
            target.classList.add('hidden');
            target.innerHTML = '';
            return;
        }

        const texts = celebrationTexts(result);
        target.innerHTML = '' +
            '<span class="hh-streak-note-kicker"><i class="fas fa-fire"></i> ' + escapeHtml(texts.kicker) + '</span>' +
            '<span class="hh-streak-note-count">' + escapeHtml(texts.count) + '</span>';
        target.classList.remove('hidden');
    }

    // Modal usado pelas accoes fora do scanner (foto / experiencia).
    // `extraLine` e texto ja formatado por quem chama — o streak nao
    // sabe de onde vem (hoje e o XP da accao).
    function showCelebration(result, extraLine) {
        if (!elements.celebrationModal || !result || !result.isNewDay) return;

        const texts = celebrationTexts(result);
        elements.celebrationKicker.textContent = texts.kicker;
        elements.celebrationCount.textContent = texts.count;
        elements.celebrationNote.textContent = texts.note;

        if (elements.celebrationExtra) {
            elements.celebrationExtra.textContent = extraLine || '';
            elements.celebrationExtra.classList.toggle('hidden', !extraLine);
        }

        elements.celebrationModal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
    }

    function closeCelebration() {
        if (!elements.celebrationModal) return;
        elements.celebrationModal.classList.add('hidden');
        if (!isDayOpen()) document.body.classList.remove('hh-no-scroll');
    }

    function isCelebrationOpen() {
        return !!elements.celebrationModal && !elements.celebrationModal.classList.contains('hidden');
    }

    // ==========================================================
    // Arranque
    // ==========================================================
    function init(options) {
        const config = options || {};
        handlers.onExplore = config.onExplore || null;
        handlers.onMilestone = config.onMilestone || null;
        handlers.resolveMonument = config.resolveMonument || null;
        handlers.getNextStory = config.getNextStory || null;

        elements = {
            card: document.getElementById('streakCard'),
            dayModal: document.getElementById('streakDayModal'),
            dayTitle: document.getElementById('streakDayTitle'),
            dayList: document.getElementById('streakDayList'),
            dayClose: document.getElementById('closeStreakDayModal'),
            celebrationModal: document.getElementById('streakCelebrationModal'),
            celebrationKicker: document.getElementById('streakCelebrationKicker'),
            celebrationCount: document.getElementById('streakCelebrationCount'),
            celebrationNote: document.getElementById('streakCelebrationNote'),
            celebrationExtra: document.getElementById('streakCelebrationXp'),
            celebrationClose: document.getElementById('closeStreakCelebration')
        };

        if (elements.dayClose) elements.dayClose.addEventListener('click', closeDay);
        if (elements.dayModal) {
            elements.dayModal.addEventListener('click', function (event) {
                if (event.target === elements.dayModal) closeDay();
            });
        }

        if (elements.celebrationClose) elements.celebrationClose.addEventListener('click', closeCelebration);
        if (elements.celebrationModal) {
            elements.celebrationModal.addEventListener('click', function (event) {
                if (event.target === elements.celebrationModal) closeCelebration();
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            if (isCelebrationOpen()) closeCelebration();
            else if (isDayOpen()) closeDay();
        });
    }

    return {
        init: init,
        render: renderCard,
        renderDiscoveryNote: renderDiscoveryNote,
        showCelebration: showCelebration,
        closeCelebration: closeCelebration,
        openDay: openDay,
        closeDay: closeDay,
        isDayOpen: isDayOpen,
        isCelebrationOpen: isCelebrationOpen
    };
})();
