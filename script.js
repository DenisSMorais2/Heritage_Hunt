// App state
const state = {
    user: null,
    points: 0,
    scannedMonuments: [],
    qrScanner: null,
    currentMonumentForMap: null,
    userLocation: null,
    userLocationIsPrecise: false,
    userLocationMarker: null,
    userLocationCircle: null,
    currentMonumentForPhotos: null,
    monumentTagsDraft: [],
    cameraStream: null,
    settings: null,
    monuments: [
        {
            id: 1,
            name: "Palácio do Povo",
            description: "Antigo palácio do governo colonial, construído em 1874, hoje serve como centro cultural e um dos símbolos mais importantes da história de Cabo Verde.",
            points: 50,
            lat: 16.8909,
            lng: -24.9878,
            image: "imagens/palacio_do_povo.jpg",
            qrCode: "PALACIO_POVO_CV"
        },
        {
            id: 2,
            name: "Farol de D. Amélia",
            description: "Farol histórico construído em 1886, oferece uma vista panorâmica deslumbrante da cidade e do porto de Mindelo.",
            points: 40,
            lat: 16.8925,
            lng: -24.9892,
            image: "imagens/farol_dona_amelia.jpg",
            qrCode: "FAROL_DONA_AMELIA_CV"
        },
        {
            id: 3,
            name: "Mercado Municipal",
            description: "Centro de comércio tradicional com arquitetura única, onde se encontra desde frutas tropicais até artesanato local.",
            points: 30,
            lat: 16.8883,
            lng: -24.9847,
            image: "imagens/mercado_municipal.jpg",
            qrCode: "MERCADO_MUNICIPAL_CV"
        },
        {
            id: 4,
            name: "Igreja Nossa Senhora da Luz",
            description: "Igreja histórica no centro da cidade, construída no século XIX, com fachada em estilo colonial português.",
            points: 45,
            lat: 16.8912,
            lng: -24.9865,
            image: "imagens/igreja_nossa_senhora_luz.jpg",
            qrCode: "IGREJA_NSA_LUZ_CV"
        },
        {
            id: 5,
            name: "Torre de Belém (Réplica)",
            description: "Pequena réplica do famoso monumento de Lisboa, símbolo da ligação histórica entre Cabo Verde e Portugal.",
            points: 35,
            lat: 16.8931,
            lng: -24.9883,
            image: "imagens/torre_belem.jpg",
            qrCode: "TORRE_BELEM_CV"
        },
        {
            id: 6,
            name: "Edifício da Alfândega",
            description: "Antigo edifício da alfândega com arquitetura colonial, testemunha do importante passado comercial de Mindelo.",
            points: 30,
            lat: 16.8876,
            lng: -24.9859,
            image: "imagens/edificio_alfandega.jpeg",
            qrCode: "ALFANDEGA_CV"
        },
        {
            id: 7,
            name: "Casa da Morna",
            description: "Museu dedicado à morna, música tradicional de Cabo Verde, onde se homenageia Cesária Évora e outros artistas.",
            points: 40,
            lat: 16.8902,
            lng: -24.9871,
            image: "imagens/casa_da_morna.jpg",
            qrCode: "CASA_MORNA_CV"
        },
        {
            id: 8,
            name: "Praça Nova",
            description: "Principal praça da cidade com coreto histórico, local de encontro e eventos culturais ao ar livre.",
            points: 25,
            lat: 16.8895,
            lng: -24.9868,
            image: "imagens/praca_nova.jpg",
            qrCode: "PRACA_NOVA_CV"
        },
        {
            id: 9,
            name: "Centro Nacional de Artesanato",
            description: "Exposição do melhor artesanato cabo-verdiano, desde cerâmica a tecidos coloridos com técnicas tradicionais.",
            points: 35,
            lat: 16.8928,
            lng: -24.9886,
            image: "imagens/centro_artesanato.jpg",
            qrCode: "ARTESANATO_CV"
        },
        {
            id: 10,
            name: "Casa da Cultura",
            description: "Importante centro cultural de Mindelo que promove exposições, concertos e eventos literários durante todo o ano.",
            points: 40,
            lat: 16.8918,
            lng: -24.9874,
            image: "imagens/casa_da_cultura.png",
            qrCode: "CASA_CULTURA_CV"
        },
        {
            id: 11,
            name: "Porto de Mindelo",
            description: "Porto histórico que foi crucial para o desenvolvimento da cidade, ponto de parada de navios transatlânticos no século XIX.",
            points: 50,
            lat: 16.8867,
            lng: -24.9839,
            image: "imagens/porto_mindelo.jpg",
            qrCode: "PORTO_MINDELO_CV"
        },
        {
            id: 12,
            name: "Fortim d'El Rei",
            description: "Antigo forte que protegia a baía de Mindelo, construído no século XVIII, hoje oferece vistas espetaculares do oceano.",
            points: 45,
            lat: 16.8942,
            lng: -24.9895,
            image: "imagens/fortim_el_rei.jpg",
            qrCode: "FORTIM_EL_REI_CV"
        }
    ],
    badges: [
        {
            id: 1,
            name: "Explorador Iniciante",
            description: "Descobriu 25% dos monumentos!",
            threshold: 25,
            icon: "fas fa-compass",
            color: "bg-gradient-to-br from-amber-200 to-amber-300",
            iconColor: "text-amber-600",
            unlocked: false,
            message: "Você está no caminho certo, pequeno explorador! Mindelo está começando a revelar seus segredos para você! 🌟"
        },
        {
            id: 2,
            name: "Aventureiro Intermediário",
            description: "Descobriu 50% dos monumentos!",
            threshold: 50,
            icon: "fas fa-map-marked-alt",
            color: "bg-gradient-to-br from-blue-200 to-blue-300",
            iconColor: "text-blue-600",
            unlocked: false,
            message: "Metade do caminho percorrido! Você já conhece Mindelo melhor que muitos turistas! 🗺️"
        },
        {
            id: 3,
            name: "Mestre Explorador",
            description: "Descobriu 75% dos monumentos!",
            threshold: 75,
            icon: "fas fa-trophy",
            color: "bg-gradient-to-br from-purple-200 to-purple-300",
            iconColor: "text-purple-600",
            unlocked: false,
            message: "Uau! Você quase conhece Mindelo melhor que os locais! Só mais um esforço para se tornar uma lenda! 🏆"
        },
        {
            id: 4,
            name: "Lenda de Mindelo",
            description: "Descobriu todos os monumentos!",
            threshold: 100,
            icon: "fas fa-crown",
            color: "bg-gradient-to-br from-yellow-200 to-yellow-300",
            iconColor: "text-yellow-600",
            unlocked: false,
            message: "Parabéns! Você conquistou Mindelo como um verdadeiro herói cultural! Agora você é um embaixador da história desta bela cidade! 👑"
        }
    ],
    // Zonas de exploracao. Descobrir todos os monumentos de uma zona
    // vale XP_CONFIG.ZONE_COMPLETED.amount, uma unica vez.
    zones: [
        { id: 'centro_historico', monumentIds: [1, 3, 4, 8] },
        { id: 'frente_mar', monumentIds: [5, 6, 11] },
        { id: 'colinas', monumentIds: [2, 12] },
        { id: 'cultura_viva', monumentIds: [7, 9, 10] }
    ]
};

// DOM elements
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const openRankingBtn = document.getElementById('openRankingBtn');
const rankingOptInToggle = document.getElementById('rankingOptInToggle');
const rankingView = document.getElementById('rankingView');
const appHeader = document.getElementById('appHeader');
const navRanking = document.getElementById('navRanking');

// Main app elements
const scannerView = document.getElementById('scannerView');
const profileView = document.getElementById('profileView');
const mapView = document.getElementById('mapView');
const settingsView = document.getElementById('settingsView');
const startScannerBtn = document.getElementById('startScannerBtn');
const closeScannerBtn = document.getElementById('closeScannerBtn');
const torchBtn = document.getElementById('torchBtn');
const scannerVideo = document.getElementById('scannerVideo');
const scannerOverlay = document.getElementById('scannerOverlay');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const badgesContainer = document.getElementById('badgesContainer');
const monumentsScanned = document.getElementById('monumentsScanned');
const totalMonuments = document.getElementById('totalMonuments');
const totalPoints = document.getElementById('totalPoints');
const totalPointsHeader = document.getElementById('totalPointsHeader');
const discoveredMonumentsList = document.getElementById('discoveredMonumentsList');
const monumentsList = document.getElementById('monumentsList');
const navScanner = document.getElementById('navScanner');
const navProfile = document.getElementById('navProfile');
const navMap = document.getElementById('navMap');
const settingsBtn = document.getElementById('settingsBtn');
const userName = document.getElementById('userName');
const profileUserName = document.getElementById('profileUserName');
const userEmail = document.getElementById('userEmail');
const badgesEarned = document.getElementById('badgesEarned');

// Profile photo elements
const profilePhotoContainer = document.getElementById('profilePhotoContainer');
const profilePhoto = document.getElementById('profilePhoto');
const profileIcon = document.getElementById('profileIcon');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const photoInput = document.getElementById('photoInput');

// Settings elements
const themeSelector = document.getElementById('themeSelector');
const themeOptions = document.querySelectorAll('.theme-option');
const languageOptions = document.querySelectorAll('.lang-option');
const achievementAlertsToggle = document.getElementById('achievementAlertsToggle');
const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');

// Badge modal elements
const badgeModal = document.getElementById('badgeModal');
const badgeIcon = document.getElementById('badgeIcon');
const badgeTitle = document.getElementById('badgeTitle');
const badgeDescription = document.getElementById('badgeDescription');
const badgeMessage = document.getElementById('badgeMessage');
const closeBadgeModal = document.getElementById('closeBadgeModal');

// Achievement modal elements
const achievementModal = document.getElementById('achievementModal');
const achievementIcon = document.getElementById('achievementIcon');
const achievementTitle = document.getElementById('achievementTitle');
const achievementDescription = document.getElementById('achievementDescription');
const achievementMessage = document.getElementById('achievementMessage');
const closeAchievementModal = document.getElementById('closeAchievementModal');

// Monument modal elements
const monumentModal = document.getElementById('monumentModal');
const monumentModalImage = document.getElementById('monumentModalImage');
const monumentModalName = document.getElementById('monumentModalName');
const monumentModalDescription = document.getElementById('monumentModalDescription');
const monumentModalPoints = document.getElementById('monumentModalPoints');
const closeMonumentModal = document.getElementById('closeMonumentModal');
const monumentLocation = document.getElementById('monumentLocation');
const locateUserBtn = document.getElementById('locateUserBtn');

// Monument Photos Modal elements
const monumentPhotosModal = document.getElementById('monumentPhotosModal');
const monumentPhotosImage = document.getElementById('monumentPhotosImage');
const monumentPhotosName = document.getElementById('monumentPhotosName');
const closeMonumentPhotosModal = document.getElementById('closeMonumentPhotosModal');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const photoUploadInput = document.getElementById('photoUploadInput');
const monumentNote = document.getElementById('monumentNote');
const monumentNoteText = document.getElementById('monumentNoteText');
const editNoteBtn = document.getElementById('editNoteBtn');
const editNoteBtnLabel = document.getElementById('editNoteBtnLabel');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const userPhotosGrid = document.getElementById('userPhotosGrid');
const monumentPageLocation = document.getElementById('monumentPageLocation');
const monumentPagePoints = document.getElementById('monumentPagePoints');
const monumentPagePhotoCount = document.getElementById('monumentPagePhotoCount');
const monumentPageVisit = document.getElementById('monumentPageVisit');
const monumentPageAlbumCount = document.getElementById('monumentPageAlbumCount');
const monumentPageTags = document.getElementById('monumentPageTags');

// Pagina do monumento: limite do album e etiquetas disponiveis
const MONUMENT_PHOTO_LIMIT = 10;
const MEMORY_TAGS = [
    { id: 'architecture', icon: 'fas fa-landmark', key: 'tagArchitecture' },
    { id: 'historicCenter', icon: 'fas fa-map-marker-alt', key: 'tagHistoricCenter' },
    { id: 'memorable', icon: 'fas fa-heart', key: 'tagMemorable' },
    { id: 'comeBack', icon: 'fas fa-undo', key: 'tagComeBack' }
];
let noteEditing = false;

// XP
const monumentPageXpChip = document.getElementById('monumentPageXpChip');
const monumentPagePhotoXp = document.getElementById('monumentPagePhotoXp');
const monumentPageExperienceXp = document.getElementById('monumentPageExperienceXp');
const zonesSubtitle = document.getElementById('zonesSubtitle');

// Uma experiencia so vale XP se tiver mesmo conteudo (ponto 13)
const MIN_EXPERIENCE_LENGTH = 10;

