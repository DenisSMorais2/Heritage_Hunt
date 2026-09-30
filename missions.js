// ============================================================
// Heritage Hunt CV — Missao semanal (camada de dominio)
//
// A UNICA funcionalidade grande nova desta beta (ponto 18): uma
// razao simples para voltar durante a semana. Nao ha missoes
// diarias, temporadas, passes nem dezenas de tipos.
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage directamente (adaptador injectado);
//   - NAO decide quanto vale a recompensa. O montante vive em
//     XP_CONFIG, como todos os outros (ponto 25 + disciplina do
//     xp.js). Aqui so se diz QUE accao recompensa;
//   - nao conhece traducoes (missions.<id>.name / .goal.<tipo>);
//   - a missao da semana e a MESMA em todos os aparelhos, porque a
//     semana e calculada em hora de Cabo Verde e a escolha e
//     deterministica (ponto 22).
//
// O catalogo de missoes e configuracao em codigo, como
// JOURNEY_CONFIG, LEVEL_CONFIG e STREAK_MILESTONES: acrescentar
// uma missao e acrescentar uma entrada aqui e o texto no i18n.
// Nenhuma tabela nova precisa de existir para isso (ponto 23).
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.WeeklyMissions = api.WeeklyMissions;
        root.MISSION_GOAL = api.MISSION_GOAL;
        root.WEEKLY_MISSION_CONFIG = api.WEEKLY_MISSION_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MISSION_MODEL_VERSION = 1;

    // Meio ano de historico basta para se perceber o padrao de
    // regresso sem o perfil crescer sem fim.
    const HISTORY_LIMIT = 26;

    // ==========================================================
    // Tipos de objectivo (ponto 20)
    //
    // Sao accoes que a app JA faz. Nenhum tipo novo de interaccao
    // foi inventado para as missoes existirem.
    // ==========================================================
    const MISSION_GOAL = {
        DISCOVER_MONUMENT: 'DISCOVER_MONUMENT',
        ADD_PHOTO: 'ADD_PHOTO',
        WRITE_EXPERIENCE: 'WRITE_EXPERIENCE',
        COMPLETE_ZONE: 'COMPLETE_ZONE'
    };

    const VALID_GOALS = Object.keys(MISSION_GOAL);

    // A accao de XP que a missao concluida atribui. O VALOR esta em
    // XP_CONFIG.WEEKLY_MISSION_COMPLETED — nunca aqui (ponto 25).
    const REWARD_ACTION = 'WEEKLY_MISSION_COMPLETED';

    // ==========================================================
    // Catalogo (ponto 21)
    //
    // Contagens pequenas de proposito: uma missao deve descrever
    // uso natural, nunca "adiciona 10 fotos" (ponto 41).
    //
    //   id            chave estavel (i18n: missions.<id>.name)
    //   icon          icone Font Awesome (a app ja carrega a biblioteca)
    //   zoneId        limita a missao a uma zona, ou null
    //   goals         objectivos, pela ordem em que se mostram
    //
    // `distinctMonuments` numa fotografia significa: em monumentos
    // DIFERENTES. Sem isso, duas fotos do mesmo lugar contavam duas
    // vezes — e isso era exactamente o spam que o ponto 41 proibe.
    // ==========================================================
    const WEEKLY_MISSION_CONFIG = [
        {
            id: 'first_steps',
            icon: 'fas fa-shoe-prints',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.DISCOVER_MONUMENT, count: 1 },
                { type: MISSION_GOAL.ADD_PHOTO, count: 1 }
            ]
        },
        {
            id: 'keep_the_story',
            icon: 'fas fa-feather-pointed',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.DISCOVER_MONUMENT, count: 1 },
                { type: MISSION_GOAL.WRITE_EXPERIENCE, count: 1 }
            ]
        },
        {
            id: 'explore_mindelo',
            icon: 'fas fa-compass',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.DISCOVER_MONUMENT, count: 2 },
                { type: MISSION_GOAL.ADD_PHOTO, count: 1 }
            ]
        },
        {
            id: 'city_memories',
            icon: 'fas fa-images',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.ADD_PHOTO, count: 2, distinctMonuments: true },
                { type: MISSION_GOAL.WRITE_EXPERIENCE, count: 1 }
            ]
        },
        {
            id: 'historic_centre',
            icon: 'fas fa-landmark',
            zoneId: 'centro_historico',
            goals: [
                { type: MISSION_GOAL.DISCOVER_MONUMENT, count: 1, zoneId: 'centro_historico' },
                { type: MISSION_GOAL.WRITE_EXPERIENCE, count: 1 }
            ]
        },
        {
            id: 'sea_front',
            icon: 'fas fa-water',
            zoneId: 'frente_mar',
            goals: [
                { type: MISSION_GOAL.DISCOVER_MONUMENT, count: 1, zoneId: 'frente_mar' },
                { type: MISSION_GOAL.ADD_PHOTO, count: 1 }
            ]
        },
        {
            id: 'close_a_zone',
            icon: 'fas fa-map-marked-alt',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.COMPLETE_ZONE, count: 1 }
            ]
        },
        // As duas ultimas nao exigem descobrir nada: sao as que
        // continuam a fazer sentido a 12/12 (ponto 40).
        {
            id: 'album_keeper',
            icon: 'fas fa-camera-retro',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.ADD_PHOTO, count: 2, distinctMonuments: true }
            ]
        },
        {
            id: 'two_memories',
            icon: 'fas fa-pen-to-square',
            zoneId: null,
            goals: [
                { type: MISSION_GOAL.WRITE_EXPERIENCE, count: 2 }
            ]
        }
    ];

    // ==========================================================
    // A semana (ponto 22)
    //
    // Segunda 00:00 a domingo 23:59, HORA DE CABO VERDE — o mesmo
    // fuso que o `week_start()` do Postgres usa para o ranking.
    //
    // Isto nao e um detalhe: se a missao usasse a hora do aparelho,
    // uma missao concluida ao domingo a noite podia cair numa
    // semana diferente daquela em que o XP que ela gerou entra no
    // ranking. Cabo Verde e UTC-1 todo o ano (nao ha hora de verao),
    // por isso a conversao e uma subtraccao, nao uma tabela.
    // ==========================================================
    const CV_UTC_OFFSET_MINUTES = -60;
    const MS_PER_DAY = 86400000;

    // Uma segunda-feira, para contar semanas inteiras a partir dela
    const EPOCH_MONDAY = '2024-01-01';

    function pad2(value) {
        return value < 10 ? '0' + value : String(value);
    }

    function toDate(value) {
        if (value instanceof Date) return value;
        if (value === undefined || value === null || value === '') return new Date();
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
    }

    // O relogio de parede em Cabo Verde, no instante indicado
    function cvClock(value) {
        const shifted = new Date(toDate(value).getTime() + CV_UTC_OFFSET_MINUTES * 60000);
        return {
            year: shifted.getUTCFullYear(),
            month: shifted.getUTCMonth(),
            day: shifted.getUTCDate(),
            // 0 = domingo, como getUTCDay()
            weekday: shifted.getUTCDay()
        };
    }

    /**
     * Chave da semana: a data da segunda-feira, "YYYY-MM-DD".
     * O mesmo instante da a mesma chave em qualquer aparelho.
     */
    function getWeekKey(value) {
        const clock = cvClock(value);
        // Queremos 0 = segunda
        const offsetToMonday = (clock.weekday + 6) % 7;

        const monday = new Date(Date.UTC(clock.year, clock.month, clock.day));
        monday.setUTCDate(monday.getUTCDate() - offsetToMonday);

        return monday.getUTCFullYear() + '-' +
            pad2(monday.getUTCMonth() + 1) + '-' +
            pad2(monday.getUTCDate());
    }

    function keyToUTC(key) {
        const parts = String(key).split('-');
        return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    // Semanas inteiras desde a segunda-feira de referencia
    function weekIndex(weekKey) {
        const days = Math.round((keyToUTC(weekKey) - keyToUTC(EPOCH_MONDAY)) / MS_PER_DAY);
        const weeks = Math.floor(days / 7);
        // O resto de um numero negativo em JS e negativo: normalizamos
        // para que uma data anterior a referencia nao parta a rotacao.
        return weeks;
    }

    // ==========================================================
    // Fontes e persistencia (injectadas)
    // ==========================================================
    let memoryValue = null;

    const memoryAdapter = {
        load: function () { return memoryValue; },
        save: function (data) { memoryValue = data; }
    };

    let adapter = memoryAdapter;

    // Contexto de elegibilidade (pontos 40 e 41). Quem chama
    // responde com o que a conta permite HOJE.
    const sources = {
        getContext: function () {
            return {
                undiscoveredCount: 0,
                undiscoveredInZone: function () { return 0; },
                photoEligibleCount: 0,
                experienceEligibleCount: 0,
                incompleteZoneCount: 0
            };
        },
        // Zona de um monumento, para as missoes limitadas a uma zona
        getZoneIdOf: function () { return null; }
    };

    function configure(options) {
        const config = options || {};
        if (typeof config.getContext === 'function') sources.getContext = config.getContext;
        if (typeof config.getZoneIdOf === 'function') sources.getZoneIdOf = config.getZoneIdOf;
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
    //
    // O progresso guarda REFERENCIAS, nao contadores. E isso que
    // torna tudo idempotente: registar a mesma fotografia duas
    // vezes — porque a app reabriu, porque a fila offline
    // sincronizou outra vez — nunca faz o contador subir duas
    // vezes (pontos 24 e 53).
    // ==========================================================
    function createEmpty() {
        return {
            version: MISSION_MODEL_VERSION,
            weekKey: null,
            missionId: null,
            refs: {},
            completedAt: null,
            rewardedAt: null,
            history: []
        };
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function uniqueStrings(list) {
        return asArray(list).filter(function (item, index, all) {
            return typeof item === 'string' && item && all.indexOf(item) === index;
        });
    }

    function isWeekKey(value) {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function findMission(id) {
        return WEEKLY_MISSION_CONFIG.filter(function (mission) {
            return mission.id === id;
        })[0] || null;
    }

    // Aceita perfis antigos (sem missao) e dados corrompidos.
    // Nunca lanca: devolve sempre um modelo utilizavel.
    function normalize(raw) {
        const state = createEmpty();
        if (!raw || typeof raw !== 'object') return state;

        state.weekKey = isWeekKey(raw.weekKey) ? raw.weekKey : null;
        state.missionId = findMission(raw.missionId) ? raw.missionId : null;
        state.completedAt = typeof raw.completedAt === 'string' ? raw.completedAt : null;
        state.rewardedAt = typeof raw.rewardedAt === 'string' ? raw.rewardedAt : null;

        if (raw.refs && typeof raw.refs === 'object') {
            VALID_GOALS.forEach(function (type) {
                const list = uniqueStrings(raw.refs[type]);
                if (list.length) state.refs[type] = list;
            });
        }

        state.history = asArray(raw.history).filter(function (entry) {
            return entry && isWeekKey(entry.weekKey) && findMission(entry.missionId);
        }).map(function (entry) {
            return {
                weekKey: entry.weekKey,
                missionId: entry.missionId,
                completedAt: typeof entry.completedAt === 'string' ? entry.completedAt : null
            };
        }).slice(0, HISTORY_LIMIT);

        // Sem semana nem missao nao ha progresso que faca sentido
        if (!state.weekKey || !state.missionId) {
            state.refs = {};
            state.completedAt = null;
            state.rewardedAt = null;
        }

        return state;
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

    // Devolve true se conseguiu persistir. Quem chama usa isto para
    // so anunciar a missao concluida depois de estar mesmo guardada.
    function write(state) {
        try {
            adapter.save(state);
            return true;
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[missions] nao foi possivel guardar a missao:', e);
            }
            return false;
        }
    }

    // ==========================================================
    // Elegibilidade (pontos 40 e 41)
    //
    // Uma missao so pode ser escolhida se TODOS os seus objectivos
    // forem alcancaveis hoje. E isto que impede "Descobre 2 novos
    // monumentos" de cair a alguem que tem 12/12.
    // ==========================================================
    function context() {
        let value = null;
        try {
            value = sources.getContext();
        } catch (e) {
            value = null;
        }
        const ctx = value || {};

        return {
            undiscoveredCount: Math.max(0, Number(ctx.undiscoveredCount) || 0),
            undiscoveredInZone: typeof ctx.undiscoveredInZone === 'function'
                ? ctx.undiscoveredInZone
                : function () { return 0; },
            photoEligibleCount: Math.max(0, Number(ctx.photoEligibleCount) || 0),
            experienceEligibleCount: Math.max(0, Number(ctx.experienceEligibleCount) || 0),
            incompleteZoneCount: Math.max(0, Number(ctx.incompleteZoneCount) || 0)
        };
    }

    function goalIsAchievable(goal, ctx) {
        const count = Math.max(1, Number(goal.count) || 1);

        if (goal.type === MISSION_GOAL.DISCOVER_MONUMENT) {
            const available = goal.zoneId
                ? Math.max(0, Number(ctx.undiscoveredInZone(goal.zoneId)) || 0)
                : ctx.undiscoveredCount;
            return available >= count;
        }

        if (goal.type === MISSION_GOAL.ADD_PHOTO) {
            // Em monumentos diferentes precisamos de tantos lugares
            // elegiveis quantas as fotografias pedidas; no mesmo
            // lugar basta um.
            const needed = goal.distinctMonuments ? count : 1;
            return ctx.photoEligibleCount >= needed;
        }

        if (goal.type === MISSION_GOAL.WRITE_EXPERIENCE) {
            return ctx.experienceEligibleCount >= count;
        }

        if (goal.type === MISSION_GOAL.COMPLETE_ZONE) {
            return ctx.incompleteZoneCount >= count;
        }

        return false;
    }

    function isEligible(mission, ctx) {
        if (!mission || !asArray(mission.goals).length) return false;
        const resolved = ctx || context();
        return mission.goals.every(function (goal) {
            return goalIsAchievable(goal, resolved);
        });
    }

    function getEligibleMissions() {
        const ctx = context();
        return WEEKLY_MISSION_CONFIG.filter(function (mission) {
            return isEligible(mission, ctx);
        }).map(copyMission);
    }

    function copyMission(mission) {
        return {
            id: mission.id,
            icon: mission.icon,
            zoneId: mission.zoneId || null,
            goals: mission.goals.map(function (goal) {
                return Object.assign({}, goal);
            })
        };
    }

    // ==========================================================
    // Escolha da missao (ponto 22)
    //
    // Deterministica: a semana da o ponto de partida, e a partir
    // dele escolhe-se a PRIMEIRA missao elegivel. Duas pessoas com
    // o mesmo progresso recebem a mesma missao; duas pessoas com
    // progresso diferente podem receber missoes diferentes, e e
    // isso que se quer (ponto 40).
    // ==========================================================
    function selectMissionFor(weekKey) {
        const total = WEEKLY_MISSION_CONFIG.length;
        if (!total) return null;

        const ctx = context();
        const index = weekIndex(weekKey);
        // `%` de um negativo e negativo em JS: somamos `total` antes
        const start = ((index % total) + total) % total;

        for (let i = 0; i < total; i++) {
            const mission = WEEKLY_MISSION_CONFIG[(start + i) % total];
            if (isEligible(mission, ctx)) return mission;
        }

        return null;
    }

    /**
     * Garante que existe uma missao atribuida para a semana do
     * instante indicado, e devolve o estado gravado.
     *
     * A atribuicao e GUARDADA. Nao voltamos a escolher a cada
     * leitura de proposito: se a elegibilidade mudar a meio da
     * semana — e muda, porque descobrir um monumento muda-a — a
     * missao nao pode trocar debaixo dos pes de quem ja a comecou.
     */
    function ensureWeek(now) {
        const weekKey = getWeekKey(now);
        const state = read();

        if (state.weekKey === weekKey && state.missionId) return state;

        // Semana nova: a anterior vai para o historico se foi feita
        if (state.weekKey && state.missionId && state.completedAt) {
            state.history.unshift({
                weekKey: state.weekKey,
                missionId: state.missionId,
                completedAt: state.completedAt
            });
            state.history = state.history.slice(0, HISTORY_LIMIT);
        }

        const mission = selectMissionFor(weekKey);

        state.weekKey = weekKey;
        state.missionId = mission ? mission.id : null;
        state.refs = {};
        state.completedAt = null;
        state.rewardedAt = null;

        write(state);
        return state;
    }

    // ==========================================================
    // Progresso
    // ==========================================================
    function refsFor(state, type) {
        return asArray(state.refs[type]);
    }

    function goalStatus(state, goal) {
        const count = Math.max(1, Number(goal.count) || 1);
        const done = Math.min(count, refsFor(state, goal.type).length);

        return {
            type: goal.type,
            count: count,
            done: done,
            zoneId: goal.zoneId || null,
            distinctMonuments: !!goal.distinctMonuments,
            isDone: done >= count
        };
    }

    function buildStatus(state) {
        const mission = findMission(state.missionId);

        if (!mission) {
            // Sem missao elegivel esta semana. Nao e um erro: e uma
            // semana sem missao, e a interface simplesmente nao
            // mostra o cartao (ponto 40).
            return {
                weekKey: state.weekKey,
                mission: null,
                goals: [],
                done: 0,
                total: 0,
                percent: 0,
                isComplete: false,
                isRewarded: false,
                nextGoal: null,
                rewardAction: REWARD_ACTION
            };
        }

        const goals = mission.goals.map(function (goal) {
            return goalStatus(state, goal);
        });

        // Contamos PASSOS, nao objectivos: uma missao de um so
        // objectivo com duas memorias e "0 / 2", nao "0 / 1".
        //
        // Contar objectivos punha dois numeros diferentes no mesmo
        // cartao — "Escreve 2 memorias 0/2" ao lado de uma barra a
        // dizer "0 / 1" — e a pessoa tinha de decidir em qual
        // acreditar.
        const done = goals.reduce(function (sum, goal) { return sum + goal.done; }, 0);
        const total = goals.reduce(function (sum, goal) { return sum + goal.count; }, 0);
        const pending = goals.filter(function (goal) { return !goal.isDone; });

        return {
            weekKey: state.weekKey,
            mission: copyMission(mission),
            goals: goals,
            done: done,
            total: total,
            percent: total ? Math.round((done / total) * 100) : 0,
            isComplete: !!state.completedAt && pending.length === 0,
            completedAt: state.completedAt,
            isRewarded: !!state.rewardedAt,
            // O primeiro objectivo por fazer: e ele que decide para
            // onde o botao "Continuar" leva (ponto 28).
            nextGoal: pending.length ? pending[0] : null,
            rewardAction: REWARD_ACTION
        };
    }

    /**
     * Estado da missao desta semana. Atribui-a se ainda nao existir.
     */
    function getStatus(now) {
        return buildStatus(ensureWeek(now));
    }

    // A referencia que torna uma accao unica. Duas fotografias
    // diferentes do mesmo monumento partilham referencia quando o
    // objectivo pede monumentos DIFERENTES — e e assim que se evita
    // o spam (ponto 41).
    function refFor(goal, action) {
        if (goal.type === MISSION_GOAL.COMPLETE_ZONE) {
            return action.zoneId ? 'z_' + action.zoneId : null;
        }

        if (goal.type === MISSION_GOAL.ADD_PHOTO && !goal.distinctMonuments) {
            // Uma fotografia concreta. Sem id proprio, cai no
            // monumento — pior a contar, melhor a nao duplicar.
            if (action.ref) return 'p_' + action.ref;
            return action.monumentId === undefined || action.monumentId === null
                ? null : 'm_' + action.monumentId;
        }

        if (action.monumentId === undefined || action.monumentId === null) return null;
        return 'm_' + action.monumentId;
    }

    function zoneIdOf(monumentId) {
        try {
            return sources.getZoneIdOf(monumentId);
        } catch (e) {
            return null;
        }
    }

    function goalAccepts(goal, action) {
        if (goal.type !== action.type) return false;

        // Missao de uma zona: so conta o que acontece nessa zona
        if (goal.zoneId) {
            if (goal.type === MISSION_GOAL.COMPLETE_ZONE) {
                return action.zoneId === goal.zoneId;
            }
            const zone = action.zoneId || zoneIdOf(action.monumentId);
            if (zone !== goal.zoneId) return false;
        }

        return true;
    }

    function buildResult(extra) {
        return Object.assign({
            changed: false,
            completed: false,
            persisted: false,
            status: null
        }, extra || {});
    }

    /**
     * Registra uma accao real no progresso da missao.
     *
     * @param {Object} action { type, monumentId?, zoneId?, ref? }
     * @param {Object} options { now? }
     * @returns {Object} { changed, completed, persisted, status }
     *
     * `completed` e true SO na transicao: a accao que fechou a
     * missao. Voltar a registar a mesma accao nao volta a
     * completar, e por isso a recompensa nunca sai duas vezes
     * (pontos 25 e 53).
     */
    function registerAction(action, options) {
        const input = action || {};
        const settings = options || {};

        if (VALID_GOALS.indexOf(input.type) === -1) {
            return buildResult({ status: getStatus(settings.now) });
        }

        const state = ensureWeek(settings.now);
        const mission = findMission(state.missionId);

        if (!mission) return buildResult({ status: buildStatus(state) });

        // Missao ja fechada: nada mais a contar esta semana
        if (state.completedAt) return buildResult({ status: buildStatus(state) });

        let changed = false;

        mission.goals.forEach(function (goal) {
            if (!goalAccepts(goal, input)) return;

            const count = Math.max(1, Number(goal.count) || 1);
            const current = refsFor(state, goal.type);
            if (current.length >= count) return;

            const ref = refFor(goal, input);
            if (!ref || current.indexOf(ref) !== -1) return;

            state.refs[goal.type] = current.concat([ref]);
            changed = true;
        });

        if (!changed) return buildResult({ status: buildStatus(state) });

        const status = buildStatus(state);
        const allDone = status.total > 0 && status.nextGoal === null;

        if (allDone) {
            state.completedAt = typeof settings.now === 'string'
                ? settings.now
                : toDate(settings.now).toISOString();
        }

        const persisted = write(state);

        // Se a gravacao falhou, a missao nao avancou: quem chama nao
        // deve anunciar nada (a mesma regra do xp.js).
        if (!persisted) {
            return buildResult({ changed: false, persisted: false, status: buildStatus(read()) });
        }

        return buildResult({
            changed: true,
            completed: allDone,
            persisted: true,
            status: buildStatus(state)
        });
    }

    /**
     * Marca que a recompensa desta semana ja foi entregue.
     *
     * A idempotencia do XP vive no xp.js (a chave de recompensa
     * `WEEKLY_MISSION_COMPLETED:mission_<semana>`). Isto aqui serve
     * so para a CELEBRACAO nao voltar a aparecer depois de um
     * refresh — o mesmo papel que `levelSeen` faz para os niveis.
     */
    function markRewarded(now) {
        const state = read();
        if (!state.missionId || !state.completedAt) return false;
        if (state.rewardedAt) return false;

        state.rewardedAt = typeof now === 'string' ? now : toDate(now).toISOString();
        return write(state);
    }

    // Serve os testes e as ferramentas de diagnostico
    function reset() {
        const empty = createEmpty();
        write(empty);
        return empty;
    }

    function getState() {
        return read();
    }

    function getMissions() {
        return WEEKLY_MISSION_CONFIG.map(copyMission);
    }

    const WeeklyMissions = {
        // Configuracao
        configure: configure,
        configureStorage: configureStorage,
        useMemoryStorage: useMemoryStorage,

        // Semana
        getWeekKey: getWeekKey,
        weekIndex: weekIndex,

        // Leitura
        getStatus: getStatus,
        getState: getState,
        getMissions: getMissions,
        getEligibleMissions: getEligibleMissions,
        isEligible: isEligible,
        selectMissionFor: selectMissionFor,

        // Escrita
        ensureWeek: ensureWeek,
        registerAction: registerAction,
        markRewarded: markRewarded,
        reset: reset,

        // Constantes
        GOAL: MISSION_GOAL,
        CONFIG: WEEKLY_MISSION_CONFIG,
        REWARD_ACTION: REWARD_ACTION,
        MODEL_VERSION: MISSION_MODEL_VERSION,
        HISTORY_LIMIT: HISTORY_LIMIT,

        // Utilitarios expostos para os testes
        createEmpty: createEmpty,
        normalize: normalize
    };

    return {
        WeeklyMissions: WeeklyMissions,
        MISSION_GOAL: MISSION_GOAL,
        WEEKLY_MISSION_CONFIG: WEEKLY_MISSION_CONFIG
    };
});
