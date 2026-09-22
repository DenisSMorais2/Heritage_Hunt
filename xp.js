// ============================================================
// Heritage Hunt CV — Sistema de XP (camada de dominio)
//
// Fonte unica de verdade da progressao do explorador.
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage directamente (usa um adaptador
//     injectado, para permitir migrar para uma base de dados);
//   - o valor de cada recompensa e decidido AQUI, nunca por quem
//     chama (quem chama envia a accao, nao o montante).
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.XP = api.XP;
        root.XP_ACTION = api.XP_ACTION;
        root.XP_CONFIG = api.XP_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const XP_MODEL_VERSION = 1;

    // Quantas transacoes mantemos no historico visivel. Os totais e as
    // chaves de recompensa NAO dependem disto (ver nota em normalize).
    const HISTORY_LIMIT = 300;

    // ==========================================================
    // Accoes
    //
    // Acrescentar uma accao nova e acrescentar uma entrada em
    // XP_ACTION e outra em XP_CONFIG. Nada mais no sistema conhece
    // os nomes das accoes de forma rigida (ponto 48).
    // ==========================================================
    const XP_ACTION = {
        MONUMENT_DISCOVERED: 'MONUMENT_DISCOVERED',
        PHOTO_ADDED: 'PHOTO_ADDED',
        EXPERIENCE_ADDED: 'EXPERIENCE_ADDED',
        ZONE_COMPLETED: 'ZONE_COMPLETED'

        // Reservado para o futuro (nao implementado):
        // QUIZ_COMPLETED, CULTURAL_CHALLENGE_COMPLETED,
        // ROUTE_COMPLETED, ISLAND_COMPLETED, EVENT_ATTENDED
    };

    // ==========================================================
    // Configuracao central das recompensas
    //
    //   amount              montante base da recompensa
    //   useEntityAmount     usa o valor da propria entidade quando
    //                       existir (os monumentos do Heritage Hunt
    //                       ja valem 25 a 50 pontos cada). Poe a
    //                       false para dares 50 XP fixos a todos.
    //   uniquePerEntity     so pode ser recompensada uma vez por entidade
    //   uniquePerMonument   so pode ser recompensada uma vez por monumento
    //   maxRewardsPerMonument  quantas vezes, no total, esta accao pode
    //                       render XP num mesmo monumento
    //   icon                icone Font Awesome usado no historico
    // ==========================================================
    const XP_CONFIG = {
        MONUMENT_DISCOVERED: {
            amount: 50,
            useEntityAmount: true,
            uniquePerEntity: true,
            entityPrefix: 'monument',
            icon: 'fas fa-landmark'
        },
        PHOTO_ADDED: {
            amount: 5,
            maxRewardsPerMonument: 3,
            entityPrefix: 'photo',
            icon: 'fas fa-camera'
        },
        EXPERIENCE_ADDED: {
            amount: 10,
            uniquePerMonument: true,
            entityPrefix: 'experience',
            icon: 'fas fa-pen'
        },
        ZONE_COMPLETED: {
            amount: 100,
            uniquePerEntity: true,
            entityPrefix: 'zone',
            icon: 'fas fa-map-marked-alt'
        }
    };

    const VALID_ACTIONS = Object.keys(XP_CONFIG);

    // Motivos possiveis para uma recompensa nao ser atribuida
    const REASON = {
        INVALID_ACTION: 'invalid_action',
        NO_WALLET: 'no_wallet',
        MISSING_REFERENCE: 'missing_reference',
        ALREADY_REWARDED: 'already_rewarded',
        LIMIT_REACHED: 'limit_reached'
    };

    // ==========================================================
    // Modelo
    // ==========================================================
    function createEmptyWallet() {
        return {
            version: XP_MODEL_VERSION,
            total: 0,
            history: [],      // mais recente primeiro, limitado
            rewardKeys: [],   // NUNCA e limitado: e a garantia de idempotencia
            migratedFrom: null
        };
    }

    function toNonNegativeInt(value) {
        const number = Number(value);
        if (!isFinite(number) || number < 0) return 0;
        return Math.floor(number);
    }

    function normalizeTransaction(raw) {
        if (!raw || typeof raw !== 'object') return null;
        if (VALID_ACTIONS.indexOf(raw.action) === -1) return null;

        return {
            id: typeof raw.id === 'string' ? raw.id : createId(),
            action: raw.action,
            amount: toNonNegativeInt(raw.amount),
            entityId: raw.entityId === undefined ? null : raw.entityId,
            monumentId: raw.monumentId === undefined ? null : raw.monumentId,
            zoneId: raw.zoneId === undefined ? null : raw.zoneId,
            rewardKey: typeof raw.rewardKey === 'string' ? raw.rewardKey : null,
            createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
        };
    }

    // Aceita carteiras antigas, em falta ou corrompidas.
    // Nunca lanca: devolve sempre um modelo utilizavel.
    function normalize(raw) {
        const wallet = createEmptyWallet();
        if (!raw || typeof raw !== 'object') return wallet;

        wallet.total = toNonNegativeInt(raw.total);
        wallet.migratedFrom = typeof raw.migratedFrom === 'number' ? raw.migratedFrom : null;

        if (Array.isArray(raw.history)) {
            wallet.history = raw.history.map(normalizeTransaction).filter(Boolean);
            wallet.history.sort(function (a, b) {
                return a.createdAt < b.createdAt ? 1 : (a.createdAt > b.createdAt ? -1 : 0);
            });
            // O historico e cortado, mas rewardKeys nao: e por isso que a
            // idempotencia nao depende do tamanho do historico.
            wallet.history = wallet.history.slice(0, HISTORY_LIMIT);
        }

        if (Array.isArray(raw.rewardKeys)) {
            wallet.rewardKeys = raw.rewardKeys.filter(function (key, index, list) {
                return typeof key === 'string' && key && list.indexOf(key) === index;
            });
        }

        return wallet;
    }

    let idCounter = 0;
    function createId() {
        idCounter += 1;
        return 'xp_' + Date.now().toString(36) + '_' + idCounter.toString(36) +
            '_' + Math.random().toString(36).slice(2, 8);
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
    let hasWallet = true;   // ha um utilizador com carteira?

    function configureStorage(nextAdapter) {
        if (nextAdapter && typeof nextAdapter.load === 'function' && typeof nextAdapter.save === 'function') {
            adapter = nextAdapter;
            hasWallet = typeof nextAdapter.exists === 'function' ? nextAdapter.exists : true;
        } else {
            adapter = memoryAdapter;
            hasWallet = true;
        }
    }

    function useMemoryStorage() {
        memoryValue = null;
        adapter = memoryAdapter;
        hasWallet = true;
    }

    function walletExists() {
        return typeof hasWallet === 'function' ? !!hasWallet() : !!hasWallet;
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
    // so mostrar "+XP" depois de a recompensa estar mesmo guardada.
    function write(wallet) {
        try {
            adapter.save(wallet);
            return true;
        } catch (e) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('[xp] nao foi possivel guardar a progressao:', e);
            }
            return false;
        }
    }

    // ==========================================================
    // Observadores (ponto 52: a UI reage sem refrescar a pagina)
    // ==========================================================
    const listeners = [];

    function subscribeToXPChanges(listener) {
        if (typeof listener !== 'function') return function () {};
        listeners.push(listener);
        return function unsubscribe() {
            const index = listeners.indexOf(listener);
            if (index !== -1) listeners.splice(index, 1);
        };
    }

    function notify(payload) {
        listeners.slice().forEach(function (listener) {
            try {
                listener(payload);
            } catch (e) {
                if (typeof console !== 'undefined' && console.error) {
                    console.error('[xp] erro num observador:', e);
                }
            }
        });
    }

    // ==========================================================
    // Chaves de recompensa (idempotencia)
    // ==========================================================
    function entityReference(action, event) {
        const config = XP_CONFIG[action];
        const prefix = config.entityPrefix || 'entity';

        let reference;
        if (action === XP_ACTION.MONUMENT_DISCOVERED) {
            reference = event.monumentId !== undefined && event.monumentId !== null
                ? event.monumentId : event.entityId;
        } else if (action === XP_ACTION.ZONE_COMPLETED) {
            reference = event.zoneId !== undefined && event.zoneId !== null
                ? event.zoneId : event.entityId;
        } else {
            reference = event.entityId;
        }

        if (reference === undefined || reference === null || reference === '') return null;
        return prefix + '_' + reference;
    }

    function countRewardsWithPrefix(wallet, prefix) {
        let count = 0;
        for (let i = 0; i < wallet.rewardKeys.length; i++) {
            if (wallet.rewardKeys[i].indexOf(prefix) === 0) count++;
        }
        return count;
    }

    function photoSlotPrefix(monumentId) {
        return XP_ACTION.PHOTO_ADDED + ':monument_' + monumentId + ':slot_';
    }

    /**
     * Resolve a chave unica desta recompensa.
     * Devolve { key } ou { key: null, reason } quando nao ha recompensa.
     *
     * As fotografias usam "slots" em vez do id da fotografia: a 1.a, 2.a
     * e 3.a recompensa de um monumento. Assim, apagar uma fotografia
     * recompensada NAO liberta o slot e nao ha farming por
     * adicionar/apagar/adicionar (pontos 10 e 11).
     */
    function resolveRewardKey(action, event, wallet) {
        const config = XP_CONFIG[action];

        if (config.maxRewardsPerMonument) {
            if (event.monumentId === undefined || event.monumentId === null) {
                return { key: null, reason: REASON.MISSING_REFERENCE };
            }
            const prefix = photoSlotPrefix(event.monumentId);
            const used = countRewardsWithPrefix(wallet, prefix);
            if (used >= config.maxRewardsPerMonument) {
                return { key: null, reason: REASON.LIMIT_REACHED, used: used, max: config.maxRewardsPerMonument };
            }
            return { key: prefix + (used + 1), slot: used + 1 };
        }

        if (config.uniquePerMonument) {
            if (event.monumentId === undefined || event.monumentId === null) {
                return { key: null, reason: REASON.MISSING_REFERENCE };
            }
            return { key: action + ':monument_' + event.monumentId };
        }

        const reference = entityReference(action, event);
        if (!reference) return { key: null, reason: REASON.MISSING_REFERENCE };
        return { key: action + ':' + reference };
    }

    function resolveAmount(action, event) {
        const config = XP_CONFIG[action];
        if (config.useEntityAmount) {
            const entityAmount = Number(event.entityAmount);
            if (isFinite(entityAmount) && entityAmount > 0) return Math.floor(entityAmount);
        }
        return config.amount;
    }

    // ==========================================================
    // Atribuicao
    // ==========================================================
    function buildResult(extra) {
        return Object.assign({
            awarded: false,
            reason: null,
            action: null,
            amount: 0,
            previousXP: 0,
            currentXP: 0,
            rewardKey: null,
            transaction: null,
            persisted: false
        }, extra || {});
    }

    // Aplica um evento a uma carteira em memoria. Nao persiste.
    function applyEvent(wallet, event) {
        const action = event && event.action;

        if (VALID_ACTIONS.indexOf(action) === -1) {
            return buildResult({ reason: REASON.INVALID_ACTION, action: action || null, previousXP: wallet.total, currentXP: wallet.total });
        }

        const resolved = resolveRewardKey(action, event, wallet);
        if (!resolved.key) {
            return buildResult({
                reason: resolved.reason,
                action: action,
                previousXP: wallet.total,
                currentXP: wallet.total,
                rewardsUsed: resolved.used,
                rewardsMax: resolved.max
            });
        }

        if (wallet.rewardKeys.indexOf(resolved.key) !== -1) {
            return buildResult({
                reason: REASON.ALREADY_REWARDED,
                action: action,
                previousXP: wallet.total,
                currentXP: wallet.total,
                rewardKey: resolved.key
            });
        }

        // O montante vem SEMPRE da configuracao, nunca de quem chama
        const amount = resolveAmount(action, event);
        const previousXP = wallet.total;

        const transaction = normalizeTransaction({
            id: createId(),
            action: action,
            amount: amount,
            entityId: event.entityId === undefined ? null : event.entityId,
            monumentId: event.monumentId === undefined ? null : event.monumentId,
            zoneId: event.zoneId === undefined ? null : event.zoneId,
            rewardKey: resolved.key,
            createdAt: typeof event.createdAt === 'string' ? event.createdAt : new Date().toISOString()
        });

        wallet.total = previousXP + amount;
        wallet.rewardKeys.push(resolved.key);
        wallet.history.unshift(transaction);
        if (wallet.history.length > HISTORY_LIMIT) {
            wallet.history = wallet.history.slice(0, HISTORY_LIMIT);
        }

        return buildResult({
            awarded: true,
            action: action,
            amount: amount,
            previousXP: previousXP,
            currentXP: wallet.total,
            rewardKey: resolved.key,
            transaction: transaction
        });
    }

    /**
     * Atribui XP por uma accao.
     *
     * @param {Object} event { action, entityId?, monumentId?, zoneId?, entityAmount? }
     * @returns {Object} { awarded, reason, amount, previousXP, currentXP, transaction, persisted }
     */
    function awardXP(event) {
        return awardMany([event]).results[0];
    }

    /**
     * Atribui varias recompensas numa unica escrita.
     *
     * Usado, por exemplo, quando uma descoberta tambem conclui uma zona:
     * +50 e +100 ficam guardados juntos, nunca so um deles (ponto 28).
     */
    function awardMany(events) {
        const list = Array.isArray(events) ? events : [events];

        if (!walletExists()) {
            return {
                results: list.map(function () { return buildResult({ reason: REASON.NO_WALLET }); }),
                totalAwarded: 0,
                awarded: [],
                previousXP: 0,
                currentXP: 0,
                persisted: false
            };
        }

        const wallet = read();
        const startXP = wallet.total;
        const results = list.map(function (event) { return applyEvent(wallet, event || {}); });
        const awarded = results.filter(function (result) { return result.awarded; });

        if (!awarded.length) {
            return {
                results: results,
                totalAwarded: 0,
                awarded: [],
                previousXP: startXP,
                currentXP: startXP,
                persisted: true
            };
        }

        const persisted = write(wallet);

        // Se a gravacao falhou, a recompensa nao conta: quem chama nao
        // deve anunciar "+XP" (ponto 43).
        results.forEach(function (result) {
            result.persisted = persisted;
            if (!persisted && result.awarded) {
                result.awarded = false;
                result.reason = 'persist_failed';
            }
        });

        if (!persisted) {
            return {
                results: results,
                totalAwarded: 0,
                awarded: [],
                previousXP: startXP,
                currentXP: startXP,
                persisted: false
            };
        }

        const payload = {
            results: results,
            totalAwarded: wallet.total - startXP,
            awarded: awarded,
            previousXP: startXP,
            currentXP: wallet.total,
            persisted: true
        };

        notify(payload);
        return payload;
    }

    // ==========================================================
    // Migracao (ponto 18)
    //
    // Os "pontos" do Heritage Hunt sempre foram experiencia de
    // exploracao, por isso passam a XP sem qualquer conversao.
    // ==========================================================

    /**
     * @param {Object} options
     *   legacyPoints         total de pontos ja acumulado
     *   discoveredMonuments  [{ id, points, discoveredAt }] para reconstruir
     *                        o historico e travar recompensas repetidas
     */
    function migrateLegacyPoints(options) {
        if (!walletExists()) return null;

        const settings = options || {};
        const wallet = read();

        // Ja migrado (ou ja tem actividade propria): nao mexer
        if (wallet.migratedFrom !== null || wallet.total > 0 || wallet.rewardKeys.length > 0) {
            return wallet;
        }

        const legacyPoints = toNonNegativeInt(settings.legacyPoints);
        const discovered = Array.isArray(settings.discoveredMonuments) ? settings.discoveredMonuments : [];

        wallet.total = legacyPoints;
        wallet.migratedFrom = legacyPoints;

        // As descobertas ja pagas passam a ter chave de recompensa, para
        // nunca voltarem a render XP. O historico e reconstruido a partir
        // delas, para o utilizador ver de onde vem o total.
        discovered.forEach(function (monument) {
            if (!monument || monument.id === undefined || monument.id === null) return;

            const key = XP_ACTION.MONUMENT_DISCOVERED + ':monument_' + monument.id;
            if (wallet.rewardKeys.indexOf(key) !== -1) return;
            wallet.rewardKeys.push(key);

            wallet.history.push(normalizeTransaction({
                id: createId(),
                action: XP_ACTION.MONUMENT_DISCOVERED,
                amount: toNonNegativeInt(monument.points) || XP_CONFIG.MONUMENT_DISCOVERED.amount,
                entityId: monument.id,
                monumentId: monument.id,
                rewardKey: key,
                createdAt: typeof monument.discoveredAt === 'string' ? monument.discoveredAt : new Date().toISOString()
            }));
        });

        wallet.history.sort(function (a, b) {
            return a.createdAt < b.createdAt ? 1 : (a.createdAt > b.createdAt ? -1 : 0);
        });
        wallet.history = wallet.history.slice(0, HISTORY_LIMIT);

        write(wallet);
        notify({ results: [], totalAwarded: 0, awarded: [], previousXP: legacyPoints, currentXP: wallet.total, persisted: true, migration: true });
        return wallet;
    }

    // ==========================================================
    // Leitura
    // ==========================================================
    function getTotalXP() {
        return walletExists() ? read().total : 0;
    }

    function getWallet() {
        return read();
    }

    // Historico paginado: a pagina de perfil pede so as ultimas,
    // o modal carrega mais quando o utilizador pedir (pontos 49 e 50).
    function getHistory(options) {
        if (!walletExists()) return [];
        const settings = options || {};
        const history = read().history;
        const offset = Math.max(0, toNonNegativeInt(settings.offset));
        if (settings.limit === undefined) return history.slice(offset);
        return history.slice(offset, offset + Math.max(0, toNonNegativeInt(settings.limit)));
    }

    function getHistoryCount() {
        return walletExists() ? read().history.length : 0;
    }

    function hasReward(action, reference) {
        if (!walletExists()) return false;
        if (VALID_ACTIONS.indexOf(action) === -1) return false;
        const config = XP_CONFIG[action];
        const prefix = config.entityPrefix || 'entity';
        return read().rewardKeys.indexOf(action + ':' + prefix + '_' + reference) !== -1;
    }

    function hasMonumentReward(action, monumentId) {
        if (!walletExists()) return false;
        return read().rewardKeys.indexOf(action + ':monument_' + monumentId) !== -1;
    }

    // Quantas recompensas de fotografia ja foram usadas neste monumento
    function getPhotoRewardsUsed(monumentId) {
        if (!walletExists()) return 0;
        return countRewardsWithPrefix(read(), photoSlotPrefix(monumentId));
    }

    function getPhotoRewardLimit() {
        return XP_CONFIG.PHOTO_ADDED.maxRewardsPerMonument;
    }

    function getPhotoRewardsLeft(monumentId) {
        return Math.max(0, getPhotoRewardLimit() - getPhotoRewardsUsed(monumentId));
    }

    function getActionConfig(action) {
        const config = XP_CONFIG[action];
        return config ? Object.assign({}, config) : null;
    }

    function getActionAmount(action) {
        const config = XP_CONFIG[action];
        return config ? config.amount : 0;
    }

    // Usado nos testes e em ferramentas de diagnostico
    function resetXP() {
        const empty = createEmptyWallet();
        write(empty);
        notify({ results: [], totalAwarded: 0, awarded: [], previousXP: 0, currentXP: 0, persisted: true, reset: true });
        return empty;
    }

    const XP = {
        // Configuracao
        configureStorage: configureStorage,
        useMemoryStorage: useMemoryStorage,

        // Escrita
        awardXP: awardXP,
        awardMany: awardMany,
        migrateLegacyPoints: migrateLegacyPoints,
        resetXP: resetXP,

        // Leitura
        getTotalXP: getTotalXP,
        getWallet: getWallet,
        getHistory: getHistory,
        getHistoryCount: getHistoryCount,
        hasReward: hasReward,
        hasMonumentReward: hasMonumentReward,
        getPhotoRewardsUsed: getPhotoRewardsUsed,
        getPhotoRewardsLeft: getPhotoRewardsLeft,
        getPhotoRewardLimit: getPhotoRewardLimit,
        getActionConfig: getActionConfig,
        getActionAmount: getActionAmount,

        // Observadores
        subscribeToXPChanges: subscribeToXPChanges,

        // Constantes e utilitarios
        ACTION: XP_ACTION,
        CONFIG: XP_CONFIG,
        REASON: REASON,
        MODEL_VERSION: XP_MODEL_VERSION,
        HISTORY_LIMIT: HISTORY_LIMIT,
        createEmptyWallet: createEmptyWallet,
        normalize: normalize
    };

    return { XP: XP, XP_ACTION: XP_ACTION, XP_CONFIG: XP_CONFIG };
});
