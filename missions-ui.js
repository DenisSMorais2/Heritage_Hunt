// ============================================================
// Heritage Hunt CV — Missao semanal (interface)
//
// Um cartao compacto e uma celebracao sobria. Nao ha aba nova, nao
// ha dashboard e nao ha confetti (pontos 26 e 27).
//
// Desenha a partir do estado que missions.js ja calculou. Nao
// escolhe missoes, nao conta progresso e nao atribui recompensas:
// recebe o que mostrar e mostra.
// ============================================================

const MissionsUI = (function () {
    'use strict';

    const handlers = {
        // "Continuar" leva sempre a uma accao util (ponto 28)
        onContinue: null,
        onClosed: null
    };

    let elements = {};
    let current = null;

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
    // Texto de um objectivo
    //
    // O texto vive no i18n; aqui so se escolhe a chave. Uma missao
    // limitada a uma zona usa a variante `_ZONE`, para a frase ficar
    // "Descobre 1 monumento do Centro Historico" e nao duas frases
    // colocadas lado a lado.
    // ==========================================================
    // "Escreve 1 memória" e "Escreve 2 memórias" sao frases
    // diferentes, nao a mesma com um numero trocado. O plural segue
    // o padrao que a sequencia ja usa (streakDayOne / streakDayMany):
    // duas chaves, e nao uma regra de gramatica no codigo — porque a
    // regra muda com o idioma e o codigo nao devia saber disso.
    function goalText(goal) {
        const key = 'mission.goal.' + goal.type +
            (goal.zoneId ? '_ZONE' : '') +
            (goal.count === 1 ? '' : '_MANY');

        return t(key, {
            n: goal.count,
            zone: goal.zoneId ? zoneName(goal.zoneId) : ''
        });
    }

    function goalHtml(goal) {
        const icon = goal.isDone ? 'fas fa-circle-check' : 'far fa-circle';

        return '' +
            '<li class="hh-mi-goal' + (goal.isDone ? ' is-done' : '') + '">' +
                '<i class="' + icon + '" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(goalText(goal)) + '</span>' +
                (goal.count > 1
                    ? '<b class="hh-mi-goal-count">' + goal.done + '/' + goal.count + '</b>'
                    : '') +
            '</li>';
    }

    function missionName(status) {
        return missionText(status.mission.id, 'name') || status.mission.id;
    }

    // ==========================================================
    // O cartao compacto (pontos 19 e 27)
    //
    //   ESTA SEMANA
    //   Explora o Centro Historico
    //   * Descobre 1 monumento
    //   o Guarda 1 fotografia
    //   2 / 3  [=========...]
    //   [ Continuar ]
    // ==========================================================
    function cardHtml(status) {
        if (!status || !status.mission) return '';

        const zone = status.mission.zoneId ? zoneName(status.mission.zoneId) : '';
        const description = missionText(status.mission.id, 'description');

        // Missao feita: o cartao passa a confirmacao, sem botao — o
        // que ha para fazer a seguir e descobrir, nao repetir.
        const cta = status.isComplete
            ? '<p class="hh-mi-done-note">' +
                  '<i class="fas fa-circle-check" aria-hidden="true"></i> ' +
                  escapeHtml(t('mission.completed')) +
              '</p>'
            : '<button type="button" class="hh-mi-cta" data-mi-action="continue">' +
                  '<span>' + escapeHtml(t('mission.continue')) + '</span>' +
                  '<i class="fas fa-chevron-right" aria-hidden="true"></i>' +
              '</button>';

        return '' +
            '<div class="hh-mi-card' + (status.isComplete ? ' is-complete' : '') + '" data-eng-step>' +
                '<div class="hh-mi-head">' +
                    '<span class="hh-mi-crest" aria-hidden="true">' +
                        '<i class="' + escapeHtml(status.mission.icon || 'fas fa-compass') + '"></i>' +
                    '</span>' +
                    '<div class="hh-mi-titles">' +
                        '<p class="hh-mi-kicker">' + escapeHtml(t('mission.thisWeek')) + '</p>' +
                        '<p class="hh-mi-name">' + escapeHtml(missionName(status)) + '</p>' +
                        (zone ? '<p class="hh-mi-zone">' + escapeHtml(zone) + '</p>' : '') +
                    '</div>' +
                '</div>' +
                (description ? '<p class="hh-mi-desc">' + escapeHtml(description) + '</p>' : '') +
                '<ul class="hh-mi-goals">' + status.goals.map(goalHtml).join('') + '</ul>' +
                '<div class="hh-mi-bar-row">' +
                    '<div class="hh-mi-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                        ' aria-valuenow="' + status.percent + '"' +
                        ' aria-label="' + escapeHtml(t('mission.thisWeek')) + '"' +
                        ' aria-valuetext="' + escapeHtml(t('mission.progress', { done: status.done, total: status.total })) + '">' +
                        '<div class="hh-mi-fill" style="width: ' + status.percent + '%"></div>' +
                    '</div>' +
                    '<span class="hh-mi-count">' +
                        escapeHtml(t('mission.progress', { done: status.done, total: status.total })) +
                    '</span>' +
                '</div>' +
                cta +
            '</div>';
    }

    // ==========================================================
    // Celebracao (ponto 26)
    //
    // Sobria de proposito: um icone, os objectivos feitos, a
    // recompensa e um convite para continuar. Nada de confetti.
    // ==========================================================
    function celebrationHtml(status, rewardXp) {
        const zone = status.mission.zoneId ? zoneName(status.mission.zoneId) : '';

        return '' +
            '<span class="hh-mi-cel-crest" aria-hidden="true">' +
                '<i class="' + escapeHtml(status.mission.icon || 'fas fa-compass') + '"></i>' +
            '</span>' +
            '<p class="hh-mi-cel-kicker">' + escapeHtml(t('mission.completedTitle')) + '</p>' +
            '<p class="hh-mi-cel-name">' + escapeHtml(missionName(status)) + '</p>' +
            (zone ? '<p class="hh-mi-cel-zone">' + escapeHtml(zone) + '</p>' : '') +
            '<p class="hh-mi-cel-goals">' +
                escapeHtml(t('mission.goalsDone', { done: status.total, total: status.total })) +
            '</p>' +
            (rewardXp > 0
                ? '<p class="hh-mi-cel-xp">' + escapeHtml(xpAmountText(rewardXp)) + '</p>'
                : '') +
            '<p class="hh-mi-cel-note">' + escapeHtml(t('mission.rewardNote')) + '</p>';
    }

    function showCelebration(status, rewardXp) {
        if (!status || !status.mission || !elements.modal || !elements.body) return false;

        current = { status: status, rewardXp: rewardXp || 0 };
        elements.body.innerHTML = celebrationHtml(status, current.rewardXp);

        elements.modal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');

        if (!prefersReducedMotion() && elements.sheet) {
            elements.sheet.classList.remove('is-in');
            // Um quadro de espera para a transicao arrancar do inicio
            requestAnimationFrame(function () {
                elements.sheet.classList.add('is-in');
            });
        } else if (elements.sheet) {
            elements.sheet.classList.add('is-in');
        }

        const cta = elements.modal.querySelector('[data-mi-action="explore"]');
        if (cta) cta.focus();

        return true;
    }

    function close() {
        if (!elements.modal) return;

        elements.modal.classList.add('hidden');
        document.body.classList.remove('hh-no-scroll');
        current = null;

        // Devolve o lugar a fila de celebracoes (ponto 17)
        if (handlers.onClosed) handlers.onClosed();
    }

    function isOpen() {
        return !!current;
    }

    // Volta a desenhar a celebracao aberta, para quando o idioma
    // muda a meio (o mesmo cuidado do DiscoveryUI.refresh).
    function refresh() {
        if (!current || !elements.body) return;
        elements.body.innerHTML = celebrationHtml(current.status, current.rewardXp);
    }

    function init(options) {
        const config = options || {};
        handlers.onContinue = config.onContinue || null;
        handlers.onClosed = config.onClosed || null;

        elements = {
            modal: document.getElementById('missionModal'),
            sheet: document.getElementById('missionSheet'),
            body: document.getElementById('missionBody')
        };

        if (elements.modal) {
            elements.modal.addEventListener('click', function (event) {
                if (event.target === elements.modal) close();
            });

            elements.modal.querySelectorAll('[data-mi-action]').forEach(function (button) {
                button.addEventListener('click', function () {
                    const action = button.dataset.miAction;
                    if (action === 'explore') {
                        close();
                        if (handlers.onContinue) handlers.onContinue(null);
                        return;
                    }
                    close();
                });
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isOpen()) close();
        });
    }

    // O cartao e desenhado por quem tem o lugar (EngagementUI), mas
    // o botao e nosso: quem o liga e quem sabe o que ele faz.
    function bindCard(container, status) {
        if (!container) return;

        const button = container.querySelector('[data-mi-action="continue"]');
        if (!button) return;

        button.addEventListener('click', function () {
            if (handlers.onContinue) handlers.onContinue(status && status.nextGoal);
        });
    }

    return {
        init: init,
        cardHtml: cardHtml,
        bindCard: bindCard,
        showCelebration: showCelebration,
        refresh: refresh,
        close: close,
        isOpen: isOpen
    };
})();