// Camera Modal elements
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const closeCameraModal = document.getElementById('closeCameraModal');
const capturePhotoBtn = document.getElementById('capturePhotoBtn');

// Initialize map
let map;
let markers = [];

function initMap() {
    if (map) return;
    
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([16.8907, -24.9874], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Force map container to have proper z-index
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.zIndex = '1';
        mapContainer.style.position = 'relative';
    }
    
    // Get user location
    getUserLocation();
    
    // Add markers for all monuments
    state.monuments.forEach(monument => {
        const marker = L.marker([monument.lat, monument.lng]).addTo(map);
        applyMarkerBehaviour(marker, monument);
        markers.push({ marker, monument });
    });

    focusMonumentOnMap();
}

// Centra o mapa no monumento pedido, se houver um.
//
// Vive fora de initMap porque initMap so corre uma vez: quando o
// mapa ja existe, era aqui que o pedido de foco se perdia e o
// "Ver no mapa" nao fazia nada a partir da segunda vez.
function focusMonumentOnMap() {
    if (!map || !state.currentMonumentForMap) return;

    const monument = state.currentMonumentForMap;

    // O contentor pode ter acabado de deixar de estar escondido. Sem
    // o medir outra vez, a animacao de zoom do Leaflet e descartada e
    // o mapa ficava exactamente onde estava.
    map.invalidateSize();
    map.setView([monument.lat, monument.lng], 17, { animate: false });

    // Abre o balao do monumento (os descobertos abrem a pagina propria)
    const targetMarker = markers.find(m => m.monument.id === monument.id);
    if (targetMarker && targetMarker.marker.getPopup()) {
        targetMarker.marker.openPopup();
    }

    // O pedido e consumido uma unica vez
    state.currentMonumentForMap = null;
}

// Conteudo do balao de um monumento ainda por descobrir
function monumentPopupHtml(monument) {
    return `
        <div class="text-center">
            <img src="${monument.image}" alt="${monument.name}" class="w-full h-24 object-cover rounded mb-2">
            <b>${monument.name}</b><br>
            <span class="text-sm">${monument.description}</span><br>
            <span class="text-blue-600 font-bold">${monument.points} ${t('pointsWord')}</span>
        </div>
    `;
}

// Um monumento descoberto abre a pagina propria; os restantes mostram o balao
function applyMarkerBehaviour(marker, monument) {
    const isScanned = state.scannedMonuments.some(m => m.id === monument.id);

    if (isScanned) {
        marker.setIcon(L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }));
    }

    if (marker.hhOpenPage) {
        marker.off('click', marker.hhOpenPage);
        marker.hhOpenPage = null;
    }

    if (isScanned) {
        if (marker.getPopup()) marker.unbindPopup();
        marker.hhOpenPage = () => openMonumentPhotos(monument.id);
        marker.on('click', marker.hhOpenPage);
    } else {
        marker.bindPopup(monumentPopupHtml(monument));
    }
}

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                state.userLocation = { lat, lng };
                state.userLocationIsPrecise = true;
                
                // Add user location marker
                if (state.userLocationMarker) {
                    map.removeLayer(state.userLocationMarker);
                }
                
                if (state.userLocationCircle) {
                    map.removeLayer(state.userLocationCircle);
                }
                
                // Add proximity circle (50m radius)
                state.userLocationCircle = L.circle([lat, lng], {
                    radius: 50,
                    className: 'user-location-circle'
                }).addTo(map);
                
                state.userLocationMarker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(createUserLocationPopup())
                    .setIcon(L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    }));
            },
            function(error) {
                console.log("Erro ao obter localização:", error);
                // Use default location (Mindelo center) if geolocation fails
                state.userLocation = { lat: 16.8907, lng: -24.9874 };
                state.userLocationIsPrecise = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        // Use default location if geolocation not supported
        state.userLocation = { lat: 16.8907, lng: -24.9874 };
        state.userLocationIsPrecise = false;
    }
}

// Monumento por descobrir mais proximo. Devolve null quando nao ha
// uma localizacao fiavel — nao inventamos distancias (ponto 14).
function findNearestUndiscoveredMonument() {
    if (!state.userLocation || !state.userLocationIsPrecise) return null;

    let nearest = null;
    let minDistance = Infinity;

    state.monuments.forEach(monument => {
        const alreadyFound = state.scannedMonuments.some(m => m.id === monument.id);
        if (alreadyFound) return;

        const distance = calculateDistance(
            state.userLocation.lat,
            state.userLocation.lng,
            monument.lat,
            monument.lng
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearest = { monument, distance };
        }
    });

    return nearest;
}

function createUserLocationPopup() {
    if (!state.userLocation) return t('currentLocation');
    
    const nearestMonument = findNearestMonument();
    if (!nearestMonument) return t('currentLocation');
    
    const distance = calculateDistance(
        state.userLocation.lat, 
        state.userLocation.lng, 
        nearestMonument.monument.lat, 
        nearestMonument.monument.lng
    );
    
    return `
        <div class="text-center">
            <b>📍 ${t('myLocation')}</b><br>
            <div class="mt-2 p-2 bg-blue-50 rounded">
                <div class="text-sm font-semibold text-blue-800">${t('nearestMonument')}</div>
                <div class="text-sm font-bold">${nearestMonument.monument.name}</div>
                <div class="text-xs text-blue-600">${t('distanceAway', { d: distance.toFixed(0) })}</div>
            </div>
        </div>
    `;
}

function findNearestMonument() {
    if (!state.userLocation || !state.monuments.length) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    state.monuments.forEach(monument => {
        const distance = calculateDistance(
            state.userLocation.lat,
            state.userLocation.lng,
            monument.lat,
            monument.lng
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = { monument, distance };
        }
    });
    
    return nearest;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function locateUser() {
    if (!map) return;

    if (state.userLocation) {
        map.setView([state.userLocation.lat, state.userLocation.lng], 17);
        if (state.userLocationMarker) {
            state.userLocationMarker.openPopup();
        }
    } else {
        getUserLocation();
    }
}

// ============================================================
// Mapa em ecra inteiro
//
// O mapa e SEMPRE a mesma instancia Leaflet: o que muda e a caixa
// que o envolve. Por isso o centro, o zoom, os marcadores, os
// baloes abertos, a localizacao e os circulos sobrevivem a abrir e
// a fechar — nada e recriado.
// ============================================================
const mapCard = document.querySelector('.hh-map-card');
const mapFullscreenBtn = document.getElementById('mapFullscreenBtn');

// Guardamos se fomos nos a empilhar a entrada de historico, para o
// botao Voltar do Android fechar o ecra inteiro em vez de sair.
let mapFullscreenPushed = false;

function isMapFullscreen() {
    return !!mapCard && mapCard.classList.contains('is-fullscreen');
}

// O Leaflet nao sabe que a caixa mudou de tamanho: se ninguem lhe
// disser, fica com as tiles do tamanho antigo. Corremos depois de o
// CSS ser aplicado (dois frames) e outra vez mais tarde, porque em
// mobile a barra do browser ainda pode mexer na altura.
function refreshMapSize() {
    if (!map) return;

    const center = map.getCenter();
    const zoom = map.getZoom();

    const apply = function () {
        if (!map) return;
        map.invalidateSize({ animate: false, pan: false });
        // Explicito de proposito: o enunciado exige que nem o centro
        // nem o zoom se percam ao entrar ou sair do ecra inteiro.
        map.setView(center, zoom, { animate: false });
    };

    requestAnimationFrame(function () {
        requestAnimationFrame(apply);
    });
    setTimeout(apply, 220);
}

// O rotulo e o icone descrevem a accao, nao o estado actual
function updateMapFullscreenButton() {
    if (!mapFullscreenBtn) return;

    const open = isMapFullscreen();
    const label = t(open ? 'mapFullscreenClose' : 'mapFullscreenOpen');

    mapFullscreenBtn.setAttribute('aria-label', label);
    mapFullscreenBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
    mapFullscreenBtn.title = label;

    const icon = mapFullscreenBtn.querySelector('i');
    if (icon) icon.className = open ? 'fas fa-compress' : 'fas fa-expand';
}

// Qualquer folha que possa estar aberta POR CIMA do mapa. A pagina do
// monumento, por exemplo, abre ao tocar num marcador ja descoberto.
const OVERLAY_IDS = [
    'monumentPhotosModal', 'monumentModal', 'cameraModal',
    'badgeModal', 'achievementModal', 'levelUpModal',
    'xpHistoryModal', 'journeyModal', 'levelJourneyModal',
    'streakDayModal', 'streakCelebrationModal', 'discoveryModal'
];

function hasOverlayOpen() {
    return OVERLAY_IDS.some(function (id) {
        const element = document.getElementById(id);
        return element && !element.classList.contains('hidden');
    });
}

// Esc fecha — excepto quando ha uma folha por cima, que trata do seu
// proprio Esc.
//
// Corre na fase de CAPTURA de proposito: os modais fecham-se a si
// proprios na fase de bolha, e se esperassemos por eles ja nao
// veriamos que estavam abertos — o Esc fechava a folha E o ecra
// inteiro de uma so vez.
function handleMapFullscreenKey(event) {
    if (event.key !== 'Escape') return;
    if (hasOverlayOpen()) return;
    closeMapFullscreen();
}

function openMapFullscreen() {
    if (!mapCard || isMapFullscreen()) return;

    mapCard.classList.add('is-fullscreen');
    document.body.classList.add('map-fullscreen-open');
    updateMapFullscreenButton();
    refreshMapSize();

    document.addEventListener('keydown', handleMapFullscreenKey, true);
    window.addEventListener('resize', refreshMapSize);
    window.addEventListener('orientationchange', refreshMapSize);

    // Uma entrada de historico so para o Voltar fechar o ecra inteiro
    try {
        history.pushState({ hhMapFullscreen: true }, '');
        mapFullscreenPushed = true;
    } catch (e) {
        mapFullscreenPushed = false;
    }

    if (mapFullscreenBtn) mapFullscreenBtn.focus();
}

// `fromHistory` evita voltar a mexer no historico quando ja foi o
// proprio Voltar a fechar.
function closeMapFullscreen(options) {
    if (!isMapFullscreen()) return;

    mapCard.classList.remove('is-fullscreen');
    document.body.classList.remove('map-fullscreen-open');
    updateMapFullscreenButton();
    refreshMapSize();

    document.removeEventListener('keydown', handleMapFullscreenKey, true);
    window.removeEventListener('resize', refreshMapSize);
    window.removeEventListener('orientationchange', refreshMapSize);

    const fromHistory = !!(options && options.fromHistory);
    const pushed = mapFullscreenPushed;
    mapFullscreenPushed = false;

    // Fechar pelo botao consome a entrada que empilhamos, para o
    // historico nao ficar com um passo morto.
    if (pushed && !fromHistory) history.back();
}

function toggleMapFullscreen() {
    if (isMapFullscreen()) closeMapFullscreen();
    else openMapFullscreen();
}

window.addEventListener('popstate', function () {
    if (isMapFullscreen()) closeMapFullscreen({ fromHistory: true });
});

// Authentication functions
function showRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
}

