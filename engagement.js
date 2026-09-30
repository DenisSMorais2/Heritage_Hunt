// ============================================================
// Heritage Hunt CV — Loop de descoberta (camada de dominio)
//
// Este ficheiro existe para responder a UMA pergunta:
//
//     "O que posso descobrir a seguir?"
//
// Nada aqui e um sistema novo. O XP vive em xp.js, o nivel em
// levels.js, o percurso em journey.js, a sequencia em streak.js.
// Este modulo LIGA o que ja existe e escolhe, de tudo o que esta a
// acontecer, a UMA coisa que vale a pena dizer a seguir.
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage;
//   - nao atribui XP, nao mexe em niveis, zonas nem sequencia;
//   - nao guarda nada: tudo e derivado do estado real;
//   - nao conhece traducoes — devolve ids e numeros, e a interface
//     traduz (engagement.reason.<motivo>, engagement.almost.<regra>).
//
// As fontes entram por Engagement.configure(), como em journey.js:
// o dominio nunca le `state` directamente.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Engagement = api.Engagement;
        root.NEXT_REASON = api.NEXT_REASON;
        root.ALMOST_RULE = api.ALMOST_RULE;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // Motivos da proxima descoberta (ponto 5)
    //
    // O motivo NAO e enfeite: e ele que decide a frase que a pessoa
    // le debaixo do nome do monumento. Por isso e escolhido aqui,
    // com regras testaveis, e nao dentro do componente.
    // ==========================================================
    const NEXT_REASON = {
        // Falta um unico lugar para fechar a jornada inteira (ponto 37)
        LAST_IN_JOURNEY: 'LAST_IN_JOURNEY',
        // Ainda nao descobriu nada: o objectivo tem de ser simples (ponto 35)
        FIRST: 'FIRST',
        // Falta um unico lugar para completar uma zona (ponto 5.1)
        LAST_IN_ZONE: 'LAST_IN_ZONE',
        // A proxima etapa do percurso editorial (ponto 5.2)
        JOURNEY_STEP: 'JOURNEY_STEP',
        // Defensivo: o percurso nao resolveu, fica o mais proximo
        NEAREST: 'NEAREST'
    };

    // ==========================================================
    // Regras do "Quase la" (pontos 8 e 9)
    //
    // Uma so mensagem, sempre. Quem esta a um monumento de fechar
    // uma zona E a 35 XP de subir de nivel ouve falar da zona — o
    // resto continua disponivel no Perfil.
    // ==========================================================
    const ALMOST_RULE = {
        JOURNEY_ONE_LEFT: 'JOURNEY_ONE_LEFT',
        ZONE_ONE_LEFT: 'ZONE_ONE_LEFT',
        ZONE_FEW_LEFT: 'ZONE_FEW_LEFT',
        LEVEL_CLOSE: 'LEVEL_CLOSE',
        JOURNEY_PROGRESS: 'JOURNEY_PROGRESS'
    };

    // "Mais 2 descobertas para completares esta zona" ainda e uma
    // promessa credivel; mais do que isso ja e so progresso.
    const ZONE_FEW_LIMIT = 2;

    // Um nivel so entra no "Quase la" quando esta mesmo perto: uma
    // descoberta, ou duas fotografias, chegam para o atravessar.
    const LEVEL_XP_NEAR = 60;

    // Estados da jornada (pontos 35, 37 e 38). A interface muda de
    // tom com eles, por isso tem nomes e nao percentagens.
    const JOURNEY_STATE = {
        EMPTY: 'empty',        // 0 descobertas
        EXPLORING: 'exploring',
        LAST_ONE: 'lastOne',   // 11/12
        COMPLETE: 'complete'   // 12/12
    };

    // ==========================================================
    // Fontes de dados (injectadas)
    //
    // As que apontam para outro dominio existem para NAO repetir
    // aritmetica que ja tem dono: `getZoneProgress` e
    // `getJourneyProgress` sao de journey.js, `getLevelProgress` e
    // de levels.js. Um teste pode configurar so o que precisa.
    // ==========================================================
    const DEFAULT_SOURCES = {
        getMonuments: function () { return []; },
        getZones: function () { return []; },
        // Ordem cronologica de descoberta (o ultimo e o mais recente)
        getDiscoveredIds: function () { return []; },
        getJourneyProgress: null,   // Journey.getJourneyProgress()
        getCurrentStep: null,       // Journey.getCurrentJourneyStep()
        getZoneProgress: null,      // Journey.getZoneProgress(zoneId)
        getLevelProgress: null,     // Levels.getProgress(XP.getTotalXP())
        // Metros, ou null quando nao ha localizacao precisa (ponto 49)
        getDistanceTo: null,
        // { photos, experiences } para o resumo dos 12/12 (ponto 38)
        getMemoryCounts: null
    };

    const sources = Object.assign({}, DEFAULT_SOURCES);

    /**
     * Uma chave AUSENTE mantem a fonte actual; uma chave PRESENTE
     * define-a, e passar null ou undefined devolve-a ao valor de
     * recurso.
     *
     * A diferenca importa: sem ela, `configure({ getZoneProgress:
     * null })` deixava a fonte anterior de pe em silencio, e o
     * modulo ficava a responder com dados de uma configuracao que
     * ja tinha sido substituida.
     */
    function configure(options) {
        const config = options || {};

        Object.keys(DEFAULT_SOURCES).forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(config, key)) return;
            sources[key] = typeof config[key] === 'function'
                ? config[key]
                : DEFAULT_SOURCES[key];
        });
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function monuments() {
        return asArray(sources.getMonuments());
    }

    function zones() {
        return asArray(sources.getZones());
    }

    function discoveredIds() {
        return asArray(sources.getDiscoveredIds());
    }

    // Uma fonte injectada nunca pode derrubar a aplicacao: se
    // falhar, o cartao mostra-se com menos informacao.
    function safeCall(fn, fallback) {
        if (typeof fn !== 'function') return fallback;
        try {
            const value = fn();
            return value === undefined || value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function findMonument(id) {
        const list = monuments();
        for (let i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === id) return list[i];
        }
        return null;
    }

    // Distancia em metros, ou null. Nunca pedimos a localizacao para
    // isto: se ainda nao ha permissao, o cartao mostra-se sem
    // distancia (pontos 4 e 49).
    function distanceTo(monument) {
        if (!monument || typeof sources.getDistanceTo !== 'function') return null;

        let value = null;
        try {
            value = sources.getDistanceTo(monument);
        } catch (e) {
            return null;
        }

        // `null` significa "ainda nao ha localizacao", e tem de
        // continuar a significar isso: `Number(null)` e 0, e um
        // cartao a dizer "0 m" mentia sobre onde a pessoa esta.
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'boolean') return null;

        const number = Number(value);
        return isFinite(number) && number >= 0 ? number : null;
    }

    // ==========================================================
    // Progresso por zona (ponto 16)
    //
    // A aritmetica preferida e a de journey.js: se estiver ligada,
    // e ela que manda. A conta local existe para que os testes
    // deste ficheiro nao precisem de montar uma jornada inteira.
    // ==========================================================
    function zoneProgress(zoneId, discovered) {
        if (typeof sources.getZoneProgress === 'function') {
            let progress = null;
            try {
                progress = sources.getZoneProgress(zoneId);
            } catch (e) {
                progress = null;
            }
            if (progress) return progress;
        }

        const zone = zones().filter(function (entry) {
            return entry && entry.id === zoneId;
        })[0];
        if (!zone) return null;

        const ids = asArray(zone.monumentIds);
        const found = discovered || discoveredIds();
        const done = ids.filter(function (id) {
            return found.indexOf(id) !== -1;
        }).length;

        return {
            zoneId: zoneId,
            total: ids.length,
            discovered: done,
            remaining: Math.max(0, ids.length - done),
            percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
            isComplete: ids.length > 0 && done === ids.length
        };
    }

    /**
     * Todas as zonas com o seu progresso, pela ordem da configuracao
     * (que e a ordem do percurso). E isto que a lista de zonas e a
     * barra "3 / 4" consomem.
     */
    function getZoneStates() {
        const discovered = discoveredIds();

        return zones().map(function (zone) {
            const progress = zoneProgress(zone.id, discovered) || {};
            const total = progress.total || 0;
            const done = progress.discovered || 0;

            return {
                zoneId: zone.id,
                total: total,
                discovered: done,
                remaining: progress.remaining === undefined
                    ? Math.max(0, total - done)
                    : progress.remaining,
                percent: progress.percent || 0,
                isComplete: !!progress.isComplete,
                monumentIds: asArray(zone.monumentIds).slice()
            };
        });
    }

    // A zona do explorador e a do ultimo lugar que descobriu: e la
    // que ele esteve, e e la que faz sentido acabar o que comecou.
    //
    // Depende de `getDiscoveredIds()` vir em ordem cronologica, que
    // e como `state.scannedMonuments` cresce (sempre por push).
    function getCurrentZoneId() {
        const discovered = discoveredIds();
        if (!discovered.length) return null;

        const newest = discovered[discovered.length - 1];

        const owner = zones().filter(function (zone) {
            return asArray(zone.monumentIds).indexOf(newest) !== -1;
        })[0];

        return owner ? owner.id : null;
    }

    function zoneOf(monumentId) {
        const owner = zones().filter(function (zone) {
            return asArray(zone.monumentIds).indexOf(monumentId) !== -1;
        })[0];
        return owner ? owner.id : null;
    }

    // Monumentos por descobrir de uma zona, pela ordem da zona
    function undiscoveredInZone(zoneState, discovered) {
        return zoneState.monumentIds
            .filter(function (id) { return discovered.indexOf(id) === -1; })
            .map(findMonument)
            .filter(Boolean);
    }

    function allUndiscovered(discovered) {
        return monuments().filter(function (monument) {
            return monument && discovered.indexOf(monument.id) === -1;
        });
    }

    // Desempate por proximidade (ponto 5, regra 3): so entra quando
    // ha mesmo localizacao. Sem ela, a ordem dos dados decide — e
    // decide igual em todos os aparelhos.
    function nearestOf(list) {
        const candidates = asArray(list).filter(Boolean);
        if (!candidates.length) return null;

        let best = candidates[0];
        let bestDistance = distanceTo(best);

        for (let i = 1; i < candidates.length; i++) {
            const distance = distanceTo(candidates[i]);
            if (distance === null) continue;
            if (bestDistance === null || distance < bestDistance) {
                best = candidates[i];
                bestDistance = distance;
            }
        }

        return best;
    }

    function journeyProgress() {
        return safeCall(sources.getJourneyProgress, null);
    }

    function currentStep() {
        return safeCall(sources.getCurrentStep, null);
    }

    function levelProgress() {
        return safeCall(sources.getLevelProgress, null);
    }

    // ==========================================================
    // PROXIMA DESCOBERTA (pontos 4, 5 e 6)
    //
    // Nunca aleatoria, nunca um monumento ja descoberto, e sempre
    // com um motivo que explica a escolha.
    //
    // Prioridade:
    //   1. falta so este para fechar a jornada    (ponto 37)
    //   2. ainda nao descobriu nada               (ponto 35)
    //   3. falta so este para fechar uma zona     (ponto 5.1)
    //   4. proxima etapa da jornada               (ponto 5.2)
    //   5. o mais proximo por descobrir           (defensivo)
    //
    // A proximidade entra como DESEMPATE dentro de cada regra
    // (ponto 5.3), nunca a passar a frente do percurso: um cartao
    // que muda de monumento a cada passo que a pessoa da nao e um
    // objectivo, e um alvo movel.
    // ==========================================================
    function buildNext(monument, reason, zoneId) {
        if (!monument) return null;

        return {
            type: 'monument',
            monumentId: monument.id,
            monument: monument,
            title: monument.name || '',
            image: monument.image || '',
            points: monument.points || 0,
            zoneId: zoneId === undefined ? zoneOf(monument.id) : zoneId,
            // null quando nao ha localizacao precisa: a interface
            // mostra o monumento sem distancia (ponto 49).
            distance: distanceTo(monument),
            reason: reason
        };
    }

    function getNextDiscovery() {
        const discovered = discoveredIds();
        const pending = allUndiscovered(discovered);

        // Jornada completa: nao ha "nova descoberta" que inventar
        // (o ponto 38 trata o que se mostra em vez disto).
        if (!pending.length) return null;

        const zoneStates = getZoneStates();

        // 1 — Ultimo lugar da jornada inteira
        if (pending.length === 1) {
            return buildNext(pending[0], NEXT_REASON.LAST_IN_JOURNEY);
        }

        // 2 — Primeira descoberta: o objectivo tem de ser um so
        if (!discovered.length) {
            const step = currentStep();
            const first = (step && step.monument) || pending[0];
            return buildNext(first, NEXT_REASON.FIRST, step ? step.zoneId : undefined);
        }

        // 3 — Falta um unico monumento para completar uma zona.
        //     A zona onde o explorador acabou de estar tem prioridade.
        //
        //     `discovered > 0` nao e detalhe: uma zona de um so
        //     monumento, intocada, tambem esta "a um do fim", e
        //     dizer-lhe "falta apenas este para completares" seria
        //     falso — nao se esta perto de acabar o que nem se
        //     comecou (o mesmo cuidado esta em getAlmostThere).
        const oneLeftZones = zoneStates.filter(function (zone) {
            return zone.total > 0 && zone.remaining === 1 && zone.discovered > 0;
        });

        if (oneLeftZones.length) {
            const currentZoneId = getCurrentZoneId();
            const preferred = oneLeftZones.filter(function (zone) {
                return zone.zoneId === currentZoneId;
            })[0];

            const chosenZone = preferred || pickZoneByDistance(oneLeftZones, discovered);
            const monument = undiscoveredInZone(chosenZone, discovered)[0];

            if (monument) {
                return buildNext(monument, NEXT_REASON.LAST_IN_ZONE, chosenZone.zoneId);
            }
        }

        // 4 — A proxima etapa do percurso editorial
        const step = currentStep();
        if (step && step.monument && discovered.indexOf(step.monumentId) === -1) {
            return buildNext(step.monument, NEXT_REASON.JOURNEY_STEP, step.zoneId);
        }

        // 5 — Defensivo: sem percurso utilizavel, o mais proximo
        return buildNext(nearestOf(pending), NEXT_REASON.NEAREST);
    }

    // Entre varias zonas a um monumento do fim, ganha a que tem o
    // monumento mais proximo. Sem localizacao, ganha a primeira da
    // ordem do percurso — igual em todos os aparelhos.
    function pickZoneByDistance(zoneStates, discovered) {
        let best = zoneStates[0];
        let bestDistance = null;

        zoneStates.forEach(function (zone) {
            const monument = undiscoveredInZone(zone, discovered)[0];
            const distance = distanceTo(monument);
            if (distance === null) return;
            if (bestDistance === null || distance < bestDistance) {
                best = zone;
                bestDistance = distance;
            }
        });

        return best;
    }

    // ==========================================================
    // QUASE LA (pontos 8 e 9)
    //
    // Devolve UMA mensagem, ou null. Nunca uma lista: cinco
    // progressos ao mesmo tempo nao sao um objectivo, sao ruido.
    //
    // O resultado traz `rule` e `vars`; o texto vive no i18n.
    // ==========================================================
    function getAlmostThere() {
        const discovered = discoveredIds();

        // Quem ainda nao descobriu nada nao esta "quase" nada: o
        // primeiro objectivo e a primeira descoberta (ponto 35).
        if (!discovered.length) return null;

        const journey = journeyProgress();
        const zoneStates = getZoneStates();

        // 1 — Falta um unico lugar na jornada inteira (ponto 37).
        //     Vence a zona porque, a 11/12, e o MESMO monumento — e
        //     fechar a jornada e a maior das duas noticias.
        if (journey && journey.total > 0 && journey.remaining === 1) {
            return {
                rule: ALMOST_RULE.JOURNEY_ONE_LEFT,
                vars: { done: journey.discovered, total: journey.total },
                isMajor: true
            };
        }

        const currentZoneId = getCurrentZoneId();

        // 2 — Falta um unico lugar numa zona. A zona actual primeiro.
        //
        //     So contam zonas COMECADAS. "Mais 2 descobertas para
        //     completares as Colinas" numa zona de dois monumentos
        //     onde ainda nao se descobriu nada nao e estar quase la:
        //     e estar no inicio, e o enunciado pede o objectivo mais
        //     proximo e mais relevante (ponto 8), nao o mais pequeno.
        const oneLeft = zoneStates.filter(function (zone) {
            return zone.total > 0 && zone.remaining === 1 && zone.discovered > 0;
        });

        if (oneLeft.length) {
            const zone = oneLeft.filter(function (entry) {
                return entry.zoneId === currentZoneId;
            })[0] || oneLeft[0];

            return {
                rule: ALMOST_RULE.ZONE_ONE_LEFT,
                zoneId: zone.zoneId,
                vars: { zone: zone.zoneId, done: zone.discovered, total: zone.total },
                isMajor: false
            };
        }

        // 3 — Faltam poucas (2) para fechar a zona onde ele anda
        const few = zoneStates.filter(function (zone) {
            return zone.total > 0 && zone.discovered > 0 &&
                zone.remaining > 1 && zone.remaining <= ZONE_FEW_LIMIT;
        });

        if (few.length) {
            const zone = few.filter(function (entry) {
                return entry.zoneId === currentZoneId;
            })[0] || few[0];

            return {
                rule: ALMOST_RULE.ZONE_FEW_LEFT,
                zoneId: zone.zoneId,
                vars: { n: zone.remaining, zone: zone.zoneId, done: zone.discovered, total: zone.total },
                isMajor: false
            };
        }

        // 4 — Falta pouco XP para o proximo nivel
        const level = levelProgress();
        if (level && !level.isMaxLevel && level.nextLevel &&
            level.xpRemaining !== null && level.xpRemaining !== undefined &&
            level.xpRemaining > 0 && level.xpRemaining <= LEVEL_XP_NEAR) {
            return {
                rule: ALMOST_RULE.LEVEL_CLOSE,
                levelId: level.nextLevel.id,
                vars: { n: level.xpRemaining, level: level.nextLevel.id },
                isMajor: false
            };
        }

        // 5 — Sem nada iminente, o progresso da jornada ainda informa
        if (journey && journey.total > 0 && journey.discovered < journey.total) {
            return {
                rule: ALMOST_RULE.JOURNEY_PROGRESS,
                vars: { done: journey.discovered, total: journey.total },
                isMajor: false
            };
        }

        return null;
    }

    // ==========================================================
    // Estado da jornada (pontos 35, 37 e 38)
    // ==========================================================
    function getJourneyState() {
        const journey = journeyProgress();
        const discovered = discoveredIds();

        const total = journey ? journey.total : monuments().length;
        const done = journey ? journey.discovered : discovered.length;

        if (!total) return JOURNEY_STATE.EMPTY;
        if (done <= 0) return JOURNEY_STATE.EMPTY;
        if (done >= total) return JOURNEY_STATE.COMPLETE;
        if (total - done === 1) return JOURNEY_STATE.LAST_ONE;
        return JOURNEY_STATE.EXPLORING;
    }

    /**
     * Resumo do fim da jornada (ponto 38): o que a pessoa construiu,
     * nao o que lhe falta. As fotografias e as memorias vem de quem
     * as guarda — aqui so se le.
     */
    function getCompletionSummary() {
        const journey = journeyProgress();
        const zoneStates = getZoneStates();
        const counts = safeCall(sources.getMemoryCounts, {}) || {};

        return {
            monuments: journey ? journey.discovered : discoveredIds().length,
            monumentsTotal: journey ? journey.total : monuments().length,
            zones: zoneStates.filter(function (zone) { return zone.isComplete; }).length,
            zonesTotal: zoneStates.length,
            photos: Math.max(0, Number(counts.photos) || 0),
            experiences: Math.max(0, Number(counts.experiences) || 0),
            isComplete: getJourneyState() === JOURNEY_STATE.COMPLETE
        };
    }

    // ==========================================================
    // O que mostrar quando a app abre (pontos 33 e 34)
    //
    // Uma prioridade, nao uma pilha: missao por terminar primeiro,
    // proxima descoberta depois. Nunca as duas a competir no topo.
    //
    // `mission` entra de fora (missions.js) para que este ficheiro
    // nao dependa do modulo das missoes — e para que a regra de
    // prioridade continue a ser testavel sozinha.
    // ==========================================================
    function getFocus(mission) {
        const state = getJourneyState();

        // Missao da semana a meio: e o objectivo mais curto que ha
        if (mission && mission.mission && !mission.isComplete) {
            return { type: 'mission', mission: mission, journeyState: state };
        }

        if (state === JOURNEY_STATE.COMPLETE) {
            return { type: 'journeyComplete', summary: getCompletionSummary(), journeyState: state };
        }

        const next = getNextDiscovery();
        if (next) {
            return { type: 'nextDiscovery', next: next, journeyState: state };
        }

        return { type: 'none', journeyState: state };
    }

    const Engagement = {
        configure: configure,

        // Proxima descoberta
        getNextDiscovery: getNextDiscovery,

        // Quase la
        getAlmostThere: getAlmostThere,

        // Zonas e jornada
        getZoneStates: getZoneStates,
        getCurrentZoneId: getCurrentZoneId,
        getJourneyState: getJourneyState,
        getCompletionSummary: getCompletionSummary,

        // Retorno a app
        getFocus: getFocus,

        REASON: NEXT_REASON,
        RULE: ALMOST_RULE,
        JOURNEY_STATE: JOURNEY_STATE,
        ZONE_FEW_LIMIT: ZONE_FEW_LIMIT,
        LEVEL_XP_NEAR: LEVEL_XP_NEAR
    };

    return {
        Engagement: Engagement,
        NEXT_REASON: NEXT_REASON,
        ALMOST_RULE: ALMOST_RULE
    };
});
