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
const scannerResult = document.getElementById('scannerResult');
const closeResultBtn = document.getElementById('closeResultBtn');
const scannedMonumentName = document.getElementById('scannedMonumentName');
const scannedMonumentDesc = document.getElementById('scannedMonumentDesc');
const pointsEarned = document.getElementById('pointsEarned');
const monumentImage = document.getElementById('monumentImage');
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
const userLevel = document.getElementById('userLevel');
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

// Streak de exploracao
const scannerStreakNote = document.getElementById('scannerStreakNote');

// XP
const scannerProgress = document.getElementById('scannerProgress');
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

    // If there's a monument to focus on, center map on it
    if (state.currentMonumentForMap) {
        const monument = state.currentMonumentForMap;
        map.setView([monument.lat, monument.lng], 17);
        
        // Open popup for the monument (os descobertos abrem a pagina propria)
        const targetMarker = markers.find(m => m.monument.id === monument.id);
        if (targetMarker && targetMarker.marker.getPopup()) {
            targetMarker.marker.openPopup();
        }
        
        // Reset the state
        state.currentMonumentForMap = null;
    }
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

// Authentication functions
function showRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
}

function showLoginForm() {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert(t('fillAllFields'));
        return;
    }
    
    // Simulate login (in real app, this would be an API call)
    const savedUser = localStorage.getItem('heritageUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email === email) {
            state.user = user;
            loadUserData();
            showMainApp();
            return;
        }
    }
    
    alert(t('wrongCredentials'));
}

function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
        alert(t('fillAllFields'));
        return;
    }
    
    if (password.length < 6) {
        alert(t('passwordTooShort'));
        return;
    }
    
    // Create new user
    const user = {
        name,
        email,
        password,
        photo: null,
        points: 0,
        scannedMonuments: [],
        xp: XP.createEmptyWallet(),
        explorationStreak: ExplorationStreak.createEmptyStreak()
    };
    
    // Save user data
    localStorage.setItem('heritageUser', JSON.stringify(user));
    state.user = user;
    
    showMainApp();
}

function logout() {
    if (confirm(t('confirmLogout'))) {
        saveUserData();
        state.user = null;
        state.points = 0;
        state.scannedMonuments = [];
        StreakUI.render();
        XPUI.render();
        document.body.classList.remove('hh-dark-bg');
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        stopScanner();
    }
}

function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    updateUserInterface();
    StreakUI.render();
    XPUI.render();
    renderZonesView();
    showScannerView();
}

function loadUserData() {
    if (state.user) {
        state.scannedMonuments = state.user.scannedMonuments || [];

        // Pontos antigos passam a XP (uma unica vez) e as zonas ja
        // completas antes deste sistema recebem a recompensa.
        migrateUserToXP();
        syncZoneCompletions();
        state.points = XP.getTotalXP();
                
        // Update badges based on current progress
        const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
        state.badges.forEach(badge => {
            badge.unlocked = progress >= badge.threshold;
        });

        // Os monumentos guardados podem ter sido gravados noutro idioma
        applyContentLanguage();
    }
}

function saveUserData() {
    if (state.user) {
        // `points` fica como espelho do XP, para que qualquer codigo
        // (ou perfil) antigo continue a ler um valor correcto.
        state.user.points = state.user.xp ? state.user.xp.total : state.points;
        state.user.scannedMonuments = state.scannedMonuments;
        localStorage.setItem('heritageUser', JSON.stringify(state.user));
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

    // A UI reage a qualquer mudanca de XP, venha de onde vier (ponto 52)
    XP.subscribeToXPChanges((change) => {
        state.points = XP.getTotalXP();
        XPUI.applyChange(change);
        updateLevelDisplay();
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

    return batch;
}

// Uma accao nunca produz dois avisos sobrepostos: quando a sequencia
// abre um novo dia, e a celebracao que mostra tambem o XP; nos restantes
// casos basta o aviso discreto (ponto 23).
function announceReward(xpBatch, streakResult, fallbackText) {
    if (streakResult && streakResult.isNewDay) {
        StreakUI.showCelebration(streakResult, XPUI.summaryText(xpBatch));
        return;
    }
    XPUI.toast(xpBatch, fallbackText);
}

// O nivel continua a ser derivado do total (100 XP por nivel)
function updateLevelDisplay() {
    userLevel.textContent = Math.floor(state.points / 100) + 1;
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
        
        if (state.user.photo) {
            profilePhoto.src = state.user.photo;
            profilePhoto.classList.remove('hidden');
            profileIcon.classList.add('hidden');
        }
    }
}

// Profile photo functions
function changePhoto() {
    photoInput.click();
}

function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoData = e.target.result;
            profilePhoto.src = photoData;
            profilePhoto.classList.remove('hidden');
            profileIcon.classList.add('hidden');
            
            // Save photo to user data
            if (state.user) {
                state.user.photo = photoData;
                saveUserData();
            }
        };
        reader.readAsDataURL(file);
    }
}

