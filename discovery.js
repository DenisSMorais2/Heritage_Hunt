// ============================================================
// Heritage Hunt CV — Celebração de descoberta (camada de domínio)
//
// Reúne, num único objecto, tudo o que a celebração precisa de
// mostrar depois de uma descoberta JÁ persistida. Não calcula
// recompensas: recebe os resultados que os domínios reais
// (xp.js, streak.js, levels.js, journey.js) já produziram.
//
// Regras deste ficheiro:
//   - não toca no DOM;
//   - não toca em localStorage;
//   - NÃO decide montantes de XP (ponto 47): lê-os do lote do XP;
//   - não conhece traduções (devolve ids; os nomes vivem no i18n);
//   - não guarda nada: a celebração pertence ao momento, e um
//     refresh nunca a repete.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Discovery = api.Discovery;
        root.DISCOVERY_VARIANT = api.DISCOVERY_VARIANT;
        root.DISCOVERY_TONE = api.DISCOVERY_TONE;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // Variantes da celebração (ponto 25)
    //
    // A intensidade visual muda com o momento, não com o gosto de
    // quem desenha: a primeira descoberta e a jornada completa têm
    // tratamento próprio, tudo o resto é `standard`.
    // ==========================================================
    const DISCOVERY_VARIANT = {
        FIRST: 'first',
        STANDARD: 'standard',
        COMPLETE: 'complete'
    };

    // Tom da frase contextual (ponto 12). O texto vive no i18n, nas
    // chaves discovery.tone.<tom>.
    const DISCOVERY_TONE = {
        FIRST: 'first',
        QUARTER: 'quarter',
        HALF: 'half',
        THREE_QUARTERS: 'threeQuarters',
        COMPLETE: 'complete',
        ONWARD: 'onward'
    };

    // Limiares que, ao serem atravessados, merecem frase própria.
    // Do mais alto para o mais baixo: o primeiro que a descoberta
    // atravessou é o que conta.
    const TONE_THRESHOLDS = [
        { percent: 75, tone: DISCOVERY_TONE.THREE_QUARTERS },
        { percent: 50, tone: DISCOVERY_TONE.HALF },
        { percent: 25, tone: DISCOVERY_TONE.QUARTER }
    ];

    // Ordem de destaque dos blocos especiais (ponto 24). Uma subida
    // de nível pesa mais do que uma zona, que pesa mais do que uma
    // medalha. Nada disto abre um modal próprio (ponto 13).
    const SPECIAL_ORDER = ['levelUp', 'zone', 'badge'];

    function toNonNegativeInt(value) {
        const number = Number(value);
        if (!isFinite(number) || number < 0) return 0;
        return Math.floor(number);
    }

    function toPercent(done, total) {
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    // ==========================================================
    // XP — lido do lote, nunca recalculado (pontos 8 e 47)
    //
    // O lote do XP é a única fonte: se uma recompensa não foi
    // atribuída, não aparece aqui.
    // ==========================================================
    function awardsFor(batch, action) {
        return asArray(batch && batch.awarded).filter(function (result) {
            return result && result.action === action;
        });
    }

    function sumAmounts(awards) {
        return awards.reduce(function (total, result) {
            return total + toNonNegativeInt(result.amount);
        }, 0);
    }

    function buildXP(batch, actions) {
        const monumentAwards = awardsFor(batch, actions.MONUMENT_DISCOVERED);
        const zoneAwards = awardsFor(batch, actions.ZONE_COMPLETED);

        return {
            monument: sumAmounts(monumentAwards),
            zone: sumAmounts(zoneAwards),
            earned: toNonNegativeInt(batch && batch.totalAwarded),
            total: toNonNegativeInt(batch && batch.currentXP),
            previousTotal: toNonNegativeInt(batch && batch.previousXP),
            // Só separamos os dois valores quando a zona rendeu mesmo
            hasZoneBonus: zoneAwards.length > 0
        };
    }

    // Zona concluída por esta descoberta. O id vem da transacção
    // real; o tamanho vem da configuração de zonas da aplicação.
    function buildZone(batch, actions, zones) {
        const award = awardsFor(batch, actions.ZONE_COMPLETED)[0];
        if (!award) return null;

        const transaction = award.transaction || {};
        const zoneId = transaction.zoneId || transaction.entityId || null;
        if (!zoneId) return null;

        const zone = asArray(zones).filter(function (entry) {
            return entry && entry.id === zoneId;
        })[0];
        const total = zone ? asArray(zone.monumentIds).length : 0;

        return {
            id: zoneId,
            xp: toNonNegativeInt(award.amount),
            discovered: total,
            total: total
        };
    }

    // ==========================================================
    // Progresso da jornada (pontos 10 e 11)
    //
    // Guardamos o valor anterior para que a barra anime de onde
    // estava, nunca de zero.
    // ==========================================================
    function buildProgress(progress, previous) {
        const total = toNonNegativeInt(progress && progress.total);
        const discovered = toNonNegativeInt(progress && progress.discovered);
        const previousDiscovered = Math.max(0, Math.min(
            toNonNegativeInt(previous && previous.discovered),
            discovered
        ));

        return {
            discovered: discovered,
            total: total,
            percent: toPercent(discovered, total),
            previousDiscovered: previousDiscovered,
            previousPercent: toPercent(previousDiscovered, total),
            isFirst: discovered === 1,
            isComplete: total > 0 && discovered === total
        };
    }

    // O tom é o do limiar ATRAVESSADO por esta descoberta. Sem
    // limiar atravessado, é o do patamar onde o explorador está.
    function toneFor(progress) {
        if (progress.isComplete) return DISCOVERY_TONE.COMPLETE;
        if (progress.isFirst) return DISCOVERY_TONE.FIRST;

        const crossed = TONE_THRESHOLDS.filter(function (entry) {
            return progress.previousPercent < entry.percent && progress.percent >= entry.percent;
        })[0];

        return crossed ? crossed.tone : DISCOVERY_TONE.ONWARD;
    }

    function variantFor(progress) {
        if (progress.isComplete) return DISCOVERY_VARIANT.COMPLETE;
        if (progress.isFirst) return DISCOVERY_VARIANT.FIRST;
        return DISCOVERY_VARIANT.STANDARD;
    }

    // ==========================================================
    // Sequência (ponto 15)
    //
    // Só mostramos a sequência quando ESTA descoberta abriu o dia.
    // Ter explorado antes, hoje, não volta a celebrar.
    // ==========================================================
    function buildStreak(result) {
        if (!result || !result.registered || !result.isNewDay) return null;

        return {
            current: toNonNegativeInt(result.current),
            best: toNonNegativeInt(result.best),
            isNewStreak: !!result.isNewStreak,
            continued: !!result.streakContinued
        };
    }

    // ==========================================================
    // Nível (ponto 14)
    //
    // A subida entra na própria celebração em vez de abrir um
    // segundo modal por cima. Quem detecta a subida continua a ser
    // levels.js; aqui só se guarda o nível já detectado.
    // ==========================================================
    function buildLevelUp(level) {
        if (!level) return null;

        return {
            id: level.id,
            level: toNonNegativeInt(level.level),
            icon: level.icon || null,
            accent: level.accent || null
        };
    }

    function buildBadges(badges) {
        return asArray(badges).filter(Boolean).map(function (badge) {
            return {
                id: badge.id,
                name: badge.name || '',
                description: badge.description || '',
                icon: badge.icon || 'fas fa-medal',
                // As conquistas de sequência trazem os dias; as de
                // progresso trazem o limiar em percentagem.
                days: badge.days === undefined ? null : toNonNegativeInt(badge.days),
                threshold: badge.threshold === undefined ? null : toNonNegativeInt(badge.threshold)
            };
        });
    }

    // Próxima etapa (ponto 17). Numa jornada concluída não há
    // próxima história por procurar.
    function buildNext(step, isComplete) {
        if (isComplete || !step || !step.monument) return null;

        return {
            monumentId: step.monumentId,
            name: step.monument.name || '',
            points: toNonNegativeInt(step.monument.points),
            zoneId: step.zoneId || null
        };
    }

    // ==========================================================
    // Construção do resultado
    //
    // Recebe o que já aconteceu. Não pergunta nada a ninguém, não
    // grava nada e não decide recompensas.
    // ==========================================================
    function buildCelebration(input) {
        const data = input || {};
        const monument = data.monument;
        if (!monument) return null;

        const actions = data.actions || {
            MONUMENT_DISCOVERED: 'MONUMENT_DISCOVERED',
            ZONE_COMPLETED: 'ZONE_COMPLETED'
        };

        const progress = buildProgress(data.progress, data.previousProgress);
        const zone = buildZone(data.xpBatch, actions, data.zones);
        const levelUp = buildLevelUp(data.levelUp);
        const badges = buildBadges(data.badges);
        const streak = buildStreak(data.streakResult);

        const specials = {
            levelUp: !!levelUp,
            zone: !!zone,
            badge: badges.length > 0
        };

        return {
            variant: variantFor(progress),
            tone: toneFor(progress),

            monument: {
                id: monument.id,
                name: monument.name || '',
                image: monument.image || '',
                points: toNonNegativeInt(monument.points),
                discoveredAt: monument.discoveredAt || null
            },

            journey: {
                id: data.journeyId || null,
                cityId: data.cityId || null,
                islandId: data.islandId || null
            },

            xp: buildXP(data.xpBatch, actions),
            progress: progress,
            streak: streak,
            zone: zone,
            badges: badges,
            levelUp: levelUp,
            next: buildNext(data.nextStep, progress.isComplete),

            // Ordem em que os blocos especiais devem ser desenhados,
            // já sem os que não se aplicam (ponto 23: não mostrar o
            // que não existe).
            specialOrder: SPECIAL_ORDER.filter(function (key) {
                return specials[key];
            }),

            hasSpecials: specials.levelUp || specials.zone || specials.badge
        };
    }

    const Discovery = {
        buildCelebration: buildCelebration,

        VARIANT: DISCOVERY_VARIANT,
        TONE: DISCOVERY_TONE
    };

    // Uma cópia nova a cada leitura: quem lê a ordem nunca a altera
    // para os outros (o mesmo cuidado de Journey.getJourneys).
    Object.defineProperty(Discovery, 'SPECIAL_ORDER', {
        enumerable: true,
        get: function () { return SPECIAL_ORDER.slice(); }
    });

    return {
        Discovery: Discovery,
        DISCOVERY_VARIANT: DISCOVERY_VARIANT,
        DISCOVERY_TONE: DISCOVERY_TONE
    };
});
