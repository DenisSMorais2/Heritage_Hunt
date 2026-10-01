// ============================================================
// Heritage Hunt CV — Mapa de exploracao (interface)
//
// O mapa deixa de dizer "aqui estao os monumentos" e passa a
// dizer, num relance:
//
//   Estou aqui. Ja explorei estes. Estes faltam.
//   Estou quase a fechar esta zona. Vou aqui a seguir.
//
// O QUE ESTE FICHEIRO NAO FAZ:
//   - nao escolhe a proxima descoberta (pergunta ao engagement.js);
//   - nao faz contas de distancia nem de zonas (pergunta ao map.js);
//   - nao grava nada;
//   - nao cria um segundo mapa: a instancia do Leaflet e uma so, e
//     o ecra inteiro so muda a caixa a volta dela.
//
// SEM ROUTING. A linha da Jornada e a ordem narrativa dos
// monumentos, nao um caminho por ruas.
// ============================================================

const MapUI = (function () {
    'use strict';

    // Zoom a que o "Explorar" aterra num monumento: perto o
    // suficiente para se ver a rua, longe o suficiente para se
    // perceber o que esta a volta.
    const FOCUS_ZOOM = 17;

    // A revelacao de uma descoberta (pontos 28 e 29). Dentro dos
    // 400-900ms pedidos, e sem confetti: a celebracao ja aconteceu.
    const REVEAL_MS = 760;

    const handlers = {
        onOpenAlbum: null,
        onOpenMonument: null,
        onOpenMemories: null,
        // Analytics do "Explorar" da folha, reaproveitando o que ja existe
        onExploreClick: null
    };

    const sources = {
        getMonuments: function () { return []; },
        getZones: function () { return []; },
        getDiscoveredIds: function () { return []; },
        // Ordem do percurso (Journey.getSteps), para a linha
        getJourneyOrder: function () { return []; },
        // Engagement.getNextDiscovery() — NAO se reimplementa aqui
        getNextDiscovery: function () { return null; },
        // { lat, lng, precise } ou null
        getUserLocation: function () { return null; },
        // Data de descoberta de um monumento, quando existir
        getDiscoveredAt: function () { return null; }
    };

    let map = null;
    let elements = {};

    // Camadas reutilizadas, nunca recriadas (ponto 41)
    const layers = {
        zones: null,
        journey: null,
        monuments: null,
        user: null
    };

    // monumentId -> { marker, state }
    const markerIndex = {};
    let userMarker = null;
    let userHalo = null;

    // Monumento seleccionado no bottom sheet
    let selectedId = null;

    // Estado TRANSITORIO da revelacao (ponto 32): sabe-se que uma
    // descoberta acabou de acontecer, mostra-se uma vez, consome-se.
    // Nao vai para o Supabase nem para o localStorage — se a pessoa
    // fechar a app antes de ver, perdeu-se uma animacao e mais nada.
    let pendingReveal = null;

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function prefersReducedMotion() {
        return typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function safe(fn, fallback) {
        try {
            const value = fn();
            return value === undefined || value === null ? fallback : value;
        } catch (e) {
            // Uma camada que falha nao pode impedir o mapa de abrir
            // (ponto 58). Falha essa camada, o resto desenha.
            return fallback;
        }
    }

    function monuments() {
        return asArray(safe(sources.getMonuments, []));
    }

    function discoveredIds() {
        return asArray(safe(sources.getDiscoveredIds, []));
    }

    function findMonument(id) {
        return monuments().filter(function (m) { return m && m.id === id; })[0] || null;
    }

    function nextDiscovery() {
        return safe(sources.getNextDiscovery, null);
    }

    function userLocation() {
        const value = safe(sources.getUserLocation, null);
        if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number') return null;
        return value;
    }

    // Distancia em linha recta ate um monumento, ou null quando nao
    // ha localizacao fiavel. Nunca se pede a localizacao por causa
    // disto (ponto 49).
    function distanceTo(monument) {
        const here = userLocation();
        if (!here || !here.precise || !monument) return null;
        return MapGeo.distance(here.lat, here.lng, monument.lat, monument.lng);
    }

    // "650 m" / "1,2 km" — o mesmo formato do resto da app
    function formatDistance(metres) {
        if (typeof metres !== 'number' || !isFinite(metres)) return null;
        if (metres >= 1000) return (metres / 1000).toFixed(1).replace('.', ',') + ' km';
        return Math.round(metres) + ' m';
    }

    // "A cerca de 650 m" — o "cerca de" nao e modestia, e rigor:
    // isto e distancia geografica, nao distancia a andar (ponto 11).
    function approxDistanceText(metres) {
        const text = formatDistance(metres);
        return text ? t('map.approxDistance', { d: text }) : '';
    }

    // ==========================================================
    // Marcadores (pontos 1 a 7)
    //
    // Tudo em L.divIcon: HTML e CSS seguem o tema, escalam em ecras
    // retina e mudam de estado sem trocar de ficheiro. Nao ha um
    // unico PNG novo.
    //
    // Nenhum estado se distingue SO pela cor (ponto 48): cada um
    // tem o seu proprio icone.
    // ==========================================================
    const STATE_ICON = {
        discovered: 'fas fa-check',
        next: 'fas fa-location-arrow',
        undiscovered: 'fas fa-landmark'
    };

    function markerIcon(state) {
        const size = state === MapGeo.STATE.NEXT ? 46 : 34;
        const icon = STATE_ICON[state] || STATE_ICON.undiscovered;

        // O anel exterior so existe no NEXT: e o que lhe da o pulse
        // e o destaque sem precisar de piscar (ponto 4).
        const ring = state === MapGeo.STATE.NEXT
            ? '<span class="heritage-marker__ring" aria-hidden="true"></span>'
            : '';

        return L.divIcon({
            className: '',
            html: '<span class="heritage-marker heritage-marker--' + state + '">' +
                ring +
                '<span class="heritage-marker__body">' +
                    '<i class="' + icon + '" aria-hidden="true"></i>' +
                '</span>' +
            '</span>',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });
    }

    function userIcon() {
        return L.divIcon({
            className: '',
            html: '<span class="heritage-marker heritage-marker--user">' +
                '<span class="heritage-marker__halo" aria-hidden="true"></span>' +
                '<span class="heritage-marker__dot" aria-hidden="true"></span>' +
            '</span>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
    }

    // Cada estado no seu pane, e e o pane que resolve a hierarquia
    // do ponto 7 — nao um !important (ponto 43).
    function paneFor(state) {
        if (state === MapGeo.STATE.NEXT) return 'hhNextPane';
        return 'hhMonumentPane';
    }

    function labelFor(monument, state) {
        const zone = zoneNameOf(monument.id);
        const status = state === MapGeo.STATE.DISCOVERED
            ? t('map.discovered')
            : (state === MapGeo.STATE.NEXT ? t('map.nextDiscovery') : t('map.undiscovered'));

        return monument.name + (zone ? ', ' + zone : '') + '. ' + status;
    }

    function zoneNameOf(monumentId) {
        const zone = asArray(safe(sources.getZones, [])).filter(function (entry) {
            return entry && asArray(entry.monumentIds).indexOf(monumentId) !== -1;
        })[0];
        return zone ? zoneName(zone.id) : '';
    }

    // ==========================================================
    // Desenho das camadas
    // ==========================================================

    function renderMarkers() {
        if (!map || !layers.monuments) return;

        const discovered = discoveredIds();
        const next = nextDiscovery();
        const nextId = next ? next.monumentId : null;

        monuments().forEach(function (monument) {
            if (!monument || typeof monument.lat !== 'number') return;

            const state = MapGeo.markerStateFor(monument.id, discovered, nextId);
            const known = markerIndex[monument.id];

            // Ja existe: so se troca o que mudou. Recriar marcadores
            // a cada descoberta perdia o estado e piscava (ponto 21).
            if (known) {
                if (known.state !== state) {
                    known.state = state;
                    known.marker.setIcon(markerIcon(state));
                    // O pane e fixo depois de criado, por isso o
                    // destaque do NEXT vive no CSS, nao no pane.
                    known.marker.setZIndexOffset(state === MapGeo.STATE.NEXT ? 1000 : 0);
                }
                known.marker.setTooltipContent(labelFor(monument, state));
                return;
            }

            const marker = L.marker([monument.lat, monument.lng], {
                icon: markerIcon(state),
                pane: paneFor(state),
                zIndexOffset: state === MapGeo.STATE.NEXT ? 1000 : 0,
                keyboard: true,
                // Um marcador sem nome e um alfinete mudo para quem
                // usa leitor de ecra (ponto 48).
                alt: labelFor(monument, state),
                riseOnHover: true
            });

            marker.bindTooltip(labelFor(monument, state), {
                direction: 'top',
                offset: [0, -18],
                opacity: 0.95,
                className: 'heritage-tip'
            });

            // Sem popup branco do Leaflet: a folha e nossa (ponto 13)
            marker.on('click', function () {
                select(monument.id, { pan: true });
            });

            marker.addTo(layers.monuments);
            markerIndex[monument.id] = { marker: marker, state: state };
        });
    }

    function renderJourney() {
        if (!map || !layers.journey) return;

        layers.journey.clearLayers();

        const order = asArray(safe(sources.getJourneyOrder, []));
        if (order.length < 2) return;

        const next = nextDiscovery();
        const segments = MapGeo.journeySegments(
            order,
            discoveredIds(),
            next ? next.monumentId : null
        );

        const grouped = MapGeo.groupSegments(segments);

        // A linha fica ABAIXO dos marcadores e discreta de proposito:
        // e contexto, nao o assunto principal (ponto 20).
        const style = {
            completed: { color: '#D6B274', weight: 3, opacity: 0.85, dashArray: null },
            current:   { color: '#E7CE9A', weight: 4, opacity: 0.95, dashArray: '1 9' },
            future:    { color: '#7E93B4', weight: 2, opacity: 0.38, dashArray: '4 8' }
        };

        Object.keys(grouped).forEach(function (state) {
            const shape = style[state] || style.future;

            L.polyline(grouped[state], {
                pane: 'hhJourneyPane',
                color: shape.color,
                weight: shape.weight,
                opacity: shape.opacity,
                dashArray: shape.dashArray,
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false,
                className: 'heritage-journey heritage-journey--' + state
            }).addTo(layers.journey);
        });
    }

    function renderZones() {
        if (!map || !layers.zones) return;

        layers.zones.clearLayers();

        // Sem geometria real no projecto, o halo vem das coordenadas
        // dos proprios monumentos. E aproximado, e o dominio diz isso
        // em `isApproximate` (pontos 22 e 23).
        const shapes = MapGeo.zoneShapes(
            safe(sources.getZones, []),
            monuments(),
            discoveredIds()
        );

        shapes.forEach(function (shape) {
            const done = shape.isCompleted;

            L.circle([shape.center.lat, shape.center.lng], {
                pane: 'hhZonePane',
                radius: shape.radius,
                // Extremamente subtil (ponto 24): o mapa tem de
                // continuar legivel por baixo.
                color: done ? '#D6B274' : '#7E93B4',
                weight: 1,
                opacity: done ? 0.5 : 0.28,
                fillColor: done ? '#D6B274' : '#8FA8C8',
                fillOpacity: done ? 0.09 : 0.05,
                // O halo NAO apanha cliques: tocar num monumento tem
                // de continuar a tocar no monumento (ponto 27).
                interactive: false,
                className: 'heritage-zone' + (done ? ' is-complete' : '')
            }).addTo(layers.zones);

            const label = L.marker([shape.center.lat, shape.center.lng], {
                pane: 'hhZonePane',
                interactive: true,
                keyboard: false,
                icon: L.divIcon({
                    className: '',
                    html: '<span class="heritage-zone-label' + (done ? ' is-complete' : '') + '">' +
                        '<b>' + escapeHtml(zoneName(shape.zoneId)) + '</b>' +
                        '<span>' + shape.discovered + '/' + shape.total +
                            (done ? ' <i class="fas fa-check" aria-hidden="true"></i>' : '') +
                        '</span>' +
                    '</span>',
                    iconSize: [120, 34],
                    iconAnchor: [60, 17]
                })
            });

            label.on('click', function () { openZoneSheet(shape); });
            label.addTo(layers.zones);
        });
    }

    function renderUser() {
        if (!map || !layers.user) return;

        const here = userLocation();

        if (!here) {
            // Sem localizacao o mapa continua inteiro (ponto 49):
            // simplesmente nao ha ponto azul.
            if (userMarker) { layers.user.removeLayer(userMarker); userMarker = null; }
            if (userHalo) { layers.user.removeLayer(userHalo); userHalo = null; }
            return;
        }

        const latlng = [here.lat, here.lng];

        if (userMarker) {
            userMarker.setLatLng(latlng);
        } else {
            userMarker = L.marker(latlng, {
                pane: 'hhUserPane',
                icon: userIcon(),
                interactive: true,
                keyboard: false,
                alt: t('map.youAreHere')
            });
            userMarker.bindTooltip(t('map.youAreHere'), {
                direction: 'top',
                offset: [0, -14],
                className: 'heritage-tip'
            });
            userMarker.addTo(layers.user);
        }

        // O circulo de precisao so faz sentido quando a leitura e
        // precisa. Uma posicao aproximada com um circulo de 50 m
        // seria uma promessa que ninguem fez.
        if (here.precise) {
            if (userHalo) {
                userHalo.setLatLng(latlng);
            } else {
                userHalo = L.circle(latlng, {
                    pane: 'hhZonePane',
                    radius: 50,
                    interactive: false,
                    className: 'heritage-user-radius'
                }).addTo(layers.user);
            }
        } else if (userHalo) {
            layers.user.removeLayer(userHalo);
            userHalo = null;
        }
    }

    // ==========================================================
    // Bottom sheet (pontos 13 a 17)
    // ==========================================================
    function monumentSheetHtml(monument) {
        const discovered = discoveredIds().indexOf(monument.id) !== -1;
        const zone = zoneNameOf(monument.id);
        const metres = distanceTo(monument);
        const distanceText = approxDistanceText(metres);

        const when = discovered ? safe(function () {
            return sources.getDiscoveredAt(monument.id);
        }, null) : null;

        const status = discovered
            ? '<span class="hh-sheet__status is-found">' +
                  '<i class="fas fa-check" aria-hidden="true"></i> ' +
                  escapeHtml(t('map.discovered')) +
              '</span>'
            : '<span class="hh-sheet__status is-todo">' +
                  '<i class="fas fa-landmark" aria-hidden="true"></i> ' +
                  escapeHtml(t('map.undiscovered')) +
              '</span>';

        // Por descobrir, a fotografia leva um veu — mas o NOME fica
        // legivel: a pessoa precisa de saber para onde vai (ponto 16).
        const shot = '<div class="hh-sheet__shot' + (discovered ? '' : ' is-veiled') + '">' +
            '<img src="' + escapeHtml(monument.image || '') + '" alt=""' +
                ' onerror="this.src=\'imagens/placeholder.jpg\'; this.onerror=null;">' +
            (discovered ? '' : '<span class="hh-sheet__veil" aria-hidden="true">' +
                '<i class="fas fa-qrcode"></i></span>') +
        '</div>';

        const body = discovered
            ? '<p class="hh-sheet__desc">' + escapeHtml(monument.description || '') + '</p>'
            : '<p class="hh-sheet__desc">' + escapeHtml(t('map.undiscoveredHint')) + '</p>';

        const cta = discovered
            ? '<button type="button" class="hh-sheet__cta" data-map-action="album"' +
                  ' data-map-monument="' + escapeHtml(monument.id) + '">' +
                  '<i class="fas fa-images" aria-hidden="true"></i>' +
                  '<span>' + escapeHtml(t('map.openAlbum')) + '</span>' +
              '</button>'
            : '<button type="button" class="hh-sheet__cta" data-map-action="explore"' +
                  ' data-map-monument="' + escapeHtml(monument.id) + '">' +
                  '<i class="fas fa-compass" aria-hidden="true"></i>' +
                  '<span>' + escapeHtml(t('map.explore')) + '</span>' +
              '</button>';

        const meta = [];
        if (zone) meta.push(escapeHtml(zone));
        if (distanceText) meta.push(escapeHtml(distanceText));
        if (when) meta.push(escapeHtml(t('map.discoveredOn', { d: formatDate(when) })));

        return '' +
            shot +
            '<h3 class="hh-sheet__name" id="mapSheetTitle">' + escapeHtml(monument.name || '') + '</h3>' +
            (meta.length ? '<p class="hh-sheet__meta">' + meta.join(' · ') + '</p>' : '') +
            status +
            body +
            cta;
    }

    function formatDate(iso) {
        const date = new Date(iso);
        if (isNaN(date.getTime())) return '';
        try {
            return date.toLocaleDateString(currentLang(), { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return date.toISOString().slice(0, 10);
        }
    }

    function currentLang() {
        return (typeof state !== 'undefined' && state.settings && state.settings.lang) || 'pt';
    }

    function zoneSheetHtml(shape) {
        const done = shape.isCompleted;

        const note = done
            ? t('map.zoneCompleted')
            : (shape.remaining === 1
                ? t('engagement.almost.ZONE_ONE_LEFT', { zone: zoneName(shape.zoneId) })
                : t('engagement.almost.ZONE_FEW_LEFT', { n: shape.remaining, zone: zoneName(shape.zoneId) }));

        // O CTA leva ao que falta, ou ao que ja se guardou
        const remainingId = done ? null : firstUndiscoveredOf(shape.zoneId);

        const cta = done
            ? '<button type="button" class="hh-sheet__cta" data-map-action="memories">' +
                  '<i class="fas fa-images" aria-hidden="true"></i>' +
                  '<span>' + escapeHtml(t('map.reviewDiscoveries')) + '</span>' +
              '</button>'
            : (remainingId !== null
                ? '<button type="button" class="hh-sheet__cta" data-map-action="explore"' +
                      ' data-map-monument="' + escapeHtml(remainingId) + '">' +
                      '<i class="fas fa-compass" aria-hidden="true"></i>' +
                      '<span>' + escapeHtml(t('map.viewRemaining')) + '</span>' +
                  '</button>'
                : '');

        return '' +
            '<h3 class="hh-sheet__name" id="mapSheetTitle">' + escapeHtml(zoneName(shape.zoneId)) + '</h3>' +
            '<p class="hh-sheet__meta">' +
                escapeHtml(t('map.zoneProgress', { done: shape.discovered, total: shape.total })) +
            '</p>' +
            '<div class="hh-sheet__track" role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
                ' aria-valuenow="' + shape.percent + '">' +
                '<span style="width: ' + shape.percent + '%"></span>' +
            '</div>' +
            '<p class="hh-sheet__desc">' + escapeHtml(note) + '</p>' +
            // Honestidade sobre o que o halo e (ponto 23)
            '<p class="hh-sheet__approx">' + escapeHtml(t('map.zoneApprox')) + '</p>' +
            cta;
    }

    function firstUndiscoveredOf(zoneId) {
        const zone = asArray(safe(sources.getZones, [])).filter(function (entry) {
            return entry && entry.id === zoneId;
        })[0];
        if (!zone) return null;

        const discovered = discoveredIds();
        const id = asArray(zone.monumentIds).filter(function (entry) {
            return discovered.indexOf(entry) === -1;
        })[0];

        return id === undefined ? null : id;
    }

    function openSheet(html) {
        const sheet = elements.sheet;
        if (!sheet || !elements.sheetBody) return;

        elements.sheetBody.innerHTML = html;
        sheet.classList.remove('hidden');
        sheet.setAttribute('aria-hidden', 'false');

        // Duas folhas empilhadas nunca (ponto 55): e sempre a mesma,
        // com conteudo novo.
        //
        // A transicao arranca depois de um reflow FORCADO, e nao num
        // requestAnimationFrame: num separador em segundo plano o rAF
        // nao corre, e a folha ficava invisivel no ecra mas ja
        // anunciada ao leitor de ecra. Ler o offsetHeight obriga o
        // browser a assentar o estado fechado antes de o abrir.
        void sheet.offsetHeight;
        sheet.classList.add('is-open');

        bindSheet(sheet);

        if (elements.sheetClose) elements.sheetClose.focus();
    }

    function bindSheet(sheet) {
        sheet.querySelectorAll('[data-map-action]').forEach(function (button) {
            button.addEventListener('click', function () {
                const action = button.dataset.mapAction;
                const raw = button.dataset.mapMonument;
                const id = raw !== undefined && raw !== '' && !isNaN(Number(raw))
                    ? Number(raw) : raw;

                if (action === 'album') {
                    closeSheet();
                    if (handlers.onOpenAlbum) handlers.onOpenAlbum(id);
                    return;
                }

                if (action === 'memories') {
                    closeSheet();
                    if (handlers.onOpenMemories) handlers.onOpenMemories();
                    return;
                }

                if (action === 'explore') {
                    if (handlers.onExploreClick) handlers.onExploreClick(id);
                    explore(id);
                }
            });
        });
    }

    function select(monumentId, options) {
        const monument = findMonument(monumentId);
        if (!monument) return;

        selectedId = monumentId;
        highlightSelected();

        // Garantir que o marcador nao fica debaixo da folha
        if (options && options.pan && map) {
            map.panTo([monument.lat, monument.lng], { animate: !prefersReducedMotion() });
        }

        openSheet(monumentSheetHtml(monument));
    }

    function openZoneSheet(shape) {
        selectedId = null;
        highlightSelected();
        openSheet(zoneSheetHtml(shape));
    }

    function highlightSelected() {
        Object.keys(markerIndex).forEach(function (id) {
            const entry = markerIndex[id];
            const element = entry.marker.getElement();
            if (!element) return;
            const badge = element.querySelector('.heritage-marker');
            if (badge) badge.classList.toggle('is-selected', String(selectedId) === String(id));
        });
    }

    function closeSheet() {
        const sheet = elements.sheet;
        if (!sheet || sheet.classList.contains('hidden')) return;

        sheet.classList.remove('is-open');
        sheet.setAttribute('aria-hidden', 'true');
        selectedId = null;
        highlightSelected();

        // Espera a transicao antes de esconder, para nao saltar
        setTimeout(function () {
            if (!sheet.classList.contains('is-open')) sheet.classList.add('hidden');
        }, prefersReducedMotion() ? 0 : 220);
    }

    function isSheetOpen() {
        return !!elements.sheet && !elements.sheet.classList.contains('hidden');
    }

    // ==========================================================
    // Explorar (ponto 12)
    // ==========================================================
    function explore(monumentId) {
        const monument = findMonument(monumentId);
        if (!monument || !map) return;

        // A folha do monumento passa a ser a deste monumento, em vez
        // de se abrir outra por cima.
        selectedId = monumentId;

        const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);

        if (prefersReducedMotion()) {
            map.setView([monument.lat, monument.lng], zoom, { animate: false });
        } else {
            map.flyTo([monument.lat, monument.lng], zoom, { duration: 0.8 });
        }

        highlightSelected();
        openSheet(monumentSheetHtml(monument));
    }

    // ==========================================================
    // Revelacao apos descoberta (pontos 28 a 32)
    //
    // So corre quando o mapa esta mesmo visivel: durante a
    // celebracao o mapa esta escondido, e animar as escondidas era
    // gastar a animacao (ponto 31).
    // ==========================================================
    function markRevealed(monumentId) {
        pendingReveal = monumentId;
    }

    function isVisible() {
        const container = document.getElementById('map');
        return !!container && container.offsetParent !== null;
    }

    function playPendingReveal() {
        if (pendingReveal === null || pendingReveal === undefined) return;
        if (!isVisible()) return;

        const entry = markerIndex[pendingReveal];
        // Consumido de qualquer maneira: se o marcador nao existe,
        // nao se fica a espera dele para sempre (ponto 32).
        const id = pendingReveal;
        pendingReveal = null;

        if (!entry) return;

        const element = entry.marker.getElement();
        if (!element) return;

        const badge = element.querySelector('.heritage-marker');
        if (!badge) return;

        if (prefersReducedMotion()) {
            badge.classList.add('is-revealed');
            return;
        }

        badge.classList.add('is-revealing');
        setTimeout(function () {
            badge.classList.remove('is-revealing');
            badge.classList.add('is-revealed');
        }, REVEAL_MS);

        // Um toque de atencao no sitio certo, sem mexer no zoom
        if (map) {
            const monument = findMonument(id);
            if (monument) map.panTo([monument.lat, monument.lng], { animate: true });
        }
    }

    // ==========================================================
    // Cabecalho do progresso (ponto 37)
    // ==========================================================
    function renderProgress() {
        if (!elements.progress) return;

        const total = monuments().length;
        const done = discoveredIds().length;

        elements.progress.textContent = total ? done + '/' + total : '';
    }

    // ==========================================================
    // Criacao — UMA vez (pontos 33 e 41)
    // ==========================================================
    function create(containerId) {
        if (map) return map;

        map = L.map(containerId, {
            zoomControl: true,
            attributionControl: true
        }).setView([16.8907, -24.9874], 15);

        // A atribuicao do OpenStreetMap fica, sempre (ponto 39)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Panes proprios: a hierarquia do ponto 43 resolve-se aqui,
        // com z-index do Leaflet, e nao com !important no CSS.
        //
        //   tiles 200 · zonas 350 · jornada 390 · marcadores 600
        //   proxima 610 · utilizador 620 · tooltips 650
        map.createPane('hhZonePane').style.zIndex = 350;
        map.createPane('hhJourneyPane').style.zIndex = 390;
        map.createPane('hhMonumentPane').style.zIndex = 600;
        map.createPane('hhNextPane').style.zIndex = 610;
        map.createPane('hhUserPane').style.zIndex = 620;

        // As zonas e a jornada nunca apanham cliques: sao contexto
        map.getPane('hhZonePane').style.pointerEvents = 'none';
        map.getPane('hhJourneyPane').style.pointerEvents = 'none';

        layers.zones = L.layerGroup().addTo(map);
        layers.journey = L.layerGroup().addTo(map);
        layers.monuments = L.layerGroup().addTo(map);
        layers.user = L.layerGroup().addTo(map);

        // Tocar no mapa vazio fecha a folha, sem mexer no
        // enquadramento (ponto 56)
        map.on('click', function () { closeSheet(); });

        // A caixa que interessa e a que o CSS dimensiona, nao o
        // elemento do Leaflet: e ela que muda com o ecra.
        const container = map.getContainer();
        watchSize((container && container.parentElement) || container);

        return map;
    }

    function getMap() {
        return map;
    }

    // ==========================================================
    // Render completo — barato, e reutiliza tudo (ponto 21)
    // ==========================================================
    function render() {
        if (!map) return;

        // Cada camada falha sozinha: uma zona sem geometria ou uma
        // jornada que nao carregou nao impedem os marcadores de
        // aparecer (ponto 58).
        safe(renderZones, null);
        safe(renderJourney, null);
        safe(renderMarkers, null);
        safe(renderUser, null);
        safe(renderProgress, null);

        // A folha aberta acompanha o novo estado (um monumento que
        // acabou de ser descoberto muda de CTA)
        if (isSheetOpen() && selectedId !== null) {
            const monument = findMonument(selectedId);
            if (monument && elements.sheetBody) {
                elements.sheetBody.innerHTML = monumentSheetHtml(monument);
                bindSheet(elements.sheet);
            }
        }

        highlightSelected();
        safe(playPendingReveal, null);
    }

    function invalidate() {
        if (!map) return;

        // Sem centro guardado, `invalidateSize` reenquadra a partir do
        // canto: em ecras estreitos isso via-se como um salto.
        const center = map.getCenter();
        const zoom = map.getZoom();

        map.invalidateSize({ animate: false, pan: false });
        map.setView(center, zoom, { animate: false });
    }

    // ==========================================================
    // O Leaflet nao percebe que a caixa mudou de tamanho
    //
    // E ele que decide quantas tiles desenhar, e essa conta e feita
    // UMA vez, com a medida que a caixa tinha no arranque. Tudo o
    // que mude essa medida depois — rodar o telemovel, a barra do
    // browser a recolher no scroll (que mexe em `dvh`), entrar e
    // sair do ecra inteiro, um teclado a abrir — deixava o mapa com
    // as tiles do tamanho antigo: faixas cinzentas de um lado e
    // imagem cortada do outro.
    //
    // Um observador da PROPRIA caixa apanha as quatro causas de uma
    // vez, e so reage quando a medida mudou mesmo.
    // ==========================================================
    let sizeObserver = null;
    let lastBox = { width: 0, height: 0 };
    let resizeFrame = null;

    function watchSize(container) {
        if (!container || typeof ResizeObserver !== 'function') return;
        if (sizeObserver) sizeObserver.disconnect();

        sizeObserver = new ResizeObserver(function (entries) {
            const rect = entries[0] && entries[0].contentRect;
            if (!rect) return;

            // Meio pixel de arredondamento nao e uma mudanca de caixa
            const changed = Math.abs(rect.width - lastBox.width) > 1 ||
                Math.abs(rect.height - lastBox.height) > 1;
            if (!changed) return;

            lastBox = { width: rect.width, height: rect.height };

            // Uma medida por frame: durante uma rotacao o observador
            // dispara varias vezes, e o Leaflet so precisa da ultima.
            if (resizeFrame) cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(function () {
                resizeFrame = null;
                invalidate();
            });
        });

        sizeObserver.observe(container);
    }

    // ==========================================================
    // Arranque
    // ==========================================================
    function init(options) {
        const config = options || {};

        Object.keys(sources).forEach(function (key) {
            if (typeof config[key] === 'function') sources[key] = config[key];
        });

        handlers.onOpenAlbum = config.onOpenAlbum || null;
        handlers.onOpenMonument = config.onOpenMonument || null;
        handlers.onOpenMemories = config.onOpenMemories || null;
        handlers.onExploreClick = config.onExploreClick || null;

        elements = {
            sheet: document.getElementById('mapSheet'),
            sheetBody: document.getElementById('mapSheetBody'),
            sheetClose: document.getElementById('mapSheetClose'),
            progress: document.getElementById('mapProgressCount')
        };

        if (elements.sheetClose) {
            elements.sheetClose.addEventListener('click', closeSheet);

            // Arrastar a pega para baixo fecha, como nas outras
            // folhas. Aqui o toque FORA continua a nao fechar, de
            // proposito: o fundo e o mapa, e ele tem de continuar a
            // responder ao dedo (ponto 13).
            if (typeof Sheets !== 'undefined') Sheets.enableDrag(elements.sheet, closeSheet);
        }

        if (elements.sheet) {
            // Tocar fora da folha fecha-a, como nos restantes modais.
            // O arrastar NUNCA e a unica forma de fechar (ponto 17).
            elements.sheet.addEventListener('click', function (event) {
                if (event.target === elements.sheet) closeSheet();
            });
        }

        // Esc fecha a folha antes de fechar o ecra inteiro: a folha
        // esta por cima, por isso e ela que responde primeiro.
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isSheetOpen()) {
                event.stopPropagation();
                closeSheet();
            }
        }, true);
    }

    return {
        init: init,
        create: create,
        getMap: getMap,
        render: render,
        invalidate: invalidate,

        select: select,
        explore: explore,
        closeSheet: closeSheet,
        isSheetOpen: isSheetOpen,

        markRevealed: markRevealed,

        // Expostos para os testes e para a consola
        formatDistance: formatDistance
    };
})();