// Settings functions
const SETTINGS_KEY = 'heritageSettings';
const defaultSettings = {
    theme: 'system',          // 'light' | 'dark' | 'system'
    lang: detectBrowserLanguage(),
    achievementAlerts: true
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

    // Cartao da sequencia (textos e dias da semana)
    StreakUI.render();

    // Cartao de XP e zonas
    XPUI.render();
    renderZonesView();

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

    // Segue o tema do sistema apenas quando a opção 'Sistema' está activa
    darkModeQuery.addEventListener('change', () => {
        if (state.settings.theme === 'system') applyTheme();
    });
}

// Navigation functions
function showScannerView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.remove('hidden');
    profileView.classList.add('hidden');
    mapView.classList.add('hidden');
    settingsView.classList.add('hidden');
    updateNavButtons('scanner');
}

function showProfileView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.remove('hidden');
    mapView.classList.add('hidden');
    settingsView.classList.add('hidden');
    updateProfileView();
    updateNavButtons('profile');
}

function showSettingsView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.add('hidden');
    mapView.classList.add('hidden');
    settingsView.classList.remove('hidden');
    updateThemeSelector();
    updateLanguageSelector();
    achievementAlertsToggle.checked = state.settings.achievementAlerts;
    updateNavButtons('settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMapView() {
    document.body.classList.add('hh-dark-bg');
    scannerView.classList.add('hidden');
    profileView.classList.add('hidden');
    settingsView.classList.add('hidden');
    mapView.classList.remove('hidden');
    renderZonesView();
    initMap();
    updateNavButtons('map');
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
}

