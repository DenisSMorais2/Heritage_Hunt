// ============================================================
// Heritage Hunt CV — traduções da interface (pt / en / fr)
// ============================================================

const AVAILABLE_LANGUAGES = ['pt', 'en', 'fr'];
let currentLanguage = 'pt';

const translations = {
    "pt": {
        "tagline": "Descubra os tesouros de Mindelo",
        "welcomeBack": "Bem-vindo de volta!",
        "welcomeBackSub": "Continue a sua jornada de descoberta",
        "authKicker": "História<br>Pessoas<br>Lugares<br>Sempre consigo",
        "authMotto": "Mais do que lugares<br>são histórias",
        "togglePassword": "Mostrar/ocultar senha",
        "email": "Email",
        "password": "Senha",
        "login": "Entrar",
        "noAccount": "Não tem conta? Criar conta",
        "noAccountPre": "Não tem conta?",
        "createAccountLink": "Criar conta",
        "createAccount": "Criar conta",
        "createAccountSub": "Junte-se à aventura histórica",
        "fullName": "Nome Completo",
        "haveAccount": "Já tem conta? Fazer login",
        "haveAccountPre": "Já tem conta?",
        "loginLink": "Fazer login",
        "greeting": "Olá",
        "tipProfile": "Perfil",
        "tipMap": "Mapa",
        "tipSettings": "Definições",
        "tipLogout": "Sair",
        "navScanner": "Scanner",
        "navProfile": "Perfil",
        "navMap": "Mapa",
        "searchingQr": "Procurando por QR Code...",
        "pointsExclaim": "pontos!",
        "keepExploring": "Continuar Explorando",
        "scanQr": "Escanear QR Code",
        "scanHint": "Aponte a câmera para um QR Code de monumento",
        "tagDiscover": "Descubra",
        "tagExplore": "Explore",
        "tagPreserve": "Preserve",
        "sealSub": "Nossa história<br>vive aqui",
        "torch": "Luz",
        "heritageQuote": "Cada monumento conta uma história.<br>Continue explorando!",
        "starting": "Iniciando...",
        "scanning": "Escaneando...",
        "yourProgress": "Seu Progresso",
        "level": "Nível",
        "monumentsLabel": "Monumentos",
        "pointsLabel": "Pontos",
        "achievementsLabel": "Conquistas",
        "cultureConnects": "Cultura<br>nos conecta",
        "placeStory": "Cada lugar<br>conta uma<br>história",
        "discoveredMonuments": "Monumentos Descobertos",
        "noMonumentsYet": "Ainda não descobriu nenhum monumento",
        "settings": "Definições",
        "appearance": "Aparência",
        "appearanceSub": "Escolha entre o tema claro, escuro ou do sistema.",
        "themeLight": "Claro",
        "themeDark": "Escuro",
        "themeSystem": "Sistema",
        "language": "Idioma",
        "languageSub": "Escolha o idioma da aplicação.",
        "achievementAlerts": "Alertas de conquistas",
        "achievementAlertsSub": "Mostrar um popup quando uma medalha é desbloqueada.",
        "logoutAction": "Terminar sessão",
        "version": "Heritage Hunt CV • versão 1.0",
        "mindeloMonuments": "Monumentos de Mindelo",
        "mapTitle": "Mapa de Mindelo",
        "mapSubtitle": "Explore a cidade e descubra os seus monumentos.",
        "legendFound": "Descoberto",
        "legendTodo": "Por descobrir",
        "myLocation": "Sua Localização",
        "currentLocation": "Sua localização atual",
        "nearestMonument": "Monumento mais próximo:",
        "distanceAway": "{d}m de distância",
        "pointsWord": "pontos",
        "discoveredCheck": "✓ Descoberto",
        "statusUnlocked": "Desbloqueado",
        "statusLocked": "Bloqueado",
        "scanToDiscover": "Escaneie o QR Code para descobrir este monumento",
        "pts": "pts",
        "fantastic": "Fantástico!",
        "achieved": "Conquistado!",
        "close": "Fechar",
        "takePhoto": "Tirar Foto",
        "uploadPhoto": "Carregar Foto",
        "yourNote": "Sua Nota sobre este Monumento",
        "notePlaceholder": "Escreva suas impressões sobre este monumento...",
        "saveNote": "Salvar Nota",
        "yourPhotos": "Suas Fotos",
        "noPhotos": "Nenhuma foto ainda.<br>Tire ou carregue fotos deste monumento!",
        "photoAlt": "Foto",
        "clickToCapture": "Clique para capturar",
        "locationLabel": "Localização",
        "monumentDiscovered": "Monumento Descoberto!",
        "discoveredOnJourney": "Descoberto em sua jornada",
        "fillAllFields": "Por favor, preencha todos os campos",
        "wrongCredentials": "Email ou senha incorretos",
        "passwordTooShort": "A senha deve ter pelo menos 6 caracteres",
        "confirmLogout": "Tem certeza que deseja sair?",
        "cameraError": "Não foi possível acessar a câmera. Verifique as permissões.",
        "qrNotRecognized": "QR Code não reconhecido. Certifique-se de escanear um QR Code de monumento válido.",
        "alreadyDiscovered": "Você já descobriu este monumento!",
        "mustDiscoverFirst": "Você precisa descobrir este monumento primeiro!",
        "photoSaved": "Foto salva com sucesso!",
        "confirmDeletePhoto": "Tem certeza que deseja excluir esta foto?",
        "noteSaved": "Nota salva com sucesso!",
        "noteRemoved": "Nota removida!",
        "heritageCrest": "PATRIMÓNIO<br>DE CABO VERDE",
        "monumentCity": "Mindelo, São Vicente",
        "yourAlbumOf": "O teu álbum deste monumento",
        "photosCountOne": "1 foto",
        "photosCountMany": "{n} fotos",
        "visitedOn": "Visitado em {d}",
        "visitDateUnknown": "Descoberto",
        "myExperience": "Minha experiência",
        "edit": "Editar",
        "done": "Concluir",
        "noNoteYet": "Ainda não escreveste nada sobre este monumento.",
        "photoAlbum": "Álbum de Fotos",
        "albumCount": "{n} de {max} fotos",
        "addPhoto": "Adicionar<br>foto",
        "takePhotoShort": "Tirar foto",
        "uploadPhotoShort": "Carregar foto",
        "quickMemories": "Memórias rápidas",
        "quickMemoriesSub": "Adiciona etiquetas que representam a tua experiência",
        "tagArchitecture": "Arquitetura",
        "tagHistoricCenter": "Centro histórico",
        "tagMemorable": "Lugar marcante",
        "tagComeBack": "Quero voltar",
        "saveExperience": "Guardar experiência",
        "experienceSaved": "Experiência guardada!",
        "photoLimitReached": "Já atingiste o limite de {max} fotos para este monumento.",
        "saveError": "Não foi possível guardar. Tenta novamente.",
        "xpLabel": "XP",
        "xpTotalLabel": "XP total",
        "xpAmount": "+{n} XP",
        "xpObtained": "{n} XP obtidos",
        "xpCardTitle": "O teu XP",
        "xpRecentTitle": "Últimas atividades",
        "xpViewHistory": "Ver histórico",
        "xpHistoryTitle": "Histórico de XP",
        "xpHistoryEmpty": "Ainda não há atividade registada. Descobre um monumento para começar a tua história.",
        "xpLoadMore": "Carregar mais",
        "xpToday": "Hoje",
        "xpYesterday": "Ontem",
        "xpMonumentDiscovered": "Monumento descoberto",
        "xpPhotoAdded": "Nova memória visual",
        "xpExperienceAdded": "Experiência registada",
        "xpZoneCompleted": "Zona concluída",
        "xpDiscoveryTitle": "NOVO MONUMENTO DESCOBERTO",
        "xpZoneTitle": "ZONA CONCLUÍDA",
        "xpDiscoveryTotal": "Total desta descoberta: +{n} XP",
        "xpProgressMonuments": "Progresso: {done}/{total} monumentos",
        "xpJourneyNote": "Cada descoberta faz parte da tua história.",
        "xpPhotoHint": "+{n} XP por fotografia",
        "xpPhotoRewardsUsed": "{used}/{max} recompensas de fotografia obtidas",
        "xpPhotoRewardsDone": "Recompensas de fotografia completas",
        "xpExperienceHint": "+{n} XP na primeira experiência",
        "xpExperienceDone": "{n} XP obtidos",
        "xpMonumentEarned": "{n} XP obtidos",
        "zonesTitle": "Zonas de Mindelo",
        "zonesSubtitle": "Completa uma zona e ganha +{n} XP.",
        "zoneProgress": "{done}/{total} monumentos",
        "zoneReward": "Recompensa: +{n} XP",
        "zoneDone": "Zona concluída",
        "zones": {
            "centro_historico": "Centro Histórico",
            "frente_mar": "Frente de Mar",
            "colinas": "Colinas e Fortificações",
            "cultura_viva": "Cultura Viva"
        },
        "journeyProgress": "{done} de {total} monumentos",
        "journeyProgressAria": "Progresso da jornada",
        "journeyRemaining": "Mais {n} monumentos por descobrir.",
        "journeyRemainingOne": "Falta 1 monumento por descobrir.",
        "journeyDiscovered": "Descoberto",
        "journeyCurrent": "Próxima descoberta",
        "journeyUpcoming": "Por descobrir",
        "journeyEarned": "{n} XP obtidos",
        "journeyViewMap": "Ver no mapa",
        "journeyViewPath": "Ver percurso completo",
        "journeyContinue": "Continuar jornada",
        "journeyFirstStep": "Primeira etapa",
        "journeyEmptyTitle": "A tua jornada começa aqui.",
        "journeyCompleteTitle": "Jornada concluída",
        "journeyCompleteNote": "Conheces agora uma parte importante da história de Mindelo.",
        "journeyOtherZone": "Outros lugares",
        "journeys": {
            "mindelo_historico": {
                "name": "Jornada de Mindelo",
                "subtitle": "Cada descoberta revela uma nova parte da história."
            }
        },
        "levelLabel": "Nível",
        "levelShort": "Nível {n}",
        "levelCardTitle": "A tua jornada",
        "levelXpValue": "{n} XP",
        "levelNextLabel": "Próximo nível",
        "levelRemaining": "{n} XP para {name}",
        "levelRemainingShort": "Faltam {n} XP",
        "levelRequired": "Necessário: {n} XP",
        "levelProgressPercent": "Progresso: {n}%",
        "levelProgressAria": "Progresso para o próximo nível",
        "levelMaxLabel": "Nível máximo atual",
        "levelMaxXp": "{n}+ XP",
        "levelMaxNote": "Continua a explorar e a construir a tua história.",
        "levelViewJourney": "Ver a tua jornada",
        "levelJourneyTitle": "A tua jornada",
        "levelJourneyDone": "Concluído",
        "levelJourneyCurrent": "Atual",
        "levelJourneyLocked": "Bloqueado",
        "levelUpKicker": "NOVO NÍVEL",
        "levelUpUnlocked": "Nível desbloqueado",
        "levelUpReached": "Chegaste a {name}.",
        "levels": {
            "explorer": {
                "name": "Explorador",
                "description": "A tua jornada pelo património começa aqui."
            },
            "traveler": {
                "name": "Viajante",
                "description": "Já descobriste diferentes lugares e histórias."
            },
            "connoisseur": {
                "name": "Conhecedor",
                "description": "Cada monumento começa a revelar uma parte maior da história de Cabo Verde."
            },
            "heritage_guardian": {
                "name": "Guardião do Património",
                "description": "Exploras, conheces e valorizas a história que te rodeia."
            }
        },
        "streakTitle": "Sequência de exploração",
        "streakDayOne": "1 dia de exploração",
        "streakDayMany": "{n} dias de exploração",
        "streakJourneyContinues": "A tua jornada continua.",
        "streakTodayDone": "Exploração de hoje concluída",
        "streakTomorrow": "A tua jornada continua amanhã.",
        "streakContinueToday": "Continua a tua jornada hoje.",
        "streakEmptyTitle": "Começa a tua sequência",
        "streakEmptySub": "Descobre um monumento para iniciar a tua jornada.",
        "streakEmptyCta": "Explorar monumentos",
        "streakCurrentLabel": "Sequência atual",
        "streakBestLabel": "Melhor sequência",
        "streakTotalLabel": "Dias de exploração",
        "streakUnitDay": "dia",
        "streakUnitDays": "dias",
        "streakDaysShort": "{n} dias",
        "streakDayShortOne": "1 dia",
        "streakBestLine": "Melhor sequência: {n} dias",
        "streakBestLineOne": "Melhor sequência: 1 dia",
        "streakThisWeek": "Esta semana",
        "streakTapDayHint": "Toca num dia com exploração para ver o que aconteceu.",
        "streakNextStory": "A tua próxima história está a {d}.",
        "streakExplore": "Explorar",
        "streakKept": "SEQUÊNCIA MANTIDA",
        "streakNew": "NOVA SEQUÊNCIA",
        "streakCelebrationNote": "Mais um dia, mais uma história.",
        "streakDayEmpty": "Ainda não há exploração registada neste dia.",
        "streakActivityDiscovery": "Monumento descoberto",
        "streakActivityPhotoOne": "1 fotografia adicionada",
        "streakActivityPhotoMany": "{n} fotografias adicionadas",
        "streakActivityExperience": "Experiência registada",
        "streakActivityMission": "Missão cultural concluída",
        "streakXp": "+{n} XP",
        "streakBadgesTitle": "Conquistas de sequência",
        "streakBadgeLocked": "Por desbloquear",
        "streakMilestoneGoal": "{n} dias seguidos",
        "weekdaysShort": ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"],
        "monthsLong": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
        "streakBadges": {
            "curious": {
                "name": "Explorador Curioso",
                "short": "Curioso",
                "description": "3 dias seguidos a explorar",
                "message": "Três dias, três histórias. A curiosidade é o primeiro passo de qualquer descoberta."
            },
            "persistent": {
                "name": "Explorador Persistente",
                "short": "Persistente",
                "description": "7 dias seguidos a explorar",
                "message": "Uma semana inteira a descobrir Cabo Verde. Mindelo já te conhece pelo nome."
            },
            "mindelo": {
                "name": "Conhecedor de Mindelo",
                "short": "Conhecedor",
                "description": "14 dias seguidos a explorar",
                "message": "Duas semanas de histórias. Poucos conhecem esta cidade tão bem como tu."
            },
            "guardian": {
                "name": "Guardião do Património",
                "short": "Guardião",
                "description": "30 dias seguidos a explorar",
                "message": "Um mês a guardar a memória de Cabo Verde. Agora também fazes parte desta história."
            }
        },
        "monthsShort": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        "monuments": {
            "1": "Antigo palácio do governo colonial, construído em 1874, hoje serve como centro cultural e um dos símbolos mais importantes da história de Cabo Verde.",
            "2": "Farol histórico construído em 1886, oferece uma vista panorâmica deslumbrante da cidade e do porto de Mindelo.",
            "3": "Centro de comércio tradicional com arquitetura única, onde se encontra desde frutas tropicais até artesanato local.",
            "4": "Igreja histórica no centro da cidade, construída no século XIX, com fachada em estilo colonial português.",
            "5": "Pequena réplica do famoso monumento de Lisboa, símbolo da ligação histórica entre Cabo Verde e Portugal.",
            "6": "Antigo edifício da alfândega com arquitetura colonial, testemunha do importante passado comercial de Mindelo.",
            "7": "Museu dedicado à morna, música tradicional de Cabo Verde, onde se homenageia Cesária Évora e outros artistas.",
            "8": "Principal praça da cidade com coreto histórico, local de encontro e eventos culturais ao ar livre.",
            "9": "Exposição do melhor artesanato cabo-verdiano, desde cerâmica a tecidos coloridos com técnicas tradicionais.",
            "10": "Importante centro cultural de Mindelo que promove exposições, concertos e eventos literários durante todo o ano.",
            "11": "Porto histórico que foi crucial para o desenvolvimento da cidade, ponto de parada de navios transatlânticos no século XIX.",
            "12": "Antigo forte que protegia a baía de Mindelo, construído no século XVIII, hoje oferece vistas espetaculares do oceano."
        },
        "badges": {
            "1": {
                "name": "Explorador Iniciante",
                "short": "Explorador",
                "description": "Descobriu 25% dos monumentos!",
                "message": "Você está no caminho certo, pequeno explorador! Mindelo está começando a revelar seus segredos para você! 🌟"
            },
            "2": {
                "name": "Aventureiro Intermediário",
                "short": "Conhecedor",
                "description": "Descobriu 50% dos monumentos!",
                "message": "Metade do caminho percorrido! Você já conhece Mindelo melhor que muitos turistas! 🗺️"
            },
            "3": {
                "name": "Mestre Explorador",
                "short": "Entusiasta",
                "description": "Descobriu 75% dos monumentos!",
                "message": "Uau! Você quase conhece Mindelo melhor que os locais! Só mais um esforço para se tornar uma lenda! 🏆"
            },
            "4": {
                "name": "Lenda de Mindelo",
                "short": "Mestre",
                "description": "Descobriu todos os monumentos!",
                "message": "Parabéns! Você conquistou Mindelo como um verdadeiro herói cultural! Agora você é um embaixador da história desta bela cidade! 👑"
            }
        }
    },
    "en": {
        "tagline": "Discover the treasures of Mindelo",
        "welcomeBack": "Welcome back!",
        "welcomeBackSub": "Continue your journey of discovery",
        "authKicker": "History<br>People<br>Places<br>Always with you",
        "authMotto": "More than places<br>they are stories",
        "togglePassword": "Show/hide password",
        "email": "Email",
        "password": "Password",
        "login": "Sign in",
        "noAccount": "No account? Create one",
        "noAccountPre": "No account?",
        "createAccountLink": "Create one",
        "createAccount": "Create account",
        "createAccountSub": "Join the historical adventure",
        "fullName": "Full Name",
        "haveAccount": "Already have an account? Sign in",
        "haveAccountPre": "Already have an account?",
        "loginLink": "Sign in",
        "greeting": "Hello",
        "tipProfile": "Profile",
        "tipMap": "Map",
        "tipSettings": "Settings",
        "tipLogout": "Log out",
        "navScanner": "Scanner",
        "navProfile": "Profile",
        "navMap": "Map",
        "searchingQr": "Looking for a QR Code...",
        "pointsExclaim": "points!",
        "keepExploring": "Keep Exploring",
        "scanQr": "Scan QR Code",
        "scanHint": "Point the camera at a monument QR Code",
        "tagDiscover": "Discover",
        "tagExplore": "Explore",
        "tagPreserve": "Preserve",
        "sealSub": "Our history<br>lives here",
        "torch": "Light",
        "heritageQuote": "Every monument tells a story.<br>Keep exploring!",
        "starting": "Starting...",
        "scanning": "Scanning...",
        "yourProgress": "Your Progress",
        "level": "Level",
        "monumentsLabel": "Monuments",
        "pointsLabel": "Points",
        "achievementsLabel": "Achievements",
        "cultureConnects": "Culture<br>connects us",
        "placeStory": "Every place<br>tells a<br>story",
        "discoveredMonuments": "Discovered Monuments",
        "noMonumentsYet": "You haven't discovered any monuments yet",
        "settings": "Settings",
        "appearance": "Appearance",
        "appearanceSub": "Choose between the light, dark or system theme.",
        "themeLight": "Light",
        "themeDark": "Dark",
        "themeSystem": "System",
        "language": "Language",
        "languageSub": "Choose the app language.",
        "achievementAlerts": "Achievement alerts",
        "achievementAlertsSub": "Show a popup when a badge is unlocked.",
        "logoutAction": "Log out",
        "version": "Heritage Hunt CV • version 1.0",
        "mindeloMonuments": "Monuments of Mindelo",
        "mapTitle": "Map of Mindelo",
        "mapSubtitle": "Explore the city and discover its monuments.",
        "legendFound": "Discovered",
        "legendTodo": "To discover",
        "myLocation": "Your Location",
        "currentLocation": "Your current location",
        "nearestMonument": "Nearest monument:",
        "distanceAway": "{d}m away",
        "pointsWord": "points",
        "discoveredCheck": "✓ Discovered",
        "statusUnlocked": "Unlocked",
        "statusLocked": "Locked",
        "scanToDiscover": "Scan the QR Code to discover this monument",
        "pts": "pts",
        "fantastic": "Fantastic!",
        "achieved": "Unlocked!",
        "close": "Close",
        "takePhoto": "Take Photo",
        "uploadPhoto": "Upload Photo",
        "yourNote": "Your Note about this Monument",
        "notePlaceholder": "Write your impressions about this monument...",
        "saveNote": "Save Note",
        "yourPhotos": "Your Photos",
        "noPhotos": "No photos yet.<br>Take or upload photos of this monument!",
        "photoAlt": "Photo",
        "clickToCapture": "Tap to capture",
        "locationLabel": "Location",
        "monumentDiscovered": "Monument Discovered!",
        "discoveredOnJourney": "Discovered on your journey",
        "fillAllFields": "Please fill in all fields",
        "wrongCredentials": "Incorrect email or password",
        "passwordTooShort": "The password must be at least 6 characters long",
        "confirmLogout": "Are you sure you want to log out?",
        "cameraError": "Could not access the camera. Please check your permissions.",
        "qrNotRecognized": "QR Code not recognised. Make sure you scan a valid monument QR Code.",
        "alreadyDiscovered": "You have already discovered this monument!",
        "mustDiscoverFirst": "You need to discover this monument first!",
        "photoSaved": "Photo saved successfully!",
        "confirmDeletePhoto": "Are you sure you want to delete this photo?",
        "noteSaved": "Note saved successfully!",
        "noteRemoved": "Note removed!",
        "heritageCrest": "CAPE VERDE<br>HERITAGE",
        "monumentCity": "Mindelo, São Vicente",
        "yourAlbumOf": "Your album for this monument",
        "photosCountOne": "1 photo",
        "photosCountMany": "{n} photos",
        "visitedOn": "Visited on {d}",
        "visitDateUnknown": "Discovered",
        "myExperience": "My experience",
        "edit": "Edit",
        "done": "Done",
        "noNoteYet": "You haven't written anything about this monument yet.",
        "photoAlbum": "Photo Album",
        "albumCount": "{n} of {max} photos",
        "addPhoto": "Add<br>photo",
        "takePhotoShort": "Take photo",
        "uploadPhotoShort": "Upload photo",
        "quickMemories": "Quick memories",
        "quickMemoriesSub": "Add tags that capture your experience",
        "tagArchitecture": "Architecture",
        "tagHistoricCenter": "Historic centre",
        "tagMemorable": "Memorable place",
        "tagComeBack": "I'll come back",
        "saveExperience": "Save experience",
        "experienceSaved": "Experience saved!",
        "photoLimitReached": "You have reached the limit of {max} photos for this monument.",
        "saveError": "Could not save. Please try again.",
        "xpLabel": "XP",
        "xpTotalLabel": "Total XP",
        "xpAmount": "+{n} XP",
        "xpObtained": "{n} XP earned",
        "xpCardTitle": "Your XP",
        "xpRecentTitle": "Recent activity",
        "xpViewHistory": "View history",
        "xpHistoryTitle": "XP history",
        "xpHistoryEmpty": "No activity yet. Discover a monument to start your story.",
        "xpLoadMore": "Load more",
        "xpToday": "Today",
        "xpYesterday": "Yesterday",
        "xpMonumentDiscovered": "Monument discovered",
        "xpPhotoAdded": "New visual memory",
        "xpExperienceAdded": "Experience recorded",
        "xpZoneCompleted": "Zone completed",
        "xpDiscoveryTitle": "NEW MONUMENT DISCOVERED",
        "xpZoneTitle": "ZONE COMPLETED",
        "xpDiscoveryTotal": "Total for this discovery: +{n} XP",
        "xpProgressMonuments": "Progress: {done}/{total} monuments",
        "xpJourneyNote": "Every discovery is part of your story.",
        "xpPhotoHint": "+{n} XP per photo",
        "xpPhotoRewardsUsed": "{used}/{max} photo rewards earned",
        "xpPhotoRewardsDone": "Photo rewards complete",
        "xpExperienceHint": "+{n} XP for your first experience",
        "xpExperienceDone": "{n} XP earned",
        "xpMonumentEarned": "{n} XP earned",
        "zonesTitle": "Zones of Mindelo",
        "zonesSubtitle": "Complete a zone and earn +{n} XP.",
        "zoneProgress": "{done}/{total} monuments",
        "zoneReward": "Reward: +{n} XP",
        "zoneDone": "Zone completed",
        "zones": {
            "centro_historico": "Historic Centre",
            "frente_mar": "Waterfront",
            "colinas": "Hills and Forts",
            "cultura_viva": "Living Culture"
        },
        "journeyProgress": "{done} of {total} monuments",
        "journeyProgressAria": "Journey progress",
        "journeyRemaining": "{n} more monuments to discover.",
        "journeyRemainingOne": "1 monument left to discover.",
        "journeyDiscovered": "Discovered",
        "journeyCurrent": "Next discovery",
        "journeyUpcoming": "To discover",
        "journeyEarned": "{n} XP earned",
        "journeyViewMap": "View on map",
        "journeyViewPath": "See the full route",
        "journeyContinue": "Continue journey",
        "journeyFirstStep": "First stop",
        "journeyEmptyTitle": "Your journey starts here.",
        "journeyCompleteTitle": "Journey complete",
        "journeyCompleteNote": "You now know an important part of Mindelo's history.",
        "journeyOtherZone": "Other places",
        "journeys": {
            "mindelo_historico": {
                "name": "Mindelo Journey",
                "subtitle": "Every discovery reveals a new part of the story."
            }
        },
        "levelLabel": "Level",
        "levelShort": "Level {n}",
        "levelCardTitle": "Your journey",
        "levelXpValue": "{n} XP",
        "levelNextLabel": "Next level",
        "levelRemaining": "{n} XP to {name}",
        "levelRemainingShort": "{n} XP to go",
        "levelRequired": "Required: {n} XP",
        "levelProgressPercent": "Progress: {n}%",
        "levelProgressAria": "Progress towards the next level",
        "levelMaxLabel": "Current highest level",
        "levelMaxXp": "{n}+ XP",
        "levelMaxNote": "Keep exploring and building your story.",
        "levelViewJourney": "See your journey",
        "levelJourneyTitle": "Your journey",
        "levelJourneyDone": "Completed",
        "levelJourneyCurrent": "Current",
        "levelJourneyLocked": "Locked",
        "levelUpKicker": "NEW LEVEL",
        "levelUpUnlocked": "Level unlocked",
        "levelUpReached": "You have reached {name}.",
        "levels": {
            "explorer": {
                "name": "Explorer",
                "description": "Your heritage journey starts here."
            },
            "traveler": {
                "name": "Traveller",
                "description": "You have already discovered different places and stories."
            },
            "connoisseur": {
                "name": "Connoisseur",
                "description": "Every monument starts to reveal a wider part of Cape Verde's history."
            },
            "heritage_guardian": {
                "name": "Heritage Guardian",
                "description": "You explore, you know and you value the history around you."
            }
        },
        "streakTitle": "Exploration streak",
        "streakDayOne": "1 day of exploration",
        "streakDayMany": "{n} days of exploration",
        "streakJourneyContinues": "Your journey continues.",
        "streakTodayDone": "Today's exploration complete",
        "streakTomorrow": "Your journey continues tomorrow.",
        "streakContinueToday": "Continue your journey today.",
        "streakEmptyTitle": "Start your streak",
        "streakEmptySub": "Discover a monument to begin your journey.",
        "streakEmptyCta": "Explore monuments",
        "streakCurrentLabel": "Current streak",
        "streakBestLabel": "Best streak",
        "streakTotalLabel": "Exploration days",
        "streakUnitDay": "day",
        "streakUnitDays": "days",
        "streakDaysShort": "{n} days",
        "streakDayShortOne": "1 day",
        "streakBestLine": "Best streak: {n} days",
        "streakBestLineOne": "Best streak: 1 day",
        "streakThisWeek": "This week",
        "streakTapDayHint": "Tap a day with exploration to see what happened.",
        "streakNextStory": "Your next story is {d} away.",
        "streakExplore": "Explore",
        "streakKept": "STREAK KEPT",
        "streakNew": "NEW STREAK",
        "streakCelebrationNote": "One more day, one more story.",
        "streakDayEmpty": "No exploration recorded on this day yet.",
        "streakActivityDiscovery": "Monument discovered",
        "streakActivityPhotoOne": "1 photo added",
        "streakActivityPhotoMany": "{n} photos added",
        "streakActivityExperience": "Experience recorded",
        "streakActivityMission": "Cultural mission completed",
        "streakXp": "+{n} XP",
        "streakBadgesTitle": "Streak achievements",
        "streakBadgeLocked": "Locked",
        "streakMilestoneGoal": "{n} days in a row",
        "weekdaysShort": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        "monthsLong": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "streakBadges": {
            "curious": {
                "name": "Curious Explorer",
                "short": "Curious",
                "description": "3 days of exploring in a row",
                "message": "Three days, three stories. Curiosity is the first step of every discovery."
            },
            "persistent": {
                "name": "Persistent Explorer",
                "short": "Persistent",
                "description": "7 days of exploring in a row",
                "message": "A whole week discovering Cape Verde. Mindelo already knows you by name."
            },
            "mindelo": {
                "name": "Mindelo Connoisseur",
                "short": "Connoisseur",
                "description": "14 days of exploring in a row",
                "message": "Two weeks of stories. Few people know this city as well as you do."
            },
            "guardian": {
                "name": "Heritage Guardian",
                "short": "Guardian",
                "description": "30 days of exploring in a row",
                "message": "A month keeping Cape Verde's memory alive. You are part of this story now."
            }
        },
        "monthsShort": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "monuments": {
            "1": "Former colonial government palace, built in 1874, today a cultural centre and one of the most important symbols of Cape Verde's history.",
            "2": "Historic lighthouse built in 1886, offering a stunning panoramic view of the city and the port of Mindelo.",
            "3": "A traditional trading hub with unique architecture, offering everything from tropical fruit to local handicrafts.",
            "4": "Historic church in the city centre, built in the 19th century, with a Portuguese colonial-style façade.",
            "5": "A small replica of the famous Lisbon monument, a symbol of the historical link between Cape Verde and Portugal.",
            "6": "Former customs building with colonial architecture, a witness to Mindelo's important commercial past.",
            "7": "Museum dedicated to the morna, Cape Verde's traditional music, honouring Cesária Évora and other artists.",
            "8": "The city's main square with its historic bandstand, a meeting place for open-air cultural events.",
            "9": "An exhibition of the finest Cape Verdean crafts, from ceramics to colourful fabrics made with traditional techniques.",
            "10": "An important cultural centre in Mindelo hosting exhibitions, concerts and literary events all year round.",
            "11": "Historic port that was crucial to the city's development, a stopover for transatlantic ships in the 19th century.",
            "12": "Old fort that protected Mindelo bay, built in the 18th century, today offering spectacular ocean views."
        },
        "badges": {
            "1": {
                "name": "Beginner Explorer",
                "short": "Explorer",
                "description": "You discovered 25% of the monuments!",
                "message": "You're on the right track, little explorer! Mindelo is starting to reveal its secrets to you! 🌟"
            },
            "2": {
                "name": "Intermediate Adventurer",
                "short": "Connoisseur",
                "description": "You discovered 50% of the monuments!",
                "message": "Halfway there! You already know Mindelo better than many tourists! 🗺️"
            },
            "3": {
                "name": "Master Explorer",
                "short": "Enthusiast",
                "description": "You discovered 75% of the monuments!",
                "message": "Wow! You almost know Mindelo better than the locals! One more push to become a legend! 🏆"
            },
            "4": {
                "name": "Legend of Mindelo",
                "short": "Master",
                "description": "You discovered every monument!",
                "message": "Congratulations! You conquered Mindelo like a true cultural hero! You are now an ambassador of this beautiful city's history! 👑"
            }
        }
    },
    "fr": {
        "tagline": "Découvrez les trésors de Mindelo",
        "welcomeBack": "Bon retour !",
        "welcomeBackSub": "Poursuivez votre voyage de découverte",
        "authKicker": "Histoire<br>Personnes<br>Lieux<br>Toujours avec vous",
        "authMotto": "Plus que des lieux<br>ce sont des histoires",
        "togglePassword": "Afficher/masquer le mot de passe",
        "email": "E-mail",
        "password": "Mot de passe",
        "login": "Se connecter",
        "noAccount": "Pas de compte ? Créer un compte",
        "noAccountPre": "Pas de compte ?",
        "createAccountLink": "Créer un compte",
        "createAccount": "Créer un compte",
        "createAccountSub": "Rejoignez l'aventure historique",
        "fullName": "Nom complet",
        "haveAccount": "Déjà un compte ? Se connecter",
        "haveAccountPre": "Déjà un compte ?",
        "loginLink": "Se connecter",
        "greeting": "Bonjour",
        "tipProfile": "Profil",
        "tipMap": "Carte",
        "tipSettings": "Paramètres",
        "tipLogout": "Déconnexion",
        "navScanner": "Scanner",
        "navProfile": "Profil",
        "navMap": "Carte",
        "searchingQr": "Recherche d'un QR Code...",
        "pointsExclaim": "points !",
        "keepExploring": "Continuer l'exploration",
        "scanQr": "Scanner le QR Code",
        "scanHint": "Pointez la caméra vers un QR Code de monument",
        "tagDiscover": "Découvrez",
        "tagExplore": "Explorez",
        "tagPreserve": "Préservez",
        "sealSub": "Notre histoire<br>vit ici",
        "torch": "Lumière",
        "heritageQuote": "Chaque monument raconte une histoire.<br>Continuez à explorer !",
        "starting": "Démarrage...",
        "scanning": "Analyse...",
        "yourProgress": "Votre progression",
        "level": "Niveau",
        "monumentsLabel": "Monuments",
        "pointsLabel": "Points",
        "achievementsLabel": "Succès",
        "cultureConnects": "La culture<br>nous relie",
        "placeStory": "Chaque lieu<br>raconte une<br>histoire",
        "discoveredMonuments": "Monuments découverts",
        "noMonumentsYet": "Vous n'avez encore découvert aucun monument",
        "settings": "Paramètres",
        "appearance": "Apparence",
        "appearanceSub": "Choisissez entre le thème clair, sombre ou du système.",
        "themeLight": "Clair",
        "themeDark": "Sombre",
        "themeSystem": "Système",
        "language": "Langue",
        "languageSub": "Choisissez la langue de l'application.",
        "achievementAlerts": "Alertes de succès",
        "achievementAlertsSub": "Afficher une fenêtre lors du déblocage d'une médaille.",
        "logoutAction": "Se déconnecter",
        "version": "Heritage Hunt CV • version 1.0",
        "mindeloMonuments": "Monuments de Mindelo",
        "mapTitle": "Carte de Mindelo",
        "mapSubtitle": "Explorez la ville et découvrez ses monuments.",
        "legendFound": "Découvert",
        "legendTodo": "À découvrir",
        "myLocation": "Votre position",
        "currentLocation": "Votre position actuelle",
        "nearestMonument": "Monument le plus proche :",
        "distanceAway": "à {d} m",
        "pointsWord": "points",
        "discoveredCheck": "✓ Découvert",
        "statusUnlocked": "Débloqué",
        "statusLocked": "Verrouillé",
        "scanToDiscover": "Scannez le QR Code pour découvrir ce monument",
        "pts": "pts",
        "fantastic": "Fantastique !",
        "achieved": "Débloqué !",
        "close": "Fermer",
        "takePhoto": "Prendre une photo",
        "uploadPhoto": "Importer une photo",
        "yourNote": "Votre note sur ce monument",
        "notePlaceholder": "Écrivez vos impressions sur ce monument...",
        "saveNote": "Enregistrer la note",
        "yourPhotos": "Vos photos",
        "noPhotos": "Aucune photo pour l'instant.<br>Prenez ou importez des photos de ce monument !",
        "photoAlt": "Photo",
        "clickToCapture": "Cliquez pour capturer",
        "locationLabel": "Localisation",
        "monumentDiscovered": "Monument découvert !",
        "discoveredOnJourney": "Découvert lors de votre parcours",
        "fillAllFields": "Veuillez remplir tous les champs",
        "wrongCredentials": "E-mail ou mot de passe incorrect",
        "passwordTooShort": "Le mot de passe doit contenir au moins 6 caractères",
        "confirmLogout": "Voulez-vous vraiment vous déconnecter ?",
        "cameraError": "Impossible d'accéder à la caméra. Vérifiez les autorisations.",
        "qrNotRecognized": "QR Code non reconnu. Assurez-vous de scanner un QR Code de monument valide.",
        "alreadyDiscovered": "Vous avez déjà découvert ce monument !",
        "mustDiscoverFirst": "Vous devez d'abord découvrir ce monument !",
        "photoSaved": "Photo enregistrée avec succès !",
        "confirmDeletePhoto": "Voulez-vous vraiment supprimer cette photo ?",
        "noteSaved": "Note enregistrée avec succès !",
        "noteRemoved": "Note supprimée !",
        "heritageCrest": "PATRIMOINE<br>DU CAP-VERT",
        "monumentCity": "Mindelo, São Vicente",
        "yourAlbumOf": "Votre album de ce monument",
        "photosCountOne": "1 photo",
        "photosCountMany": "{n} photos",
        "visitedOn": "Visité le {d}",
        "visitDateUnknown": "Découvert",
        "myExperience": "Mon expérience",
        "edit": "Modifier",
        "done": "Terminer",
        "noNoteYet": "Vous n'avez encore rien écrit sur ce monument.",
        "photoAlbum": "Album photo",
        "albumCount": "{n} sur {max} photos",
        "addPhoto": "Ajouter<br>une photo",
        "takePhotoShort": "Prendre une photo",
        "uploadPhotoShort": "Importer une photo",
        "quickMemories": "Souvenirs rapides",
        "quickMemoriesSub": "Ajoutez des étiquettes qui représentent votre expérience",
        "tagArchitecture": "Architecture",
        "tagHistoricCenter": "Centre historique",
        "tagMemorable": "Lieu marquant",
        "tagComeBack": "Je veux revenir",
        "saveExperience": "Enregistrer l'expérience",
        "experienceSaved": "Expérience enregistrée !",
        "photoLimitReached": "Vous avez atteint la limite de {max} photos pour ce monument.",
        "saveError": "Impossible d'enregistrer. Veuillez réessayer.",
        "xpLabel": "XP",
        "xpTotalLabel": "XP total",
        "xpAmount": "+{n} XP",
        "xpObtained": "{n} XP obtenus",
        "xpCardTitle": "Votre XP",
        "xpRecentTitle": "Activité récente",
        "xpViewHistory": "Voir l'historique",
        "xpHistoryTitle": "Historique d'XP",
        "xpHistoryEmpty": "Aucune activité pour l'instant. Découvrez un monument pour commencer votre histoire.",
        "xpLoadMore": "Charger plus",
        "xpToday": "Aujourd'hui",
        "xpYesterday": "Hier",
        "xpMonumentDiscovered": "Monument découvert",
        "xpPhotoAdded": "Nouveau souvenir visuel",
        "xpExperienceAdded": "Expérience enregistrée",
        "xpZoneCompleted": "Zone terminée",
        "xpDiscoveryTitle": "NOUVEAU MONUMENT DÉCOUVERT",
        "xpZoneTitle": "ZONE TERMINÉE",
        "xpDiscoveryTotal": "Total de cette découverte : +{n} XP",
        "xpProgressMonuments": "Progression : {done}/{total} monuments",
        "xpJourneyNote": "Chaque découverte fait partie de votre histoire.",
        "xpPhotoHint": "+{n} XP par photo",
        "xpPhotoRewardsUsed": "{used}/{max} récompenses photo obtenues",
        "xpPhotoRewardsDone": "Récompenses photo terminées",
        "xpExperienceHint": "+{n} XP pour la première expérience",
        "xpExperienceDone": "{n} XP obtenus",
        "xpMonumentEarned": "{n} XP obtenus",
        "zonesTitle": "Zones de Mindelo",
        "zonesSubtitle": "Terminez une zone et gagnez +{n} XP.",
        "zoneProgress": "{done}/{total} monuments",
        "zoneReward": "Récompense : +{n} XP",
        "zoneDone": "Zone terminée",
        "zones": {
            "centro_historico": "Centre historique",
            "frente_mar": "Front de mer",
            "colinas": "Collines et forts",
            "cultura_viva": "Culture vivante"
        },
        "journeyProgress": "{done} sur {total} monuments",
        "journeyProgressAria": "Progression du parcours",
        "journeyRemaining": "Encore {n} monuments à découvrir.",
        "journeyRemainingOne": "Il reste 1 monument à découvrir.",
        "journeyDiscovered": "Découvert",
        "journeyCurrent": "Prochaine découverte",
        "journeyUpcoming": "À découvrir",
        "journeyEarned": "{n} XP obtenus",
        "journeyViewMap": "Voir sur la carte",
        "journeyViewPath": "Voir le parcours complet",
        "journeyContinue": "Continuer le parcours",
        "journeyFirstStep": "Première étape",
        "journeyEmptyTitle": "Votre parcours commence ici.",
        "journeyCompleteTitle": "Parcours terminé",
        "journeyCompleteNote": "Vous connaissez désormais une part importante de l'histoire de Mindelo.",
        "journeyOtherZone": "Autres lieux",
        "journeys": {
            "mindelo_historico": {
                "name": "Parcours de Mindelo",
                "subtitle": "Chaque découverte révèle une nouvelle part de l'histoire."
            }
        },
        "levelLabel": "Niveau",
        "levelShort": "Niveau {n}",
        "levelCardTitle": "Votre parcours",
        "levelXpValue": "{n} XP",
        "levelNextLabel": "Niveau suivant",
        "levelRemaining": "{n} XP pour {name}",
        "levelRemainingShort": "Encore {n} XP",
        "levelRequired": "Requis : {n} XP",
        "levelProgressPercent": "Progression : {n} %",
        "levelProgressAria": "Progression vers le niveau suivant",
        "levelMaxLabel": "Niveau maximum actuel",
        "levelMaxXp": "{n}+ XP",
        "levelMaxNote": "Continuez à explorer et à écrire votre histoire.",
        "levelViewJourney": "Voir votre parcours",
        "levelJourneyTitle": "Votre parcours",
        "levelJourneyDone": "Terminé",
        "levelJourneyCurrent": "Actuel",
        "levelJourneyLocked": "Verrouillé",
        "levelUpKicker": "NOUVEAU NIVEAU",
        "levelUpUnlocked": "Niveau débloqué",
        "levelUpReached": "Vous avez atteint {name}.",
        "levels": {
            "explorer": {
                "name": "Explorateur",
                "description": "Votre parcours à travers le patrimoine commence ici."
            },
            "traveler": {
                "name": "Voyageur",
                "description": "Vous avez déjà découvert différents lieux et différentes histoires."
            },
            "connoisseur": {
                "name": "Connaisseur",
                "description": "Chaque monument révèle une part plus vaste de l'histoire du Cap-Vert."
            },
            "heritage_guardian": {
                "name": "Gardien du Patrimoine",
                "description": "Vous explorez, vous connaissez et vous valorisez l'histoire qui vous entoure."
            }
        },
        "streakTitle": "Série d'exploration",
        "streakDayOne": "1 jour d'exploration",
        "streakDayMany": "{n} jours d'exploration",
        "streakJourneyContinues": "Votre voyage continue.",
        "streakTodayDone": "Exploration du jour terminée",
        "streakTomorrow": "Votre voyage continue demain.",
        "streakContinueToday": "Poursuivez votre voyage aujourd'hui.",
        "streakEmptyTitle": "Commencez votre série",
        "streakEmptySub": "Découvrez un monument pour commencer votre voyage.",
        "streakEmptyCta": "Explorer les monuments",
        "streakCurrentLabel": "Série actuelle",
        "streakBestLabel": "Meilleure série",
        "streakTotalLabel": "Jours d'exploration",
        "streakUnitDay": "jour",
        "streakUnitDays": "jours",
        "streakDaysShort": "{n} jours",
        "streakDayShortOne": "1 jour",
        "streakBestLine": "Meilleure série : {n} jours",
        "streakBestLineOne": "Meilleure série : 1 jour",
        "streakThisWeek": "Cette semaine",
        "streakTapDayHint": "Touchez un jour avec exploration pour voir le détail.",
        "streakNextStory": "Votre prochaine histoire est à {d}.",
        "streakExplore": "Explorer",
        "streakKept": "SÉRIE MAINTENUE",
        "streakNew": "NOUVELLE SÉRIE",
        "streakCelebrationNote": "Un jour de plus, une histoire de plus.",
        "streakDayEmpty": "Aucune exploration enregistrée ce jour-là.",
        "streakActivityDiscovery": "Monument découvert",
        "streakActivityPhotoOne": "1 photo ajoutée",
        "streakActivityPhotoMany": "{n} photos ajoutées",
        "streakActivityExperience": "Expérience enregistrée",
        "streakActivityMission": "Mission culturelle terminée",
        "streakXp": "+{n} XP",
        "streakBadgesTitle": "Succès de série",
        "streakBadgeLocked": "À débloquer",
        "streakMilestoneGoal": "{n} jours d'affilée",
        "weekdaysShort": ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"],
        "monthsLong": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
        "streakBadges": {
            "curious": {
                "name": "Explorateur curieux",
                "short": "Curieux",
                "description": "3 jours d'exploration d'affilée",
                "message": "Trois jours, trois histoires. La curiosité est le premier pas de toute découverte."
            },
            "persistent": {
                "name": "Explorateur persévérant",
                "short": "Persévérant",
                "description": "7 jours d'exploration d'affilée",
                "message": "Une semaine entière à découvrir le Cap-Vert. Mindelo vous connaît déjà par votre nom."
            },
            "mindelo": {
                "name": "Connaisseur de Mindelo",
                "short": "Connaisseur",
                "description": "14 jours d'exploration d'affilée",
                "message": "Deux semaines d'histoires. Peu de gens connaissent cette ville aussi bien que vous."
            },
            "guardian": {
                "name": "Gardien du patrimoine",
                "short": "Gardien",
                "description": "30 jours d'exploration d'affilée",
                "message": "Un mois à préserver la mémoire du Cap-Vert. Vous faites désormais partie de cette histoire."
            }
        },
        "monthsShort": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
        "monuments": {
            "1": "Ancien palais du gouvernement colonial, construit en 1874, aujourd'hui centre culturel et l'un des symboles les plus importants de l'histoire du Cap-Vert.",
            "2": "Phare historique construit en 1886, il offre une vue panoramique époustouflante sur la ville et le port de Mindelo.",
            "3": "Centre de commerce traditionnel à l'architecture unique, où l'on trouve aussi bien des fruits tropicaux que de l'artisanat local.",
            "4": "Église historique au centre-ville, construite au XIXe siècle, avec une façade de style colonial portugais.",
            "5": "Petite réplique du célèbre monument de Lisbonne, symbole du lien historique entre le Cap-Vert et le Portugal.",
            "6": "Ancien bâtiment des douanes à l'architecture coloniale, témoin du riche passé commercial de Mindelo.",
            "7": "Musée dédié à la morna, la musique traditionnelle du Cap-Vert, qui rend hommage à Cesária Évora et à d'autres artistes.",
            "8": "Place principale de la ville avec son kiosque à musique historique, lieu de rencontre et d'événements culturels en plein air.",
            "9": "Exposition du meilleur artisanat cap-verdien, de la céramique aux tissus colorés réalisés selon des techniques traditionnelles.",
            "10": "Important centre culturel de Mindelo qui accueille expositions, concerts et événements littéraires tout au long de l'année.",
            "11": "Port historique qui fut crucial pour le développement de la ville, escale des navires transatlantiques au XIXe siècle.",
            "12": "Ancien fort qui protégeait la baie de Mindelo, construit au XVIIIe siècle, il offre aujourd'hui des vues spectaculaires sur l'océan."
        },
        "badges": {
            "1": {
                "name": "Explorateur débutant",
                "short": "Explorateur",
                "description": "Vous avez découvert 25 % des monuments !",
                "message": "Vous êtes sur la bonne voie, petit explorateur ! Mindelo commence à vous révéler ses secrets ! 🌟"
            },
            "2": {
                "name": "Aventurier intermédiaire",
                "short": "Connaisseur",
                "description": "Vous avez découvert 50 % des monuments !",
                "message": "À mi-chemin ! Vous connaissez déjà Mindelo mieux que bien des touristes ! 🗺️"
            },
            "3": {
                "name": "Maître explorateur",
                "short": "Passionné",
                "description": "Vous avez découvert 75 % des monuments !",
                "message": "Waouh ! Vous connaissez presque Mindelo mieux que les habitants ! Encore un effort pour devenir une légende ! 🏆"
            },
            "4": {
                "name": "Légende de Mindelo",
                "short": "Maître",
                "description": "Vous avez découvert tous les monuments !",
                "message": "Félicitations ! Vous avez conquis Mindelo en véritable héros culturel ! Vous êtes désormais un ambassadeur de l'histoire de cette belle ville ! 👑"
            }
        }
    }
};