function showLoginForm() {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

// ============================================================
// Autenticacao — Supabase Auth
//
// A sessao deixa de ser fingida: a senha e mesmo verificada, e o
// progresso deixa de estar preso a este aparelho. O `localStorage`
// continua a guardar tudo localmente, para que a app abra depressa
// e funcione sem rede — a nuvem e um espelho (ver cloud.js).
// ============================================================

function setAuthBusy(button, labelKey, busy) {
    if (!button) return;

    // O rotulo vive num <span data-i18n> ao lado da seta: mexer no
    // botao inteiro apagaria o icone e a marca de traducao, e o
    // idioma deixava de poder ser mudado depois.
    const label = button.querySelector('[data-i18n]') || button;

    if (busy) {
        label.dataset.idleLabel = label.textContent;
        label.textContent = t(labelKey);
        button.disabled = true;
        return;
    }

    if (label.dataset.idleLabel) {
        label.textContent = label.dataset.idleLabel;
        delete label.dataset.idleLabel;
    }
    button.disabled = false;
}

function readLocalUser() {
    try {
        const saved = localStorage.getItem('heritageUser');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

// Chaves locais com dono. Antes havia um utilizador por aparelho;
// agora que ha contas a serio, o album e as notas de uma pessoa
// nao podem aparecer a quem entrar a seguir no mesmo telemovel.
function monumentKey(kind, monumentId) {
    const owner = state.user && state.user.cloudId ? state.user.cloudId : 'local';
    return 'monument_' + kind + '_' + monumentId + '__' + owner;
}

// Conteudo gravado antes de existirem contas nao tem dono. Quando
// uma conta adopta esse perfil, adopta tambem o que ele escreveu
// e fotografou, em vez de o deixar orfao.
function adoptLegacyMonumentKeys() {
    const kinds = ['note', 'tags', 'photos'];

    state.monuments.forEach(function (monument) {
        kinds.forEach(function (kind) {
            const legacyKey = 'monument_' + kind + '_' + monument.id;
            const value = localStorage.getItem(legacyKey);
            if (value === null) return;

            const ownedKey = monumentKey(kind, monument.id);
            if (localStorage.getItem(ownedKey) === null) {
                localStorage.setItem(ownedKey, value);
            }
            localStorage.removeItem(legacyKey);
        });
    });
}

function createEmptyProfile(name, email, cloudId) {
    return {
        cloudId: cloudId,
        name: name || '',
        email: email || '',
        photo: null,
        points: 0,
        scannedMonuments: [],
        xp: XP.createEmptyWallet(),
        explorationStreak: ExplorationStreak.createEmptyStreak(),
        // Toda a gente comeca Explorador, sem celebracao (ponto 3)
        levelSeen: Levels.getLevelFromXP(0).level
    };
}

function remoteToProfile(remote, session) {
    return {
        cloudId: session.userId,
        name: remote.name || '',
        email: remote.email || session.email,
        // A foto de perfil e deste browser: nunca vem da nuvem.
        photo: null,
        points: remote.points || 0,
        scannedMonuments: remote.scannedMonuments || [],
        xp: remote.xp || XP.createEmptyWallet(),
        explorationStreak: remote.explorationStreak || ExplorationStreak.createEmptyStreak(),
        levelSeen: remote.levelSeen || Levels.getLevelFromXP(0).level
    };
}

function profileTotalXP(profile) {
    if (!profile) return -1;
    if (profile.xp && typeof profile.xp.total === 'number') return profile.xp.total;
    return profile.points || 0;
}

// O perfil deste aparelho so conta se for mesmo desta conta.
function localProfileFor(local, session) {
    if (!local) return null;

    if (local.cloudId === session.userId) return local;

    // Perfil anterior a nuvem, criado aqui com este email: e
    // adoptado pela conta em vez de se perder.
    if (!local.cloudId && local.email && local.email === session.email) {
        local.adoptedFromDevice = true;
        return local;
    }

    return null;
}

// Qual dos dois retratos vale: o deste aparelho ou o da nuvem?
//
// O progresso nesta app so cresce, por isso o criterio e simples e
// previsivel: ganha quem tiver mais XP total. Jogar sem rede e
// voltar a ligar nunca perde nada, e entrar num aparelho novo traz
// o progresso todo.
function pickProfile(localProfile, remoteProfile) {
    if (!localProfile) return remoteProfile;
    if (!remoteProfile) return localProfile;

    return profileTotalXP(localProfile) >= profileTotalXP(remoteProfile)
        ? localProfile
        : remoteProfile;
}

// As notas e etiquetas da nuvem passam a viver tambem aqui, nas
// chaves desta conta. As FOTOGRAFIAS nao vem de lado nenhum: essas
// sao, e continuam a ser, deste browser.
function applyRemoteEntries(entries) {
    entries.forEach(function (entry) {
        if (entry.note) {
            localStorage.setItem(monumentKey('note', entry.monumentId), entry.note);
        }
        if (entry.tags && entry.tags.length) {
            localStorage.setItem(
                monumentKey('tags', entry.monumentId),
                JSON.stringify(entry.tags)
            );
        }
    });
}

// Entrada unica na app depois de a sessao existir — vinda do
// login, do registo ou de uma sessao que o browser ainda guardava.
async function enterWithSession(session, fallbackName) {
    const remote = await HeritageCloud.pullProfile();
    const localProfile = localProfileFor(readLocalUser(), session);
    const remoteProfile = remote ? remoteToProfile(remote, session) : null;

    const adopted = !!(localProfile && localProfile.adoptedFromDevice);
    let profile = pickProfile(localProfile, remoteProfile);
    if (!profile) profile = createEmptyProfile(fallbackName, session.email, session.userId);

    profile.cloudId = session.userId;
    profile.email = session.email;
    if (!profile.name) profile.name = fallbackName || '';
    delete profile.adoptedFromDevice;

    // A senha nunca fica guardada no aparelho: quem a verifica e o
    // Supabase, e ja nao ha aqui nada que precise dela.
    delete profile.password;

    // A foto de perfil e local: se este aparelho tinha uma, fica.
    if (localProfile && localProfile.photo) profile.photo = localProfile.photo;

    state.user = profile;

    if (adopted) adoptLegacyMonumentKeys();

    // A nuvem pode trazer definicoes de outro aparelho, mas so as
    // aplicamos quando este ainda nao tem nenhumas — mudar o tema
    // ou o idioma debaixo dos pes de quem ja escolheu seria pior.
    if (remote && remote.settings && !localStorage.getItem(SETTINGS_KEY)) {
        state.settings = Object.assign({}, defaultSettings, remote.settings);
        saveSettings();
        applyTheme();
        applyLanguage();
    }

    // Participar ou nao no ranking e uma escolha da PESSOA, nao
    // deste telemovel: acompanha a conta para outro aparelho.
    if (remote && typeof remote.rankingOptIn === 'boolean') {
        state.settings.rankingOptIn = remote.rankingOptIn;
        saveSettings();
        if (rankingOptInToggle) rankingOptInToggle.checked = remote.rankingOptIn;
    }

    applyRemoteEntries(await HeritageCloud.pullEntries());

    // `loadUserData()` primeiro: e ele que enche o `state` a partir
    // do perfil. So depois se grava, ou gravariamos o estado velho.
    loadUserData();
    saveUserData();
    showMainApp();

    // O que ficou por subir sobe em segundo plano: entrar na app
    // nunca pode ficar a espera de fotografias.
    flushPendingPhotos();
    flushPendingAvatar();

    // O ledger do ranking recupera aqui tudo o que nao chegou a
    // subir — uma descoberta feita sem rede, por exemplo. Repetir
    // nao custa: a chave de recompensa impede contar duas vezes.
    if (state.user.xp) HeritageCloud.syncXpLedger(state.user.xp.history);
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert(t('fillAllFields'));
        return;
    }

    setAuthBusy(loginBtn, 'signingIn', true);

    try {
        const result = await HeritageCloud.signIn(email, password);

        if (!result.ok) {
            alert(t(result.code));
            return;
        }

        await enterWithSession(result);
    } finally {
        setAuthBusy(loginBtn, 'signingIn', false);
    }
}

async function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        alert(t('fillAllFields'));
        return;
    }

    if (password.length < 6) {
        alert(t('passwordTooShort'));
        return;
    }

    setAuthBusy(registerBtn, 'signingUp', true);

    try {
        const result = await HeritageCloud.signUp(name, email, password);

        if (!result.ok) {
            // Conta criada mas a espera de confirmacao por email
            // nao e um erro: e um passo que ainda falta.
            alert(t(result.code));
            if (result.pendingConfirmation) showLoginForm();
            return;
        }

        await enterWithSession(result, name);
    } finally {
        setAuthBusy(registerBtn, 'signingUp', false);
    }
}

async function logout() {
    if (!confirm(t('confirmLogout'))) return;

    // O que ainda nao subiu sobe antes de a sessao fechar: sair da
    // conta nunca pode ser a maneira de perder progresso.
    saveUserData();
    await HeritageCloud.signOut();

    // O perfil sai deste aparelho, para que quem entrar a seguir
    // nao encontre o progresso de outra pessoa. O album fica, com
    // o dono marcado na chave, e volta no proximo login.
    localStorage.removeItem('heritageUser');

    state.user = null;
    state.points = 0;
    state.scannedMonuments = [];
    levelCelebrationsReady = false;
    closeMapFullscreen();
    StreakUI.render();
    XPUI.render();
    LevelsUI.render();
    JourneyUI.render();
    RankingUI.closeInfo();
    document.body.classList.remove('hh-dark-bg');
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    stopScanner();
}

function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    updateUserInterface();
    StreakUI.render();
    XPUI.render();
    LevelsUI.render();
    renderZonesView();
    JourneyUI.render();
    showScannerView();
}

function loadUserData() {
    if (state.user) {
        // Nada do que acontece durante o arranque e "agora": migracoes
        // e recompensas retroactivas nunca celebram niveis (ponto 47).
        levelCelebrationsReady = false;

        state.scannedMonuments = state.user.scannedMonuments || [];

        // Pontos antigos passam a XP (uma unica vez) e as zonas ja
        // completas antes deste sistema recebem a recompensa.
        migrateUserToXP();
        syncZoneCompletions();
        state.points = XP.getTotalXP();

        // O nivel passa a ser derivado do XP: um `level` guardado por
        // versoes antigas deixa de ter significado (pontos 30 e 31).
        migrateUserToLevels();

        // Update badges based on current progress
        const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
        state.badges.forEach(badge => {
            badge.unlocked = progress >= badge.threshold;
        });

        // Os monumentos guardados podem ter sido gravados noutro idioma
        applyContentLanguage();

        // A partir daqui, qualquer subida de nivel aconteceu mesmo agora
        levelCelebrationsReady = true;
    }
}

function saveUserData() {
    if (state.user) {
        // `points` fica como espelho do XP, para que qualquer codigo
        // (ou perfil) antigo continue a ler um valor correcto.
        state.user.points = state.user.xp ? state.user.xp.total : state.points;
        state.user.scannedMonuments = state.scannedMonuments;
        localStorage.setItem('heritageUser', JSON.stringify(state.user));

        // A nuvem recebe o mesmo retrato, sem imagens e sem pressa:
        // a gravacao local ja aconteceu, e e ela que conta.
        HeritageCloud.queueProfile(state.user, state.settings);
    }
}

// ============================================================
// XP — ligacao entre o dominio (xp.js), a persistencia do
// utilizador e a interface (xp-ui.js)
//
// O XP vive dentro do perfil autenticado, ao lado dos monumentos
// descobertos, por isso e gravado na mesma escrita.
// ============================================================
function initXPSystem() {
    XP.configureStorage({
        exists: () => !!state.user,
        load: () => (state.user ? state.user.xp : null),
        save: (wallet) => {
            if (!state.user) throw new Error('sem utilizador autenticado');

            // Se a escrita falhar, a memoria volta atras: o total em
            // memoria nunca fica a frente do que esta guardado.
            const previousWallet = state.user.xp;
            const previousPoints = state.user.points;
            state.user.xp = wallet;

            try {
                // Uma unica escrita cobre XP, monumentos e pontos (ponto 28)
                saveUserData();
            } catch (error) {
                state.user.xp = previousWallet;
                state.user.points = previousPoints;
                throw error;
            }
        }
    });

    XPUI.init({
        resolveMonument: (id) => state.monuments.find(m => m.id === id) || null,
        resolveZone: (id) => state.zones.find(z => z.id === id) || null,
        getMonumentProgress: () => ({
            done: state.scannedMonuments.length,
            total: state.monuments.length
        })
    });

    LevelsUI.init({
        // O nivel le o XP pela camada de dominio, nunca por state.points
        getTotalXP: () => XP.getTotalXP(),
        // Fechar a celebracao devolve o lugar a fila de conquistas
        onLevelUpClosed: () => scheduleNextBadge(400)
    });

    // A UI reage a qualquer mudanca de XP, venha de onde vier (ponto 52)
    XP.subscribeToXPChanges((change) => {
        state.points = XP.getTotalXP();
        XPUI.applyChange(change);
        LevelsUI.applyChange(change);
        handleLevelChange(change);
    });
}

// Ponto unico de entrada para XP na aplicacao.
// Nenhum componente chama XP.awardMany directamente (ponto 4).
function awardXP(events) {
    if (!state.user) return null;

    const batch = XP.awardMany(Array.isArray(events) ? events : [events]);

    // Os erros sao sempre registados; o detalhe de cada recompensa so
    // aparece com window.HH_DEBUG_XP = true na consola (ponto 44).
    if (!batch.persisted) {
        console.error('[xp] recompensa nao guardada', batch.results);
    } else if (batch.totalAwarded > 0 && window.HH_DEBUG_XP) {
        batch.awarded.forEach(result => {
            console.info('[xp] +' + result.amount + ' ' + result.action, result.rewardKey);
        });
    }

    // O ledger do servidor e a base do ranking — e so isso. O jogo
    // nunca espera por ele: vai em segundo plano, e o que falhar
    // e recuperado no arranque seguinte por `syncXpLedger`.
    if (batch.persisted && batch.totalAwarded > 0) {
        recordAwardedXP(batch.awarded);
    }

    return batch;
}

/**
 * Espelha no servidor as recompensas que a carteira local atribuiu.
 *
 * Repare-se no que NAO vai daqui: o montante. O servidor tem as
 * suas proprias tabelas e decide quanto vale cada accao — e por
 * isso que nenhuma consola consegue escrever 999999 no ranking.
 *
 * A ordem e a de atribuicao, porque o servidor exige que um
 * monumento ja esteja descoberto antes de aceitar uma fotografia
 * ou uma experiencia sobre ele.
 */