function updateNavButtons(activeView) {
    if (settingsBtn) settingsBtn.classList.toggle('is-active', activeView === 'settings');

    // Desliza o indicador do glass radio group para a aba activa
    const navBar = document.querySelector('nav.hh-nav');
    if (navBar) {
        navBar.dataset.active = ['scanner', 'profile', 'map'].includes(activeView) ? activeView : 'none';
    }

    const buttons = [
        { element: navScanner, view: 'scanner' },
        { element: navProfile, view: 'profile' },
        { element: navMap, view: 'map' }
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

    const discoveryAward = xpBatch.awarded.filter(
        result => result.action === XP.ACTION.MONUMENT_DISCOVERED
    )[0];

    // Sequencia de exploracao: a descoberta conta como actividade do dia
    const streakResult = registerExploration(
        ExplorationStreak.ACTIVITY.MONUMENT_DISCOVERY,
        monument.id,
        { points: monument.points }
    );
    
    // Stop scanner
    stopScanner();
    
    // Show result
    scannerOverlay.classList.add('hidden');
    scannerResult.classList.remove('hidden');
    scannedMonumentName.textContent = monument.name;
    scannedMonumentDesc.textContent = monument.description;
    pointsEarned.textContent = discoveryAward ? discoveryAward.amount : monument.points;
    scannerProgress.textContent = t('xpProgressMonuments', {
        done: state.scannedMonuments.length,
        total: state.monuments.length
    });
    monumentImage.src = monument.image;
    monumentImage.alt = monument.name;
    monumentImage.onerror = function() {
        this.src = 'imagens/placeholder.jpg';
        this.onerror = null;
    };

    // Zona concluida, quando for o caso (ponto 24)
    XPUI.renderDiscovery(xpBatch);

    // So celebramos a sequencia na primeira actividade valida do dia
    StreakUI.renderDiscoveryNote(scannerStreakNote, streakResult);
    
    // Update UI and save data
    updateProgress();
    checkForBadges();
    saveUserData();
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

function closeResult() {
    scannerResult.classList.add('hidden');
    XPUI.clearDiscovery();
    StreakUI.renderDiscoveryNote(scannerStreakNote, null);
    resetScanner();
}

// Progress functions
function updateProgress() {
    const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
    
    // Update stats
    monumentsScanned.textContent = state.scannedMonuments.length;
    totalMonuments.textContent = state.monuments.length;

    // Totais e cartao de XP (a camada de XP e a fonte de verdade)
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

// Uma conquista de cada vez: as medalhas de progresso e as de
// sequencia partilham o mesmo modal.
const badgeQueue = [];
let badgeQueueTimer = null;

function enqueueBadge(badge) {
    badgeQueue.push(badge);
    scheduleNextBadge(1000);
}

function scheduleNextBadge(delay) {
    if (badgeQueueTimer !== null) return;
    if (!badgeQueue.length) return;

    badgeQueueTimer = setTimeout(() => {
        badgeQueueTimer = null;
        const next = badgeQueue.shift();
        if (next) showBadge(next);
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
    monumentNote.value = localStorage.getItem(`monument_note_${monumentId}`) || '';

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
        const saved = JSON.parse(localStorage.getItem(`monument_tags_${monumentId}`));
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
// Cada fotografia passa a ser { id, data, createdAt }. Os albuns
// antigos eram arrays de data URLs; sao convertidos ao serem lidos,
// sem perder nada.
function createPhotoId() {
    return 'photo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function normalizeMonumentPhoto(entry) {
    if (typeof entry === 'string') {
        return { id: createPhotoId(), data: entry, createdAt: null };
    }
    if (entry && typeof entry === 'object' && typeof entry.data === 'string') {
        return {
            id: typeof entry.id === 'string' ? entry.id : createPhotoId(),
            data: entry.data,
            createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : null
        };
    }
    return null;
}

function getMonumentPhotos(monumentId) {
    try {
        const saved = JSON.parse(localStorage.getItem(`monument_photos_${monumentId}`));
        if (!Array.isArray(saved)) return [];
        return saved.map(normalizeMonumentPhoto).filter(Boolean);
    } catch (e) {
        return [];
    }
}

function saveMonumentPhotos(monumentId, photos) {
    localStorage.setItem(`monument_photos_${monumentId}`, JSON.stringify(photos));
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
        photoElement.innerHTML = `
            <img src="${photo.data}" alt="${t('photoAlt')} ${index + 1}">
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
}

// --- Guardar experiencia (nota + etiquetas) ---
function saveExperience() {
    if (!state.currentMonumentForPhotos) return;

    const monumentId = state.currentMonumentForPhotos.id;
    const note = monumentNote.value.trim();

    if (note) {
        localStorage.setItem(`monument_note_${monumentId}`, note);
    } else {
        localStorage.removeItem(`monument_note_${monumentId}`);
    }

    if (state.monumentTagsDraft.length) {
        localStorage.setItem(`monument_tags_${monumentId}`, JSON.stringify(state.monumentTagsDraft));
    } else {
        localStorage.removeItem(`monument_tags_${monumentId}`);
    }

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
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    savePhoto(photoData);
    
    closeCameraCapture();
}

function uploadPhoto() {
    photoUploadInput.click();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file || !state.currentMonumentForPhotos) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        savePhoto(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
}

function savePhoto(photoData) {
    if (!state.currentMonumentForPhotos) return;
    
    const monumentId = state.currentMonumentForPhotos.id;
    const savedPhotos = getMonumentPhotos(monumentId);

    if (savedPhotos.length >= MONUMENT_PHOTO_LIMIT) {
        alert(t('photoLimitReached', { max: MONUMENT_PHOTO_LIMIT }));
        return;
    }

    const photo = { id: createPhotoId(), data: photoData, createdAt: new Date().toISOString() };
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

    announceReward(xpBatch, streakResult, t('photoSaved'));
}

function deletePhoto(index) {
    if (!state.currentMonumentForPhotos) return;
    
    const monumentId = state.currentMonumentForPhotos.id;
    const savedPhotos = getMonumentPhotos(monumentId);

    if (confirm(t('confirmDeletePhoto'))) {
        // O XP ja atribuido nao e devolvido nem o lugar libertado:
        // apagar e voltar a adicionar nao rende XP outra vez.
        savedPhotos.splice(index, 1);
        saveMonumentPhotos(monumentId, savedPhotos);
        updateUserPhotosGrid();
    }
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

// Event listeners
showRegisterBtn.addEventListener('click', showRegisterForm);
showLoginBtn.addEventListener('click', showLoginForm);
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);
logoutBtn.addEventListener('click', logout);

startScannerBtn.addEventListener('click', startScanner);
closeScannerBtn.addEventListener('click', closeScanner);
if (torchBtn) torchBtn.addEventListener('click', toggleTorch);
closeResultBtn.addEventListener('click', closeResult);
navScanner.addEventListener('click', showScannerView);
navProfile.addEventListener('click', showProfileView);
navMap.addEventListener('click', showMapView);
settingsBtn.addEventListener('click', showSettingsView);
closeBadgeModal.addEventListener('click', closeBadge);
closeAchievementModal.addEventListener('click', closeAchievementDetails);
closeMonumentModal.addEventListener('click', closeMonumentDetails);
locateUserBtn.addEventListener('click', locateUser);

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
function initApp() {
    initSettings();
    initXPSystem();
    initExplorationStreak();

    const savedUser = localStorage.getItem('heritageUser');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
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
}

// Start the app
initApp();

// Global functions for HTML onclick
window.openMonumentPhotos = openMonumentPhotos;
window.deletePhoto = deletePhoto;