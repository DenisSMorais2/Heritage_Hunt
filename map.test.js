// ============================================================
// Heritage Hunt CV — testes da geometria do mapa
//
//   node map.test.js
// ============================================================

const { MapGeo, MARKER_STATE, SEGMENT_STATE } = require('./map.js');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('  ✓ ' + name);
    } catch (error) {
        failed++;
        failures.push({ name, error });
        console.log('  ✗ ' + name + '\n      ' + error.message);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'asserção falhou');
}

function assertEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error((label || 'valor') + ': esperado ' + JSON.stringify(expected) +
            ', obtido ' + JSON.stringify(actual));
    }
}

function assertNear(actual, expected, tolerance, label) {
    if (typeof actual !== 'number' || Math.abs(actual - expected) > tolerance) {
        throw new Error((label || 'valor') + ': esperado ~' + expected +
            ' (±' + tolerance + '), obtido ' + actual);
    }
}

// --- Dados reais do projecto (script.js) --------------------

const MONUMENTS = [
    { id: 1,  name: 'Palácio do Povo',       lat: 16.8909, lng: -24.9878 },
    { id: 2,  name: 'Farol de D. Amélia',    lat: 16.8925, lng: -24.9892 },
    { id: 3,  name: 'Mercado Municipal',     lat: 16.8883, lng: -24.9847 },
    { id: 4,  name: 'Igreja N. S. da Luz',   lat: 16.8912, lng: -24.9865 },
    { id: 5,  name: 'Torre de Belém',        lat: 16.8931, lng: -24.9883 },
    { id: 6,  name: 'Edifício da Alfândega', lat: 16.8876, lng: -24.9859 },
    { id: 7,  name: 'Casa da Morna',         lat: 16.8902, lng: -24.9871 },
    { id: 8,  name: 'Praça Nova',            lat: 16.8895, lng: -24.9868 },
    { id: 9,  name: 'Centro de Artesanato',  lat: 16.8928, lng: -24.9886 },
    { id: 10, name: 'Casa da Cultura',       lat: 16.8918, lng: -24.9874 },
    { id: 11, name: 'Porto de Mindelo',      lat: 16.8867, lng: -24.9839 },
    { id: 12, name: 'Fortim d\'El Rei',      lat: 16.8942, lng: -24.9895 }
];

const ZONES = [
    { id: 'centro_historico', monumentIds: [1, 3, 4, 8] },
    { id: 'frente_mar',       monumentIds: [5, 6, 11] },
    { id: 'colinas',          monumentIds: [2, 12] },
    { id: 'cultura_viva',     monumentIds: [7, 9, 10] }
];

// A ordem do percurso: zonas pela ordem da jornada, monumentos
// pela ordem de cada zona
const JOURNEY_ORDER = [1, 3, 4, 8, 5, 6, 11, 2, 12, 7, 9, 10]
    .map(id => MONUMENTS.filter(m => m.id === id)[0]);

function byId(id) {
    return MONUMENTS.filter(m => m.id === id)[0];
}

// ============================================================
console.log('\nDISTÂNCIA — em linha recta, e só isso\n');
// ============================================================

test('Haversine devolve metros entre dois monumentos', () => {
    const metres = MapGeo.distance(16.8909, -24.9878, 16.8883, -24.9847);
    // ~420 m entre o Palácio do Povo e o Mercado Municipal
    assertNear(metres, 420, 60, 'distância');
});

test('a distância de um ponto a si próprio é zero', () => {
    assertEqual(MapGeo.distance(16.89, -24.98, 16.89, -24.98), 0, 'distância');
});

test('a distância é simétrica', () => {
    const ida = MapGeo.distance(16.8909, -24.9878, 16.8942, -24.9895);
    const volta = MapGeo.distance(16.8942, -24.9895, 16.8909, -24.9878);
    assertNear(ida, volta, 0.0001, 'simetria');
});