async function recordAwardedXP(awarded) {
    if (!HeritageCloud.isAvailable() || !HeritageCloud.getUserId()) return;

    for (let i = 0; i < awarded.length; i++) {
        const transaction = awarded[i] && awarded[i].transaction;
        if (transaction) await HeritageCloud.recordXpEvent(transaction);
    }
}

// Uma accao nunca produz dois avisos sobrepostos: quando a sequencia
// abre um novo dia, e a celebracao que mostra tambem o XP; nos restantes
// casos basta o aviso discreto (ponto 23).
function announceReward(xpBatch, streakResult, fallbackText) {
    if (streakResult && streakResult.isNewDay) {
        StreakUI.showCelebration(streakResult, XPUI.summaryText(xpBatch));
        return;
    }
    // O aviso leva tambem quanto falta para o proximo nivel: ganhar XP
    // sem subir de nivel continua a mostrar progresso (ponto 42).
    XPUI.toast(xpBatch, fallbackText, LevelsUI.nextLevelHint());
}

// ============================================================
// Niveis — ligacao entre o dominio (levels.js), o XP e a
// interface (levels-ui.js)
//
// O nivel NAO e guardado: e sempre Levels.getLevelFromXP(total).
// A unica coisa persistida e `levelSeen`, o nivel cuja celebracao
// o utilizador ja viu, para nao voltar a aparecer depois de um
// refresh (ponto 47).
// ============================================================

// Enquanto a sessao arranca (migracao de pontos antigos, zonas
// concluidas noutra sessao) nao ha celebracoes: essas subidas nao
// aconteceram agora (pontos 16 e 47).
let levelCelebrationsReady = false;

// O nivel visivel e sempre recalculado a partir do XP
function updateLevelDisplay() {
    LevelsUI.render();
}

// Alinha `levelSeen` com o nivel actual sem celebrar nada.
// Usado no arranque e depois de recompensas retroactivas.
function syncLevelSeen() {
    if (!state.user) return;

    const level = Levels.getLevelFromXP(XP.getTotalXP()).level;
    if (state.user.levelSeen === level) return;

    state.user.levelSeen = level;
    saveUserData();
}

// Ponto unico de deteccao de subida de nivel (ponto 14).
// Recebe o resultado de qualquer atribuicao de XP, venha de onde vier.
function handleLevelChange(change) {
    if (!state.user || !levelCelebrationsReady) return;
    if (!change || change.migration || change.reset) return;

    const transition = Levels.detectLevelUp(change.previousXP, change.currentXP);
    if (!transition.leveledUp) return;

    // Uma recompensa repetida ou um duplo clique nunca geram uma
    // segunda celebracao do mesmo nivel (pontos 12 e 13).
    const seen = typeof state.user.levelSeen === 'number' ? state.user.levelSeen : 0;
    if (transition.newLevel.level <= seen) return;

    state.user.levelSeen = transition.newLevel.level;
    saveUserData();

    if (!state.settings || state.settings.achievementAlerts) {
        enqueueLevelUp(transition.newLevel);
    }
}

// ============================================================
// Jornada cultural — ligacao entre o dominio (journey.js), os
// dados reais da aplicacao e a interface (journey-ui.js)
//
// A jornada NAO guarda nada: le os monumentos, as zonas e as
// descobertas que ja existem (ponto 47). Tambem nao atribui XP
// nem mexe em niveis ou na sequencia (pontos 25, 26 e 27).
// ============================================================
function initJourney() {
    Journey.configure({
        getMonuments: () => state.monuments,
        getZones: () => state.zones,
        // Fonte unica de verdade das descobertas
        getDiscoveredIds: () => discoveredMonumentIds()
    });

    JourneyUI.init({
        // Etapa descoberta: abre o album/pagina que ja existe (ponto 21)
        onOpenMonument: (monumentId) => openMonumentPhotos(monumentId),

        // Proxima etapa: leva ao mapa existente, centrado no monumento
        // (ponto 23 — nao ha um segundo mapa)
        onShowOnMap: (monument) => {
            state.currentMonumentForMap = monument;
            showMapView();
        },

        // So ha distancia quando a localizacao ja foi obtida e e
        // precisa. Nunca a pedimos so para desenhar o caminho (ponto 56).
        getDistanceTo: (monument) => {
            if (!state.userLocation || !state.userLocationIsPrecise) return null;
            if (!monument) return null;
            return calculateDistance(
                state.userLocation.lat,
                state.userLocation.lng,
                monument.lat,
                monument.lng
            );
        }
    });
}

// Ponto 40 — lista de zonas no mapa
function renderZonesView() {
    if (zonesSubtitle) {
        zonesSubtitle.textContent = t('zonesSubtitle', {
            n: XP.getActionAmount(XP.ACTION.ZONE_COMPLETED)
        });
    }
    XPUI.renderZones(state.zones, discoveredMonumentIds());
}

// Ponto 38 — quantas recompensas de fotografia ainda restam
function renderPhotoXpHint(monumentId) {
    if (!monumentPagePhotoXp) return;

    const used = XP.getPhotoRewardsUsed(monumentId);
    const max = XP.getPhotoRewardLimit();
    const done = used >= max;

    monumentPagePhotoXp.textContent = done
        ? t('xpPhotoRewardsUsed', { used: used, max: max })
        : t('xpPhotoHint', { n: XP.getActionAmount(XP.ACTION.PHOTO_ADDED) });
    monumentPagePhotoXp.classList.toggle('is-done', done);
}

// Ponto 39 — a experiencia so promete XP enquanto nao foi paga
function renderExperienceXpHint(monumentId) {
    if (!monumentPageExperienceXp) return;

    const amount = XP.getActionAmount(XP.ACTION.EXPERIENCE_ADDED);
    const earned = XP.hasMonumentReward(XP.ACTION.EXPERIENCE_ADDED, monumentId);

    monumentPageExperienceXp.textContent = earned
        ? t('xpExperienceDone', { n: amount })
        : t('xpExperienceHint', { n: amount });
    monumentPageExperienceXp.classList.toggle('is-done', earned);
}

// Passa os pontos ja existentes para XP sem perder nada (ponto 18)
function migrateUserToXP() {
    if (!state.user) return;

    XP.migrateLegacyPoints({
        legacyPoints: state.user.points || 0,
        discoveredMonuments: state.scannedMonuments
    });

    state.points = XP.getTotalXP();
}

// ============================================================
// Migracao do nivel antigo (pontos 30, 31 e 32)
//
// Ate aqui o nivel era um numero calculado na interface
// (1 nivel por cada 100 XP) e nunca chegou a ser guardado. Passa a
// ser derivado de LEVEL_CONFIG, por isso o numero visivel muda para
// alguns utilizadores — mas o XP fica exactamente igual.
//
// Exemplo: 315 XP mostrava "Nivel 4" e passa a mostrar
// "Viajante · Nivel 2". Continuam a ser 315 XP.
// ============================================================
function migrateUserToLevels() {
    if (!state.user) return;

    // Um `level` guardado por uma versao antiga deixa de ser lido:
    // manter o campo so convidava a dessincronizacao (ponto 2).
    if (state.user.level !== undefined) {
        delete state.user.level;
    }

    // `levelSeen` nasce alinhado com o XP actual, para quem ja era
    // utilizador nao receber celebracoes de niveis antigos.
    syncLevelSeen();
}

// Ids dos monumentos ja descobertos
function discoveredMonumentIds() {
    return state.scannedMonuments.map(m => m.id);
}

// Zonas que ficam completas com a lista de descobertas indicada e
// que ainda nao foram recompensadas.
function pendingZoneCompletions(discoveredIds) {
    const discovered = discoveredIds || discoveredMonumentIds();

    return state.zones.filter(zone => {
        const complete = zone.monumentIds.every(id => discovered.indexOf(id) !== -1);
        if (!complete) return false;
        return !XP.hasReward(XP.ACTION.ZONE_COMPLETED, zone.id);
    });
}

function zoneEvents(zones) {
    return zones.map(zone => ({
        action: XP.ACTION.ZONE_COMPLETED,
        zoneId: zone.id,
        entityId: zone.id
    }));
}

// Zonas ja concluidas antes de este sistema existir (ou concluidas
// noutra sessao) recebem a recompensa em silencio no arranque.
function syncZoneCompletions() {
    if (!state.user) return null;

    const pending = pendingZoneCompletions();
    if (!pending.length) return null;

    return XP.awardMany(zoneEvents(pending));
}

// ============================================================
// Streak de exploracao — ligacao entre o dominio (streak.js),
// a persistencia do utilizador e a interface (streak-ui.js)
// ============================================================

// A sequencia vive dentro do perfil autenticado, por isso e gravada
// pelo mesmo caminho que os pontos e os monumentos descobertos.
// Trocar de utilizador troca automaticamente de sequencia.
function initExplorationStreak() {
    ExplorationStreak.configureStorage({
        load: () => (state.user ? state.user.explorationStreak : null),
        save: (data) => {
            if (!state.user) return;

            const previous = state.user.explorationStreak;
            state.user.explorationStreak = data;

            try {
                saveUserData();
            } catch (error) {
                state.user.explorationStreak = previous;
                throw error;
            }
        }
    });

    StreakUI.init({
        onExplore: showMapView,
        onMilestone: showStreakMilestone,
        resolveMonument: (id) => state.monuments.find(m => m.id === id) || null,
        getNextStory: findNearestUndiscoveredMonument
    });
}

// Ponto unico de entrada para qualquer accao que conte como exploracao
function registerExploration(type, monumentId, metadata) {
    if (!state.user) return null;

    const result = ExplorationStreak.registerExplorationActivity({
        type: type,
        monumentId: monumentId === undefined ? null : monumentId,
        metadata: metadata || {}
    });

    if (result.registered) {
        StreakUI.render();
        queueStreakMilestones(result.newMilestones);
    }

    return result;
}

// Conquistas de sequencia reutilizam o modal de medalhas existente
function streakMilestoneBadge(milestoneId) {
    const milestone = ExplorationStreak.MILESTONES.filter(m => m.id === milestoneId)[0];
    if (!milestone) return null;

    return {
        id: milestone.id,
        days: milestone.days,
        icon: milestone.icon,
        color: 'hh-streak-badge-icon',
        iconColor: '',
        name: streakBadgeText(milestone.id, 'name'),
        description: streakBadgeText(milestone.id, 'description'),
        message: streakBadgeText(milestone.id, 'message')
    };
}

function queueStreakMilestones(milestones) {
    if (!milestones || !milestones.length) return;
    if (state.settings && !state.settings.achievementAlerts) return;

    milestones.forEach(milestone => {
        const badge = streakMilestoneBadge(milestone.id);
        if (badge) enqueueBadge(badge);
    });
}

function showStreakMilestone(milestoneId) {
    const badge = streakMilestoneBadge(milestoneId);
    if (badge) showAchievementDetails(badge);
}

function updateUserInterface() {
    if (state.user) {
        userName.textContent = state.user.name.split(' ')[0];
        profileUserName.textContent = state.user.name;
        userEmail.textContent = state.user.email;
        
        // A foto pode estar em casa (ainda por subir) ou no Storage,
        // e nesse caso precisa de um link assinado.
        if (state.user.photo) {
            showProfilePhoto(state.user.photo);
        } else if (state.user.avatarPath) {
            showRemoteAvatar(state.user.avatarPath);
        }
    }
}

function showProfilePhoto(src) {
    profilePhoto.src = src;
    profilePhoto.classList.remove('hidden');
    profileIcon.classList.add('hidden');
}

async function showRemoteAvatar(path) {
    const urls = await HeritageCloud.signImageUrls([path]);
    if (urls[path]) showProfilePhoto(urls[path]);
}

// Profile photo functions
function changePhoto() {
    photoInput.click();
}

async function handlePhotoChange(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    // Um avatar nunca e visto maior que um circulo: 512 px chegam,
    // e tudo o que sobra e espaco poupado para sempre.
    let compressed;
    try {
        compressed = await ImageCompressor.compress(file, 'AVATAR');
    } catch (error) {
        alert(t('photoUnreadable'));
        return;
    }

    const preview = await blobToDataUrl(compressed.blob);
    showProfilePhoto(preview);

    if (!state.user) return;

    const path = HeritageCloud.avatarPath(compressed.extension);
    const upload = await HeritageCloud.uploadImage(path, compressed.blob, compressed.format);

    if (upload.ok) {
        // O avatar anterior pode ter outra extensao: apaga-se, ou
        // ficava para sempre a ocupar espaco sem ninguem o ver.
        if (state.user.avatarPath && state.user.avatarPath !== path) {
            await HeritageCloud.removeImages([state.user.avatarPath]);
        }
        state.user.avatarPath = path;
        state.user.photo = null;
    } else {
        // Sem rede fica em casa, e sobe no proximo arranque.
        state.user.photo = preview;
    }

    saveUserData();
}