function setCurrentLanguage(lang) {
    currentLanguage = AVAILABLE_LANGUAGES.indexOf(lang) !== -1 ? lang : 'pt';
    return currentLanguage;
}

// Devolve a tradução da chave no idioma activo.
// `vars` substitui marcadores do tipo {nome}.
function t(key, vars) {
    const dict = translations[currentLanguage] || translations.pt;
    let text = dict[key];
    if (text === undefined) text = translations.pt[key];
    if (text === undefined) return key;
    if (vars) {
        Object.keys(vars).forEach(name => {
            text = text.split('{' + name + '}').join(vars[name]);
        });
    }
    return text;
}

// Formata uma data no formato curto do idioma activo (ex.: 12 Jun 2026)
function formatShortDate(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';
    const dict = translations[currentLanguage] || translations.pt;
    const months = dict.monthsShort || translations.pt.monthsShort;
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

function monumentDescription(id) {
    const dict = translations[currentLanguage] || translations.pt;
    return (dict.monuments && dict.monuments[id]) || translations.pt.monuments[id];
}

function badgeText(id, field) {
    const dict = translations[currentLanguage] || translations.pt;
    const entry = (dict.badges && dict.badges[id]) || translations.pt.badges[id];
    return entry ? entry[field] : '';
}

// --- Streak de exploracao -----------------------------------

// Nomes curtos dos dias da semana, de segunda a domingo
function weekdayShortLabels() {
    const dict = translations[currentLanguage] || translations.pt;
    return dict.weekdaysShort || translations.pt.weekdaysShort;
}

// Formata uma data como "21 Setembro" no idioma activo.
// Uma chave "YYYY-MM-DD" e interpretada como dia LOCAL: new Date("2026-09-21")
// seria lido como meia-noite UTC e, em Cabo Verde (UTC-1), daria o dia anterior.
function formatDayMonth(value) {
    if (!value) return '';

    let date;
    if (value instanceof Date) {
        date = value;
    } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parts = value.split('-');
        date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
        date = new Date(value);
    }

    if (isNaN(date.getTime())) return '';
    const dict = translations[currentLanguage] || translations.pt;
    const months = dict.monthsLong || translations.pt.monthsLong;
    return date.getDate() + ' ' + months[date.getMonth()];
}

