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
        "scannerCardTitle": "Scanner de Monumentos",
        "tagDiscover": "Descubra",
        "tagExplore": "Explore",
        "tagPreserve": "Preserve",
        "sealSub": "Nossa história<br>vive aqui",
        "torch": "Luz",
        "heritageQuote": "Cada monumento conta uma história.<br>Continue explorando!",
        "starting": "Iniciando...",
        "scanning": "Escaneando...",
        "scanBrandMotto": "Explora. Descobre. Preserva.",
        "scanFullscreenOpen": "Abrir scanner em ecrã inteiro",
        "scanFullscreenClose": "Fechar ecrã inteiro",
        "scanFindSymbol": "Encontre este símbolo",
        "scanFindSymbolNote": "Nos monumentos do Heritage Hunt irá encontrar este QR code.",
        "scanTipCollapse": "Recolher a dica",
        "scanTipExpand": "Mostrar a dica",
        "scanZoomLabel": "Aproximação da câmara",
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
        "mapFullscreenOpen": "Abrir mapa em ecrã inteiro",
        "mapFullscreenClose": "Fechar mapa em ecrã inteiro",
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
        "signingIn": "A entrar...",
        "signingUp": "A criar conta...",
        "cloudConfirmEmail": "Conta criada. Confirme o email que lhe enviámos e depois entre.",
        "cloudEmailNotConfirmed": "Ainda falta confirmar o email desta conta.",
        "cloudEmailTaken": "Já existe uma conta com este email. Tente entrar.",
        "cloudInvalidEmail": "Esse email não parece válido.",
        "cloudTooManyTries": "Demasiadas tentativas. Aguarde um pouco e tente de novo.",
        "cloudOffline": "Sem ligação à internet. Verifique a rede e tente de novo.",
        "cloudUnavailable": "Não foi possível contactar o servidor. Tente mais tarde.",
        "cloudUnknownError": "Algo correu mal. Tente de novo.",
        "photoCompressed": "Fotografia guardada · {saved}% mais leve",
        "photoQueued": "Fotografia guardada aqui. Sobe assim que houver ligação.",
        "photoUnreadable": "Não foi possível ler esta imagem. Tente outra.",
        "photoDeleteFailed": "Não foi possível apagar a fotografia na nuvem. Tente com ligação.",
        "rankingHeader": "Ranking",
        "rankingBack": "Voltar",
        "rankingRefresh": "Atualizar",
        "rankingTitle": "Exploradores de São Vicente",
        "rankingSubtitle": "Descobre quem está a explorar o património esta semana.",
        "rankingAloneSub": "És o primeiro a explorar esta semana. A tua jornada começa aqui.",
        "rankingThisWeek": "Esta semana",
        "rankingWeeklyXp": "{xp} XP",
        "rankingDiscoveryOne": "1 descoberta",
        "rankingDiscoveryMany": "{n} descobertas",
        "rankingYou": "Tu",
        "rankingExplorer": "Explorador",
        "rankingOpen": "Ver exploradores",
        "rankingTeaserTitle": "Comunidade",
        "rankingTeaserSub": "Outras pessoas também estão a descobrir São Vicente.",
        "rankingNewWeek": "Uma nova semana de exploração começou. Novas histórias esperam por ti.",
        "rankingEmptyWaiting": "Os primeiros exploradores estão a chegar.",
        "rankingEmptySub": "Continua a tua jornada e acompanha aqui a comunidade que está a descobrir São Vicente.",
        "rankingError": "Não foi possível carregar os exploradores neste momento.",
        "rankingRetry": "Tentar novamente",
        "rankingOptedOutNote": "Estás a explorar em privado: vês a comunidade, mas não apareces na lista.",
        "rankingOptInTitle": "Participar no ranking",
        "rankingOptInSub": "Permite que outros exploradores vejam o teu nome, fotografia e progresso semanal.",
        "navRanking": "Ranking",
        "rankingAbout": "Sobre o ranking",
        "rankingExplore": "Explorar monumentos",
        "rankingInfoTitle": "Faz parte da comunidade",
        "rankingInfoLead": "O ranking mostra os exploradores mais activos da semana. Participa para partilhar a tua jornada e ver como outros também estão a descobrir São Vicente.",
        "rankingPrivacyTitle": "A tua privacidade é respeitada",
        "rankingPrivacySub": "Apenas o teu nome, fotografia e progresso são mostrados.",
        "rankingLeaveTitle": "Podes sair quando quiseres",
        "rankingLeaveSub": "Desliga esta opção a qualquer momento.",
        "rankingProgressTitle": "A tua exploração continua",
        "rankingProgressSub": "Mesmo que não participes, continuas a ganhar XP, a subir de nível e a explorar normalmente.",
        "rankingOffTitle": "Ranking desativado",
        "rankingOffLead": "Participa no ranking para ver os exploradores mais activos da semana e partilhar a tua jornada de descoberta em São Vicente.",
        "rankingOffNote": "Quando desactivado, o teu perfil não aparece no ranking, mas continuas a ganhar XP, a descobrir monumentos e a guardar as tuas memórias normalmente.",
        "rankingAssureSub": "Mesmo que não participes, continuas a ganhar XP, descobrir monumentos e guardar as tuas memórias normalmente.",
        "rankingJoin": "Participar no ranking",
        "rankingJoinNow": "Participar agora",
        "rankingLearnMore": "Saber mais",
        "rankingConfirmTitle": "Participar no ranking?",
        "rankingConfirmText": "O teu nome, fotografia e progresso semanal poderão aparecer para outros exploradores. Dados privados, como o email e a localização exacta, não são partilhados.",
        "rankingConfirmYes": "Participar",
        "rankingConfirmNo": "Agora não",
        "rankingJoinedToast": "Agora fazes parte do ranking de exploradores.",
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
        "cities": { "mindelo": "Mindelo" },
        "islands": { "sao_vicente": "São Vicente" },
        "discovery.aria": "Celebração de descoberta",
        "discovery.newMonument": "Novo monumento descoberto",
        "discovery.firstDiscovery": "A tua jornada começa",
        "discovery.journeyComplete": "Jornada concluída",
        "discovery.xpMonument": "Monumento",
        "discovery.xpZone": "Zona concluída",
        "discovery.xpTotalEarned": "Total desta descoberta",
        "discovery.xpWallet": "{n} XP no total",
        "discovery.progress": "{done} de {total} monumentos",
        "discovery.progressOf": "{n}% da {journey}",
        "discovery.streakKept": "Sequência mantida",
        "discovery.streakStarted": "Sequência iniciada",
        "discovery.newBadge": "Nova conquista",
        "discovery.newLevel": "Novo nível",
        "discovery.zoneCompleted": "Zona concluída",
        "discovery.zoneProgress": "{done} de {total} monumentos",
        "discovery.nextStory": "Próxima história",
        "discovery.addToAlbum": "Adicionar ao meu álbum",
        "discovery.saveMemory": "Guardar esta memória",
        "discovery.viewAlbum": "Ver o meu álbum",
        "discovery.reviewJourney": "Rever o percurso",
        "discovery.notNow": "Agora não",
        "discovery.completeNote": "Agora conheces todas as histórias desta jornada.",
        "discovery.completeEmblem": "Percurso completo",
        "discovery.tone.first": "Este é o primeiro lugar da tua história no Heritage Hunt.",
        "discovery.tone.quarter": "Já começaste a revelar as histórias de Mindelo.",
        "discovery.tone.half": "Metade da jornada já faz parte da tua história.",
        "discovery.tone.threeQuarters": "Estás cada vez mais perto de conhecer todo o percurso.",
        "discovery.tone.onward": "Mais uma história faz parte da tua jornada.",
        "discovery.tone.complete": "A próxima história já não é um lugar: é tudo o que guardaste.",

        "engagement.nextDiscovery": "Próxima descoberta",
        "engagement.firstDiscovery": "A tua primeira descoberta",
        "engagement.firstDiscoveryNote": "Explora Mindelo e encontra o teu primeiro monumento.",
        "engagement.lastDiscovery": "Última descoberta",
        "engagement.viewOnMap": "Ver no mapa",
        "engagement.almostThere": "Quase lá",
        "engagement.reason.LAST_IN_JOURNEY": "Falta apenas um lugar para completares a {journey}.",
        "engagement.reason.FIRST": "Começa por aqui. Cada lugar guarda uma história.",
        "engagement.reason.LAST_IN_ZONE": "{zone}: falta apenas este lugar.",
        "engagement.reason.JOURNEY_STEP": "A próxima etapa do teu percurso.",
        "engagement.reason.NEAREST": "O lugar por descobrir mais próximo de ti.",
        "engagement.almost.JOURNEY_ONE_LEFT": "Falta apenas 1 lugar para completares a Jornada de Mindelo.",
        "engagement.almost.ZONE_ONE_LEFT": "{zone}: falta apenas 1 monumento.",
        "engagement.almost.ZONE_FEW_LEFT": "{zone}: mais {n} descobertas para completar.",
        "engagement.almost.LEVEL_CLOSE": "Faltam {n} XP para chegares a {level}.",
        "engagement.almost.JOURNEY_PROGRESS": "Já descobriste {done} de {total} lugares de Mindelo.",
        "engagement.zoneProgress": "{done} de {total} descobertos",
        "engagement.zoneComplete": "Zona concluída",
        "engagement.storyUnlocked": "História desbloqueada",
        "engagement.didYouKnow": "Sabias que...?",
        "engagement.learnMore": "Saber mais",
        "engagement.journeyCompleted": "Jornada de Mindelo concluída",
        "engagement.guardian": "Guardião de Mindelo",
        "engagement.completeNote": "Exploraste todos os lugares desta jornada.",
        "engagement.explorationContinues": "A exploração continua. Novas histórias e desafios serão adicionados ao Heritage Hunt.",
        "engagement.viewMemories": "Ver as minhas memórias",
        "engagement.statMonuments": "monumentos",
        "engagement.statZones": "zonas",
        "engagement.statPhotos": "fotografias",
        "engagement.statMemories": "memórias",

        "map.nextDiscovery": "Próxima descoberta",
        "map.explore": "Explorar",
        "map.discovered": "Descoberto",
        "map.undiscovered": "Ainda por descobrir",
        "map.undiscoveredHint": "Visita este lugar e lê o QR para revelar a sua história.",
        "map.discoveredOn": "Descoberto a {d}",
        "map.youAreHere": "Estás aqui",
        "map.approxDistance": "A cerca de {d}",
        "map.viewMonument": "Ver monumento",
        "map.openAlbum": "Abrir álbum",
        "map.zoneProgress": "{done} de {total} descobertos",
        "map.zoneCompleted": "Zona concluída",
        "map.zoneApprox": "Área aproximada, a partir dos lugares desta zona.",
        "map.viewRemaining": "Ver o que falta",
        "map.reviewDiscoveries": "Rever descobertas",
        "map.closeSheet": "Fechar",
        "map.journey": "Percurso da Jornada",
        "map.sheetLabel": "Detalhes do lugar",

        "mission.thisWeek": "Esta semana",
        "mission.weekly": "Exploração da semana",
        "mission.progress": "{done} / {total}",
        "mission.goalsDone": "{done} / {total} objetivos",
        "mission.continue": "Continuar",
        "mission.completed": "Exploração desta semana concluída.",
        "mission.completedTitle": "Exploração da semana concluída",
        "mission.rewardNote": "Boa exploração. Há sempre mais uma história por descobrir.",
        "mission.keepExploring": "Continuar a explorar",
        "mission.goal.DISCOVER_MONUMENT": "Descobre {n} monumento",
        "mission.goal.DISCOVER_MONUMENT_MANY": "Descobre {n} monumentos",
        "mission.goal.DISCOVER_MONUMENT_ZONE": "Descobre {n} monumento do {zone}",
        "mission.goal.DISCOVER_MONUMENT_ZONE_MANY": "Descobre {n} monumentos do {zone}",
        "mission.goal.ADD_PHOTO": "Guarda {n} fotografia",
        "mission.goal.ADD_PHOTO_MANY": "Guarda {n} fotografias",
        "mission.goal.ADD_PHOTO_ZONE": "Guarda {n} fotografia no {zone}",
        "mission.goal.ADD_PHOTO_ZONE_MANY": "Guarda {n} fotografias no {zone}",
        "mission.goal.WRITE_EXPERIENCE": "Escreve {n} memória",
        "mission.goal.WRITE_EXPERIENCE_MANY": "Escreve {n} memórias",
        "mission.goal.WRITE_EXPERIENCE_ZONE": "Escreve {n} memória no {zone}",
        "mission.goal.WRITE_EXPERIENCE_ZONE_MANY": "Escreve {n} memórias no {zone}",
        "mission.goal.COMPLETE_ZONE": "Completa {n} zona",
        "mission.goal.COMPLETE_ZONE_MANY": "Completa {n} zonas",
        "mission.goal.COMPLETE_ZONE_ZONE": "Completa o {zone}",
        "missions": {
            "first_steps": {
                "name": "Primeiros passos",
                "description": "Descobre um lugar e guarda a primeira fotografia."
            },
            "keep_the_story": {
                "name": "Guarda a história",
                "description": "Descobre um lugar e escreve o que sentiste lá."
            },
            "explore_mindelo": {
                "name": "Explora Mindelo",
                "description": "Dois lugares novos e uma fotografia para os lembrar."
            },
            "city_memories": {
                "name": "Memórias da cidade",
                "description": "Duas fotografias em lugares diferentes e uma memória escrita."
            },
            "historic_centre": {
                "name": "Centro Histórico",
                "description": "Conhece o coração da cidade e guarda essa memória."
            },
            "sea_front": {
                "name": "Frente de mar",
                "description": "O mar fez Mindelo. Descobre um lugar da frente de mar."
            },
            "close_a_zone": {
                "name": "Fecha uma zona",
                "description": "Completa todos os lugares de uma zona da cidade."
            },
            "album_keeper": {
                "name": "O teu álbum",
                "description": "Duas fotografias em lugares diferentes do teu álbum."
            },
            "two_memories": {
                "name": "Duas memórias",
                "description": "Escreve o que viveste em dois lugares que já conheces."
            }
        },
        "monumentStories": {
            "1": "Foi aqui que o governo colonial despachava a ilha inteira. Hoje o mesmo edifício serve exposições e concertos — o poder saiu, a vida ficou.",
            "2": "O farol foi batizado em honra da rainha D. Amélia. A luz que guiava os navios transatlânticos fazia-se com um mecanismo de relojoaria a corda.",
            "3": "O mercado é o lugar onde se ouve o crioulo mais vivo da cidade: o regateio das peixeiras é uma forma de conversa, não um conflito.",
            "4": "A igreja foi levantada quando Mindelo mal passava de um punhado de casas em volta da baía. A cidade cresceu à volta dela, não o contrário.",
            "5": "É uma réplica da Torre de Belém de Lisboa, construída como posto da capitania do porto. Cabo Verde respondeu ao símbolo com uma versão sua, à beira do mesmo Atlântico.",
            "6": "A Alfândega contava a riqueza de Mindelo: tudo o que entrava na baía passava por estes balcões antes de entrar na ilha.",
            "7": "A morna é o blues de Cabo Verde. Cesária Évora cantou-a descalça pelo mundo inteiro e foi daqui, destas ruas, que ela saiu.",
            "8": "O coreto da Praça Nova não é enfeite: era aqui que a filarmónica tocava ao domingo, e é ainda aqui que a cidade se encontra ao fim do dia.",
            "9": "A cerâmica e os panos de terra que aqui se veem usam técnicas que atravessaram o Atlântico e ficaram — cada padrão tem origem e nome.",
            "10": "Mindelo tem fama de capital cultural de Cabo Verde, e é em casas como esta que essa fama se sustenta durante todo o ano, não só no Carnaval.",
            "11": "No século XIX este porto era escala obrigatória do carvão nas rotas do Atlântico. Foi o carvão que trouxe os ingleses, e com eles o críquete e o futebol.",
            "12": "O fortim guardava a baía num tempo em que os corsários eram um risco real. Do alto percebe-se porquê: daqui vê-se chegar qualquer coisa."
        },
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
        "scannerCardTitle": "Monument Scanner",
        "tagDiscover": "Discover",
        "tagExplore": "Explore",
        "tagPreserve": "Preserve",
        "sealSub": "Our history<br>lives here",
        "torch": "Light",
        "heritageQuote": "Every monument tells a story.<br>Keep exploring!",
        "starting": "Starting...",
        "scanning": "Scanning...",
        "scanBrandMotto": "Explore. Discover. Preserve.",
        "scanFullscreenOpen": "Open scanner in full screen",
        "scanFullscreenClose": "Close full screen",
        "scanFindSymbol": "Look for this symbol",
        "scanFindSymbolNote": "You will find this QR code on Heritage Hunt monuments.",
        "scanTipCollapse": "Collapse the tip",
        "scanTipExpand": "Show the tip",
        "scanZoomLabel": "Camera zoom",
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
        "mapFullscreenOpen": "Open map in full screen",
        "mapFullscreenClose": "Close full screen map",
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
        "signingIn": "Signing in...",
        "signingUp": "Creating account...",
        "cloudConfirmEmail": "Account created. Confirm the email we sent you, then sign in.",
        "cloudEmailNotConfirmed": "This account still needs its email confirmed.",
        "cloudEmailTaken": "An account with this email already exists. Try signing in.",
        "cloudInvalidEmail": "That email does not look valid.",
        "cloudTooManyTries": "Too many attempts. Please wait a moment and try again.",
        "cloudOffline": "No internet connection. Check your network and try again.",
        "cloudUnavailable": "Could not reach the server. Please try again later.",
        "cloudUnknownError": "Something went wrong. Please try again.",
        "photoCompressed": "Photo saved · {saved}% lighter",
        "photoQueued": "Photo saved on this device. It will upload once you are online.",
        "photoUnreadable": "This image could not be read. Try another one.",
        "photoDeleteFailed": "Could not delete the photo from the cloud. Try again when online.",
        "rankingHeader": "Ranking",
        "rankingBack": "Back",
        "rankingRefresh": "Refresh",
        "rankingTitle": "Explorers of São Vicente",
        "rankingSubtitle": "See who is exploring the island's heritage this week.",
        "rankingAloneSub": "You are the first to explore this week. Your journey starts here.",
        "rankingThisWeek": "This week",
        "rankingWeeklyXp": "{xp} XP",
        "rankingDiscoveryOne": "1 discovery",
        "rankingDiscoveryMany": "{n} discoveries",
        "rankingYou": "You",
        "rankingExplorer": "Explorer",
        "rankingOpen": "See explorers",
        "rankingTeaserTitle": "Community",
        "rankingTeaserSub": "Other people are discovering São Vicente too.",
        "rankingNewWeek": "A new week of exploring has begun. New stories are waiting for you.",
        "rankingEmptyWaiting": "The first explorers are on their way.",
        "rankingEmptySub": "Carry on with your journey and follow here the community discovering São Vicente.",
        "rankingError": "The explorers could not be loaded right now.",
        "rankingRetry": "Try again",
        "rankingOptedOutNote": "You are exploring privately: you can see the community, but you do not appear on the list.",
        "rankingOptInTitle": "Take part in the ranking",
        "rankingOptInSub": "Lets other explorers see your name, photo and weekly progress.",
        "navRanking": "Ranking",
        "rankingAbout": "About the ranking",
        "rankingExplore": "Explore monuments",
        "rankingInfoTitle": "Be part of the community",
        "rankingInfoLead": "The ranking shows the most active explorers of the week. Take part to share your journey and see how others are discovering São Vicente too.",
        "rankingPrivacyTitle": "Your privacy is respected",
        "rankingPrivacySub": "Only your name, photo and progress are shown.",
        "rankingLeaveTitle": "You can leave whenever you want",
        "rankingLeaveSub": "Turn this option off at any time.",
        "rankingProgressTitle": "Your exploring carries on",
        "rankingProgressSub": "Even if you do not take part, you keep earning XP, levelling up and exploring as usual.",
        "rankingOffTitle": "Ranking turned off",
        "rankingOffLead": "Take part in the ranking to see the most active explorers of the week and share your journey of discovery in São Vicente.",
        "rankingOffNote": "While it is off, your profile does not appear in the ranking, but you keep earning XP, discovering monuments and saving your memories as usual.",
        "rankingAssureSub": "Even if you do not take part, you keep earning XP, discovering monuments and saving your memories as usual.",
        "rankingJoin": "Take part in the ranking",
        "rankingJoinNow": "Take part now",
        "rankingLearnMore": "Learn more",
        "rankingConfirmTitle": "Take part in the ranking?",
        "rankingConfirmText": "Your name, photo and weekly progress may appear to other explorers. Private data, such as your email and exact location, is never shared.",
        "rankingConfirmYes": "Take part",
        "rankingConfirmNo": "Not now",
        "rankingJoinedToast": "You are now part of the explorers' ranking.",
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
        "cities": { "mindelo": "Mindelo" },
        "islands": { "sao_vicente": "São Vicente" },
        "discovery.aria": "Discovery celebration",
        "discovery.newMonument": "New monument discovered",
        "discovery.firstDiscovery": "Your journey begins",
        "discovery.journeyComplete": "Journey complete",
        "discovery.xpMonument": "Monument",
        "discovery.xpZone": "Area completed",
        "discovery.xpTotalEarned": "Total from this discovery",
        "discovery.xpWallet": "{n} XP in total",
        "discovery.progress": "{done} of {total} monuments",
        "discovery.progressOf": "{n}% of the {journey}",
        "discovery.streakKept": "Streak kept",
        "discovery.streakStarted": "Streak started",
        "discovery.newBadge": "New achievement",
        "discovery.newLevel": "New level",
        "discovery.zoneCompleted": "Area completed",
        "discovery.zoneProgress": "{done} of {total} monuments",
        "discovery.nextStory": "Next story",
        "discovery.addToAlbum": "Add to my album",
        "discovery.saveMemory": "Save this memory",
        "discovery.viewAlbum": "View my album",
        "discovery.reviewJourney": "Revisit the route",
        "discovery.notNow": "Not now",
        "discovery.completeNote": "You now know every story on this journey.",
        "discovery.completeEmblem": "Route complete",
        "discovery.tone.first": "This is the first place in your Heritage Hunt story.",
        "discovery.tone.quarter": "Mindelo is starting to reveal its stories to you.",
        "discovery.tone.half": "Half of the journey is already part of your story.",
        "discovery.tone.threeQuarters": "You are getting closer to knowing the whole route.",
        "discovery.tone.onward": "One more story is now part of your journey.",
        "discovery.tone.complete": "The next story is not a place: it is everything you kept.",

        "engagement.nextDiscovery": "Next discovery",
        "engagement.firstDiscovery": "Your first discovery",
        "engagement.firstDiscoveryNote": "Explore Mindelo and find your first monument.",
        "engagement.lastDiscovery": "Last discovery",
        "engagement.viewOnMap": "View on map",
        "engagement.almostThere": "Almost there",
        "engagement.reason.LAST_IN_JOURNEY": "Just one place left to complete the {journey}.",
        "engagement.reason.FIRST": "Start here. Every place keeps a story.",
        "engagement.reason.LAST_IN_ZONE": "Just this one left to complete {zone}.",
        "engagement.reason.JOURNEY_STEP": "The next stop on your route.",
        "engagement.reason.NEAREST": "The closest place still to discover.",
        "engagement.almost.JOURNEY_ONE_LEFT": "Just 1 place left to complete the Mindelo Journey.",
        "engagement.almost.ZONE_ONE_LEFT": "Just 1 monument left to complete {zone}.",
        "engagement.almost.ZONE_FEW_LEFT": "{n} more discoveries to complete {zone}.",
        "engagement.almost.LEVEL_CLOSE": "{n} XP to reach {level}.",
        "engagement.almost.JOURNEY_PROGRESS": "You have discovered {done} of {total} places in Mindelo.",
        "engagement.zoneProgress": "{done} of {total} discovered",
        "engagement.zoneComplete": "Area completed",
        "engagement.storyUnlocked": "Story unlocked",
        "engagement.didYouKnow": "Did you know...?",
        "engagement.learnMore": "Learn more",
        "engagement.journeyCompleted": "Mindelo Journey complete",
        "engagement.guardian": "Guardian of Mindelo",
        "engagement.completeNote": "You have explored every place on this journey.",
        "engagement.explorationContinues": "The exploration continues. New stories and challenges will be added to Heritage Hunt.",
        "engagement.viewMemories": "View my memories",
        "engagement.statMonuments": "monuments",
        "engagement.statZones": "areas",
        "engagement.statPhotos": "photos",
        "engagement.statMemories": "memories",

        "map.nextDiscovery": "Next discovery",
        "map.explore": "Explore",
        "map.discovered": "Discovered",
        "map.undiscovered": "Still to discover",
        "map.undiscoveredHint": "Visit this place and scan the QR to reveal its story.",
        "map.discoveredOn": "Discovered on {d}",
        "map.youAreHere": "You are here",
        "map.approxDistance": "About {d}",
        "map.viewMonument": "View monument",
        "map.openAlbum": "Open album",
        "map.zoneProgress": "{done} of {total} discovered",
        "map.zoneCompleted": "Area completed",
        "map.zoneApprox": "Approximate area, drawn from the places in it.",
        "map.viewRemaining": "See what is left",
        "map.reviewDiscoveries": "Review discoveries",
        "map.closeSheet": "Close",
        "map.journey": "Journey route",
        "map.sheetLabel": "Place details",

        "mission.thisWeek": "This week",
        "mission.weekly": "Exploration of the week",
        "mission.progress": "{done} / {total}",
        "mission.goalsDone": "{done} / {total} goals",
        "mission.continue": "Continue",
        "mission.completed": "This week's exploration is complete.",
        "mission.completedTitle": "Exploration of the week complete",
        "mission.rewardNote": "Good exploring. There is always one more story to discover.",
        "mission.keepExploring": "Keep exploring",
        "mission.goal.DISCOVER_MONUMENT": "Discover {n} monument",
        "mission.goal.DISCOVER_MONUMENT_MANY": "Discover {n} monuments",
        "mission.goal.DISCOVER_MONUMENT_ZONE": "Discover {n} monument in {zone}",
        "mission.goal.DISCOVER_MONUMENT_ZONE_MANY": "Discover {n} monuments in {zone}",
        "mission.goal.ADD_PHOTO": "Keep {n} photo",
        "mission.goal.ADD_PHOTO_MANY": "Keep {n} photos",
        "mission.goal.ADD_PHOTO_ZONE": "Keep {n} photo in {zone}",
        "mission.goal.ADD_PHOTO_ZONE_MANY": "Keep {n} photos in {zone}",
        "mission.goal.WRITE_EXPERIENCE": "Write {n} memory",
        "mission.goal.WRITE_EXPERIENCE_MANY": "Write {n} memories",
        "mission.goal.WRITE_EXPERIENCE_ZONE": "Write {n} memory in {zone}",
        "mission.goal.WRITE_EXPERIENCE_ZONE_MANY": "Write {n} memories in {zone}",
        "mission.goal.COMPLETE_ZONE": "Complete {n} area",
        "mission.goal.COMPLETE_ZONE_MANY": "Complete {n} areas",
        "mission.goal.COMPLETE_ZONE_ZONE": "Complete {zone}",
        "missions": {
            "first_steps": {
                "name": "First steps",
                "description": "Discover a place and keep your first photo."
            },
            "keep_the_story": {
                "name": "Keep the story",
                "description": "Discover a place and write what you felt there."
            },
            "explore_mindelo": {
                "name": "Explore Mindelo",
                "description": "Two new places, and a photo to remember them."
            },
            "city_memories": {
                "name": "City memories",
                "description": "Two photos in different places and one written memory."
            },
            "historic_centre": {
                "name": "Historic Centre",
                "description": "Get to know the heart of the city and keep that memory."
            },
            "sea_front": {
                "name": "Sea front",
                "description": "The sea made Mindelo. Discover a place on the waterfront."
            },
            "close_a_zone": {
                "name": "Close an area",
                "description": "Complete every place in one area of the city."
            },
            "album_keeper": {
                "name": "Your album",
                "description": "Two photos in different places in your album."
            },
            "two_memories": {
                "name": "Two memories",
                "description": "Write what you lived in two places you already know."
            }
        },
        "monumentStories": {
            "1": "This is where the colonial government ran the whole island. Today the same building hosts exhibitions and concerts — the power left, the life stayed.",
            "2": "The lighthouse was named after Queen Amélia. The light that guided transatlantic ships was driven by a wound clockwork mechanism.",
            "3": "The market is where you hear the city's liveliest Creole: the fishwives' haggling is a form of conversation, not a quarrel.",
            "4": "The church was raised when Mindelo was barely a handful of houses around the bay. The city grew around it, not the other way round.",
            "5": "It is a replica of Lisbon's Belém Tower, built as a harbour-master's post. Cabo Verde answered the symbol with a version of its own, on the same Atlantic.",
            "6": "The customs house measured Mindelo's wealth: everything entering the bay passed over these counters before it reached the island.",
            "7": "The morna is Cabo Verde's blues. Cesária Évora sang it barefoot around the world, and it was from here, from these streets, that she left.",
            "8": "The bandstand in Praça Nova is not decoration: the town band played here on Sundays, and this is still where the city meets at the end of the day.",
            "9": "The pottery and woven cloth here use techniques that crossed the Atlantic and stayed — every pattern has an origin and a name.",
            "10": "Mindelo is known as the cultural capital of Cabo Verde, and it is houses like this one that sustain that reputation all year, not only at Carnival.",
            "11": "In the 19th century this port was a compulsory coaling stop on the Atlantic routes. Coal brought the English, and with them cricket and football.",
            "12": "The fort guarded the bay when privateers were a real risk. From up here you see why: anything approaching is visible long before it arrives."
        },
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
        "scannerCardTitle": "Scanner de monuments",
        "tagDiscover": "Découvrez",
        "tagExplore": "Explorez",
        "tagPreserve": "Préservez",
        "sealSub": "Notre histoire<br>vit ici",
        "torch": "Lumière",
        "heritageQuote": "Chaque monument raconte une histoire.<br>Continuez à explorer !",
        "starting": "Démarrage...",
        "scanning": "Analyse...",
        "scanBrandMotto": "Explore. Découvre. Préserve.",
        "scanFullscreenOpen": "Ouvrir le scanner en plein écran",
        "scanFullscreenClose": "Quitter le plein écran",
        "scanFindSymbol": "Cherchez ce symbole",
        "scanFindSymbolNote": "Vous trouverez ce QR code sur les monuments Heritage Hunt.",
        "scanTipCollapse": "Réduire l'astuce",
        "scanTipExpand": "Afficher l'astuce",
        "scanZoomLabel": "Zoom de la caméra",
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
        "mapFullscreenOpen": "Ouvrir la carte en plein écran",
        "mapFullscreenClose": "Fermer la carte en plein écran",
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
        "signingIn": "Connexion...",
        "signingUp": "Création du compte...",
        "cloudConfirmEmail": "Compte créé. Confirmez l'e-mail que nous vous avons envoyé, puis connectez-vous.",
        "cloudEmailNotConfirmed": "L'e-mail de ce compte n'est pas encore confirmé.",
        "cloudEmailTaken": "Un compte existe déjà avec cet e-mail. Essayez de vous connecter.",
        "cloudInvalidEmail": "Cet e-mail ne semble pas valide.",
        "cloudTooManyTries": "Trop de tentatives. Patientez un instant et réessayez.",
        "cloudOffline": "Aucune connexion internet. Vérifiez le réseau et réessayez.",
        "cloudUnavailable": "Impossible de joindre le serveur. Réessayez plus tard.",
        "cloudUnknownError": "Une erreur est survenue. Veuillez réessayer.",
        "photoCompressed": "Photo enregistrée · {saved}% plus légère",
        "photoQueued": "Photo enregistrée sur cet appareil. Elle sera envoyée dès que possible.",
        "photoUnreadable": "Cette image n'a pas pu être lue. Essayez-en une autre.",
        "photoDeleteFailed": "Impossible de supprimer la photo dans le cloud. Réessayez connecté.",
        "rankingHeader": "Classement",
        "rankingBack": "Retour",
        "rankingRefresh": "Actualiser",
        "rankingTitle": "Explorateurs de São Vicente",
        "rankingSubtitle": "Découvrez qui explore le patrimoine cette semaine.",
        "rankingAloneSub": "Vous êtes le premier à explorer cette semaine. Votre parcours commence ici.",
        "rankingThisWeek": "Cette semaine",
        "rankingWeeklyXp": "{xp} XP",
        "rankingDiscoveryOne": "1 découverte",
        "rankingDiscoveryMany": "{n} découvertes",
        "rankingYou": "Vous",
        "rankingExplorer": "Explorateur",
        "rankingOpen": "Voir les explorateurs",
        "rankingTeaserTitle": "Communauté",
        "rankingTeaserSub": "D'autres personnes découvrent aussi São Vicente.",
        "rankingNewWeek": "Une nouvelle semaine d'exploration commence. De nouvelles histoires vous attendent.",
        "rankingEmptyWaiting": "Les premiers explorateurs arrivent.",
        "rankingEmptySub": "Poursuivez votre parcours et suivez ici la communauté qui découvre São Vicente.",
        "rankingError": "Impossible de charger les explorateurs pour le moment.",
        "rankingRetry": "Réessayer",
        "rankingOptedOutNote": "Vous explorez en privé : vous voyez la communauté, mais vous n'apparaissez pas dans la liste.",
        "rankingOptInTitle": "Participer au classement",
        "rankingOptInSub": "Permet aux autres explorateurs de voir votre nom, votre photo et votre progression hebdomadaire.",
        "navRanking": "Classement",
        "rankingAbout": "À propos du classement",
        "rankingExplore": "Explorer les monuments",
        "rankingInfoTitle": "Faites partie de la communauté",
        "rankingInfoLead": "Le classement montre les explorateurs les plus actifs de la semaine. Participez pour partager votre parcours et voir comment d'autres découvrent aussi São Vicente.",
        "rankingPrivacyTitle": "Votre vie privée est respectée",
        "rankingPrivacySub": "Seuls votre nom, votre photo et votre progression sont affichés.",
        "rankingLeaveTitle": "Vous pouvez partir quand vous voulez",
        "rankingLeaveSub": "Désactivez cette option à tout moment.",
        "rankingProgressTitle": "Votre exploration continue",
        "rankingProgressSub": "Même sans participer, vous continuez à gagner de l'XP, à monter de niveau et à explorer normalement.",
        "rankingOffTitle": "Classement désactivé",
        "rankingOffLead": "Participez au classement pour voir les explorateurs les plus actifs de la semaine et partager votre parcours de découverte à São Vicente.",
        "rankingOffNote": "Lorsqu'il est désactivé, votre profil n'apparaît pas dans le classement, mais vous continuez à gagner de l'XP, à découvrir des monuments et à garder vos souvenirs normalement.",
        "rankingAssureSub": "Même sans participer, vous continuez à gagner de l'XP, à découvrir des monuments et à garder vos souvenirs normalement.",
        "rankingJoin": "Participer au classement",
        "rankingJoinNow": "Participer maintenant",
        "rankingLearnMore": "En savoir plus",
        "rankingConfirmTitle": "Participer au classement ?",
        "rankingConfirmText": "Votre nom, votre photo et votre progression hebdomadaire pourront apparaître aux autres explorateurs. Les données privées, comme l'e-mail et la localisation exacte, ne sont pas partagées.",
        "rankingConfirmYes": "Participer",
        "rankingConfirmNo": "Pas maintenant",
        "rankingJoinedToast": "Vous faites désormais partie du classement des explorateurs.",
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
        "cities": { "mindelo": "Mindelo" },
        "islands": { "sao_vicente": "São Vicente" },
        "discovery.aria": "Célébration de découverte",
        "discovery.newMonument": "Nouveau monument découvert",
        "discovery.firstDiscovery": "Votre parcours commence",
        "discovery.journeyComplete": "Parcours terminé",
        "discovery.xpMonument": "Monument",
        "discovery.xpZone": "Zone terminée",
        "discovery.xpTotalEarned": "Total de cette découverte",
        "discovery.xpWallet": "{n} XP au total",
        "discovery.progress": "{done} sur {total} monuments",
        "discovery.progressOf": "{n}% du {journey}",
        "discovery.streakKept": "Série maintenue",
        "discovery.streakStarted": "Série commencée",
        "discovery.newBadge": "Nouvel accomplissement",
        "discovery.newLevel": "Nouveau niveau",
        "discovery.zoneCompleted": "Zone terminée",
        "discovery.zoneProgress": "{done} sur {total} monuments",
        "discovery.nextStory": "Prochaine histoire",
        "discovery.addToAlbum": "Ajouter à mon album",
        "discovery.saveMemory": "Garder ce souvenir",
        "discovery.viewAlbum": "Voir mon album",
        "discovery.reviewJourney": "Revoir le parcours",
        "discovery.notNow": "Pas maintenant",
        "discovery.completeNote": "Vous connaissez désormais toutes les histoires de ce parcours.",
        "discovery.completeEmblem": "Parcours complet",
        "discovery.tone.first": "C'est le premier lieu de votre histoire dans Heritage Hunt.",
        "discovery.tone.quarter": "Mindelo commence à vous révéler ses histoires.",
        "discovery.tone.half": "La moitié du parcours fait déjà partie de votre histoire.",
        "discovery.tone.threeQuarters": "Vous approchez de la découverte de tout le parcours.",
        "discovery.tone.onward": "Une histoire de plus fait partie de votre parcours.",
        "discovery.tone.complete": "La prochaine histoire n'est plus un lieu : c'est tout ce que vous avez gardé.",

        "engagement.nextDiscovery": "Prochaine découverte",
        "engagement.firstDiscovery": "Votre première découverte",
        "engagement.firstDiscoveryNote": "Explorez Mindelo et trouvez votre premier monument.",
        "engagement.lastDiscovery": "Dernière découverte",
        "engagement.viewOnMap": "Voir sur la carte",
        "engagement.almostThere": "Presque terminé",
        "engagement.reason.LAST_IN_JOURNEY": "Il ne reste qu'un lieu pour terminer le {journey}.",
        "engagement.reason.FIRST": "Commencez ici. Chaque lieu garde une histoire.",
        "engagement.reason.LAST_IN_ZONE": "{zone} : il ne reste que ce lieu.",
        "engagement.reason.JOURNEY_STEP": "La prochaine étape de votre parcours.",
        "engagement.reason.NEAREST": "Le lieu à découvrir le plus proche de vous.",
        "engagement.almost.JOURNEY_ONE_LEFT": "Il ne reste qu'1 lieu pour terminer le Parcours de Mindelo.",
        "engagement.almost.ZONE_ONE_LEFT": "{zone} : il ne reste qu'1 monument.",
        "engagement.almost.ZONE_FEW_LEFT": "{zone} : encore {n} découvertes.",
        "engagement.almost.LEVEL_CLOSE": "Encore {n} XP pour atteindre {level}.",
        "engagement.almost.JOURNEY_PROGRESS": "Vous avez découvert {done} des {total} lieux de Mindelo.",
        "engagement.zoneProgress": "{done} sur {total} découverts",
        "engagement.zoneComplete": "Zone terminée",
        "engagement.storyUnlocked": "Histoire débloquée",
        "engagement.didYouKnow": "Le saviez-vous ?",
        "engagement.learnMore": "En savoir plus",
        "engagement.journeyCompleted": "Parcours de Mindelo terminé",
        "engagement.guardian": "Gardien de Mindelo",
        "engagement.completeNote": "Vous avez exploré tous les lieux de ce parcours.",
        "engagement.explorationContinues": "L'exploration continue. De nouvelles histoires et de nouveaux défis seront ajoutés à Heritage Hunt.",
        "engagement.viewMemories": "Voir mes souvenirs",
        "engagement.statMonuments": "monuments",
        "engagement.statZones": "zones",
        "engagement.statPhotos": "photos",
        "engagement.statMemories": "souvenirs",

        "map.nextDiscovery": "Prochaine découverte",
        "map.explore": "Explorer",
        "map.discovered": "Découvert",
        "map.undiscovered": "Encore à découvrir",
        "map.undiscoveredHint": "Visitez ce lieu et scannez le QR pour révéler son histoire.",
        "map.discoveredOn": "Découvert le {d}",
        "map.youAreHere": "Vous êtes ici",
        "map.approxDistance": "À environ {d}",
        "map.viewMonument": "Voir le monument",
        "map.openAlbum": "Ouvrir l'album",
        "map.zoneProgress": "{done} sur {total} découverts",
        "map.zoneCompleted": "Zone terminée",
        "map.zoneApprox": "Zone approximative, tracée à partir des lieux qu'elle contient.",
        "map.viewRemaining": "Voir ce qu'il reste",
        "map.reviewDiscoveries": "Revoir les découvertes",
        "map.closeSheet": "Fermer",
        "map.journey": "Tracé du parcours",
        "map.sheetLabel": "Détails du lieu",

        "mission.thisWeek": "Cette semaine",
        "mission.weekly": "Exploration de la semaine",
        "mission.progress": "{done} / {total}",
        "mission.goalsDone": "{done} / {total} objectifs",
        "mission.continue": "Continuer",
        "mission.completed": "L'exploration de cette semaine est terminée.",
        "mission.completedTitle": "Exploration de la semaine terminée",
        "mission.rewardNote": "Belle exploration. Il y a toujours une histoire de plus à découvrir.",
        "mission.keepExploring": "Continuer à explorer",
        "mission.goal.DISCOVER_MONUMENT": "Découvrez {n} monument",
        "mission.goal.DISCOVER_MONUMENT_MANY": "Découvrez {n} monuments",
        "mission.goal.DISCOVER_MONUMENT_ZONE": "Découvrez {n} monument dans {zone}",
        "mission.goal.DISCOVER_MONUMENT_ZONE_MANY": "Découvrez {n} monuments dans {zone}",
        "mission.goal.ADD_PHOTO": "Gardez {n} photo",
        "mission.goal.ADD_PHOTO_MANY": "Gardez {n} photos",
        "mission.goal.ADD_PHOTO_ZONE": "Gardez {n} photo dans {zone}",
        "mission.goal.ADD_PHOTO_ZONE_MANY": "Gardez {n} photos dans {zone}",
        "mission.goal.WRITE_EXPERIENCE": "Écrivez {n} souvenir",
        "mission.goal.WRITE_EXPERIENCE_MANY": "Écrivez {n} souvenirs",
        "mission.goal.WRITE_EXPERIENCE_ZONE": "Écrivez {n} souvenir dans {zone}",
        "mission.goal.WRITE_EXPERIENCE_ZONE_MANY": "Écrivez {n} souvenirs dans {zone}",
        "mission.goal.COMPLETE_ZONE": "Terminez {n} zone",
        "mission.goal.COMPLETE_ZONE_MANY": "Terminez {n} zones",
        "mission.goal.COMPLETE_ZONE_ZONE": "Terminez {zone}",
        "missions": {
            "first_steps": {
                "name": "Premiers pas",
                "description": "Découvrez un lieu et gardez votre première photo."
            },
            "keep_the_story": {
                "name": "Gardez l'histoire",
                "description": "Découvrez un lieu et écrivez ce que vous y avez ressenti."
            },
            "explore_mindelo": {
                "name": "Explorez Mindelo",
                "description": "Deux lieux nouveaux, et une photo pour s'en souvenir."
            },
            "city_memories": {
                "name": "Souvenirs de la ville",
                "description": "Deux photos dans des lieux différents et un souvenir écrit."
            },
            "historic_centre": {
                "name": "Centre historique",
                "description": "Découvrez le cœur de la ville et gardez ce souvenir."
            },
            "sea_front": {
                "name": "Front de mer",
                "description": "La mer a fait Mindelo. Découvrez un lieu du front de mer."
            },
            "close_a_zone": {
                "name": "Terminez une zone",
                "description": "Complétez tous les lieux d'une zone de la ville."
            },
            "album_keeper": {
                "name": "Votre album",
                "description": "Deux photos dans des lieux différents de votre album."
            },
            "two_memories": {
                "name": "Deux souvenirs",
                "description": "Écrivez ce que vous avez vécu dans deux lieux que vous connaissez déjà."
            }
        },
        "monumentStories": {
            "1": "C'est ici que le gouvernement colonial administrait toute l'île. Aujourd'hui le même bâtiment accueille expositions et concerts — le pouvoir est parti, la vie est restée.",
            "2": "Le phare porte le nom de la reine Amélia. La lumière qui guidait les navires transatlantiques était entraînée par un mécanisme d'horlogerie à remonter.",
            "3": "Le marché est l'endroit où l'on entend le créole le plus vivant de la ville : le marchandage des poissonnières est une conversation, pas une dispute.",
            "4": "L'église fut élevée quand Mindelo n'était qu'une poignée de maisons autour de la baie. La ville a grandi autour d'elle, et non l'inverse.",
            "5": "C'est une réplique de la tour de Belém de Lisbonne, bâtie comme poste de capitainerie. Le Cap-Vert a répondu au symbole par sa propre version, sur le même Atlantique.",
            "6": "La douane mesurait la richesse de Mindelo : tout ce qui entrait dans la baie passait par ces comptoirs avant d'atteindre l'île.",
            "7": "La morna est le blues du Cap-Vert. Cesária Évora l'a chantée pieds nus dans le monde entier, et c'est d'ici, de ces rues, qu'elle est partie.",
            "8": "Le kiosque de la Praça Nova n'est pas un ornement : l'harmonie y jouait le dimanche, et c'est encore là que la ville se retrouve en fin de journée.",
            "9": "La céramique et les tissus présentés ici emploient des techniques qui ont traversé l'Atlantique et sont restées — chaque motif a une origine et un nom.",
            "10": "Mindelo est réputée capitale culturelle du Cap-Vert, et ce sont des maisons comme celle-ci qui entretiennent cette réputation toute l'année, pas seulement au Carnaval.",
            "11": "Au XIXe siècle ce port était une escale charbonnière obligée des routes de l'Atlantique. Le charbon a amené les Anglais, et avec eux le cricket et le football.",
            "12": "Le fortin gardait la baie à une époque où les corsaires étaient un risque réel. D'en haut on comprend pourquoi : on voit venir n'importe quoi."
        },
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

