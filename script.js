// App state
const state = {
    user: null,
    points: 0,
    scannedMonuments: [],
    qrScanner: null,
    currentMonumentForMap: null,
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
            image: "imagens/casa_da_cultura.jpg",
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
const startScannerBtn = document.getElementById('startScannerBtn');
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
const profileBtn = document.getElementById('profileBtn');
const mapBtn = document.getElementById('mapBtn');
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

// Initialize map
let map;
let markers = [];

function initMap() {
    if (map) return;
    
    map = L.map('map').setView([16.8907, -24.9874], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add markers for all monuments
    state.monuments.forEach(monument => {
        const isScanned = state.scannedMonuments.some(m => m.id === monument.id);
        
        const marker = L.marker([monument.lat, monument.lng])
            .addTo(map)
            .bindPopup(`
                <div class="text-center">
                    <img src="${monument.image}" alt="${monument.name}" class="w-full h-24 object-cover rounded mb-2">
                    <b>${monument.name}</b><br>
                    <span class="text-sm">${monument.description}</span><br>
                    <span class="text-blue-600 font-bold">${monument.points} pontos</span>
                    ${isScanned ? '<br><span class="text-green-600">✓ Descoberto</span>' : ''}
                </div>
            `);
        
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
        
        markers.push({ marker, monument });
    });

    // If there's a monument to focus on, center map on it
    if (state.currentMonumentForMap) {
        const monument = state.currentMonumentForMap;
        map.setView([monument.lat, monument.lng], 17);
        
        // Open popup for the monument
        const targetMarker = markers.find(m => m.monument.id === monument.id);
        if (targetMarker) {
            targetMarker.marker.openPopup();
        }
        
        // Reset the state
        state.currentMonumentForMap = null;
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
        alert('Por favor, preencha todos os campos');
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
    
    alert('Email ou senha incorretos');
}

function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
        alert('Por favor, preencha todos os campos');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    // Create new user
    const user = {
        name,
        email,
        password,
        photo: null,
        points: 0,
        scannedMonuments: []
    };
    
    // Save user data
    localStorage.setItem('heritageUser', JSON.stringify(user));
    state.user = user;
    
    showMainApp();
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        saveUserData();
        state.user = null;
        state.points = 0;
        state.scannedMonuments = [];
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        stopScanner();
    }
}

function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    updateUserInterface();
    showScannerView();
}

function loadUserData() {
    if (state.user) {
        state.points = state.user.points || 0;
        state.scannedMonuments = state.user.scannedMonuments || [];
        
        // Update badges based on current progress
        const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
        state.badges.forEach(badge => {
            badge.unlocked = progress >= badge.threshold;
        });
    }
}

function saveUserData() {
    if (state.user) {
        state.user.points = state.points;
        state.user.scannedMonuments = state.scannedMonuments;
        localStorage.setItem('heritageUser', JSON.stringify(state.user));
    }
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

// Navigation functions
function showScannerView() {
    scannerView.classList.remove('hidden');
    profileView.classList.add('hidden');
    mapView.classList.add('hidden');
    updateNavButtons('scanner');
}

function showProfileView() {
    scannerView.classList.add('hidden');
    profileView.classList.remove('hidden');
    mapView.classList.add('hidden');
    updateProfileView();
    updateNavButtons('profile');
}

function showMapView() {
    scannerView.classList.add('hidden');
    profileView.classList.add('hidden');
    mapView.classList.remove('hidden');
    initMap();
    updateNavButtons('map');
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
}

function updateNavButtons(activeView) {
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
    startScannerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i> Iniciando...';
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
        startScannerBtn.innerHTML = '<i class="fas fa-search mr-3"></i> Escaneando...';
        
        // Initialize QR Scanner
        state.qrScanner = new QrScanner(scannerVideo, result => {
            handleQRResult(result.data);
        }, {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
        });
        
        state.qrScanner.start();
        
    }).catch(err => {
        console.error("Camera error: ", err);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
        resetScanner();
    });
}

function handleQRResult(qrData) {
    // Find monument by QR code
    const monument = state.monuments.find(m => m.qrCode === qrData);
    
    if (!monument) {
        alert("QR Code não reconhecido. Certifique-se de escanear um QR Code de monumento válido.");
        return;
    }
    
    // Check if already scanned
    const alreadyScanned = state.scannedMonuments.some(m => m.id === monument.id);
    if (alreadyScanned) {
        alert("Você já descobriu este monumento!");
        return;
    }
    
    // Add to scanned monuments
    state.scannedMonuments.push(monument);
    state.points += monument.points;
    
    // Stop scanner
    stopScanner();
    
    // Show result
    scannerOverlay.classList.add('hidden');
    scannerResult.classList.remove('hidden');
    scannedMonumentName.textContent = monument.name;
    scannedMonumentDesc.textContent = monument.description;
    pointsEarned.textContent = monument.points;
    monumentImage.src = monument.image;
    monumentImage.alt = monument.name;
    monumentImage.onerror = function() {
        this.src = 'imagens/placeholder.jpg';
        this.onerror = null;
    };
    
    // Update UI and save data
    updateProgress();
    checkForBadges();
    saveUserData();
}

function stopScanner() {
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
    startScannerBtn.innerHTML = '<i class="fas fa-qrcode mr-3"></i> Escanear QR Code';
    startScannerBtn.disabled = false;
    scannerOverlay.classList.add('hidden');
    stopScanner();
}

function closeResult() {
    scannerResult.classList.add('hidden');
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
    totalPoints.textContent = state.points;
    totalPointsHeader.textContent = state.points;
    
    // Update user level
    const level = Math.floor(state.points / 100) + 1;
    userLevel.textContent = level;
    
    // Update badges earned count
    const earnedBadges = state.badges.filter(badge => badge.unlocked).length;
    badgesEarned.textContent = earnedBadges;
    
    // Update lists
    updateDiscoveredMonumentsList();
    updateMonumentsList();
    updateMapMarkers();
}