test('coordenadas em falta devolvem null, nunca zero', () => {
    // Devolver 0 seria dizer "estás mesmo em cima", e isso é pior
    // do que não dizer nada.
    assertEqual(MapGeo.distance(null, -24.98, 16.89, -24.98), null, 'lat em falta');
    assertEqual(MapGeo.distance(16.89, undefined, 16.89, -24.98), null, 'lng em falta');
    assertEqual(MapGeo.distance('16.89', -24.98, 16.89, -24.98), null, 'lat em texto');
    assertEqual(MapGeo.distance(NaN, -24.98, 16.89, -24.98), null, 'NaN');
});

test('distanceBetween ignora monumentos sem coordenadas', () => {
    assertEqual(MapGeo.distanceBetween(byId(1), { id: 99 }), null, 'sem coordenadas');
    assertEqual(MapGeo.distanceBetween(null, byId(1)), null, 'sem monumento');
    assert(MapGeo.distanceBetween(byId(1), byId(3)) > 0, 'com coordenadas');
});

// ============================================================
console.log('\nESTADO DOS MARCADORES\n');
// ============================================================

test('descoberto, próximo e por descobrir', () => {
    assertEqual(MapGeo.markerStateFor(1, [1, 3], 8), MARKER_STATE.DISCOVERED, 'descoberto');
    assertEqual(MapGeo.markerStateFor(8, [1, 3], 8), MARKER_STATE.NEXT, 'próximo');
    assertEqual(MapGeo.markerStateFor(4, [1, 3], 8), MARKER_STATE.UNDISCOVERED, 'por descobrir');
});

test('um monumento descoberto nunca é a próxima descoberta', () => {
    // Defensivo: mesmo que alguém indique um id já descoberto como
    // "próximo", o estado descoberto ganha.
    assertEqual(MapGeo.markerStateFor(1, [1], 1), MARKER_STATE.DISCOVERED, 'estado');
});

test('sem próxima descoberta ninguém fica destacado', () => {
    assertEqual(MapGeo.markerStateFor(8, [1], null), MARKER_STATE.UNDISCOVERED, 'null');
    assertEqual(MapGeo.markerStateFor(8, [1], undefined), MARKER_STATE.UNDISCOVERED, 'undefined');
});

test('só UM marcador pode estar em NEXT', () => {
    const discovered = [1, 3];
    const nextId = 4;

    const destacados = MONUMENTS.filter(m =>
        MapGeo.markerStateFor(m.id, discovered, nextId) === MARKER_STATE.NEXT
    );

    assertEqual(destacados.length, 1, 'marcadores destacados');
    assertEqual(destacados[0].id, 4, 'monumento');
});

// ============================================================
console.log('\nZONAS — halo aproximado, nunca fronteira inventada\n');
// ============================================================

test('o halo vem das coordenadas dos próprios monumentos', () => {
    const cluster = MapGeo.zoneCluster([byId(1), byId(3), byId(4), byId(8)]);

    assert(cluster !== null, 'devia haver cluster');
    // O centro cai entre os quatro monumentos
    assert(cluster.center.lat > 16.888 && cluster.center.lat < 16.892, 'latitude do centro');
    assert(cluster.center.lng > -24.988 && cluster.center.lng < -24.984, 'longitude do centro');
    assertEqual(cluster.count, 4, 'monumentos');
});

test('o halo declara-se aproximado', () => {
    // A app não tem geometria de zonas. Quem desenhar isto tem de
    // saber que não é um limite oficial.
    const cluster = MapGeo.zoneCluster([byId(1), byId(3)]);
    assertEqual(cluster.isApproximate, true, 'isApproximate');
});

test('o raio envolve o monumento mais afastado', () => {
    const points = [byId(1), byId(3), byId(4), byId(8)];
    const cluster = MapGeo.zoneCluster(points);

    points.forEach(point => {
        const metres = MapGeo.distance(
            cluster.center.lat, cluster.center.lng, point.lat, point.lng
        );
        assert(metres <= cluster.radius,
            point.name + ' fica fora do halo (' + Math.round(metres) + ' > ' + cluster.radius + ')');
    });
});

test('uma zona de um só monumento recebe o raio mínimo', () => {
    const cluster = MapGeo.zoneCluster([byId(1)]);
    assertEqual(cluster.radius, MapGeo.ZONE_MIN_RADIUS, 'raio');
});