// --- Recompensa cultural (ponto 14) -------------------------
//
// A curiosidade de cada monumento e CONTEUDO, por isso vive aqui,
// ao lado das descricoes, e nao dentro do componente que a mostra.
// Acrescentar um monumento e acrescentar uma entrada em
// `monumentStories`, nos idiomas que houver.
function monumentStory(id) {
    const dict = translations[currentLanguage] || translations.pt;
    const own = dict.monumentStories && dict.monumentStories[id];
    const fallback = translations.pt.monumentStories && translations.pt.monumentStories[id];
    return own || fallback || '';
}

function hasMonumentStory(id) {
    return !!monumentStory(id);
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

// --- Missao semanal -----------------------------------------
//
// Texto de uma missao (ver WEEKLY_MISSION_CONFIG em missions.js).
// O `id` e a chave estavel, igual em todos os idiomas.
function missionText(id, field) {
    const dict = translations[currentLanguage] || translations.pt;
    const entry = (dict.missions && dict.missions[id]) ||
        (translations.pt.missions && translations.pt.missions[id]);
    return entry ? (entry[field] || '') : '';
}

// --- Lugares ------------------------------------------------
//
// A cidade e a ilha vivem na configuracao da jornada (cityId e
// islandId em JOURNEY_CONFIG), nunca no monumento. Acrescentar
// outra ilha e acrescentar a entrada aqui.

// "Mindelo"
function cityName(id) {
    const dict = translations[currentLanguage] || translations.pt;
    return (dict.cities && dict.cities[id]) || (translations.pt.cities && translations.pt.cities[id]) || '';
}

// "Sao Vicente"
function islandName(id) {
    const dict = translations[currentLanguage] || translations.pt;
    return (dict.islands && dict.islands[id]) || (translations.pt.islands && translations.pt.islands[id]) || '';
}

// "Mindelo · Sao Vicente" — sem separador quando falta um dos lados
function placeLabel(cityId, islandId) {
    return [cityName(cityId), islandName(islandId)].filter(Boolean).join(' · ');
}
