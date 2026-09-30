// ============================================================
// Heritage Hunt CV — Analytics da beta (camada de dominio)
//
// Mede COMPORTAMENTO DE PRODUTO, nao pessoas (ponto 43).
//
// O que este ficheiro guarda, e so isto:
//   - que um marco do funil aconteceu, e quando;
//   - em que dias a app foi aberta (chaves de dia, nada de horas);
//   - quantas vezes um cartao levou a uma accao.
//
// O que NUNCA guarda:
//   - localizacao, nem uma vez, muito menos continua;
//   - movimento, percursos ou tempo em ecra;
//   - texto de experiencias, nomes de fotografias ou qualquer
//     conteudo que a pessoa tenha escrito.
//
// Onde vive: dentro do perfil, como a carteira de XP e a sequencia.
// Sobe para a coluna `profiles.analytics` pela fila que ja existe,
// por isso funciona offline sem nada de novo, e o funil do ponto 44
// responde-se com uma consulta a essa coluna — sem tabela de
// eventos, sem RPC e sem infraestrutura nova (ponto 42).
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage directamente (adaptador injectado);
//   - um marco conta UMA vez por conta, para sempre.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Analytics = api.Analytics;
        root.ANALYTICS_EVENT = api.ANALYTICS_EVENT;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const ANALYTICS_MODEL_VERSION = 1;

    // Quantos dias de actividade guardamos. Chega para se ver o
    // regresso sem o perfil crescer sem fim.
    const DAY_LIMIT = 120;
    const WEEK_LIMIT = 26;

    // ==========================================================
    // O funil da beta (pontos 42 e 44)
    //
    // Cada marco e uma pergunta que se quer poder responder:
    // "quantos registados chegaram aqui?".
    // ==========================================================
    const ANALYTICS_EVENT = {
        ACCOUNT_CREATED: 'ACCOUNT_CREATED',
        FIRST_SCAN: 'FIRST_SCAN',
        FIRST_DISCOVERY: 'FIRST_DISCOVERY',
        SECOND_DISCOVERY: 'SECOND_DISCOVERY',
        FIRST_PHOTO: 'FIRST_PHOTO',
        FIRST_EXPERIENCE: 'FIRST_EXPERIENCE',
        FIRST_ZONE_COMPLETED: 'FIRST_ZONE_COMPLETED',
        FOUR_MONUMENTS_DISCOVERED: 'FOUR_MONUMENTS_DISCOVERED',
        ALL_MONUMENTS_DISCOVERED: 'ALL_MONUMENTS_DISCOVERED',

        // Regresso e loop
        APP_RETURNED_OTHER_DAY: 'APP_RETURNED_OTHER_DAY',
        WEEKLY_MISSION_VIEWED: 'WEEKLY_MISSION_VIEWED',
        WEEKLY_MISSION_COMPLETED: 'WEEKLY_MISSION_COMPLETED',
        NEXT_DISCOVERY_CLICKED: 'NEXT_DISCOVERY_CLICKED'
    };

    // A ordem do funil, para a leitura sair sempre na mesma ordem
    const FUNNEL_ORDER = [
        ANALYTICS_EVENT.ACCOUNT_CREATED,
        ANALYTICS_EVENT.FIRST_SCAN,
        ANALYTICS_EVENT.FIRST_DISCOVERY,
        ANALYTICS_EVENT.SECOND_DISCOVERY,
        ANALYTICS_EVENT.FIRST_PHOTO,
        ANALYTICS_EVENT.FIRST_EXPERIENCE,
        ANALYTICS_EVENT.FIRST_ZONE_COMPLETED,
        ANALYTICS_EVENT.FOUR_MONUMENTS_DISCOVERED,
        ANALYTICS_EVENT.ALL_MONUMENTS_DISCOVERED,
        ANALYTICS_EVENT.APP_RETURNED_OTHER_DAY,
        ANALYTICS_EVENT.WEEKLY_MISSION_VIEWED,
        ANALYTICS_EVENT.WEEKLY_MISSION_COMPLETED
    ];

    const VALID_EVENTS = Object.keys(ANALYTICS_EVENT);

    // ==========================================================
    // Persistencia (adaptador injectavel)
    // ==========================================================
    let memoryValue = null;

    const memoryAdapter = {
        load: function () { return memoryValue; },
        save: function (data) { memoryValue = data; }
    };

    let adapter = memoryAdapter;

    // A chave do dia vem de fora para ser a MESMA que a sequencia
    // usa (StreakDate.getLocalDateKey). O recurso local existe so
    // para os testes deste ficheiro correrem sozinhos.
    let dayKeyFor = function (value) {
        const date = value instanceof Date ? value : (value ? new Date(value) : new Date());
        const safe = isNaN(date.getTime()) ? new Date() : date;
        const pad = function (n) { return n < 10 ? '0' + n : String(n); };
        return safe.getFullYear() + '-' + pad(safe.getMonth() + 1) + '-' + pad(safe.getDate());
    };

    function configure(options) {
        const config = options || {};
        if (typeof config.getDayKey === 'function') dayKeyFor = config.getDayKey;
    }

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

    // ==========================================================
    // Modelo
    // ==========================================================
    function createEmpty() {
        return {
            version: ANALYTICS_MODEL_VERSION,
            // marco -> ISO da primeira (e unica) vez
            first: {},
            // dias em que a app foi aberta, mais recente primeiro
            activeDays: [],
            // semanas em que a missao foi vista
            missionWeeks: [],
            // contadores de intencao (ex.: cliques no cartao)
            counts: {}
        };
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function toNonNegativeInt(value) {
        const number = Number(value);
        if (!isFinite(number) || number < 0) return 0;
        return Math.floor(number);
    }

    function normalize(raw) {
        const model = createEmpty();
        if (!raw || typeof raw !== 'object') return model;

        if (raw.first && typeof raw.first === 'object') {
            VALID_EVENTS.forEach(function (event) {
                if (typeof raw.first[event] === 'string') model.first[event] = raw.first[event];
            });
        }

        model.activeDays = asArray(raw.activeDays).filter(function (day, index, all) {
            return typeof day === 'string' && day && all.indexOf(day) === index;
        }).sort().reverse().slice(0, DAY_LIMIT);

        model.missionWeeks = asArray(raw.missionWeeks).filter(function (week, index, all) {
            return typeof week === 'string' && week && all.indexOf(week) === index;
        }).sort().reverse().slice(0, WEEK_LIMIT);

        if (raw.counts && typeof raw.counts === 'object') {
            VALID_EVENTS.forEach(function (event) {
                const value = toNonNegativeInt(raw.counts[event]);
                if (value > 0) model.counts[event] = value;
            });
        }

        return model;
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

    // Medir nunca pode derrubar a app: uma gravacao falhada
    // perde-se em silencio e mais nada.
    function write(model) {
        try {
            adapter.save(model);
            return true;
        } catch (e) {
            return false;
        }
    }

    function nowIso(now) {
        if (typeof now === 'string') return now;
        const date = now instanceof Date ? now : new Date();
        return (isNaN(date.getTime()) ? new Date() : date).toISOString();
    }

    // ==========================================================
    // Registo
    // ==========================================================

    /**
     * Marca um marco do funil. Conta UMA vez por conta, para sempre.
     *
     * @returns {boolean} true so na primeira vez — quem chama usa
     *          isto para so ensinar uma coisa quando ela e nova
     *          (ponto 36, progressive disclosure).
     */
    function track(event, options) {
        if (VALID_EVENTS.indexOf(event) === -1) return false;

        const model = read();
        if (model.first[event]) return false;

        model.first[event] = nowIso(options && options.now);
        write(model);
        return true;
    }

    function hasHappened(event) {
        return !!read().first[event];
    }

    /**
     * Registra que a app foi aberta hoje.
     *
     * Quando aparece um SEGUNDO dia distinto, o marco
     * APP_RETURNED_OTHER_DAY fecha-se — e e exactamente a resposta
     * a "quantos voltaram noutro dia?" (ponto 44).
     */
    function trackAppOpen(options) {
        const settings = options || {};
        const today = dayKeyFor(settings.now);

        const model = read();
        const known = model.activeDays.indexOf(today) !== -1;

        if (!known) {
            model.activeDays = [today].concat(model.activeDays).sort().reverse().slice(0, DAY_LIMIT);
        }

        let returned = false;
        if (model.activeDays.length >= 2 && !model.first[ANALYTICS_EVENT.APP_RETURNED_OTHER_DAY]) {
            model.first[ANALYTICS_EVENT.APP_RETURNED_OTHER_DAY] = nowIso(settings.now);
            returned = true;
        }

        if (!known || returned) write(model);

        return { isNewDay: !known, returnedOtherDay: returned, days: model.activeDays.length };
    }

    /**
     * A missao foi vista nesta semana. Uma vez por semana, para se
     * poder comparar "viu" com "completou" (ponto 44) sem contar
     * cada vez que o cartao aparece no ecra.
     */
    function trackMissionViewed(weekKey, options) {
        if (!weekKey) return false;

        const model = read();
        if (model.missionWeeks.indexOf(weekKey) !== -1) return false;

        model.missionWeeks = [weekKey].concat(model.missionWeeks).sort().reverse().slice(0, WEEK_LIMIT);
        if (!model.first[ANALYTICS_EVENT.WEEKLY_MISSION_VIEWED]) {
            model.first[ANALYTICS_EVENT.WEEKLY_MISSION_VIEWED] = nowIso(options && options.now);
        }

        write(model);
        return true;
    }

    /**
     * Um contador simples de intencao. Usado pelo cartao da proxima
     * descoberta: quantas vezes levou mesmo a alguma coisa.
     */
    function count(event, options) {
        if (VALID_EVENTS.indexOf(event) === -1) return 0;

        const model = read();
        model.counts[event] = toNonNegativeInt(model.counts[event]) + 1;

        if (!model.first[event]) model.first[event] = nowIso(options && options.now);

        write(model);
        return model.counts[event];
    }

    // ==========================================================
    // Leitura
    // ==========================================================

    /**
     * O funil desta conta, pela ordem do ponto 42. E sobre isto que
     * a consulta a `profiles.analytics` agrega, para responder as
     * perguntas do ponto 44 sem trazer eventos para o browser.
     */
    function getFunnel() {
        const model = read();

        return FUNNEL_ORDER.map(function (event) {
            return {
                event: event,
                reached: !!model.first[event],
                at: model.first[event] || null,
                count: toNonNegativeInt(model.counts[event]) || null
            };
        });
    }

    function getActiveDayCount() {
        return read().activeDays.length;
    }

    function getSnapshot() {
        return read();
    }

    function reset() {
        const empty = createEmpty();
        write(empty);
        return empty;
    }

    const Analytics = {
        // Configuracao
        configure: configure,
        configureStorage: configureStorage,
        useMemoryStorage: useMemoryStorage,

        // Escrita
        track: track,
        trackAppOpen: trackAppOpen,
        trackMissionViewed: trackMissionViewed,
        count: count,
        reset: reset,

        // Leitura
        hasHappened: hasHappened,
        getFunnel: getFunnel,
        getActiveDayCount: getActiveDayCount,
        getSnapshot: getSnapshot,

        // Constantes
        EVENT: ANALYTICS_EVENT,
        FUNNEL_ORDER: FUNNEL_ORDER,
        MODEL_VERSION: ANALYTICS_MODEL_VERSION,

        createEmpty: createEmpty,
        normalize: normalize
    };

    return { Analytics: Analytics, ANALYTICS_EVENT: ANALYTICS_EVENT };
});
