// ============================================================
// Heritage Hunt CV — XP (componentes visuais)
//
// Desenha o total, o cartao de progressao, o historico, as zonas,
// o aviso discreto (toast) e o bloco da celebracao de descoberta.
//
// Nao decide montantes nem valida recompensas: tudo isso vive em
// xp.js. Aqui so se le e se desenha.
// ============================================================

const XPUI = (function () {
    'use strict';

    const HISTORY_PAGE_SIZE = 20;   // ponto 50: historico paginado
    const RECENT_LIMIT = 5;         // ponto 49: o perfil so carrega as ultimas
    const TOAST_DURATION = 3200;

    const handlers = {
        resolveMonument: null,
        resolveZone: null,
        getMonumentProgress: null
    };

    let elements = {};
    let historyOffset = 0;
    let toastTimer = null;
    // Enquanto o total esta a contar, nenhum outro desenho lhe toca
    let animating = false;

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

    // Chave do dia LOCAL de um instante ISO. Deliberadamente local e
    // nao partilhada com o streak, para os dois sistemas continuarem
    // independentes (ponto 26).
    function localDateKey(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return '';
        const pad = (n) => (n < 10 ? '0' + n : String(n));
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    function todayKey() {
        return localDateKey(new Date());
    }

    function yesterdayKey() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return localDateKey(date);
    }

    function dayLabel(dateKey) {
        if (dateKey === todayKey()) return t('xpToday');
        if (dateKey === yesterdayKey()) return t('xpYesterday');
        return formatDayMonth(dateKey);
    }

    // ==========================================================
    // Descricao de uma transacao (ponto 22 e 47)
    // ==========================================================
    function monumentName(monumentId) {
        if (monumentId === null || monumentId === undefined) return '';
        const monument = handlers.resolveMonument ? handlers.resolveMonument(monumentId) : null;
        return monument ? monument.name : '';
    }

    function describe(transaction) {
        const config = XP.getActionConfig(transaction.action) || {};
        const icon = config.icon || 'fas fa-star';

        if (transaction.action === XP.ACTION.MONUMENT_DISCOVERED) {
            return {
                icon: icon,
                variant: 'is-gold',
                title: monumentName(transaction.monumentId) || t('xpMonumentDiscovered'),
                subtitle: t('xpMonumentDiscovered')
            };
        }

        if (transaction.action === XP.ACTION.ZONE_COMPLETED) {
            return {
                icon: icon,
                variant: 'is-zone',
                title: zoneName(transaction.zoneId || transaction.entityId),
                subtitle: t('xpZoneCompleted')
            };
        }

        if (transaction.action === XP.ACTION.PHOTO_ADDED) {
            return {
                icon: icon,
                variant: 'is-blue',
                title: t('xpPhotoAdded'),
                subtitle: monumentName(transaction.monumentId)
            };
        }

        if (transaction.action === XP.ACTION.EXPERIENCE_ADDED) {
            return {
                icon: icon,
                variant: 'is-green',
                title: t('xpExperienceAdded'),
                subtitle: monumentName(transaction.monumentId)
            };
        }

        // Accoes futuras ainda sem texto proprio: mostram algo util
        return { icon: icon, variant: 'is-gold', title: transaction.action, subtitle: '' };
    }

    function rowHtml(transaction) {
        const info = describe(transaction);
        return '' +
            '<div class="hh-xp-row">' +
                '<span class="hh-xp-row-icon ' + info.variant + '"><i class="' + info.icon + '"></i></span>' +
                '<div class="hh-xp-row-body">' +
                    '<p class="hh-xp-row-title">' + escapeHtml(info.title) + '</p>' +
                    (info.subtitle ? '<p class="hh-xp-row-sub">' + escapeHtml(info.subtitle) + '</p>' : '') +
                '</div>' +
                '<span class="hh-xp-row-amount">' + escapeHtml(t('xpAmount', { n: transaction.amount })) + '</span>' +
            '</div>';
    }

    // ==========================================================
    // Total animado (ponto 25)
    // ==========================================================
    function setTotalText(element, value) {
        if (element) element.textContent = value;
    }

    function totalElements() {
        return [elements.profileTotal, elements.headerTotal, elements.cardTotal].filter(Boolean);
    }

    function animateTotal(from, to) {
        const targets = totalElements();
        if (!targets.length) return;

        if (prefersReducedMotion() || from === to || typeof requestAnimationFrame !== 'function') {
            targets.forEach(el => setTotalText(el, to));
            return;
        }

        const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = 700;
        animating = true;

        function step(now) {
            const elapsed = (typeof now === 'number' ? now : Date.now()) - start;
            const progress = Math.min(1, elapsed / duration);
            // ease-out suave, sem exageros
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(from + (to - from) * eased);
            targets.forEach(el => setTotalText(el, value));

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                animating = false;
            }
        }

        requestAnimationFrame(step);
    }

    // ==========================================================
    // Cartao de progressao no perfil (ponto 21)
    // ==========================================================
    // `displayTotal` permite desenhar com o valor ANTERIOR, para a
    // animacao poder contar a partir dele sem piscar.
    function renderProfile(displayTotal) {
        const shown = displayTotal === undefined ? XP.getTotalXP() : displayTotal;

        if (!animating) totalElements().forEach(el => setTotalText(el, shown));

        if (!elements.cardBody) return;

        const recent = XP.getHistory({ limit: RECENT_LIMIT });

        const list = recent.length
            ? '<div class="hh-xp-list">' + recent.map(rowHtml).join('') + '</div>'
            : '<p class="hh-empty">' + escapeHtml(t('xpHistoryEmpty')) + '</p>';

        const moreButton = XP.getHistoryCount() > 0
            ? '<button type="button" class="hh-xp-more" data-xp-action="history">' +
                  '<span>' + escapeHtml(t('xpViewHistory')) + '</span>' +
                  '<i class="fas fa-chevron-right" aria-hidden="true"></i>' +
              '</button>'
            : '';

        elements.cardBody.innerHTML = '' +
            '<div class="hh-xp-total">' +
                '<span class="hh-xp-total-value" id="xpTotalValue">' + shown + '</span>' +
                '<span class="hh-xp-total-unit">' + escapeHtml(t('xpLabel')) + '</span>' +
            '</div>' +
            '<p class="hh-xp-note">' + escapeHtml(t('xpJourneyNote')) + '</p>' +
            '<p class="hh-streak-week-title">' + escapeHtml(t('xpRecentTitle')) + '</p>' +
            list +
            moreButton;

        // O total do cartao e recriado a cada desenho
        elements.cardTotal = document.getElementById('xpTotalValue');

        const button = elements.cardBody.querySelector('[data-xp-action="history"]');
        if (button) button.addEventListener('click', openHistory);
    }

    // ==========================================================
    // Historico completo (pontos 22 e 50)
    // ==========================================================
    function renderHistoryPage(reset) {
        if (!elements.historyList) return;

        if (reset) {
            historyOffset = 0;
            elements.historyList.innerHTML = '';
        }

        const page = XP.getHistory({ limit: HISTORY_PAGE_SIZE, offset: historyOffset });

        if (!page.length && historyOffset === 0) {
            elements.historyList.innerHTML = '<p class="hh-empty">' + escapeHtml(t('xpHistoryEmpty')) + '</p>';
            if (elements.historyMore) elements.historyMore.classList.add('hidden');
            return;
        }

        // Agrupa por dia, continuando o ultimo grupo quando a pagina
        // seguinte comeca no mesmo dia
        let html = '';
        let lastKey = elements.historyList.dataset.lastDay || '';

        page.forEach(function (transaction) {
            const key = localDateKey(transaction.createdAt);
            if (key !== lastKey) {
                html += '<p class="hh-xp-day">' + escapeHtml(dayLabel(key)) + '</p>';
                lastKey = key;
            }
            html += rowHtml(transaction);
        });

        elements.historyList.insertAdjacentHTML('beforeend', html);
        elements.historyList.dataset.lastDay = lastKey;

        historyOffset += page.length;

        if (elements.historyMore) {
            const hasMore = historyOffset < XP.getHistoryCount();
            elements.historyMore.classList.toggle('hidden', !hasMore);
        }
    }

    function openHistory() {
        if (!elements.historyModal) return;
        if (elements.historyList) delete elements.historyList.dataset.lastDay;
        renderHistoryPage(true);
        elements.historyModal.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');
    }

    function closeHistory() {
        if (!elements.historyModal) return;
        elements.historyModal.classList.add('hidden');
        document.body.classList.remove('hh-no-scroll');
    }

    function isHistoryOpen() {
        return !!elements.historyModal && !elements.historyModal.classList.contains('hidden');
    }

    // ==========================================================
    // Aviso discreto (ponto 23)
    // ==========================================================

    // Recebe o resultado de XP.awardMany. Quando nao houve XP (limite
    // atingido, recompensa repetida) mostra apenas `fallbackText`, para
    // a accao nunca ficar sem confirmacao.
    //
    // `noteText` e uma segunda linha opcional (ex.: "170 XP para
    // Conhecedor"). So aparece quando houve mesmo XP: sem recompensa
    // nao ha progresso por anunciar (ponto 42).
    function toast(batch, fallbackText, noteText) {
        if (!elements.toast) return;

        const earned = !!(batch && batch.totalAwarded);
        if (!earned && !fallbackText) return;

        if (earned) {
            const info = describe(batch.awarded[0].transaction);
            elements.toast.innerHTML = '' +
                '<span class="hh-xp-toast-amount">' + escapeHtml(t('xpAmount', { n: batch.totalAwarded })) + '</span>' +
                '<span class="hh-xp-toast-text">' + escapeHtml(info.title) + '</span>' +
                (noteText ? '<span class="hh-xp-toast-note">' + escapeHtml(noteText) + '</span>' : '');
        } else {
            elements.toast.innerHTML =
                '<span class="hh-xp-toast-text">' + escapeHtml(fallbackText) + '</span>';
        }

        elements.toast.classList.toggle('is-plain', !earned);
        // Com segunda linha o aviso deixa de ser uma pilula de uma linha
        elements.toast.classList.toggle('has-note', !!(earned && noteText));
        elements.toast.classList.remove('hidden');
        // reinicia a animacao
        void elements.toast.offsetWidth;
        elements.toast.classList.add('is-on');

        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            elements.toast.classList.remove('is-on');
            toastTimer = setTimeout(function () {
                elements.toast.classList.add('hidden');
            }, 260);
        }, TOAST_DURATION);
    }

    // Resumo de uma atribuicao, para quem quiser mostra-la noutro
    // sitio (ex.: dentro da celebracao da sequencia). Devolve ''
    // quando nao houve XP.
    function summaryText(batch) {
        if (!batch || !batch.totalAwarded) return '';
        const info = describe(batch.awarded[0].transaction);
        return t('xpAmount', { n: batch.totalAwarded }) + ' · ' + info.title;
    }

    // ==========================================================
    // Celebracao da descoberta (ponto 24)
    // ==========================================================

    // `batch` e o resultado de XP.awardMany com a descoberta e, se for
    // o caso, a zona concluida.
    // ==========================================================
    // Zonas (ponto 40)
    // ==========================================================
    function renderZones(zones, discoveredIds) {
        if (!elements.zonesList) return;

        const discovered = discoveredIds || [];
        const rewardAmount = XP.getActionAmount(XP.ACTION.ZONE_COMPLETED);

        if (!zones || !zones.length) {
            elements.zonesList.innerHTML = '';
            return;
        }

        elements.zonesList.innerHTML = zones.map(function (zone) {
            const total = zone.monumentIds.length;
            const done = zone.monumentIds.filter(function (id) {
                return discovered.indexOf(id) !== -1;
            }).length;
            const complete = done === total;
            const percent = total ? Math.round((done / total) * 100) : 0;

            return '' +
                '<div class="hh-zone' + (complete ? ' is-done' : '') + '">' +
                    '<div class="hh-zone-head">' +
                        '<p class="hh-zone-name">' + escapeHtml(zoneName(zone.id)) + '</p>' +
                        (complete
                            ? '<span class="hh-zone-state"><i class="fas fa-check"></i> ' + escapeHtml(t('zoneDone')) + '</span>'
                            : '<span class="hh-zone-count">' + escapeHtml(t('zoneProgress', { done: done, total: total })) + '</span>') +
                    '</div>' +
                    '<div class="hh-zone-track"><div class="hh-zone-fill" style="width: ' + percent + '%"></div></div>' +
                    '<p class="hh-zone-reward' + (complete ? ' is-done' : '') + '">' +
                        (complete
                            ? '<i class="fas fa-check" aria-hidden="true"></i> ' + escapeHtml(t('xpObtained', { n: rewardAmount }))
                            : escapeHtml(t('zoneReward', { n: rewardAmount }))) +
                    '</p>' +
                '</div>';
        }).join('');
    }

    // ==========================================================
    // Reaccao a mudancas de XP (ponto 52)
    // ==========================================================
    function applyChange(batch) {
        if (!batch) {
            renderProfile();
            return;
        }

        // Desenha primeiro com o valor antigo (o cartao e recriado, por
        // isso a animacao tem de comecar depois) e so entao conta.
        animating = false;
        renderProfile(batch.previousXP);
        animateTotal(batch.previousXP, batch.currentXP);

        if (isHistoryOpen()) {
            if (elements.historyList) delete elements.historyList.dataset.lastDay;
            renderHistoryPage(true);
        }
    }

    // ==========================================================
    // Arranque
    // ==========================================================
    function init(options) {
        const config = options || {};
        handlers.resolveMonument = config.resolveMonument || null;
        handlers.resolveZone = config.resolveZone || null;
        handlers.getMonumentProgress = config.getMonumentProgress || null;

        elements = {
            profileTotal: document.getElementById('totalPoints'),
            headerTotal: document.getElementById('totalPointsHeader'),
            cardBody: document.getElementById('xpCardBody'),
            cardTotal: null,
            historyModal: document.getElementById('xpHistoryModal'),
            historyList: document.getElementById('xpHistoryList'),
            historyMore: document.getElementById('xpHistoryMore'),
            historyClose: document.getElementById('closeXpHistory'),
            toast: document.getElementById('xpToast'),
            zonesList: document.getElementById('zonesList')
        };

        if (elements.historyClose) elements.historyClose.addEventListener('click', closeHistory);
        if (elements.historyMore) elements.historyMore.addEventListener('click', function () { renderHistoryPage(false); });
        if (elements.historyModal) {
            elements.historyModal.addEventListener('click', function (event) {
                if (event.target === elements.historyModal) closeHistory();
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isHistoryOpen()) closeHistory();
        });
    }

    return {
        init: init,
        render: renderProfile,
        applyChange: applyChange,
        toast: toast,
        describe: describe,
        summaryText: summaryText,
        renderZones: renderZones,
        openHistory: openHistory,
        closeHistory: closeHistory,
        isHistoryOpen: isHistoryOpen
    };
})();
