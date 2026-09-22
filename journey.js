// ============================================================
// Heritage Hunt CV — Jornada cultural (camada de dominio)
//
// Transforma os monumentos e as zonas que ja existem num
// percurso ordenado, e diz em que estado esta cada etapa.
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage;
//   - NAO guarda que monumentos foram descobertos: pergunta
//     sempre a fonte real (ponto 47);
//   - nao atribui XP, nao mexe em niveis nem na sequencia;
//   - nao conhece traducoes (os nomes vivem no i18n, nas
//     chaves journeys.<id> e zones.<id>).
//
// Os monumentos, as zonas e as descobertas entram por
// Journey.configure(): o dominio nunca le `state` directamente.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Journey = api.Journey;
        root.JOURNEY_CONFIG = api.JOURNEY_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // Configuracao das jornadas
    //
    // Uma jornada NAO repete a lista de monumentos: aponta para
    // as zonas que ja existem, pela ordem em que devem ser
    // percorridas. A ordem dentro de cada zona e a ordem de
    // `monumentIds` na propria zona.
    //
    // Acrescentar uma jornada nova (Rota Portuaria, Sao Vicente
    // Completo, outra ilha) e acrescentar uma entrada aqui e o
    // texto em i18n. Nada mais no sistema muda.
    //
    //   id        chave estavel (i18n: journeys.<id>)
    //   islandId  ilha a que pertence (preparado para o futuro)
    //   cityId    cidade
    //   zoneIds   zonas pela ordem do percurso
    // ==========================================================
    const JOURNEY_CONFIG = [
        {
            id: 'mindelo_historico',
            islandId: 'sao_vicente',
            cityId: 'mindelo',
            icon: 'fas fa-route',
            // Percurso editorial: centro -> frente de mar -> colinas -> cultura
            zoneIds: ['centro_historico', 'frente_mar', 'colinas', 'cultura_viva']
        }
    ];

    const STEP_STATE = {
        DISCOVERED: 'discovered',
        CURRENT: 'current',
        UPCOMING: 'upcoming'
    };

    // ==========================================================
    // Fontes de dados (injectadas)
    // ==========================================================
    const sources = {
        getMonuments: function () { return []; },
        getZones: function () { return []; },
        getDiscoveredIds: function () { return []; }
    };

    function configure(options) {
        const config = options || {};
        if (typeof config.getMonuments === 'function') sources.getMonuments = config.getMonuments;
        if (typeof config.getZones === 'function') sources.getZones = config.getZones;
        if (typeof config.getDiscoveredIds === 'function') sources.getDiscoveredIds = config.getDiscoveredIds;
    }

    function monuments() {
        const list = sources.getMonuments();
        return Array.isArray(list) ? list : [];
    }

    function zones() {
        const list = sources.getZones();
        return Array.isArray(list) ? list : [];
    }

    // A fonte de verdade das descobertas continua a ser o perfil
    // do utilizador. Aqui so se le.
    function discoveredIds() {
        const list = sources.getDiscoveredIds();
        return Array.isArray(list) ? list : [];
    }

    function findMonument(id) {
        const list = monuments();
        for (let i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === id) return list[i];
        }
        return null;
    }

    function findZone(id) {
        const list = zones();
        for (let i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === id) return list[i];
        }
        return null;
    }

    function findJourneyConfig(journeyId) {
        const id = journeyId || getDefaultJourneyId();
        return JOURNEY_CONFIG.filter(function (journey) {
            return journey.id === id;
        })[0] || null;
    }

    function getDefaultJourneyId() {
        return JOURNEY_CONFIG.length ? JOURNEY_CONFIG[0].id : null;
    }

    function getJourneys() {
        return JOURNEY_CONFIG.map(function (journey) {
            return Object.assign({}, journey, { zoneIds: journey.zoneIds.slice() });
        });
    }

    // ==========================================================
    // Construcao do percurso
    //
    // Passo = um monumento numa posicao do percurso. A ordem vem
    // dos dados (zonas da jornada + monumentIds de cada zona),
    // nunca de ordenacao alfabetica.
    // ==========================================================
    function buildGroups(journeyId) {
        const config = findJourneyConfig(journeyId);
        if (!config) return [];

        const groups = [];
        const used = [];
        let order = 0;

        config.zoneIds.forEach(function (zoneId) {
            const zone = findZone(zoneId);
            if (!zone || !Array.isArray(zone.monumentIds)) return;

            const steps = [];
            zone.monumentIds.forEach(function (monumentId) {
                // Um monumento listado em duas zonas entra uma so vez
                if (used.indexOf(monumentId) !== -1) return;

                const monument = findMonument(monumentId);
                if (!monument) return;

                used.push(monumentId);
                order += 1;
                steps.push({ monumentId: monumentId, monument: monument, order: order, zoneId: zoneId });
            });

            if (steps.length) groups.push({ zoneId: zoneId, steps: steps });
        });

        // Defensivo: um monumento que nao pertenca a nenhuma zona da
        // jornada continua a fazer parte do percurso, no fim.
        const orphans = [];
        monuments().forEach(function (monument) {
            if (!monument || used.indexOf(monument.id) !== -1) return;
            used.push(monument.id);
            order += 1;
            orphans.push({ monumentId: monument.id, monument: monument, order: order, zoneId: null });
        });

        if (orphans.length) groups.push({ zoneId: null, steps: orphans });

        return groups;
    }

    function flatten(groups) {
        return groups.reduce(function (all, group) {
            return all.concat(group.steps);
        }, []);
    }

    // ==========================================================
    // Estado de cada etapa
    //
    //   discovered  ja foi descoberto (venha de onde vier a ordem)
    //   current     primeiro por descobrir na ordem do percurso
    //   upcoming    ainda por chegar
    //
    // O estado "upcoming" e apenas visual: nao impede ninguem de
    // ler o QR de um monumento em que esteja fisicamente (ponto 12).
    // ==========================================================
    function resolveCurrentId(steps, discovered) {
        for (let i = 0; i < steps.length; i++) {
            if (discovered.indexOf(steps[i].monumentId) === -1) return steps[i].monumentId;
        }
        return null;
    }

    function stateFor(monumentId, discovered, currentId) {
        if (discovered.indexOf(monumentId) !== -1) return STEP_STATE.DISCOVERED;
        if (monumentId === currentId) return STEP_STATE.CURRENT;
        return STEP_STATE.UPCOMING;
    }

    /**
     * Percurso completo, agrupado por zona, com o estado de cada
     * etapa ja resolvido. E isto que a interface consome.
     */
    function getJourney(journeyId) {
        const config = findJourneyConfig(journeyId);
        if (!config) return null;

        const groups = buildGroups(config.id);
        const steps = flatten(groups);
        const discovered = discoveredIds();
        const currentId = resolveCurrentId(steps, discovered);

        steps.forEach(function (step) {
            step.state = stateFor(step.monumentId, discovered, currentId);
            step.isDiscovered = step.state === STEP_STATE.DISCOVERED;
            step.isCurrent = step.state === STEP_STATE.CURRENT;
            step.isLast = false;
        });

        if (steps.length) steps[steps.length - 1].isLast = true;

        // Progresso de cada zona, para o separador entre zonas
        groups.forEach(function (group) {
            const done = group.steps.filter(function (step) { return step.isDiscovered; }).length;
            group.total = group.steps.length;
            group.discovered = done;
            group.isComplete = group.total > 0 && done === group.total;
            group.percent = group.total ? Math.round((done / group.total) * 100) : 0;
            group.hasCurrent = group.steps.some(function (step) { return step.isCurrent; });
        });

        return {
            id: config.id,
            islandId: config.islandId,
            cityId: config.cityId,
            icon: config.icon,
            groups: groups,
            steps: steps
        };
    }

    function getSteps(journeyId) {
        const journey = getJourney(journeyId);
        return journey ? journey.steps : [];
    }

    /**
     * Progresso global. Derivado, nunca guardado (ponto 46).
     */
    function getJourneyProgress(journeyId) {
        const steps = getSteps(journeyId);
        const discovered = discoveredIds();
        const done = steps.filter(function (step) {
            return discovered.indexOf(step.monumentId) !== -1;
        }).length;
        const total = steps.length;

        return {
            journeyId: journeyId || getDefaultJourneyId(),
            total: total,
            discovered: done,
            remaining: Math.max(0, total - done),
            percent: total ? Math.round((done / total) * 100) : 0,
            currentMonumentId: resolveCurrentId(steps, discovered),
            isCompleted: total > 0 && done === total,
            isEmpty: done === 0
        };
    }

    function getJourneyStepState(monumentId, journeyId) {
        const steps = getSteps(journeyId);
        const discovered = discoveredIds();
        return stateFor(monumentId, discovered, resolveCurrentId(steps, discovered));
    }

    // Etapa actual: o primeiro monumento por descobrir do percurso.
    // null quando a jornada esta completa.
    function getCurrentJourneyStep(journeyId) {
        const steps = getSteps(journeyId);
        const discovered = discoveredIds();
        const currentId = resolveCurrentId(steps, discovered);
        if (currentId === null) return null;

        return steps.filter(function (step) {
            return step.monumentId === currentId;
        })[0] || null;
    }

    function getNextUndiscoveredMonument(journeyId) {
        const step = getCurrentJourneyStep(journeyId);
        return step ? step.monument : null;
    }

    function isJourneyCompleted(journeyId) {
        return getJourneyProgress(journeyId).isCompleted;
    }

    function getZoneProgress(zoneId, journeyId) {
        const journey = getJourney(journeyId);
        if (!journey) return null;

        const group = journey.groups.filter(function (entry) {
            return entry.zoneId === zoneId;
        })[0];
        if (!group) return null;

        return {
            zoneId: zoneId,
            total: group.total,
            discovered: group.discovered,
            remaining: group.total - group.discovered,
            percent: group.percent,
            isComplete: group.isComplete
        };
    }

    const Journey = {
        configure: configure,

        // Percurso
        getJourney: getJourney,
        getSteps: getSteps,
        getJourneys: getJourneys,
        getDefaultJourneyId: getDefaultJourneyId,

        // Progresso
        getJourneyProgress: getJourneyProgress,
        getJourneyStepState: getJourneyStepState,
        getCurrentJourneyStep: getCurrentJourneyStep,
        getNextUndiscoveredMonument: getNextUndiscoveredMonument,
        isJourneyCompleted: isJourneyCompleted,
        getZoneProgress: getZoneProgress,

        STATE: STEP_STATE,
        CONFIG: JOURNEY_CONFIG
    };

    return { Journey: Journey, JOURNEY_CONFIG: JOURNEY_CONFIG };
});