// O avatar que ficou por subir sobe assim que houver ligacao.
async function flushPendingAvatar() {
    if (!state.user || !state.user.photo) return;
    if (!HeritageCloud.isAvailable() || !HeritageCloud.getUserId()) return;

    let compressed;
    try {
        compressed = await ImageCompressor.compress(state.user.photo, 'AVATAR');
    } catch (error) {
        return;
    }

    const path = HeritageCloud.avatarPath(compressed.extension);
    const upload = await HeritageCloud.uploadImage(path, compressed.blob, compressed.format);
    if (!upload.ok) return;

    state.user.avatarPath = path;
    state.user.photo = null;
    saveUserData();
}

// Settings functions
const SETTINGS_KEY = 'heritageSettings';
const defaultSettings = {
    theme: 'system',          // 'light' | 'dark' | 'system'
    lang: detectBrowserLanguage(),
    achievementAlerts: true,
    // Participar no ranking nao muda nada no que se ganha: muda
    // apenas se o nome e a fotografia aparecem aos outros.
    rankingOptIn: true
};
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Idioma inicial sugerido pelo browser (pt por omissão)
function detectBrowserLanguage() {
    const browserLang = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    return AVAILABLE_LANGUAGES.indexOf(browserLang) !== -1 ? browserLang : 'pt';
}

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
        state.settings = Object.assign({}, defaultSettings, saved);
    } catch (e) {
        state.settings = Object.assign({}, defaultSettings);
    }
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));

    // Tema, idioma e alertas seguem a conta, para que um aparelho
    // novo nao comece do zero nas preferencias.
    if (state.user) HeritageCloud.queueProfile(state.user, state.settings);
}

function resolveTheme(theme) {
    if (theme === 'system') {
        return darkModeQuery.matches ? 'dark' : 'light';
    }
    return theme;
}

function applyTheme() {
    const effective = resolveTheme(state.settings.theme);
    document.documentElement.classList.toggle('dark', effective === 'dark');
    document.documentElement.style.colorScheme = effective;
    updateThemeSelector();
}

function setTheme(theme) {
    state.settings.theme = theme;
    saveSettings();
    applyTheme();
}

function updateThemeSelector() {
    themeOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.theme === state.settings.theme);
    });
}

function toggleAchievementAlerts(enabled) {
    state.settings.achievementAlerts = enabled;
    saveSettings();
}

// Traduz os elementos estáticos marcados com data-i18n no HTML
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}

// Traduz os conteúdos dos dados (descrições de monumentos e textos das medalhas)
function applyContentLanguage() {
    state.monuments.forEach(monument => {
        monument.description = monumentDescription(monument.id);
    });
    state.scannedMonuments.forEach(monument => {
        monument.description = monumentDescription(monument.id);
    });
    state.badges.forEach(badge => {
        badge.name = badgeText(badge.id, 'name');
        badge.description = badgeText(badge.id, 'description');
        badge.message = badgeText(badge.id, 'message');
    });
}

function updateLanguageSelector() {
    languageOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.lang === state.settings.lang);
    });
}

function applyLanguage() {
    setCurrentLanguage(state.settings.lang);
    document.documentElement.lang = state.settings.lang;

    applyTranslations();
    applyContentLanguage();
    updateLanguageSelector();

    // Pagina do monumento, caso esteja aberta
    if (isMonumentPageOpen()) {
        renderMonumentPage();
    }

    // Celebracao de descoberta, caso esteja aberta: volta a desenhar
    // a partir do MESMO resultado, sem recontar o XP (ponto 41).
    if (DiscoveryUI.isOpen()) {
        DiscoveryUI.refresh();
    }

    // Botao de ecra inteiro do mapa (o rotulo muda com o estado)
    updateMapFullscreenButton();

    // Cartao da sequencia (textos e dias da semana)
    StreakUI.render();

    // Cartao de XP e zonas
    XPUI.render();
    renderZonesView();

    // Cartao de nivel (nome, descricao e texto do proximo nivel)
    LevelsUI.render();

    // Jornada cultural (nomes das zonas, estados e microcopy)
    JourneyUI.render();

    // Botão do scanner (só quando está em repouso, para não interromper uma leitura)
    if (!state.qrScanner) {
        startScannerBtn.innerHTML = `<i class="fas fa-qrcode mr-3 text-xl"></i> <span data-i18n="scanQr">${t('scanQr')}</span>`;
    }
}

function setLanguage(lang) {
    if (state.settings.lang === lang) return;
    state.settings.lang = lang;
    saveSettings();
    applyLanguage();

    // Volta a desenhar tudo o que é gerado por JS
    renderBadges();
    updateProgress();
}

function initSettings() {
    loadSettings();
    applyTheme();
    applyLanguage();
    achievementAlertsToggle.checked = state.settings.achievementAlerts;
    if (rankingOptInToggle) rankingOptInToggle.checked = state.settings.rankingOptIn !== false;

    // Segue o tema do sistema apenas quando a opção 'Sistema' está activa
    darkModeQuery.addEventListener('change', () => {
        if (state.settings.theme === 'system') applyTheme();
    });
}

// ============================================================
// Ranking de exploradores
//
// Vive atras do perfil, e nao na barra de navegacao: o centro da
// app continua a ser explorar, descobrir e guardar memorias.
// ============================================================

// A ilha ja esta prevista na jornada (`islandId`), por isso o
// ranking nasce preparado para outras ilhas sem mudar de forma.
const RANKING_ISLAND = 'sao_vicente';

function initRanking() {
    RankingUI.init({
        t: t,
        islandId: RANKING_ISLAND,
        fetchRanking: function (limit, islandId) {
            return HeritageCloud.getWeeklyRanking(limit, islandId);
        },
        signAvatars: function (paths) {
            return HeritageCloud.signImageUrls(paths);
        },
        isOptedIn: function () {
            return state.settings.rankingOptIn !== false;
        },
        onOptInChange: function (enabled) {
            return toggleRankingOptIn(enabled);
        },
        // Uma lista vazia nao pode ser um beco: leva de volta ao que
        // a app e mesmo — sair e descobrir.
        onExplore: function () {
            RankingUI.closeInfo();
            showScannerView();
        },
        // Aviso discreto, do mesmo feitio dos outros da app. Entrar
        // no ranking nao merece confetti: merece uma frase.
        onJoined: function () {
            XPUI.toast(null, t('rankingJoinedToast'));
        }
    });
}

function showRankingView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.add('hidden');
    mapView.classList.add('hidden');
    settingsView.classList.add('hidden');
    rankingView.classList.remove('hidden');
    updateNavButtons('ranking');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Carrega ao entrar. Sem tempo real nem sondagem: o ranking nao
    // precisa de mudar a cada segundo (ponto 40).
    RankingUI.load();
}

async function toggleRankingOptIn(enabled) {
    state.settings.rankingOptIn = !!enabled;
    saveSettings();

    // O interruptor vive em dois sitios — nas definicoes e no painel
    // do ranking — e os dois tem de mostrar sempre o mesmo.
    if (rankingOptInToggle) rankingOptInToggle.checked = !!enabled;
    RankingUI.syncOptIn(!!enabled);

    // A escolha tem de valer ja. Sem esta subida imediata, sair do
    // ranking so teria efeito no arranque seguinte — e ninguem
    // espera isso de um interruptor de privacidade.
    await HeritageCloud.flushNow();

    if (RankingUI.isVisible()) RankingUI.reload();
}

// Navigation functions
function showScannerView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.remove('hidden');
    profileView.classList.add('hidden');
    mapView.classList.add('hidden');
    settingsView.classList.add('hidden');
    rankingView.classList.add('hidden');
    updateNavButtons('scanner');
}

function showProfileView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.remove('hidden');
    mapView.classList.add('hidden');
    settingsView.classList.add('hidden');
    rankingView.classList.add('hidden');
    updateProfileView();
    updateNavButtons('profile');
}

function showSettingsView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.add('hidden');
    mapView.classList.add('hidden');
    rankingView.classList.add('hidden');
    settingsView.classList.remove('hidden');
    updateThemeSelector();
    updateLanguageSelector();
    achievementAlertsToggle.checked = state.settings.achievementAlerts;
    if (rankingOptInToggle) rankingOptInToggle.checked = state.settings.rankingOptIn !== false;
    updateNavButtons('settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMapView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.add('hidden');
    settingsView.classList.add('hidden');
    rankingView.classList.add('hidden');
    mapView.classList.remove('hidden');
    renderZonesView();
    initMap();
    // Tambem quando o mapa ja estava criado (initMap so corre uma vez)
    focusMonumentOnMap();
    updateNavButtons('map');
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
}

function updateNavButtons(activeView) {
    // Sair do mapa fecha o ecra inteiro: um elemento fixo nunca pode
    // ficar por cima de outra vista.
    if (activeView !== 'map') closeMapFullscreen();

    // O ranking traz cabecalho proprio — a fotografia do porto vai ate
    // ao topo. Dois cabecalhos empilhados seriam dois titulos a discutir.
    if (appHeader) appHeader.classList.toggle('hidden', activeView === 'ranking');

    if (settingsBtn) settingsBtn.classList.toggle('is-active', activeView === 'settings');

    // Desliza o indicador do glass radio group para a aba activa
    const navBar = document.querySelector('nav.hh-nav');
    if (navBar) {
        navBar.dataset.active = ['scanner', 'profile', 'map', 'ranking'].includes(activeView) ? activeView : 'none';
    }

    const buttons = [
        { element: navScanner, view: 'scanner' },
        { element: navProfile, view: 'profile' },
        { element: navMap, view: 'map' },
        { element: navRanking, view: 'ranking' }
    ];
    
    buttons.forEach(button => {
        if (button.view === activeView) {
            button.element.classList.remove('text-gray-400');
            button.element.classList.add('text-blue-600');
        } else {
            button.element.classList.remove('text-blue-600');
            button.element.classList.add('text-gray-400');
        }
    });
}

// QR Scanner functions
function startScanner() {
    startScannerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-3"></i> ${t('starting')}`;
    startScannerBtn.disabled = true;
    
    navigator.mediaDevices.getUserMedia({
        video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    }).then(stream => {
        scannerVideo.srcObject = stream;
        scannerOverlay.classList.remove('hidden');
        closeScannerBtn.classList.remove('hidden');
        startScannerBtn.innerHTML = `<i class="fas fa-search mr-3"></i> ${t('scanning')}`;
        
        // Initialize QR Scanner
        state.qrScanner = new QrScanner(scannerVideo, result => {
            handleQRResult(result.data);
        }, {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
        });
        
        state.qrScanner.start().then(() => setupTorch()).catch(err => console.error('Scanner start error:', err));
        
    }).catch(err => {
        console.error("Camera error: ", err);
        alert(t('cameraError'));
        resetScanner();
    });
}

// Lanterna: mostra o botao apenas se a camara actual suportar flash
function setupTorch() {
    if (!torchBtn) return;
    hideTorch();
    if (!state.qrScanner || typeof state.qrScanner.hasFlash !== 'function') return;
    Promise.resolve(state.qrScanner.hasFlash())
        .then(hasFlash => {
            if (hasFlash && state.qrScanner) torchBtn.classList.remove('hidden');
        })
        .catch(() => {});
}

function hideTorch() {
    if (!torchBtn) return;
    torchBtn.classList.add('hidden');
    torchBtn.classList.remove('hh-torch-on');
    state.torchOn = false;
}

function toggleTorch() {
    if (!state.qrScanner || typeof state.qrScanner.toggleFlash !== 'function') return;
    Promise.resolve(state.qrScanner.toggleFlash())
        .then(() => {
            state.torchOn = !state.torchOn;
            torchBtn.classList.toggle('hh-torch-on', state.torchOn);
        })
        .catch(err => console.error('Torch error:', err));
}

function closeScanner() {
    stopScanner();
    resetScanner();
}

