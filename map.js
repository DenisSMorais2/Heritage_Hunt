// ============================================================
// Heritage Hunt CV — Geometria do mapa (camada de dominio)
//
// A aritmetica que o mapa precisa, fora do mapa: distancias,
// estados dos marcadores, trocos da Jornada e os halos aproximados
// das zonas.
//
// Regras deste ficheiro:
//   - nao toca no DOM nem no Leaflet;
//   - nao toca em localStorage;
//   - nao decide qual e a "proxima descoberta" (isso e do
//     engagement.js, e ha UM sitio para essa decisao);
//   - nao conhece traducoes.
//
// ATENCAO AO QUE ESTE FICHEIRO NAO FAZ, e de proposito:
//
//   Nao calcula rotas. Nao conhece ruas. A linha da Jornada e a
//   ORDEM NARRATIVA dos monumentos, e as distancias sao em linha
//   recta — nunca "a pe" nem "em N minutos".
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.MapGeo = api.MapGeo;
        root.MARKER_STATE = api.MARKER_STATE;
        root.SEGMENT_STATE = api.SEGMENT_STATE;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // Estados de um marcador (pontos 1 a 5)
    //
    // A hierarquia de atencao do ponto 7 esta nesta ordem, e e ela
    // que decide tambem o pane em que cada marcador e desenhado.
    // ==========================================================
    const MARKER_STATE = {
        NEXT: 'next',                 // 1 — o mais importante
        USER: 'user',                 // 2
        DISCOVERED: 'discovered',     // 3
        UNDISCOVERED: 'undiscovered'  // 4
    };

    // Estados de um troco da linha da Jornada (ponto 19)
    const SEGMENT_STATE = {
        COMPLETED: 'completed',
        CURRENT: 'current',
        FUTURE: 'future'
    };

    // Raio minimo de um halo de zona, em metros. Uma zona de um so
    // monumento nao pode desenhar um circulo de raio zero.
    const ZONE_MIN_RADIUS = 130;

    // Folga entre o monumento mais afastado e o limite do halo, para
    // o circulo envolver os lugares em vez de lhes passar por cima.
    const ZONE_PADDING = 70;

    const EARTH_RADIUS = 6371000;

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function isNumber(value) {
        return typeof value === 'number' && isFinite(value);
    }

    // Um monumento so entra em contas se tiver coordenadas reais
    function hasCoords(monument) {
        return !!monument && isNumber(monument.lat) && isNumber(monument.lng);
    }

    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Distancia em LINHA RECTA entre dois pontos, em metros
     * (Haversine).
     *
     * E a unica distancia que esta app conhece, e e por isso que o
     * texto que a acompanha diz "a cerca de" e nunca "a pe": nao ha
     * routing, e prometer um caminho que nao se calculou seria
     * mentir a quem esta a andar na rua.
     */
    function distance(lat1, lng1, lat2, lng2) {
        if (!isNumber(lat1) || !isNumber(lng1) || !isNumber(lat2) || !isNumber(lng2)) {
            return null;
        }

        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function distanceBetween(from, to) {
        if (!hasCoords(from) || !hasCoords(to)) return null;
        return distance(from.lat, from.lng, to.lat, to.lng);
    }

    // ==========================================================
    // Estado de um marcador (pontos 1 a 4)
    // ==========================================================
    function markerStateFor(monumentId, discoveredIds, nextId) {
        const discovered = asArray(discoveredIds);

        if (discovered.indexOf(monumentId) !== -1) return MARKER_STATE.DISCOVERED;

        // So UM marcador pode estar em NEXT (ponto 4). Um monumento
        // ja descoberto nunca la chega, mesmo que alguem o indique:
        // a linha acima vem primeiro de proposito.
        if (nextId !== null && nextId !== undefined && monumentId === nextId) {
            return MARKER_STATE.NEXT;
        }

        return MARKER_STATE.UNDISCOVERED;
    }

    // ==========================================================
    // Halo aproximado de uma zona (pontos 22, 23 e 24)
    //
    // O PROJECTO NAO TEM GEOMETRIA DE ZONAS. As zonas sao listas de
    // monumentos (id + monumentIds) e mais nada: nao ha poligonos,
    // nao ha GeoJSON, nao ha limites oficiais em lado nenhum.
    //
    // Por isso NAO se inventam fronteiras (ponto 23). O que se
    // desenha e um circulo derivado APENAS das coordenadas dos
    // monumentos da propria zona — uma representacao visual
    // aproximada de onde eles estao, e nunca um limite
    // administrativo.
    //
    // `isApproximate` vai no resultado para que quem desenha nao se
    // esqueca do que isto e.
    // ==========================================================
    function zoneCluster(monuments) {
        const points = asArray(monuments).filter(hasCoords);
        if (!points.length) return null;

        let sumLat = 0;
        let sumLng = 0;
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        points.forEach(function (point) {
            sumLat += point.lat;
            sumLng += point.lng;
            if (point.lat < minLat) minLat = point.lat;
            if (point.lat > maxLat) maxLat = point.lat;
            if (point.lng < minLng) minLng = point.lng;
            if (point.lng > maxLng) maxLng = point.lng;
        });

        const center = {
            lat: sumLat / points.length,
            lng: sumLng / points.length
        };

        // O raio cobre o monumento mais afastado do centro, mais uma
        // folga. A escala da cidade torna a media aritmetica boa que
        // chegue: nao vale um centroide geodesico para desenhar um
        // halo de opacidade 0.06.
        let furthest = 0;
        points.forEach(function (point) {
            const metres = distance(center.lat, center.lng, point.lat, point.lng);
            if (metres !== null && metres > furthest) furthest = metres;
        });

        return {
            center: center,
            radius: Math.max(ZONE_MIN_RADIUS, Math.round(furthest + ZONE_PADDING)),
            bounds: [[minLat, minLng], [maxLat, maxLng]],
            count: points.length,
            // Nunca e um limite oficial. Ver o comentario acima.
            isApproximate: true
        };
    }

    /**
     * Progresso de uma zona com a sua geometria aproximada.
     *
     * Devolve null quando a zona nao tem monumentos com coordenadas:
     * uma zona sem geometria nao pode partir o mapa (ponto 58), fica
     * simplesmente por desenhar.
     */
    function zoneShape(zone, monumentsById, discoveredIds) {
        if (!zone) return null;

        const ids = asArray(zone.monumentIds);
        const monuments = ids
            .map(function (id) { return monumentsById[id]; })
            .filter(hasCoords);

        const cluster = zoneCluster(monuments);
        if (!cluster) return null;

        const discovered = asArray(discoveredIds);
        const done = ids.filter(function (id) {
            return discovered.indexOf(id) !== -1;
        }).length;

        return {
            zoneId: zone.id,
            center: cluster.center,
            radius: cluster.radius,
            bounds: cluster.bounds,
            isApproximate: cluster.isApproximate,

            total: ids.length,
            discovered: done,
            remaining: Math.max(0, ids.length - done),
            percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
            isCompleted: ids.length > 0 && done === ids.length
        };
    }

    function zoneShapes(zones, monuments, discoveredIds) {
        const byId = {};
        asArray(monuments).forEach(function (monument) {
            if (monument) byId[monument.id] = monument;
        });

        return asArray(zones)
            .map(function (zone) { return zoneShape(zone, byId, discoveredIds); })
            .filter(Boolean);
    }

    // ==========================================================
    // Linha da Jornada (pontos 18, 19 e 50)
    //
    // ISTO NAO E UMA ROTA. Liga os monumentos pela ordem do
    // percurso, em linha recta, para se ver a SEQUENCIA da historia.
    // Nao segue ruas, nao da instrucoes e nao diz tempos.
    //
    // A linha parte-se em trocos com estado proprio para que se veja,
    // de relance, o que ja foi andado e o que falta.
    // ==========================================================
    function journeySegments(orderedMonuments, discoveredIds, nextId) {
        const points = asArray(orderedMonuments).filter(hasCoords);
        if (points.length < 2) return [];

        const discovered = asArray(discoveredIds);
        const isDone = function (monument) {
            return discovered.indexOf(monument.id) !== -1;
        };

        const segments = [];

        for (let i = 0; i < points.length - 1; i++) {
            const from = points[i];
            const to = points[i + 1];

            let state;
            if (isDone(from) && isDone(to)) {
                state = SEGMENT_STATE.COMPLETED;
            } else if (nextId !== null && nextId !== undefined && to.id === nextId) {
                // So o troco que CHEGA a proxima descoberta, nunca o
                // que sai dela: o que vem depois ainda nao e uma
                // intencao, e o destaque perdia o significado se
                // fossem dois (ponto 19).
                state = SEGMENT_STATE.CURRENT;
            } else {
                state = SEGMENT_STATE.FUTURE;
            }

            segments.push({
                state: state,
                fromId: from.id,
                toId: to.id,
                latlngs: [[from.lat, from.lng], [to.lat, to.lng]]
            });
        }

        return segments;
    }

    /**
     * Agrupa os trocos por estado, para a interface desenhar UMA
     * polyline por estado em vez de uma por troco. Menos camadas,
     * menos trabalho para o Leaflet (ponto 41).
     */
    function groupSegments(segments) {
        const groups = {};

        asArray(segments).forEach(function (segment) {
            if (!groups[segment.state]) groups[segment.state] = [];
            groups[segment.state].push(segment.latlngs);
        });

        return groups;
    }

    // ==========================================================
    // Enquadramento
    // ==========================================================

    /**
     * Limites que contem todos os pontos indicados. Devolve null
     * quando nao ha pontos utilizaveis — quem chama decide se
     * mantem o enquadramento actual.
     */
    function boundsOf(points) {
        const usable = asArray(points).filter(hasCoords);
        if (!usable.length) return null;

        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        usable.forEach(function (point) {
            if (point.lat < minLat) minLat = point.lat;
            if (point.lat > maxLat) maxLat = point.lat;
            if (point.lng < minLng) minLng = point.lng;
            if (point.lng > maxLng) maxLng = point.lng;
        });

        return [[minLat, minLng], [maxLat, maxLng]];
    }

    const MapGeo = {
        // Distancias
        distance: distance,
        distanceBetween: distanceBetween,

        // Marcadores
        markerStateFor: markerStateFor,

        // Zonas
        zoneCluster: zoneCluster,
        zoneShape: zoneShape,
        zoneShapes: zoneShapes,

        // Jornada
        journeySegments: journeySegments,
        groupSegments: groupSegments,

        // Enquadramento
        boundsOf: boundsOf,

        // Constantes
        STATE: MARKER_STATE,
        SEGMENT: SEGMENT_STATE,
        ZONE_MIN_RADIUS: ZONE_MIN_RADIUS,
        ZONE_PADDING: ZONE_PADDING
    };

    return {
        MapGeo: MapGeo,
        MARKER_STATE: MARKER_STATE,
        SEGMENT_STATE: SEGMENT_STATE
    };
});