// Texto das conquistas de sequencia (ver STREAK_MILESTONES em streak.js)
function streakBadgeText(id, field) {
    const dict = translations[currentLanguage] || translations.pt;
    const entry = (dict.streakBadges && dict.streakBadges[id]) || translations.pt.streakBadges[id];
    return entry ? entry[field] : '';
}

// "1 dia de exploracao" / "N dias de exploracao"
function streakDaysText(days) {
    return days === 1 ? t('streakDayOne') : t('streakDayMany', { n: days });
}

// --- Sistema de XP ------------------------------------------

// Nome traduzido de uma zona (ver state.zones em script.js)
function zoneName(id) {
    const dict = translations[currentLanguage] || translations.pt;
    return (dict.zones && dict.zones[id]) || (translations.pt.zones && translations.pt.zones[id]) || id;
}

// "+50 XP"
function xpAmountText(amount) {
    return t('xpAmount', { n: amount });
}

// --- Niveis do explorador -----------------------------------

// Texto de um nivel (ver LEVEL_CONFIG em levels.js). O `id` e a
// chave estavel do nivel, igual em todos os idiomas: so o texto muda.
function levelText(id, field) {
    const dict = translations[currentLanguage] || translations.pt;
    const entry = (dict.levels && dict.levels[id]) || (translations.pt.levels && translations.pt.levels[id]);
    return entry ? entry[field] : '';
}

// "Conhecedor"
function levelName(id) {
    return levelText(id, 'name') || id;
}

// "Cada monumento comeca a revelar..."
function levelDescription(id) {
    return levelText(id, 'description');
}

// "Nivel 3"
function levelRankText(number) {
    return t('levelShort', { n: number });
}

// --- Jornada cultural ---------------------------------------

// Texto de uma jornada (ver JOURNEY_CONFIG em journey.js). O `id`
// e a chave estavel da jornada, igual em todos os idiomas.
function journeyText(id, field) {
    const dict = translations[currentLanguage] || translations.pt;
    const entry = (dict.journeys && dict.journeys[id]) || (translations.pt.journeys && translations.pt.journeys[id]);
    return entry ? entry[field] : '';
}

// "Jornada de Mindelo"
function journeyName(id) {
    return journeyText(id, 'name') || id;
}

// "Cada descoberta revela uma nova parte da historia."
function journeySubtitle(id) {
    return journeyText(id, 'subtitle');
}