function handleQRResult(qrData) {
    // Find monument by QR code
    const monument = state.monuments.find(m => m.qrCode === qrData);
    
    if (!monument) {
        alert(t('qrNotRecognized'));
        return;
    }
    
    // Check if already scanned
    const alreadyScanned = state.scannedMonuments.some(m => m.id === monument.id);
    if (alreadyScanned) {
        alert(t('alreadyDiscovered'));
        return;
    }
    
    // O progresso ANTES da descoberta: a barra da celebracao anima
    // de onde estava, nunca de zero (ponto 11).
    const previousProgress = {
        discovered: state.scannedMonuments.length,
        total: state.monuments.length
    };

    // A partir daqui, as recompensas que forem desbloqueadas ficam
    // retidas para a celebracao em vez de abrirem modais proprios
    // (pontos 13, 14 e 28). O portao fecha-se em qualquer saida.
    openDiscoveryCapture();

    let celebration = null;

    try {
        // Add to scanned monuments
        monument.discoveredAt = new Date().toISOString();
        state.scannedMonuments.push(monument);

        // XP: a descoberta e a zona que ela eventualmente conclui ficam
        // guardadas na mesma escrita (ponto 28).
        const xpBatch = awardXP([{
            action: XP.ACTION.MONUMENT_DISCOVERED,
            monumentId: monument.id,
            entityId: monument.id,
            entityAmount: monument.points
        }].concat(zoneEvents(pendingZoneCompletions())));

        // Se o XP nao ficou guardado, a descoberta tambem nao conta:
        // nunca anunciamos XP que nao foi persistido (ponto 43).
        if (!xpBatch || !xpBatch.persisted) {
            state.scannedMonuments.pop();
            delete monument.discoveredAt;
            alert(t('saveError'));
            closeScanner();
            return;
        }

        state.points = XP.getTotalXP();

        // Sequencia de exploracao: a descoberta conta como actividade do dia
        const streakResult = registerExploration(
            ExplorationStreak.ACTIVITY.MONUMENT_DISCOVERY,
            monument.id,
            { points: monument.points }
        );

        // A jornada assinala a etapa acabada de percorrer: o no anima
        // uma unica vez, quando o percurso for aberto (ponto 54).
        JourneyUI.markDiscovery(monument.id);

        // Update UI and save data
        updateProgress();
        checkForBadges();
        saveUserData();

        // Tudo ja esta gravado e contabilizado: so agora se constroi o
        // que a celebracao vai mostrar (pontos 3 e 46).
        celebration = buildDiscoveryCelebration({
            monument: monument,
            xpBatch: xpBatch,
            streakResult: streakResult,
            previousProgress: previousProgress
        });
    } finally {
        closeDiscoveryCapture();
    }

    // A camara e sempre libertada e o botao volta ao estado de
    // repouso: ao fechar a celebracao pode voltar a ler outro QR.
    resetScanner();

    // Uma celebracao de cada vez: enquanto a folha estiver aberta a
    // fila de conquistas fica parada (ponto 28).
    if (!celebration || !DiscoveryUI.show(celebration)) {
        // Sem celebracao possivel, a fila segue o seu caminho normal
        scheduleNextBadge(400);
    }
}

// ============================================================
// Celebracao da descoberta — ligacao entre o dominio
// (discovery.js), os resultados reais e a interface
// (discovery-ui.js)
//
// A celebracao NAO calcula recompensas nem guarda nada: recebe o
// que os dominios ja decidiram e ja persistiram. Por isso um
// refresh nunca a repete (ponto 30).
// ============================================================

// Enquanto uma descoberta esta a ser processada, as medalhas e a
// subida de nivel que ela desbloquear ficam aqui em vez de irem
// para a fila de modais. A celebracao mostra-as no proprio ecra.
let discoveryCapture = null;

function openDiscoveryCapture() {
    discoveryCapture = { badges: [], levelUp: null };
}

function closeDiscoveryCapture() {
    discoveryCapture = null;
}

function buildDiscoveryCelebration(input) {
    const journeyId = Journey.getDefaultJourneyId();
    const journeyConfig = Journey.getJourneys().filter(j => j.id === journeyId)[0] || null;

    return Discovery.buildCelebration({
        monument: input.monument,
        zones: state.zones,
        actions: XP.ACTION,

        journeyId: journeyId,
        cityId: journeyConfig ? journeyConfig.cityId : null,
        islandId: journeyConfig ? journeyConfig.islandId : null,

        xpBatch: input.xpBatch,
        streakResult: input.streakResult,

        // O progresso real da jornada, ja actualizado
        progress: Journey.getJourneyProgress(journeyId),
        previousProgress: input.previousProgress,
        nextStep: Journey.getCurrentJourneyStep(journeyId),

        // Recompensas retidas durante esta descoberta
        badges: discoveryCapture ? discoveryCapture.badges : [],
        levelUp: discoveryCapture ? discoveryCapture.levelUp : null
    });
}

function initDiscoveryCelebration() {
    DiscoveryUI.init({
        // O CTA principal abre o album que ja existe (ponto 18)
        onOpenAlbum: (monumentId) => openMonumentPhotos(monumentId),

        // Continuar: a proxima etapa no mapa, ou o percurso completo
        // quando a jornada ja esta fechada (ponto 19)
        onContinueJourney: (result) => {
            if (result.next) {
                focusMonumentFromJourney(result.next.monumentId);
                return;
            }
            JourneyUI.openJourney();
        },

        onShowOnMap: (monumentId) => focusMonumentFromJourney(monumentId),

        // Fechar devolve o lugar a fila de conquistas
        onClosed: () => scheduleNextBadge(400)
    });
}

// Leva ao mapa existente, centrado no monumento (ponto 23 da
// jornada: nunca ha um segundo mapa)
function focusMonumentFromJourney(monumentId) {
    const monument = state.monuments.find(m => m.id === monumentId);
    if (!monument) return;

    state.currentMonumentForMap = monument;
    showMapView();
}

function stopScanner() {
    hideTorch();

    if (state.qrScanner) {
        state.qrScanner.stop();
        state.qrScanner = null;
    }
    
    if (scannerVideo.srcObject) {
        scannerVideo.srcObject.getTracks().forEach(track => track.stop());
        scannerVideo.srcObject = null;
    }
}

function resetScanner() {
    startScannerBtn.innerHTML = `<i class="fas fa-qrcode mr-3 text-xl"></i> <span data-i18n="scanQr">${t('scanQr')}</span>`;
    startScannerBtn.disabled = false;
    scannerOverlay.classList.add('hidden');
    closeScannerBtn.classList.add('hidden');
    stopScanner();
}

// Progress functions
function updateProgress() {
    const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
    
    // Update stats
    monumentsScanned.textContent = state.scannedMonuments.length;
    totalMonuments.textContent = state.monuments.length;

    // Totais, cartao de XP e nivel (a camada de XP e a fonte de verdade)
    XPUI.render();
    updateLevelDisplay();

    
    // Update badges earned count
    const earnedBadges = state.badges.filter(badge => badge.unlocked).length;
    badgesEarned.textContent = earnedBadges;
    
    // Update lists
    updateDiscoveredMonumentsList();
    updateMonumentsList();
    updateMapMarkers();
    renderZonesView();

    // A jornada reage a qualquer mudanca nas descobertas, sem
    // recarregar a pagina (ponto 24). Deriva sempre do estado real.
    JourneyUI.render();
}

function checkForBadges() {
    const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
    
    state.badges.forEach(badge => {
        if (!badge.unlocked && progress >= badge.threshold) {
            badge.unlocked = true;
            if (!state.settings || state.settings.achievementAlerts) {
                enqueueBadge(badge);
            }
        }
    });
    
    renderBadges();
}

// Uma celebracao de cada vez (ponto 16): as medalhas de progresso,
// as de sequencia e as subidas de nivel partilham a mesma fila, por
// isso uma descoberta nunca abre varios modais ao mesmo tempo.
//
// A ordem e a de chegada: descoberta (no proprio cartao do scanner),
// depois medalha, depois novo nivel.
const badgeQueue = [];
let badgeQueueTimer = null;

function enqueueBadge(badge) {
    // Durante uma descoberta, a medalha e mostrada dentro da propria
    // celebracao em vez de abrir um modal por cima dela (ponto 13).
    if (discoveryCapture) {
        discoveryCapture.badges.push(badge);
        return;
    }

    badgeQueue.push({ kind: 'badge', badge: badge });
    scheduleNextBadge(1000);
}

// O novo nivel entra na mesma fila, mas abre o seu proprio modal.
// Numa descoberta, entra antes na celebracao: um unico ecra chega
// para dizer tudo o que acabou de acontecer (pontos 14 e 29).
function enqueueLevelUp(level) {
    if (discoveryCapture) {
        discoveryCapture.levelUp = level;
        return;
    }

    badgeQueue.push({ kind: 'level', level: level });
    scheduleNextBadge(1000);
}

function scheduleNextBadge(delay) {
    if (badgeQueueTimer !== null) return;
    if (!badgeQueue.length) return;

    // A celebracao da descoberta ja e uma celebracao: nada se abre
    // por cima dela. Ao fechar, a fila e retomada (ponto 28).
    if (DiscoveryUI.isOpen()) return;

    badgeQueueTimer = setTimeout(() => {
        badgeQueueTimer = null;
        if (DiscoveryUI.isOpen()) return;

        const next = badgeQueue.shift();
        if (!next) return;
        if (next.kind === 'level') LevelsUI.showLevelUp(next.level);
        else showBadge(next.badge);
    }, delay);
}

function showBadge(badge) {
    badgeIcon.className = `w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 badge-animation ${badge.color}`;
    badgeIcon.innerHTML = `<i class="${badge.icon} ${badge.iconColor} text-4xl"></i>`;
    
    badgeTitle.textContent = badge.name;
    badgeDescription.textContent = badge.description;
    badgeMessage.textContent = badge.message;
    
    badgeModal.classList.remove('hidden');
}

function closeBadge() {
    badgeModal.classList.add('hidden');
    scheduleNextBadge(400);
}

function showAchievementDetails(badge) {
    achievementIcon.className = `w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${badge.color}`;
    achievementIcon.innerHTML = `<i class="${badge.icon} ${badge.iconColor} text-3xl"></i>`;
    
    achievementTitle.textContent = badge.name;
    achievementDescription.textContent = badge.description;
    achievementMessage.textContent = badge.message;
    
    achievementModal.classList.remove('hidden');
}

function closeAchievementDetails() {
    achievementModal.classList.add('hidden');
}

function showMonumentDetails(monument) {
    monumentModalImage.src = monument.image;
    monumentModalImage.alt = monument.name;
    monumentModalImage.onerror = function() {
        this.src = 'imagens/placeholder.jpg';
        this.onerror = null;
    };
    
    monumentModalName.textContent = monument.name;
    monumentModalDescription.textContent = monument.description;
    monumentModalPoints.textContent = `+${monument.points}`;
    
    // Store monument for map navigation
    monumentLocation.onclick = () => {
        state.currentMonumentForMap = monument;
        closeMonumentDetails();
        showMapView();
    };
    
    monumentModal.classList.remove('hidden');
}

function closeMonumentDetails() {
    monumentModal.classList.add('hidden');
}

function renderBadges() {
    badgesContainer.innerHTML = '';
    
    state.badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = `hh-badge ${badge.unlocked ? 'is-unlocked' : 'is-locked'}`;
        badgeElement.dataset.threshold = badge.threshold;
        
        if (badge.unlocked) {
            badgeElement.addEventListener('click', () => showAchievementDetails(badge));
        }
        
        badgeElement.innerHTML = `
            <div class="hh-badge-ring ${badge.unlocked ? 'badge-animation' : ''}">
                <i class="${badge.icon}"></i>
            </div>
            <span class="hh-badge-pct">${badge.threshold}%</span>
            <span class="hh-badge-name" title="${badge.name}">${badgeText(badge.id, 'short') || badge.name}</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
}

// List functions
function updateDiscoveredMonumentsList() {
    if (state.scannedMonuments.length === 0) {
        discoveredMonumentsList.innerHTML = `<p class="hh-empty" data-i18n="noMonumentsYet">${t('noMonumentsYet')}</p>`;
        return;
    }
    
    discoveredMonumentsList.innerHTML = '';
    state.scannedMonuments.forEach(monument => {
        const monumentElement = document.createElement('div');
        monumentElement.className = 'hh-mon-card';
        
        monumentElement.addEventListener('click', () => showMonumentDetails(monument));
        
        monumentElement.innerHTML = `
            <img src="${monument.image}" alt="${monument.name}" class="hh-mon-thumb"
                 onerror="this.src='imagens/placeholder.jpg'; this.onerror=null;">
            <div class="hh-mon-info">
                <h4 class="hh-mon-name">${monument.name}</h4>
                <p class="hh-mon-desc">${monument.description.substring(0, 80)}...</p>
            </div>
            <div class="hh-mon-points">
                <div class="hh-mon-pts">+${monument.points}</div>
                <div class="hh-mon-pts-label">${t('pointsWord')}</div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        discoveredMonumentsList.appendChild(monumentElement);
    });
}