test('uma zona sem monumentos não produz geometria', () => {
    assertEqual(MapGeo.zoneCluster([]), null, 'lista vazia');
    assertEqual(MapGeo.zoneCluster(null), null, 'null');
});

test('monumentos sem coordenadas são ignorados, não partem o halo', () => {
    const cluster = MapGeo.zoneCluster([byId(1), { id: 99 }, byId(3), { id: 98, lat: 'x', lng: 2 }]);
    assertEqual(cluster.count, 2, 'monumentos contados');
});

test('progresso da zona: 3 / 4 no Centro Histórico', () => {
    const shapes = MapGeo.zoneShapes(ZONES, MONUMENTS, [1, 3, 4]);
    const centro = shapes.filter(z => z.zoneId === 'centro_historico')[0];

    assertEqual(centro.total, 4, 'total');
    assertEqual(centro.discovered, 3, 'descobertos');
    assertEqual(centro.remaining, 1, 'a faltar');
    assertEqual(centro.percent, 75, 'percentagem');
    assertEqual(centro.isCompleted, false, 'concluída');
});

test('progresso da zona: 4 / 4 conclui', () => {
    const shapes = MapGeo.zoneShapes(ZONES, MONUMENTS, [1, 3, 4, 8]);
    const centro = shapes.filter(z => z.zoneId === 'centro_historico')[0];

    assertEqual(centro.discovered, 4, 'descobertos');
    assertEqual(centro.percent, 100, 'percentagem');
    assertEqual(centro.isCompleted, true, 'concluída');
});

test('as quatro zonas do projecto produzem geometria', () => {
    const shapes = MapGeo.zoneShapes(ZONES, MONUMENTS, []);
    assertEqual(shapes.length, 4, 'zonas desenhadas');
    shapes.forEach(shape => {
        assert(shape.radius > 0, shape.zoneId + ' sem raio');
        assertEqual(shape.isApproximate, true, shape.zoneId + ' devia ser aproximada');
    });
});

test('uma zona cujos monumentos não existem é omitida, sem quebrar', () => {
    const zones = ZONES.concat([{ id: 'fantasma', monumentIds: [900, 901] }]);
    const shapes = MapGeo.zoneShapes(zones, MONUMENTS, []);

    assertEqual(shapes.length, 4, 'zonas desenhadas');
    assertEqual(shapes.filter(z => z.zoneId === 'fantasma').length, 0, 'zona fantasma');
});

// ============================================================
console.log('\nLINHA DA JORNADA — ordem narrativa, não uma rota\n');
// ============================================================

test('12 monumentos dão 11 troços', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [], null);
    assertEqual(segments.length, 11, 'troços');
});

test('cada troço liga dois pontos consecutivos do percurso', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [], null);

    segments.forEach((segment, i) => {
        assertEqual(segment.fromId, JOURNEY_ORDER[i].id, 'origem do troço ' + i);
        assertEqual(segment.toId, JOURNEY_ORDER[i + 1].id, 'destino do troço ' + i);
        assertEqual(segment.latlngs.length, 2, 'pontos do troço ' + i);
    });
});

test('entre dois descobertos o troço está concluído', () => {
    // 1 e 3 são os dois primeiros do percurso
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [1, 3], 4);
    assertEqual(segments[0].state, SEGMENT_STATE.COMPLETED, 'primeiro troço');
});

test('o troço que toca a próxima descoberta é o actual', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [1, 3], 4);
    // 3 -> 4 é o segundo troço, e o 4 é a próxima descoberta
    assertEqual(segments[1].state, SEGMENT_STATE.CURRENT, 'segundo troço');
});

test('o resto fica em futuro', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [1, 3], 4);
    const futuros = segments.filter(s => s.state === SEGMENT_STATE.FUTURE);
    assertEqual(futuros.length, 9, 'troços futuros');
});

