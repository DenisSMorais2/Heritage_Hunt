// ============================================================
// Heritage Hunt CV — Streak de Exploracao
// Camada de dominio: regras, calculo e persistencia.
//
// Este ficheiro nao toca no DOM nem em localStorage directamente.
// A gravacao e feita atraves de um adaptador injectado com
// ExplorationStreak.configureStorage({ load, save }), o que permite
// migrar para uma base de dados sem reescrever a logica.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.ExplorationStreak = api.ExplorationStreak;
        root.StreakDate = api.StreakDate;
        root.EXPLORATION_ACTIVITY = api.EXPLORATION_ACTIVITY;
        root.STREAK_MILESTONES = api.STREAK_MILESTONES;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // --- Constantes do modelo ---------------------------------
    const STREAK_MODEL_VERSION = 1;

    // Quantos dias de historico guardamos (evita crescimento sem fim
    // no localStorage). Os contadores agregados nao dependem disto.
    const HISTORY_DAY_LIMIT = 180;

    // Tecto defensivo de actividades guardadas por dia
    const ACTIVITIES_PER_DAY_LIMIT = 60;

    // Tipos de actividade que contam como "um dia de exploracao"
    const EXPLORATION_ACTIVITY = {
        MONUMENT_DISCOVERY: 'monument_discovery',
        PHOTO_ADDED: 'photo_added',
        EXPERIENCE_SAVED: 'experience_saved',
        // Reservado para missoes culturais futuras (ponto 2.4)
        MISSION_COMPLETED: 'mission_completed'
    };

    const VALID_ACTIVITY_TYPES = Object.keys(EXPLORATION_ACTIVITY)
        .map(function (key) { return EXPLORATION_ACTIVITY[key]; });

    // Conquistas por sequencia. O texto vive no i18n (chaves
    // streakBadges.<id>), aqui ficam apenas as regras.
    const STREAK_MILESTONES = [
        { id: 'curious', days: 3, icon: 'fas fa-seedling' },
        { id: 'persistent', days: 7, icon: 'fas fa-fire' },
        { id: 'mindelo', days: 14, icon: 'fas fa-city' },
        { id: 'guardian', days: 30, icon: 'fas fa-shield-alt' }
    ];

    const MS_PER_DAY = 86400000;
    const DATE_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    // ==========================================================
    // Utilitarios de data
    //
    // Tudo funciona com a data LOCAL do dispositivo. Nunca usamos
    // toISOString() para obter o dia, porque perto da meia-noite o
    // UTC pode saltar para o dia seguinte (ou anterior).
    // ==========================================================
    function pad2(value) {
        return value < 10 ? '0' + value : String(value);
    }

    function isDateKey(value) {
        return typeof value === 'string' && DATE_KEY_PATTERN.test(value);
    }

    // Converte uma chave "YYYY-MM-DD" para Date a meia-noite local
    function parseDateKey(key) {
        if (!isDateKey(key)) return null;
        const parts = key.split('-');
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    function toDate(value) {
        if (value instanceof Date) return value;
        if (value === undefined || value === null || value === '') return new Date();
        if (isDateKey(value)) return parseDateKey(value);
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
    }

    // Chave do dia local: "YYYY-MM-DD"
    function getLocalDateKey(value) {
        const date = toDate(value);
        return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
    }

    // Diferenca em dias de calendario (toKey - fromKey).
    // Arredondamos para absorver eventuais mudancas de hora.
    function daysBetween(fromKey, toKey) {
        const from = parseDateKey(fromKey);
        const to = parseDateKey(toKey);
        if (!from || !to) return null;
        return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
    }

    function addDays(key, amount) {
        const date = parseDateKey(key) || toDate(key);
        date.setDate(date.getDate() + amount);
        return getLocalDateKey(date);
    }

    // Aceita Date, ISO string ou chave "YYYY-MM-DD" nos dois lados
    function isSameDay(a, b) {
        return getLocalDateKey(a) === getLocalDateKey(b);
    }

    // `value` e o dia anterior a `reference` (hoje por omissao)?
    function isYesterday(value, reference) {
        return daysBetween(getLocalDateKey(value), getLocalDateKey(reference)) === 1;
    }

    function isToday(value, reference) {
        return isSameDay(value, reference === undefined ? new Date() : reference);
    }

    // Semana de segunda a domingo que contem `reference`
    function getWeekDayKeys(reference) {
        const today = toDate(reference);
        // getDay(): 0 = domingo. Queremos 0 = segunda.
        const offsetToMonday = (today.getDay() + 6) % 7;
        const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        monday.setDate(monday.getDate() - offsetToMonday);

        const keys = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
            day.setDate(day.getDate() + i);
            keys.push(getLocalDateKey(day));
        }
        return keys;
    }

    const StreakDate = {
        getLocalDateKey: getLocalDateKey,
        parseDateKey: parseDateKey,
        isDateKey: isDateKey,
        daysBetween: daysBetween,
        addDays: addDays,
        isSameDay: isSameDay,
        isYesterday: isYesterday,
        isToday: isToday,
        getWeekDayKeys: getWeekDayKeys
    };

    // ==========================================================
    // Modelo
    // ==========================================================
    function createEmptyStreak() {
        return {
            version: STREAK_MODEL_VERSION,
            current: 0,
            best: 0,
            totalExplorationDays: 0,
            lastExplorationDate: null,
            history: [],
            unlockedMilestones: []
        };
    }

    function toPositiveInt(value) {
        const number = Number(value);
        if (!isFinite(number) || number < 0) return 0;
        return Math.floor(number);
    }

    function normalizeActivity(raw) {
        if (!raw || typeof raw !== 'object') return null;
        if (VALID_ACTIVITY_TYPES.indexOf(raw.type) === -1) return null;

        return {
            type: raw.type,
            monumentId: raw.monumentId === undefined ? null : raw.monumentId,
            timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
            metadata: (raw.metadata && typeof raw.metadata === 'object') ? raw.metadata : {}
        };
    }

    // Aceita perfis antigos (sem explorationStreak) e dados corrompidos.
    // Nunca lanca: devolve sempre um modelo valido.
    function normalize(raw) {
        const streak = createEmptyStreak();
        if (!raw || typeof raw !== 'object') return streak;

        streak.current = toPositiveInt(raw.current);
        streak.best = toPositiveInt(raw.best);
        streak.totalExplorationDays = toPositiveInt(raw.totalExplorationDays);
        streak.lastExplorationDate = isDateKey(raw.lastExplorationDate) ? raw.lastExplorationDate : null;

        if (Array.isArray(raw.history)) {
            const seen = {};
            raw.history.forEach(function (entry) {
                if (!entry || typeof entry !== 'object') return;
                if (!isDateKey(entry.date)) return;
                if (seen[entry.date]) return;
                seen[entry.date] = true;

                const activities = Array.isArray(entry.activities)
                    ? entry.activities.map(normalizeActivity).filter(Boolean)
                    : [];

                streak.history.push({ date: entry.date, activities: activities });
            });
            // Mais recente primeiro
            streak.history.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
            streak.history = streak.history.slice(0, HISTORY_DAY_LIMIT);
        }

        if (Array.isArray(raw.unlockedMilestones)) {
            const known = STREAK_MILESTONES.map(function (m) { return m.id; });
            streak.unlockedMilestones = raw.unlockedMilestones.filter(function (id, index, list) {
                return known.indexOf(id) !== -1 && list.indexOf(id) === index;
            });
        }

        // Coerencia: o recorde nunca pode ser inferior a sequencia actual
        if (streak.best < streak.current) streak.best = streak.current;
        // Sem data de exploracao nao ha sequencia em curso
        if (!streak.lastExplorationDate) streak.current = 0;
        // Um dia de exploracao registado implica pelo menos um dia no total
        if (streak.lastExplorationDate && streak.totalExplorationDays === 0) {
            streak.totalExplorationDays = Math.max(1, streak.current);
        }

        return streak;
    }

    // ==========================================================
    // Persistencia (adaptador injectavel)
    // ==========================================================
    let memoryValue = null;

    const memoryAdapter = {
        load: function () { return memoryValue; },
        save: function (data) { memoryValue = data; }
    };

    let adapter = memoryAdapter;

    function configureStorage(nextAdapter) {
        if (nextAdapter && typeof nextAdapter.load === 'function' && typeof nextAdapter.save === 'function') {
            adapter = nextAdapter;
        } else {
            adapter = memoryAdapter;
        }
    }

    function useMemoryStorage() {
        memoryValue = null;
        adapter = memoryAdapter;
    }

    function read() {
        let raw = null;
        try {
            raw = adapter.load();
        } catch (e) {
            raw = null;
        }
        return normalize(raw);
    }

    function write(data) {
        try {
            adapter.save(data);
        } catch (e) {
            // Sem persistencia (ex.: quota cheia) a app continua a funcionar
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[streak] nao foi possivel guardar a sequencia:', e);
            }
        }
        return data;
    }

    // ==========================================================
    // Leitura derivada
    // ==========================================================

    // A sequencia so esta "viva" se a ultima exploracao foi hoje ou ontem.
    // Guardamos o valor em bruto e derivamos o efectivo na leitura, para
    // que nenhum ecra precise de escrever para corrigir o estado.
    function isStreakAlive(streak, todayKey) {
        if (!streak.lastExplorationDate) return false;
        const gap = daysBetween(streak.lastExplorationDate, todayKey);
        return gap !== null && gap >= 0 && gap <= 1;
    }

    function effectiveCurrent(streak, todayKey) {
        return isStreakAlive(streak, todayKey) ? streak.current : 0;
    }

    function findHistoryEntry(streak, dateKey) {
        for (let i = 0; i < streak.history.length; i++) {
            if (streak.history[i].date === dateKey) return streak.history[i];
        }
        return null;
    }

    // Estado completo para a interface. Nao escreve nada.
    function getStreakStatus(reference) {
        const todayKey = getLocalDateKey(reference);
        const streak = read();
        const current = effectiveCurrent(streak, todayKey);
        const exploredToday = streak.lastExplorationDate === todayKey;

        return {
            current: current,
            best: streak.best,
            totalExplorationDays: streak.totalExplorationDays,
            lastExplorationDate: streak.lastExplorationDate,
            exploredToday: exploredToday,
            // Tem sequencia viva mas ainda nao explorou hoje
            pendingToday: current > 0 && !exploredToday,
            isActive: current > 0,
            todayKey: todayKey,
            unlockedMilestones: streak.unlockedMilestones.slice()
        };
    }

    function getCurrentStreak(reference) {
        return getStreakStatus(reference).current;
    }

    function getBestStreak() {
        return read().best;
    }

    function getTotalExplorationDays() {
        return read().totalExplorationDays;
    }

    function hasExploredToday(reference) {
        return read().lastExplorationDate === getLocalDateKey(reference);
    }

    // Historico do mais recente para o mais antigo
    function getExplorationHistory(limit) {
        const history = read().history;
        return typeof limit === 'number' ? history.slice(0, Math.max(0, limit)) : history;
    }

    function getDayActivities(dateKey) {
        const entry = findHistoryEntry(read(), getLocalDateKey(dateKey));
        return entry ? entry.activities.slice() : [];
    }

    // Semana de segunda a domingo que contem `reference`
    function getWeekExplorationStatus(reference) {
        const todayKey = getLocalDateKey(reference);
        const streak = read();
        const keys = getWeekDayKeys(reference);

        const days = keys.map(function (key, index) {
            const entry = findHistoryEntry(streak, key);
            const offset = daysBetween(todayKey, key);
            return {
                date: key,
                weekday: index,              // 0 = segunda ... 6 = domingo
                explored: !!(entry && entry.activities.length) || streak.lastExplorationDate === key,
                activityCount: entry ? entry.activities.length : 0,
                isToday: key === todayKey,
                isFuture: offset !== null && offset > 0
            };
        });

        return {
            startDate: keys[0],
            endDate: keys[6],
            todayKey: todayKey,
            days: days
        };
    }

    // ==========================================================
    // Conquistas por sequencia
    // ==========================================================
    function getMilestones() {
        return STREAK_MILESTONES.map(function (milestone) {
            return { id: milestone.id, days: milestone.days, icon: milestone.icon };
        });
    }

    function getMilestoneStatus(reference) {
        const status = getStreakStatus(reference);
        const best = status.best;
        return STREAK_MILESTONES.map(function (milestone) {
            return {
                id: milestone.id,
                days: milestone.days,
                icon: milestone.icon,
                unlocked: status.unlockedMilestones.indexOf(milestone.id) !== -1 || best >= milestone.days
            };
        });
    }

    // Devolve os marcos desbloqueados agora (e marca-os no modelo)
    function collectNewMilestones(streak, current) {
        const unlocked = [];
        STREAK_MILESTONES.forEach(function (milestone) {
            if (current < milestone.days) return;
            if (streak.unlockedMilestones.indexOf(milestone.id) !== -1) return;
            streak.unlockedMilestones.push(milestone.id);
            unlocked.push({ id: milestone.id, days: milestone.days, icon: milestone.icon });
        });
        return unlocked;
    }

    // ==========================================================
    // Registo de actividade — o coracao das regras
    // ==========================================================
    function buildResult(extra) {
        const base = {
            registered: false,
            reason: null,
            isNewDay: false,       // primeira actividade valida de hoje
            isNewStreak: false,    // a sequencia recomecou (ou nasceu) em 1
            streakContinued: false,// a sequencia cresceu a partir de ontem
            bestImproved: false,
            current: 0,
            best: 0,
            totalExplorationDays: 0,
            previousCurrent: 0,
            newMilestones: [],
            date: null
        };
        return Object.assign(base, extra || {});
    }

    /**
     * Regista uma actividade de exploracao.
     *
     * O incremento diario e idempotente: varias actividades no mesmo dia
     * (descoberta + fotos + experiencia) guardam-se todas no historico,
     * mas so a primeira faz o contador subir.
     *
     * @param {Object} activity { type, monumentId?, metadata?, timestamp? }
     * @param {Object} options  { now?: Date|string }  — usado nos testes
     * @returns {Object} resultado com isNewDay / current / best / newMilestones
     */
    function registerExplorationActivity(activity, options) {
        const input = activity || {};
        const settings = options || {};

        if (VALID_ACTIVITY_TYPES.indexOf(input.type) === -1) {
            return buildResult({ reason: 'invalid_activity_type' });
        }

        // PASSO 1 — data local de hoje (nunca UTC)
        const now = settings.now === undefined ? new Date() : toDate(settings.now);
        const todayKey = getLocalDateKey(now);

        const streak = read();
        const previousCurrent = streak.current;
        const lastKey = streak.lastExplorationDate;

        const record = normalizeActivity({
            type: input.type,
            monumentId: input.monumentId,
            timestamp: typeof input.timestamp === 'string' ? input.timestamp : now.toISOString(),
            metadata: input.metadata
        });

        // PASSO 2 — comparar com a ultima exploracao
        let isNewDay = false;
        let isNewStreak = false;
        let streakContinued = false;

        if (!lastKey) {
            // CASO A — nunca explorou
            streak.current = 1;
            streak.totalExplorationDays += 1;
            isNewDay = true;
            isNewStreak = true;
        } else if (lastKey === todayKey) {
            // CASO B — ja explorou hoje: nada muda nos contadores
            isNewDay = false;
        } else {
            const gap = daysBetween(lastKey, todayKey);

            if (gap === 1) {
                // CASO C — a ultima actividade foi ontem
                streak.current += 1;
                streak.totalExplorationDays += 1;
                isNewDay = true;
                streakContinued = true;
            } else if (gap !== null && gap > 1) {
                // CASO D — passou mais de um dia: recomeca em 1
                streak.current = 1;
                streak.totalExplorationDays += 1;
                isNewDay = true;
                isNewStreak = true;
            } else {
                // Data futura guardada (relogio alterado): nao mexemos nos
                // contadores, mas guardamos a actividade no historico de hoje.
                isNewDay = false;
            }
        }

        if (isNewDay) {
            streak.lastExplorationDate = todayKey;
        }

        const bestImproved = streak.current > streak.best;
        if (bestImproved) streak.best = streak.current;

        // Historico do dia
        let entry = findHistoryEntry(streak, todayKey);
        if (!entry) {
            entry = { date: todayKey, activities: [] };
            streak.history.unshift(entry);
        }
        if (entry.activities.length < ACTIVITIES_PER_DAY_LIMIT) {
            entry.activities.push(record);
        }

        streak.history.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        streak.history = streak.history.slice(0, HISTORY_DAY_LIMIT);

        const newMilestones = isNewDay ? collectNewMilestones(streak, streak.current) : [];

        write(streak);

        return buildResult({
            registered: true,
            isNewDay: isNewDay,
            isNewStreak: isNewDay && isNewStreak,
            streakContinued: isNewDay && streakContinued,
            bestImproved: bestImproved,
            current: streak.current,
            best: streak.best,
            totalExplorationDays: streak.totalExplorationDays,
            previousCurrent: previousCurrent,
            newMilestones: newMilestones,
            date: todayKey,
            activity: record
        });
    }

    // Repoe o modelo (usado nos testes e em ferramentas de diagnostico)
    function resetStreak() {
        const empty = createEmptyStreak();
        write(empty);
        return empty;
    }

    // Snapshot em bruto — util para depurar ou exportar
    function getStreak() {
        return read();
    }

    const ExplorationStreak = {
        // Configuracao
        configureStorage: configureStorage,
        useMemoryStorage: useMemoryStorage,

        // Escrita
        registerExplorationActivity: registerExplorationActivity,
        // alias curto usado na app
        registerActivity: registerExplorationActivity,
        resetStreak: resetStreak,

        // Leitura
        getStreak: getStreak,
        getStreakStatus: getStreakStatus,
        getCurrentStreak: getCurrentStreak,
        getBestStreak: getBestStreak,
        getTotalExplorationDays: getTotalExplorationDays,
        hasExploredToday: hasExploredToday,
        getExplorationHistory: getExplorationHistory,
        getDayActivities: getDayActivities,
        getWeekExplorationStatus: getWeekExplorationStatus,

        // Conquistas
        getMilestones: getMilestones,
        getMilestoneStatus: getMilestoneStatus,

        // Constantes
        ACTIVITY: EXPLORATION_ACTIVITY,
        MILESTONES: STREAK_MILESTONES,
        MODEL_VERSION: STREAK_MODEL_VERSION,

        // Datas (reexportadas por conveniencia)
        dates: StreakDate,

        // ------------------------------------------------------
        // Extensao futura (ponto 18): a sequencia semanal pode ser
        // derivada de `history` sem alterar nada do que esta acima.
        // Basta agrupar as chaves por semana ISO e aplicar as mesmas
        // regras de CASO A..D sobre semanas em vez de dias.
        // ------------------------------------------------------
        createEmptyStreak: createEmptyStreak,
        normalize: normalize
    };

    return {
        ExplorationStreak: ExplorationStreak,
        StreakDate: StreakDate,
        EXPLORATION_ACTIVITY: EXPLORATION_ACTIVITY,
        STREAK_MILESTONES: STREAK_MILESTONES
    };
});