function updateMonumentsList() {
    monumentsList.innerHTML = '';
    state.monuments.forEach(monument => {
        const isScanned = state.scannedMonuments.some(m => m.id === monument.id);
        const monumentElement = document.createElement('div');
        monumentElement.className = `hh-mon-card hh-map-mon ${isScanned ? 'is-unlocked' : 'is-locked'}`;
        monumentElement.addEventListener('click', () => openMonumentPhotos(monument.id));
        
        const imageClass = isScanned ? '' : 'blurred-image';
        const statusText = isScanned ? t('statusUnlocked') : t('statusLocked');
        const statusColor = isScanned ? 'is-ok' : 'is-off';
        const descriptionText = isScanned ? monument.description : t('scanToDiscover');
        
        monumentElement.innerHTML = `
            <img src="${monument.image}" 
                 alt="${monument.name}" 
                 class="hh-mon-thumb ${imageClass} cursor-pointer"
                 data-monument-id="${monument.id}"
                 onerror="this.src='imagens/placeholder.jpg'; this.onerror=null;">
            <div class="hh-mon-info">
                <h4 class="hh-mon-name">${monument.name}</h4>
                <p class="hh-mon-desc">${descriptionText}</p>
                <p class="hh-mon-status ${statusColor}">${statusText}</p>
            </div>
            <div class="hh-mon-state">
                <span class="hh-state-badge ${isScanned ? 'is-ok' : 'is-off'}">
                    <i class="fas ${isScanned ? 'fa-check' : 'fa-lock'}"></i>
                </span>
                ${isScanned ? `<span class="hh-state-pts">${monument.points} ${t('pts')}</span>` : ''}
                <i class="fas fa-chevron-right hh-state-chevron"></i>
            </div>
        `;
        monumentsList.appendChild(monumentElement);
    });
}

function updateMapMarkers() {
    if (!map) return;
    
    // Update user location popup if it exists
    if (state.userLocationMarker) {
        state.userLocationMarker.setPopupContent(createUserLocationPopup());
    }
    
    markers.forEach(({ marker, monument }) => {
        applyMarkerBehaviour(marker, monument);
        if (marker.getPopup()) {
            marker.setPopupContent(monumentPopupHtml(monument));
        }
    });
}

function updateProfileView() {
    updateProgress();
    StreakUI.render();
}

// ============================================================
// Pagina do monumento (abre a partir do mapa, ao tocar num
// monumento ja descoberto)
// ============================================================
function openMonumentPhotos(monumentId) {
    const monument = state.monuments.find(m => m.id === monumentId);
    if (!monument) return;

    // So os monumentos ja descobertos tem pagina
    const isScanned = state.scannedMonuments.some(m => m.id === monumentId);
    if (!isScanned) {
        alert(t('mustDiscoverFirst'));
        return;
    }

    state.currentMonumentForPhotos = monument;
    state.monumentTagsDraft = getMonumentTags(monumentId);
    monumentNote.value = localStorage.getItem(monumentKey('note', monumentId)) || '';

    renderMonumentPage();
    monumentPhotosModal.classList.remove('hidden');
    document.body.classList.add('hh-no-scroll');
    monumentPhotosModal.querySelector('.hh-mp-sheet').scrollTop = 0;
}

function closeMonumentPhotos() {
    monumentPhotosModal.classList.add('hidden');
    document.body.classList.remove('hh-no-scroll');
    state.currentMonumentForPhotos = null;
    state.monumentTagsDraft = [];
    noteEditing = false;
}

function isMonumentPageOpen() {
    return !monumentPhotosModal.classList.contains('hidden');
}

// Desenha todo o conteudo da pagina do monumento
function renderMonumentPage() {
    const monument = state.currentMonumentForPhotos;
    if (!monument) return;

    const scanned = state.scannedMonuments.find(m => m.id === monument.id);

    monumentPhotosImage.src = monument.image;
    monumentPhotosImage.alt = monument.name;
    monumentPhotosImage.onerror = function () {
        this.src = 'imagens/placeholder.jpg';
        this.onerror = null;
    };

    monumentPhotosName.textContent = monument.name;
    monumentPageLocation.textContent = t('monumentCity');
    monumentPagePoints.textContent = monument.points;

    const visitDate = formatShortDate(scanned && scanned.discoveredAt);
    monumentPageVisit.textContent = visitDate
        ? t('visitedOn', { d: visitDate })
        : t('visitDateUnknown');

    // XP ja obtido por este monumento (ponto 37)
    if (monumentPageXpChip) {
        monumentPageXpChip.classList.toggle(
            'is-earned',
            XP.hasReward(XP.ACTION.MONUMENT_DISCOVERED, monument.id)
        );
    }
    renderExperienceXpHint(monument.id);

    setNoteEditing(noteEditing);
    renderMemoryTags();
    updateUserPhotosGrid();
}

// --- Minha experiencia ---
function renderMonumentNote() {
    const note = (monumentNote.value || '').trim();
    monumentNoteText.textContent = note || t('noNoteYet');
    monumentNoteText.classList.toggle('is-empty', !note);
}

function setNoteEditing(editing) {
    noteEditing = editing;
    monumentNote.classList.toggle('hidden', !editing);
    monumentNoteText.classList.toggle('hidden', editing);
    editNoteBtn.classList.toggle('is-editing', editing);
    editNoteBtnLabel.textContent = editing ? t('done') : t('edit');

    const icon = editNoteBtn.querySelector('i');
    if (icon) icon.className = editing ? 'fas fa-check' : 'fas fa-pen';

    if (editing) {
        monumentNote.focus();
    } else {
        renderMonumentNote();
    }
}

function toggleNoteEditing() {
    setNoteEditing(!noteEditing);
}

// --- Memorias rapidas ---
function getMonumentTags(monumentId) {
    try {
        const saved = JSON.parse(localStorage.getItem(monumentKey('tags', monumentId)));
        return Array.isArray(saved) ? saved : [];
    } catch (e) {
        return [];
    }
}

function renderMemoryTags() {
    monumentPageTags.innerHTML = '';

    MEMORY_TAGS.forEach(tag => {
        const isOn = state.monumentTagsDraft.indexOf(tag.id) !== -1;
        const tagButton = document.createElement('button');
        tagButton.type = 'button';
        tagButton.className = `hh-mp-tag ${isOn ? 'is-on' : ''}`;
        tagButton.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        tagButton.innerHTML = `<i class="${tag.icon}"></i><span>${t(tag.key)}</span>`;
        tagButton.addEventListener('click', () => toggleMemoryTag(tag.id));
        monumentPageTags.appendChild(tagButton);
    });
}

function toggleMemoryTag(tagId) {
    const index = state.monumentTagsDraft.indexOf(tagId);
    if (index === -1) {
        state.monumentTagsDraft.push(tagId);
    } else {
        state.monumentTagsDraft.splice(index, 1);
    }
    renderMemoryTags();
}

// --- Album de fotos ---
//
// A imagem vive no Supabase Storage. Aqui fica so o que a app
// precisa para a mostrar: o caminho, as medidas e a data. Deixou de
// haver Data URLs no localStorage — eram eles que esgotavam a quota
// do browser quando um album crescia.
//
// Tres formas ja existiram, e todas continuam a ser lidas:
//   "data:..."                    album muito antigo
//   { id, data, createdAt }       album anterior a nuvem
//   { id, path, width, ... }      album actual, no Storage
//
// As duas primeiras nascem PENDENTES: ficam em casa com a imagem, e
// sobem — comprimidas — assim que houver ligacao.
function createPhotoId() {
    return 'photo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function normalizeMonumentPhoto(entry) {
    if (typeof entry === 'string') {
        return { id: createPhotoId(), data: entry, createdAt: null, pending: true };
    }

    if (!entry || typeof entry !== 'object') return null;

    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : null;
    const id = typeof entry.id === 'string' ? entry.id : createPhotoId();

    if (typeof entry.path === 'string' && entry.path) {
        return {
            id: id,
            path: entry.path,
            width: entry.width || null,
            height: entry.height || null,
            bytes: entry.bytes || null,
            originalBytes: entry.originalBytes || null,
            format: entry.format || null,
            createdAt: createdAt
        };
    }

    if (typeof entry.data === 'string') {
        return {
            id: id,
            data: entry.data,
            format: entry.format || null,
            createdAt: createdAt,
            pending: true
        };
    }

    return null;
}

// Pixel transparente: o lugar da fotografia enquanto o link
// assinado nao chega, em vez do icone de imagem partida.
const PHOTO_PLACEHOLDER =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error('nao foi possivel ler a imagem')); };
        reader.readAsDataURL(blob);
    });
}

async function dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    return await response.blob();
}

function getMonumentPhotos(monumentId) {
    try {
        const saved = JSON.parse(localStorage.getItem(monumentKey('photos', monumentId)));
        if (!Array.isArray(saved)) return [];
        return saved.map(normalizeMonumentPhoto).filter(Boolean);
    } catch (e) {
        return [];
    }
}

function saveMonumentPhotos(monumentId, photos) {
    localStorage.setItem(monumentKey('photos', monumentId), JSON.stringify(photos));
}

function updateUserPhotosGrid() {
    if (!state.currentMonumentForPhotos) return;

    const monumentId = state.currentMonumentForPhotos.id;
    const savedPhotos = getMonumentPhotos(monumentId);
    const isFull = savedPhotos.length >= MONUMENT_PHOTO_LIMIT;

    monumentPagePhotoCount.textContent = savedPhotos.length === 1
        ? t('photosCountOne')
        : t('photosCountMany', { n: savedPhotos.length });
    monumentPageAlbumCount.textContent = t('albumCount', {
        n: savedPhotos.length,
        max: MONUMENT_PHOTO_LIMIT
    });

    userPhotosGrid.innerHTML = '';

    renderPhotoXpHint(monumentId);

    savedPhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'hh-mp-photo';
        // A grelha aparece de imediato; as que vivem no Storage
        // recebem o link assinado logo a seguir (hydratePhotoUrls).
        photoElement.innerHTML = `
            <img src="${photo.pending ? photo.data : PHOTO_PLACEHOLDER}"
                 alt="${t('photoAlt')} ${index + 1}"
                 data-path="${photo.path || ''}">
            <button type="button" class="hh-mp-photo-del" title="${t('close')}">
                <i class="fas fa-times"></i>
            </button>
        `;
        photoElement.querySelector('.hh-mp-photo-del')
            .addEventListener('click', () => deletePhoto(index));
        userPhotosGrid.appendChild(photoElement);
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = `hh-mp-add ${isFull ? 'is-full' : ''}`;
    addButton.innerHTML = `<i class="fas fa-camera"></i><span>${t('addPhoto')}</span>`;
    addButton.addEventListener('click', () => {
        if (isFull) {
            alert(t('photoLimitReached', { max: MONUMENT_PHOTO_LIMIT }));
            return;
        }
        uploadPhoto();
    });
    userPhotosGrid.appendChild(addButton);

    hydratePhotoUrls(monumentId);
}

// Pede os links assinados das fotografias visiveis e pinta-as.
async function hydratePhotoUrls(monumentId) {
    const paths = getMonumentPhotos(monumentId)
        .filter(function (photo) { return !!photo.path; })
        .map(function (photo) { return photo.path; });

    if (!paths.length) return;

    const urls = await HeritageCloud.signImageUrls(paths);

    // A pagina pode ter mudado enquanto esperavamos: so pintamos se
    // ainda for este o monumento aberto.
    if (!state.currentMonumentForPhotos) return;
    if (state.currentMonumentForPhotos.id !== monumentId) return;

    userPhotosGrid.querySelectorAll('img[data-path]').forEach(function (img) {
        const url = urls[img.dataset.path];
        if (url) img.src = url;
    });
}

// --- Guardar experiencia (nota + etiquetas) ---
function saveExperience() {
    if (!state.currentMonumentForPhotos) return;

    const monumentId = state.currentMonumentForPhotos.id;
    const note = monumentNote.value.trim();

    if (note) {
        localStorage.setItem(monumentKey('note', monumentId), note);
    } else {
        localStorage.removeItem(monumentKey('note', monumentId));
    }

    if (state.monumentTagsDraft.length) {
        localStorage.setItem(monumentKey('tags', monumentId), JSON.stringify(state.monumentTagsDraft));
    } else {
        localStorage.removeItem(monumentKey('tags', monumentId));
    }

    // A experiencia e as etiquetas seguem para a nuvem; as
    // fotografias deste monumento ficam aqui, neste browser.
    HeritageCloud.queueEntry(monumentId, note, state.monumentTagsDraft);

    setNoteEditing(false);

    // XP: so a primeira experiencia com conteudo real rende, e editar
    // ou voltar a guardar nao rende outra vez (pontos 12 e 13).
    let xpBatch = null;
    if (note.length >= MIN_EXPERIENCE_LENGTH) {
        xpBatch = awardXP([{
            action: XP.ACTION.EXPERIENCE_ADDED,
            monumentId: monumentId,
            entityId: 'experience_' + monumentId
        }]);
    }
    renderExperienceXpHint(monumentId);

    // So conta como exploracao se houver mesmo uma memoria registada
    let streakResult = null;
    if (note || state.monumentTagsDraft.length) {
        streakResult = registerExploration(
            ExplorationStreak.ACTIVITY.EXPERIENCE_SAVED,
            monumentId,
            { hasNote: !!note, tags: state.monumentTagsDraft.length }
        );
    }

    announceReward(xpBatch, streakResult, t('experienceSaved'));
}