test('o troço que SAI da próxima descoberta ainda é futuro', () => {
    // 3 -> 4 chega ao próximo (actual); 4 -> 8 sai dele. Destacar os
    // dois diluía o destaque e apontava para dois sítios ao mesmo
    // tempo.
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [1, 3], 4);

    assertEqual(segments[1].state, SEGMENT_STATE.CURRENT, 'troço que chega');
    assertEqual(segments[2].state, SEGMENT_STATE.FUTURE, 'troço que sai');

    const actuais = segments.filter(s => s.state === SEGMENT_STATE.CURRENT);
    assertEqual(actuais.length, 1, 'só um troço em destaque');
});

test('a primeira descoberta não tem troço que lhe chegue', () => {
    // 0/12 com o primeiro do percurso como próximo: nada foi andado,
    // por isso nada está "em curso" — é tudo futuro, e é honesto.
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [], 1);
    assertEqual(segments.filter(s => s.state === SEGMENT_STATE.CURRENT).length, 0, 'troços actuais');
});

test('a jornada completa tem todos os troços concluídos', () => {
    const all = MONUMENTS.map(m => m.id);
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, all, null);

    assertEqual(segments.filter(s => s.state === SEGMENT_STATE.COMPLETED).length, 11, 'concluídos');
});

test('a jornada vazia não tem troço concluído nenhum', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [], 1);
    assertEqual(segments.filter(s => s.state === SEGMENT_STATE.COMPLETED).length, 0, 'concluídos');
});

test('menos de dois pontos não desenham linha', () => {
    assertEqual(MapGeo.journeySegments([byId(1)], [], null).length, 0, 'um ponto');
    assertEqual(MapGeo.journeySegments([], [], null).length, 0, 'nenhum ponto');
    assertEqual(MapGeo.journeySegments(null, [], null).length, 0, 'null');
});

test('pontos sem coordenadas não partem a linha', () => {
    const order = [byId(1), { id: 99 }, byId(3)];
    const segments = MapGeo.journeySegments(order, [], null);

    // O ponto sem coordenadas sai, e os dois válidos ligam-se
    assertEqual(segments.length, 1, 'troços');
    assertEqual(segments[0].fromId, 1, 'origem');
    assertEqual(segments[0].toId, 3, 'destino');
});

test('os troços agrupam-se por estado, uma polyline por estado', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [1, 3], 4);
    const grouped = MapGeo.groupSegments(segments);

    assertEqual(Object.keys(grouped).sort().join(','), 'completed,current,future', 'grupos');
    assertEqual(grouped.completed.length, 1, 'concluídos');
    assertEqual(grouped.current.length, 1, 'actuais');
    assertEqual(grouped.future.length, 9, 'futuros');
});

test('um troço é um par de coordenadas, pronto para o Leaflet', () => {
    const segments = MapGeo.journeySegments(JOURNEY_ORDER, [], null);
    const first = segments[0].latlngs;

    assertEqual(first[0][0], JOURNEY_ORDER[0].lat, 'lat de origem');
    assertEqual(first[0][1], JOURNEY_ORDER[0].lng, 'lng de origem');
    assertEqual(first[1][0], JOURNEY_ORDER[1].lat, 'lat de destino');
});

// ============================================================
console.log('\nENQUADRAMENTO\n');
// ============================================================

test('os limites contêm todos os monumentos', () => {
    const bounds = MapGeo.boundsOf(MONUMENTS);
    const [[minLat, minLng], [maxLat, maxLng]] = bounds;

    MONUMENTS.forEach(m => {
        assert(m.lat >= minLat && m.lat <= maxLat, m.name + ' fora em latitude');
        assert(m.lng >= minLng && m.lng <= maxLng, m.name + ' fora em longitude');
    });
});

test('sem pontos utilizáveis não há limites', () => {
    assertEqual(MapGeo.boundsOf([]), null, 'lista vazia');
    assertEqual(MapGeo.boundsOf([{ id: 1 }]), null, 'sem coordenadas');
    assertEqual(MapGeo.boundsOf(null), null, 'null');
});

// ============================================================
console.log('');
console.log('─'.repeat(52));
console.log('  ' + passed + ' passaram, ' + failed + ' falharam');
console.log('─'.repeat(52));

if (failed) {
    console.log('\nFalhas:');
    failures.forEach(f => console.log('  • ' + f.name + '\n    ' + f.error.message));
    process.exit(1);
}