function checkForBadges() {
    const progress = (state.scannedMonuments.length / state.monuments.length) * 100;
    
    state.badges.forEach(badge => {
        if (!badge.unlocked && progress >= badge.threshold) {
            badge.unlocked = true;
            setTimeout(() => showBadge(badge), 1000);
        }
    });
    
    renderBadges();
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
        badgeElement.className = `flex flex-col items-center ${badge.unlocked ? 'cursor-pointer' : 'opacity-40'}`;
        
        if (badge.unlocked) {
            badgeElement.addEventListener('click', () => showAchievementDetails(badge));
        }
        
        badgeElement.innerHTML = `
            <div class="w-14 h-14 ${badge.color} rounded-full flex items-center justify-center mb-2 ${badge.unlocked ? 'badge-animation shadow-lg hover:scale-105 transition-transform' : ''}">
                <i class="${badge.icon} ${badge.iconColor} text-xl"></i>
            </div>
            <span class="text-xs text-center font-medium text-gray-600">${badge.threshold}%</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
}

// List functions
function updateDiscoveredMonumentsList() {
    if (state.scannedMonuments.length === 0) {
        discoveredMonumentsList.innerHTML = '<p class="text-gray-500 text-center py-8">Ainda não descobriu nenhum monumento</p>';
        return;
    }
    
    discoveredMonumentsList.innerHTML = '';
    state.scannedMonuments.forEach(monument => {
        const monumentElement = document.createElement('div');
        monumentElement.className = 'monument-card bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-100 cursor-pointer hover:shadow-md transition-all';
        
        monumentElement.addEventListener('click', () => showMonumentDetails(monument));
        
        monumentElement.innerHTML = `
            <div class="flex items-center">
                <img src="${monument.image}" alt="${monument.name}" 
                     class="w-16 h-16 object-cover rounded-lg mr-4"
                     onerror="this.src='imagens/placeholder.jpg'; this.onerror=null;">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800">${monument.name}</h4>
                    <p class="text-xs text-gray-600 mt-1 line-clamp-2">${monument.description.substring(0, 80)}...</p>
                </div>
                <div class="text-center">
                    <div class="text-green-600 font-bold text-lg">+${monument.points}</div>
                    <div class="text-xs text-gray-500">pontos</div>
                    <i class="fas fa-chevron-right text-gray-400 text-xs mt-1"></i>
                </div>
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
        monumentElement.className = `monument-card ${isScanned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} p-4 rounded-xl border`;
        
        const imageClass = isScanned ? '' : 'blurred-image';
        const statusText = isScanned ? 'Desbloqueado' : 'Bloqueado';
        const statusColor = isScanned ? 'text-green-600' : 'text-red-600';
        const descriptionText = isScanned ? monument.description : 'Escaneie o QR Code para descobrir este monumento';
        
        monumentElement.innerHTML = `
            <div class="flex items-center">
                <img src="${monument.image}" 
                     alt="${monument.name}" 
                     class="w-12 h-12 object-cover rounded-lg mr-3 ${imageClass}"
                     onerror="this.src='imagens/placeholder.jpg'; this.onerror=null;">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800">${monument.name}</h4>
                    <p class="text-xs text-gray-600 mt-1">${descriptionText}</p>
                    <p class="text-xs font-semibold ${statusColor} mt-1">${statusText}</p>
                </div>
                <div class="text-center">
                    <div class="w-8 h-8 ${isScanned ? 'bg-green-100' : 'bg-gray-200'} rounded-full flex items-center justify-center">
                        <i class="fas ${isScanned ? 'fa-check text-green-600' : 'fa-lock text-gray-500'} text-sm"></i>
                    </div>
                    <div class="text-xs mt-1 font-bold ${isScanned ? 'text-green-600' : 'text-gray-400'}">
                        ${isScanned ? monument.points + ' pts' : '?'}
                    </div>
                </div>
            </div>
        `;
        monumentsList.appendChild(monumentElement);
    });
}

function updateMapMarkers() {
    if (!map) return;
    
    markers.forEach(({ marker, monument }) => {
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
        
        marker.setPopupContent(`
            <div class="text-center">
                <img src="${monument.image}" alt="${monument.name}" class="w-full h-24 object-cover rounded mb-2">
                <b>${monument.name}</b><br>
                <span class="text-sm">${monument.description}</span><br>
                <span class="text-blue-600 font-bold">${monument.points} pontos</span>
                ${isScanned ? '<br><span class="text-green-600">✓ Descoberto</span>' : ''}
            </div>
        `);
    });
}

function updateProfileView() {
    updateProgress();
}

// Event listeners
showRegisterBtn.addEventListener('click', showRegisterForm);
showLoginBtn.addEventListener('click', showLoginForm);
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);
logoutBtn.addEventListener('click', logout);

startScannerBtn.addEventListener('click', startScanner);
closeResultBtn.addEventListener('click', closeResult);
navScanner.addEventListener('click', showScannerView);
navProfile.addEventListener('click', showProfileView);
navMap.addEventListener('click', showMapView);
profileBtn.addEventListener('click', showProfileView);
mapBtn.addEventListener('click', showMapView);
closeBadgeModal.addEventListener('click', closeBadge);
closeAchievementModal.addEventListener('click', closeAchievementDetails);
closeMonumentModal.addEventListener('click', closeMonumentDetails);

changePhotoBtn.addEventListener('click', changePhoto);
photoInput.addEventListener('change', handlePhotoChange);

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
}

// Start the app
initApp();