function takePhoto() {
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
    }).then(stream => {
        state.cameraStream = stream;
        cameraVideo.srcObject = stream;
        cameraModal.classList.remove('hidden');
    }).catch(err => {
        console.error("Camera error: ", err);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
    });
}

function closeCameraCapture() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
    }
    cameraModal.classList.add('hidden');
}

function capturePhoto() {
    if (!state.cameraStream || !state.currentMonumentForPhotos) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;

    context.drawImage(cameraVideo, 0, 0);

    // Sai em qualidade alta e como Blob: quem comprime e o
    // compressor, uma unica vez, e nao esta funcao. Comprimir aqui
    // tambem so faria a imagem passar duas vezes pela perda.
    canvas.toBlob(function (blob) {
        if (blob) savePhoto(blob);
    }, 'image/jpeg', 0.92);

    closeCameraCapture();
}

function uploadPhoto() {
    photoUploadInput.click();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    event.target.value = '';

    if (!file || !state.currentMonumentForPhotos) return;

    // O ficheiro segue inteiro para o compressor: ler para Data URL
    // antes de comprimir so gastava memoria a mais.
    savePhoto(file);
}

// Guardar uma fotografia: comprimir, subir, registar.
//
// A ordem importa. O XP so e atribuido depois de a fotografia estar
// mesmo guardada — na nuvem, ou em casa a espera de subir. Nunca se
// anuncia o que nao ficou gravado (ponto 4 da seccao 13).
async function savePhoto(source) {
    if (!state.currentMonumentForPhotos) return;

    const monumentId = state.currentMonumentForPhotos.id;
    const savedPhotos = getMonumentPhotos(monumentId);

    if (savedPhotos.length >= MONUMENT_PHOTO_LIMIT) {
        alert(t('photoLimitReached', { max: MONUMENT_PHOTO_LIMIT }));
        return;
    }

    let compressed;
    try {
        compressed = await ImageCompressor.compress(source, 'ALBUM');
    } catch (error) {
        alert(t('photoUnreadable'));
        return;
    }

    const photo = {
        id: createPhotoId(),
        createdAt: new Date().toISOString(),
        width: compressed.width,
        height: compressed.height,
        bytes: compressed.bytes,
        originalBytes: compressed.originalBytes,
        format: compressed.format
    };

    const uploaded = await uploadPhotoToCloud(monumentId, photo, compressed.blob, compressed.extension);

    if (!uploaded) {
        // Sem rede, fica em casa com a imagem e marcada para subir.
        // Conta na mesma, porque FOI gravada — e liberta a quota do
        // browser assim que a ligacao voltar.
        photo.pending = true;
        photo.data = await blobToDataUrl(compressed.blob);
    }

    savedPhotos.push(photo);
    saveMonumentPhotos(monumentId, savedPhotos);

    updateUserPhotosGrid();

    // XP: so as primeiras fotografias de cada monumento rendem, e os
    // lugares gastos nunca sao devolvidos ao apagar (pontos 10 e 11).
    const xpBatch = awardXP([{
        action: XP.ACTION.PHOTO_ADDED,
        monumentId: monumentId,
        entityId: photo.id
    }]);

    // A pista tem de reflectir o lugar que esta atribuicao acabou de gastar
    renderPhotoXpHint(monumentId);

    // Varias fotos no mesmo dia continuam a valer um unico dia
    const streakResult = registerExploration(
        ExplorationStreak.ACTIVITY.PHOTO_ADDED,
        monumentId
    );

    announceReward(xpBatch, streakResult, photoSavedMessage(photo, compressed));
}

// O aviso conta o que aconteceu: que ficou a espera de rede, ou
// quanto espaco a compressao poupou.
function photoSavedMessage(photo, compressed) {
    if (photo.pending) return t('photoQueued');
    if (compressed.savings > 0) return t('photoCompressed', { saved: compressed.savings });
    return t('photoSaved');
}

// Sobe o ficheiro e regista-o. Devolve `true` so quando as duas
// coisas correram bem — meia gravacao nao e uma gravacao.
async function uploadPhotoToCloud(monumentId, photo, blob, extension) {
    if (!HeritageCloud.isAvailable() || !HeritageCloud.getUserId()) return false;

    const path = HeritageCloud.photoPath(monumentId, photo.id, extension);

    const upload = await HeritageCloud.uploadImage(path, blob, photo.format);
    if (!upload.ok) return false;

    const registered = await HeritageCloud.savePhotoRow({
        id: photo.id,
        monumentId: monumentId,
        path: path,
        width: photo.width,
        height: photo.height,
        bytes: photo.bytes,
        originalBytes: photo.originalBytes,
        format: photo.format,
        createdAt: photo.createdAt
    });

    if (!registered.ok) {
        // O ficheiro subiu mas o registo nao: apaga-se o ficheiro,
        // ou ficava a ocupar espaco sem nada que o soubesse mostrar.
        await HeritageCloud.removeImages([path]);
        return false;
    }

    photo.path = path;
    delete photo.pending;
    delete photo.data;
    return true;
}

// As fotografias que ficaram em casa — por falta de rede, ou porque
// foram tiradas antes de existir nuvem — sobem agora. Cada uma que
// sobe liberta a quota do browser que estava a ocupar.
async function flushPendingPhotos() {
    if (!HeritageCloud.isAvailable() || !HeritageCloud.getUserId()) return;
    if (!navigator.onLine) return;

    for (let i = 0; i < state.monuments.length; i++) {
        const monumentId = state.monuments[i].id;
        const photos = getMonumentPhotos(monumentId);

        const hasPending = photos.some(function (photo) { return photo.pending; });
        if (!hasPending) continue;

        let changed = false;

        for (let j = 0; j < photos.length; j++) {
            const photo = photos[j];
            if (!photo.pending || !photo.data) continue;

            const prepared = await preparePendingPhoto(photo);
            if (!prepared) continue;

            if (await uploadPhotoToCloud(monumentId, photo, prepared.blob, prepared.extension)) {
                changed = true;
            }
        }

        if (!changed) continue;

        saveMonumentPhotos(monumentId, photos);

        if (state.currentMonumentForPhotos && state.currentMonumentForPhotos.id === monumentId) {
            updateUserPhotosGrid();
        }
    }
}

// Uma fotografia ja comprimida nao volta a passar pelo compressor:
// perder qualidade uma segunda vez nao poupa nada que compense. Uma
// antiga, guardada em bruto, e comprimida agora — e e ai que esta o
// maior ganho de espaco de toda esta mudanca.
async function preparePendingPhoto(photo) {
    try {
        if (photo.format) {
            return {
                blob: await dataUrlToBlob(photo.data),
                extension: ImageCompressor.extensionFor(photo.format)
            };
        }

        const compressed = await ImageCompressor.compress(photo.data, 'ALBUM');

        photo.width = compressed.width;
        photo.height = compressed.height;
        photo.bytes = compressed.bytes;
        photo.originalBytes = compressed.originalBytes;
        photo.format = compressed.format;

        return { blob: compressed.blob, extension: compressed.extension };
    } catch (error) {
        return null;
    }
}

async function deletePhoto(index) {
    if (!state.currentMonumentForPhotos) return;

    const monumentId = state.currentMonumentForPhotos.id;
    const savedPhotos = getMonumentPhotos(monumentId);
    const photo = savedPhotos[index];

    if (!photo) return;
    if (!confirm(t('confirmDeletePhoto'))) return;

    // Uma fotografia que ja vive na nuvem so sai daqui depois de sair
    // de la. Apagar so em casa deixaria um ficheiro orfao a ocupar
    // espaco para sempre, sem nada que voltasse a mostra-lo.
    if (photo.path) {
        const removed = await HeritageCloud.removeImages([photo.path]);
        if (!removed.ok) {
            alert(t('photoDeleteFailed'));
            return;
        }
        await HeritageCloud.deletePhotoRow(photo.id);
    }

    // O XP ja atribuido nao e devolvido nem o lugar libertado:
    // apagar e voltar a adicionar nao rende XP outra vez.
    savedPhotos.splice(index, 1);
    saveMonumentPhotos(monumentId, savedPhotos);
    updateUserPhotosGrid();
}

// Mostra/oculta a senha nos campos do ecra de autenticacao
document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.togglePassword);
        if (!input) return;
        const hidden = input.type === 'password';
        input.type = hidden ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) icon.className = hidden ? 'far fa-eye-slash' : 'far fa-eye';
        input.focus();
    });
});

// Quando a rede volta, as imagens que estavam em casa sobem.
window.addEventListener('online', function () {
    flushPendingPhotos();
    flushPendingAvatar();
});

// Event listeners
showRegisterBtn.addEventListener('click', showRegisterForm);
showLoginBtn.addEventListener('click', showLoginForm);
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);
logoutBtn.addEventListener('click', logout);

startScannerBtn.addEventListener('click', startScanner);
closeScannerBtn.addEventListener('click', closeScanner);
if (torchBtn) torchBtn.addEventListener('click', toggleTorch);
navScanner.addEventListener('click', showScannerView);
navProfile.addEventListener('click', showProfileView);
navMap.addEventListener('click', showMapView);
if (navRanking) navRanking.addEventListener('click', showRankingView);
settingsBtn.addEventListener('click', showSettingsView);
closeBadgeModal.addEventListener('click', closeBadge);
closeAchievementModal.addEventListener('click', closeAchievementDetails);
closeMonumentModal.addEventListener('click', closeMonumentDetails);
locateUserBtn.addEventListener('click', locateUser);
if (mapFullscreenBtn) mapFullscreenBtn.addEventListener('click', toggleMapFullscreen);

// Monument page listeners
closeMonumentPhotosModal.addEventListener('click', closeMonumentPhotos);
takePhotoBtn.addEventListener('click', takePhoto);
uploadPhotoBtn.addEventListener('click', uploadPhoto);
photoUploadInput.addEventListener('change', handlePhotoUpload);
editNoteBtn.addEventListener('click', toggleNoteEditing);
saveNoteBtn.addEventListener('click', saveExperience);

// Fechar a pagina do monumento tocando fora da folha ou com Esc
monumentPhotosModal.addEventListener('click', (e) => {
    if (e.target === monumentPhotosModal) closeMonumentPhotos();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMonumentPageOpen()) closeMonumentPhotos();
});

// Camera Modal listeners
closeCameraModal.addEventListener('click', closeCameraCapture);
capturePhotoBtn.addEventListener('click', capturePhoto);

changePhotoBtn.addEventListener('click', changePhoto);
photoInput.addEventListener('change', handlePhotoChange);

// Settings listeners
themeOptions.forEach(option => {
    option.addEventListener('click', () => setTheme(option.dataset.theme));
});
languageOptions.forEach(option => {
    option.addEventListener('click', () => setLanguage(option.dataset.lang));
});
achievementAlertsToggle.addEventListener('change', (e) => toggleAchievementAlerts(e.target.checked));
if (rankingOptInToggle) {
    rankingOptInToggle.addEventListener('change', (e) => toggleRankingOptIn(e.target.checked));
}
if (openRankingBtn) openRankingBtn.addEventListener('click', showRankingView);
settingsLogoutBtn.addEventListener('click', logout);

// Handle form submissions
document.getElementById('loginEmail').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') login();
});
document.getElementById('loginPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') login();
});
document.getElementById('registerPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') register();
});

// Initialize app
async function initApp() {
    initSettings();
    initXPSystem();
    initExplorationStreak();
    initJourney();
    initDiscoveryCelebration();
    initRanking();

    // A nuvem e opcional: se a biblioteca ou a configuracao
    // faltarem, a app corre na mesma, so com este aparelho.
    HeritageCloud.init();

    const session = HeritageCloud.isAvailable()
        ? await HeritageCloud.restoreSession()
        : null;

    if (session) {
        await enterWithSession(session);
    } else if (!navigator.onLine && readLocalUser()) {
        // Sem rede no arranque, quem ja tinha entrado neste aparelho
        // continua a explorar — e o que descobrir agora sobe assim
        // que a ligacao voltar. O trabalho de campo nao pode parar
        // por causa de uma barra de sinal.
        state.user = readLocalUser();
        loadUserData();
        showMainApp();
    } else {
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
    
    renderBadges();
    updateProgress();
    updateMonumentsList();
    StreakUI.render();
    XPUI.render();
    LevelsUI.render();
    JourneyUI.render();
}

// Start the app
initApp();

// Global functions for HTML onclick
window.openMonumentPhotos = openMonumentPhotos;
window.deletePhoto = deletePhoto;