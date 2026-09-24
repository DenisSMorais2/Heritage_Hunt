# Heritage Hunt CV — Roteiro de Funcionamento

> Documento de referência do percurso completo da aplicação: cada ecrã, cada
> elemento visível e para que serve. Gerado a partir da leitura do código
> (`index.html`, `script.js`, `xp.js`, `levels.js`, `streak.js`, `journey.js`,
> `i18n.js` e respectivas camadas `*-ui.js`).

**O que é:** uma web app mobile-first (contentor `max-w-md`) que transforma a
visita aos monumentos de Mindelo, São Vicente, numa caça ao património: o
visitante lê o QR Code afixado em cada monumento, ganha XP, sobe de nível,
mantém uma sequência diária de exploração e constrói um álbum pessoal de cada
lugar.

---

## 1. Arquitectura em duas camadas

O projecto separa **domínio** (regras) de **interface** (desenho). Nenhum
ficheiro de domínio toca no DOM nem no `localStorage` directamente.

| Ficheiro | Papel |
|---|---|
| `index.html` | Estrutura de todos os ecrãs e modais (tudo existe no HTML, só se alterna a classe `hidden`) |
| `styles.css` | Todo o aspecto visual, temas claro/escuro, animações |
| `i18n.js` | Traduções PT / EN / FR + função `t(chave, vars)` |
| `script.js` | Orquestrador: estado, autenticação, scanner, mapa, navegação, álbum, definições |
| `xp.js` | **Domínio** do XP: quanto vale cada acção, idempotência, histórico |
| `xp-ui.js` | Cartão de XP, histórico, toast, zonas, painel pós-descoberta |
| `levels.js` | **Domínio** dos níveis: derivados sempre do XP total |
| `levels-ui.js` | Cartão de nível, modal "A tua jornada", celebração de subida |
| `streak.js` | **Domínio** da sequência diária (datas locais, marcos) |
| `streak-ui.js` | Cartão da sequência, semana, detalhe do dia, celebração |
| `journey.js` | **Domínio** do percurso cultural (zonas ordenadas → etapas) |
| `journey-ui.js` | Resumo da jornada + modal do percurso completo |
| `discovery.js` | **Domínio** da celebração: reúne o que mostrar depois de uma descoberta já persistida |
| `discovery-ui.js` | A folha de celebração da descoberta |

Bibliotecas externas: **Tailwind** (CDN), **Font Awesome**, **Leaflet** (mapa),
**qr-scanner** (leitura de QR), fontes Google (Playfair Display / Cormorant).

### Ordem de carregamento (fim de `index.html`)

`i18n.js` → `streak.js` → `streak-ui.js` → `xp.js` → `xp-ui.js` → `levels.js` →
`levels-ui.js` → `journey.js` → `journey-ui.js` → `discovery.js` →
`discovery-ui.js` → `script.js`

O domínio carrega sempre antes da UI que o consome; `script.js` é o último,
porque liga tudo.

---

## 2. Arranque da aplicação — `initApp()`

Antes de qualquer ecrã aparecer:

1. **Anti-flash de tema** — um script inline no `<head>` lê `heritageSettings` e
   aplica `dark` ao `<html>` *antes* da renderização, para não haver um piscar
   branco em tema escuro.
2. `initSettings()` — carrega definições, aplica tema e idioma.
3. `initXPSystem()` — liga `xp.js` à carteira dentro do perfil do utilizador.
4. `initExplorationStreak()` — liga `streak.js` ao mesmo perfil.
5. `initJourney()` — injecta monumentos, zonas e descobertas em `journey.js`.
6. `initDiscoveryCelebration()` — liga a celebração ao álbum, ao mapa e à fila.
7. Lê `localStorage.heritageUser`:
   - **existe** → `loadUserData()` + `showMainApp()` (sessão recuperada);
   - **não existe** → mostra o `#authScreen`.
8. Desenha tudo o que é gerado por JS: medalhas, progresso, listas, sequência,
   XP, nível e jornada.

### `loadUserData()` — migrações silenciosas

Ao entrar, o perfil antigo é actualizado sem o utilizador notar:

- `migrateUserToXP()` — pontos antigos passam a XP (uma única vez);
- `syncZoneCompletions()` — zonas já completas antes do sistema de zonas
  recebem a recompensa retroactiva;
- `migrateUserToLevels()` — um `level` gravado por versões antigas deixa de ter
  significado (o nível passa a ser derivado do XP);
- `applyContentLanguage()` — descrições gravadas noutro idioma são repostas.

A flag `levelCelebrationsReady` fica `false` durante todo o arranque: nenhuma
migração dispara celebração de novo nível. Só passa a `true` no fim.

---

## 3. ECRÃ 1 — Autenticação (`#authScreen`)

Ecrã de entrada, a toda a altura, com fotografia de fundo, véu escuro e ondas
douradas em SVG (evocação do mar de Mindelo).

### Elementos

| Elemento | Para que serve |
|---|---|
| `.hh-auth-photo` / `.hh-auth-veil` | Fotografia de fundo + véu que garante leitura do texto |
| `.hh-auth-waves` (SVG) | Quatro linhas douradas — identidade marítima |
| `.hh-auth-kicker` | "História / Pessoas / Lugares / Sempre consigo" |
| `.hh-auth-place` | "Mindelo, Cabo Verde" — ancora geograficamente |
| `.hh-auth-logo` (SVG) | Logótipo: pin dourado + arquipélago de Cabo Verde + estrada |
| `.hh-auth-wordmark` | "Heritage Hunt" |
| `.hh-auth-tagline` | "Descubra os tesouros de Mindelo" |
| `.hh-auth-motto` | "Mais do que lugares, são histórias" |

### Formulário de Login (`#loginForm`)

- `#loginEmail` — email (Enter submete)
- `#loginPassword` — senha (Enter submete)
- `[data-toggle-password]` — olho que alterna `password` ↔ `text`
- `#loginBtn` → `login()`
- `#showRegisterBtn` → troca para o formulário de registo

**`login()`:** valida campos preenchidos → lê `heritageUser` do `localStorage` →
se o email corresponder, carrega o perfil e entra. Caso contrário, alerta
`wrongCredentials`. *(É uma simulação local; não há API nem verificação de
senha no login.)*

### Formulário de Registo (`#registerForm`)

- `#registerName`, `#registerEmail`, `#registerPassword` (Enter submete)
- `#registerBtn` → `register()`
- `#showLoginBtn` → volta ao login

**`register()`:** exige os três campos e senha com ≥ 6 caracteres. Cria o
objecto de utilizador com: nome, email, senha, `photo: null`, `points: 0`,
`scannedMonuments: []`, carteira de XP vazia, sequência vazia e
`levelSeen` = nível 1 (toda a gente começa Explorador, **sem** celebração).
Grava em `heritageUser` e entra directamente.

**`logout()`** (dois pontos de saída: header e Definições) — pede confirmação,
grava os dados, limpa o estado, volta ao `#authScreen` e pára o scanner.

---

## 4. Estrutura da aplicação principal (`#mainApp`)

Depois de autenticado: **cabeçalho fixo + área de conteúdo + barra de navegação
inferior**. Há quatro vistas que partilham o mesmo contentor e vários modais de
ecrã inteiro.

### Cabeçalho (`.hh-header`)

| Elemento | Para que serve |
|---|---|
| `.hh-logo` (SVG) | Igreja + palmeira + linha de água: a silhueta de Mindelo |
| `.hh-brand-title` | "Heritage Hunt CV" |
| `.hh-brand-greet` / `#userName` | "Olá, `<nome>`!" |
| `#settingsBtn` | Abre as Definições |
| `#logoutBtn` | Termina sessão |
| `.hh-tagline` | "Descubra • Explore • Preserve" |
| `.hh-seal` | Selo "São Vicente — Nossa história vive aqui" |

### Navegação inferior (`nav.hh-nav`)

Três botões com indicador deslizante (`.glass-glider`, movido por
`navBar.dataset.active`):

| Botão | Ícone | Vista |
|---|---|---|
| `#navScanner` | QR Code | `showScannerView()` |
| `#navProfile` | Troféu | `showProfileView()` |
| `#navMap` | Mapa | `showMapView()` |

As Definições **não** têm botão na barra — abrem pelo ícone do cabeçalho, e
`updateNavButtons('settings')` põe a barra em `data-active="none"`.

---

## 5. ECRÃ 2 — Scanner (`#scannerView`) — vista por omissão

O coração da aplicação: é aqui que a descoberta acontece.

### 5.1 Bloco da câmara (`.hh-cam`)

| Elemento | Estado | Para que serve |
|---|---|---|
| `.hh-cam-idle` | Repouso | Imagem estática (Igreja Nossa Senhora da Luz) enquanto a câmara está desligada |
| `.hh-brackets` + `.hh-qr-glyph` | Repouso | Quatro cantos + ícone de QR: mostram onde apontar |
| `#scannerVideo` | Activo | Vídeo ao vivo da câmara traseira (`facingMode: environment`, 1280×720 ideal) |
| `#scannerOverlay` | A ler | Moldura com linha animada + "Procurando por QR Code..." |
| `#torchBtn` | A ler | Lanterna — **só aparece se a câmara suportar flash** (`hasFlash()`) |
| `#closeScannerBtn` | A ler | Fecha a câmara e volta ao repouso |
| `#startScannerBtn` | Sempre | Botão dourado "Escanear QR Code" |
| `.hh-cam-hint` | Sempre | "Aponte a câmera para um QR Code de monumento" |

**`startScanner()`** → botão passa a "A iniciar…" com spinner → pede
`getUserMedia` → instancia `QrScanner` com destaque da região e do contorno →
`setupTorch()`. Se a câmara falhar, alerta `cameraError` e faz `resetScanner()`.

**`stopScanner()`** liberta sempre as *tracks* de vídeo — a câmara nunca fica
ligada em segundo plano.

### 5.2 Celebração de descoberta (`#discoveryModal`)

Quando um QR válido é lido, a descoberta abre uma **folha de celebração** em
ecrã inteiro — ver a secção 10 para o detalhe completo. O antigo cartão sobre a
câmara (`#scannerResult`) foi substituído por ela.

### 5.3 O fluxo crítico — `handleQRResult(qrData)`

```
1. Procura monumento com qrCode === qrData
   └─ não existe → alert('qrNotRecognized') e pára
2. Já foi descoberto?
   └─ sim → alert('alreadyDiscovered') e pára
3. Guarda o progresso ANTERIOR (para a barra animar de onde estava)
4. Abre o portão: medalhas e subidas de nível desta descoberta ficam
   retidas em vez de abrirem modais próprios
5. Marca discoveredAt = agora e adiciona a scannedMonuments
6. awardXP([ MONUMENT_DISCOVERED, ...zonas concluídas por esta descoberta ])
   ↓
7. ⚠ Se o XP NÃO foi persistido:
   → desfaz a descoberta (pop + delete discoveredAt)
   → alert('saveError'), fecha o scanner, NÃO celebra nada
   → "nunca anunciamos XP que não foi gravado"
8. registerExploration(MONUMENT_DISCOVERY) — conta o dia na sequência
9. JourneyUI.markDiscovery() — a etapa anima quando o percurso abrir
10. updateProgress() + checkForBadges() + saveUserData()
11. SÓ ENTÃO buildDiscoveryCelebration() reúne o que mostrar
12. Fecha o portão, liberta a câmara e abre a celebração
```

A descoberta e a conclusão de zona são gravadas **na mesma escrita** — ou vale
tudo, ou não vale nada. A celebração só existe depois do passo 10.

### 5.4 Cartão "Seu Progresso" (`.hh-progress`)

| Elemento | Para que serve |
|---|---|
| `#totalPointsHeader` | XP total, com estrela |
| `#progressBar` / `#progressPercent` | Barra e percentagem: descobertos ÷ 12 |
| `#badgesContainer` | As 4 medalhas de progresso (ver 5.5) |
| `.hh-quote` | "Cada monumento conta uma história. Continue explorando!" |

### 5.5 Medalhas de progresso (`renderBadges()`)

| # | Medalha | Limiar | Ícone |
|---|---|---|---|
| 1 | Explorador Iniciante | 25 % | bússola |
| 2 | Aventureiro Intermediário | 50 % | mapa |
| 3 | Mestre Explorador | 75 % | troféu |
| 4 | Lenda de Mindelo | 100 % | coroa |

- **Bloqueada** (`.is-locked`): apagada, não clicável.
- **Desbloqueada** (`.is-unlocked`): animada, clicável → `#achievementModal`.
- `checkForBadges()` desbloqueia e, se `achievementAlerts` estiver ligado,
  coloca a medalha na **fila de celebrações**.

### 5.6 Cartão "Jornada de Mindelo" (`.hh-journey-card`)

Resumo do percurso cultural, desenhado por `journey-ui.js`:

- `#journeySummaryTitle` / `#journeySummarySub` — nome e ilha/cidade, vindos dos
  dados (nunca fixos no HTML);
- `.hh-jp-count` + `.hh-jp-bar-row` — "X de 12" e barra de percurso;
- `.hh-jp-dots` — um ponto por etapa, na ordem do percurso;
- `.hh-jp-next` — **etapa actual**: nome, distância (só se a localização já for
  precisa) e botão "Ver no mapa";
- `.hh-jp-cta` — "Ver percurso completo" / "Continuar" → abre `#journeyModal`;
- Percurso concluído → bloco com coroa em vez da próxima etapa.

---

## 6. ECRÃ 3 — Perfil (`#profileView`)

Cinco cartões empilhados, do mais pessoal ao mais detalhado.

### 6.1 Cartão de identidade (`.hh-id-card`)

| Elemento | Para que serve |
|---|---|
| `#profilePhotoContainer` / `#profilePhoto` | Avatar; sem foto mostra `#profileIcon` |
| `#changePhotoBtn` + `#photoInput` | Escolhe imagem → `FileReader` → guarda como Data URL no perfil |
| `#profileUserName` | Nome do utilizador |
| `#userLevelLine` (botão) | Nome e patente do nível — **clicável**, abre "A tua jornada" |
| `#userEmail` | Email da conta |
| `.hh-motto-script` | "Cultura nos conecta" |

**Três estatísticas** (`.hh-stats`):

- `#monumentsScanned` / `#totalMonuments` — monumentos (X/12)
- `#totalPoints` — XP
- `#badgesEarned` / 4 — conquistas

### 6.2 Cartão "A tua jornada" — nível (`.hh-level-card`)

Desenhado por `levels-ui.js` em `#levelCardBody`.

| Elemento | Para que serve |
|---|---|
| `.hh-level-head` | Brasão + nome + patente; clicável → modal de todos os níveis |
| `.hh-level-desc` | Descrição do nível actual |
| `.hh-level-xp` | XP total acumulado |
| `.hh-level-track` / `.hh-level-fill` | Barra com `role="progressbar"` e `aria-valuetext` |
| `.hh-level-next` | "Faltam N XP para `<próximo nível>`" |
| `.is-max` | No último nível mostra coroa e nota especial |

**Os quatro níveis** (`LEVEL_CONFIG`) — derivados **sempre** do XP total, nunca
gravados:

| Nível | id | XP mínimo | Acento |
|---|---|---|---|
| 1 | `explorer` | 0 | bronze |
| 2 | `traveler` | 250 | azul |
| 3 | `connoisseur` | 600 | violeta |
| 4 | `heritage_guardian` | 1200 | dourado |

A barra abre no valor já desenhado e só depois anima para o novo — nunca salta.

### 6.3 Cartão "O teu XP" (`.hh-xp-card`)

Desenhado por `xp-ui.js` em `#xpCardBody`:

- `.hh-xp-total` — total com animação de contagem;
- `.hh-xp-list` — as transacções mais recentes, cada uma com ícone, título e
  data legível ("Hoje", "Ontem", data);
- `.hh-xp-more` — "Ver histórico" → abre `#xpHistoryModal` (paginado).

**Tabela de recompensas** (`XP_CONFIG`) — o valor é decidido **sempre** em
`xp.js`, nunca por quem chama:

| Acção | XP | Regra |
|---|---|---|
| `MONUMENT_DISCOVERED` | 25–50 (valor do próprio monumento) | uma vez por monumento |
| `PHOTO_ADDED` | 5 | máximo **3** fotografias por monumento |
| `EXPERIENCE_ADDED` | 10 | uma vez por monumento, texto com ≥ 10 caracteres |
| `ZONE_COMPLETED` | 100 | uma vez por zona |

*Reservado para o futuro (não implementado): quiz, desafio cultural, rota, ilha
completa, evento.*

**Idempotência:** cada recompensa gera uma `rewardKey` guardada em
`wallet.rewardKeys`, lista que **nunca** é truncada. O histórico visível está
limitado a 300 entradas, mas os totais e as chaves não dependem disso — apagar e
voltar a adicionar uma foto não rende XP outra vez.

### 6.4 Cartão "Sequência de exploração" (`.hh-streak-card`)

Desenhado por `streak-ui.js` em `#streakCard`.

| Bloco | Para que serve |
|---|---|
| `.hh-streak-hero` | Chama + contagem de dias; acesa se já explorou hoje |
| Sem sequência | "Ainda não há sequência" + botão que leva ao mapa |
| `.hh-streak-week` | Segunda a domingo; cada dia é um botão — se houve actividade, abre `#streakDayModal` |
| `.hh-streak-stats` | Sequência actual · melhor sequência · total de dias |
| `.hh-streak-next` | Próxima história: monumento mais próximo + distância (só se não explorou hoje) |
| `.hh-streak-badges` | Os quatro marcos, clicáveis quando desbloqueados |

**Actividades que contam como "um dia de exploração"**: descobrir um monumento,
adicionar uma fotografia, guardar uma experiência. *(Missões culturais estão
reservadas para o futuro.)* Várias actividades no mesmo dia continuam a valer
**um** dia.

**Marcos** (`STREAK_MILESTONES`): 3 dias (Curioso) · 7 (Persistente) ·
14 (Mindelo) · 30 (Guardião).

As datas usam **sempre a data local do dispositivo** — nunca `toISOString()`,
porque perto da meia-noite o UTC saltaria de dia. Histórico limitado a 180 dias.

### 6.5 Cartão "Monumentos Descobertos" (`.hh-discover`)

`#discoveredMonumentsList` — só os já descobertos. Cada cartão mostra miniatura,
nome, 80 caracteres da descrição e os pontos. **Clicar abre `#monumentModal`**
(ficha rápida, diferente da página do monumento).

Vazio → "Ainda não descobriu nenhum monumento".

A rosa-dos-ventos (`.hh-compass`) com "Cada lugar conta uma história" repete-se
como assinatura visual neste ecrã, nas Definições e no mapa.

---

## 7. ECRÃ 4 — Mapa (`#mapView`)

### 7.1 Mapa Leaflet (`.hh-map-card`)

| Elemento | Para que serve |
|---|---|
| `.hh-map-title` | "Mapa de Mindelo" + subtítulo |
| `.hh-legend` | Legenda: pin verde = Descoberto · pin azul = Por descobrir |
| `#map` | Mapa Leaflet com os 12 marcadores |
| `#locateUserBtn` | Alvo de mira → `locateUser()` |

**Comportamento dos marcadores** (`applyMarkerBehaviour()`):

- **Por descobrir** (azul) → clicar abre um *popup* com foto, nome, descrição e
  pontos;
- **Descoberto** (verde) → o *popup* é removido e clicar abre directamente a
  **página do monumento** (álbum).

**`locateUser()` / `getUserLocation()`** — pede geolocalização, coloca o
marcador do utilizador com círculo de precisão e calcula a distância ao
monumento mais próximo (fórmula de Haversine em `calculateDistance()`, raio da
Terra 6 371 000 m). A localização **nunca** é pedida só para desenhar distâncias
na jornada.

**`focusMonumentOnMap()`** — quando se chega ao mapa vindo de outro ecrã ("Ver
no mapa", "Localização"), centra e abre o marcador desse monumento.

### 7.2 Cartão "Zonas de Mindelo" (`.hh-zones-card`)

`#zonesList`, desenhado por `XPUI.renderZones()`. Cada zona mostra nome,
"X/Y descobertos", barra de progresso e a recompensa (+100 XP), com marca de
visto quando completa.

**As quatro zonas** (`state.zones`):

| Zona | Monumentos |
|---|---|
| `centro_historico` | Palácio do Povo, Mercado Municipal, Igreja N. S. da Luz, Praça Nova |
| `frente_mar` | Torre de Belém (réplica), Edifício da Alfândega, Porto de Mindelo |
| `colinas` | Farol de D. Amélia, Fortim d'El Rei |
| `cultura_viva` | Casa da Morna, Centro Nacional de Artesanato, Casa da Cultura |

`#openJourneyFromMap` — "Ver percurso completo" → abre o modal da jornada.

### 7.3 Cartão "Monumentos de Mindelo" (`#monumentsList`)

Os **12** monumentos, descobertos ou não:

- **Por descobrir**: imagem desfocada (`.blurred-image`), cadeado, texto
  "Escaneie o QR Code para descobrir";
- **Descoberto**: imagem nítida, visto verde, pontos, descrição real.

Clicar chama `openMonumentPhotos(id)` — se ainda não foi descoberto, alerta "tem
de descobrir primeiro".

### 7.4 Catálogo de monumentos

| # | Monumento | XP | Código QR |
|---|---|---|---|
| 1 | Palácio do Povo | 50 | `PALACIO_POVO_CV` |
| 2 | Farol de D. Amélia | 40 | `FAROL_DONA_AMELIA_CV` |
| 3 | Mercado Municipal | 30 | `MERCADO_MUNICIPAL_CV` |
| 4 | Igreja Nossa Senhora da Luz | 45 | `IGREJA_NSA_LUZ_CV` |
| 5 | Torre de Belém (Réplica) | 35 | `TORRE_BELEM_CV` |
| 6 | Edifício da Alfândega | 30 | `ALFANDEGA_CV` |
| 7 | Casa da Morna | 40 | `CASA_MORNA_CV` |
| 8 | Praça Nova | 25 | `PRACA_NOVA_CV` |
| 9 | Centro Nacional de Artesanato | 35 | `ARTESANATO_CV` |
| 10 | Casa da Cultura | 40 | `CASA_CULTURA_CV` |
| 11 | Porto de Mindelo | 50 | `PORTO_MINDELO_CV` |
| 12 | Fortim d'El Rei | 45 | `FORTIM_EL_REI_CV` |

**Total possível por descobertas: 465 XP.** Com as 4 zonas (+400 XP) chega a
865 XP. Fotografias (12 × 3 × 5 = 180) e experiências (12 × 10 = 120) levam o
máximo actual a **1 165 XP** — ou seja, o nível 4 (1 200 XP) **ainda não é
alcançável** com o conteúdo hoje implementado. É um ponto a rever: ou se
acrescenta conteúdo (as acções reservadas da secção 14), ou se baixa o limiar
em `LEVEL_CONFIG`.

---

## 8. ECRÃ 5 — Definições (`#settingsView`)

Abre pelo ícone de *sliders* no cabeçalho. Faz `scrollTo` suave para o topo.

| Secção | Elemento | Para que serve |
|---|---|---|
| **Aparência** | `#themeSelector` | Claro · Escuro · Sistema |
| **Idioma** | `#languageSelector` | Português · English · Français (com bandeiras SVG) |
| **Alertas de conquistas** | `#achievementAlertsToggle` | Liga/desliga o *popup* ao desbloquear medalha |
| **Conta** | `#settingsLogoutBtn` | Terminar sessão |
| — | `.hh-version` | "Heritage Hunt CV • versão 1.0" |

**Tema:** `resolveTheme()` converte `system` no valor real via
`matchMedia('(prefers-color-scheme: dark)')`; um *listener* segue as mudanças do
sistema **apenas** enquanto "Sistema" estiver activo.

**Idioma:** `setLanguage()` grava e chama `applyLanguage()`, que:

1. traduz tudo o que tem `data-i18n` / `data-i18n-html` / `data-i18n-title` /
   `data-i18n-placeholder`;
2. `applyContentLanguage()` retraduz descrições dos monumentos e textos das
   medalhas — **também os já gravados no perfil**;
3. redesenha sequência, XP, zonas, nível e jornada;
4. actualiza o botão do scanner **só se não estiver a ler** (não interrompe uma
   leitura em curso).

Idioma inicial: detectado do browser (`navigator.language`), com PT por omissão.

---

## 9. Página do Monumento (`#monumentPhotosModal`)

O ecrã mais rico da aplicação — o álbum pessoal de cada lugar. Abre **apenas
para monumentos já descobertos**, a partir de: marcador verde no mapa, lista de
monumentos, ou etapa descoberta no percurso.

### Estrutura

| Bloco | Elemento | Para que serve |
|---|---|---|
| **Herói** | `#monumentPhotosImage` | Fotografia oficial em grande |
| | `.hh-mp-crest` | Selo "PATRIMÓNIO DE CABO VERDE" |
| | `#closeMonumentPhotosModal` | Fechar |
| **Cabeçalho** | `#monumentPhotosName` + `.hh-mp-status` | Nome + selo "Descoberto" |
| | `#monumentPageLocation` | Cidade |
| **Resumo** | `#monumentPageXpChip` | XP do monumento; ganha `.is-earned` quando já foi recebido |
| | `#monumentPagePhotoCount` | Nº de fotografias |
| | `#monumentPageVisit` | "Visitado a `<data>`" |
| **Minha experiência** | `#monumentNoteText` / `#monumentNote` | Texto lido ↔ `textarea` de edição |
| | `#editNoteBtn` | Alterna Editar ↔ Concluído (ícone caneta ↔ visto) |
| | `#monumentPageExperienceXp` | Pista: "+10 XP pela primeira experiência" / "XP já obtido" |
| **Álbum** | `#userPhotosGrid` | Grelha de fotografias, com apagar |
| | `#takePhotoBtn` | Abre `#cameraModal` |
| | `#uploadPhotoBtn` | Abre o selector de ficheiros |
| | `#monumentPagePhotoXp` | Pista: quantas recompensas de foto ainda restam |
| **Memórias rápidas** | `#monumentPageTags` | 4 etiquetas alternáveis |
| **Acção** | `#saveNoteBtn` | "Guardar experiência" |

**Etiquetas disponíveis** (`MEMORY_TAGS`): Arquitectura · Centro histórico ·
Memorável · Voltar.

**Fechar:** botão ✕, clique fora da folha, ou tecla **Esc**.

### Fluxos

**`saveExperience()`**

1. Grava nota em `monument_note_<id>` (ou remove se vazia);
2. Grava etiquetas em `monument_tags_<id>` (ou remove se nenhuma);
3. XP: só se a nota tiver **≥ 10 caracteres**, e só **na primeira vez** — editar
   não rende outra vez;
4. Sequência: conta como exploração se houver nota **ou** etiquetas;
5. `announceReward()` decide o aviso (ver secção 10).

**`savePhoto(dados)`**

1. Limite de **10 fotografias por monumento** — acima disso, alerta;
2. Guarda `{ id, data, createdAt }` em `monument_photos_<id>`;
3. XP: +5 pelas **primeiras 3** de cada monumento;
4. Sequência: várias fotos no mesmo dia continuam a valer um só dia;
5. `announceReward()`.

**`deletePhoto(índice)`** — pede confirmação. **O XP não é devolvido nem o lugar
libertado**: apagar e voltar a adicionar não rende XP outra vez.

*Nota: álbuns antigos guardados como simples lista de Data URLs são convertidos
para o novo formato ao serem lidos, sem perder nada.*

---

## 10. Modais e celebrações

### 10.1 A celebração de descoberta (`#discoveryModal`)

O momento mais importante da aplicação. Aparece **só depois** de a descoberta e
todas as recompensas estarem gravadas, e conta numa única folha tudo o que
acabou de acontecer — nunca em modais encadeados.

**Hierarquia visual**, de cima para baixo (blocos que não se aplicam não são
desenhados):

| # | Bloco | Conteúdo |
|---|---|---|
| 1 | **Herói** | Fotografia do monumento que passa de desfocada a nítida, kicker, nome e "Mindelo · São Vicente" |
| 2 | **XP** | O valor ganho, a contar de 0. Com zona concluída, separa "Monumento +45" e "Zona +100" antes do total |
| 3 | **Sequência** | Bloco compacto, só na primeira actividade válida do dia |
| 4 | **Progresso** | Nome da jornada, "X de 12", barra que anima do valor anterior, e uma frase que muda com o patamar atravessado |
| 5 | **Especiais** | Por ordem de peso: novo nível → zona concluída → nova conquista |
| 6 | **Próxima história** | O monumento seguinte do percurso, o seu XP e "Ver no mapa" |
| 7 | **Acções** | Rodapé colado: "Adicionar ao meu álbum" · "Continuar jornada" · "Agora não" |

**Três variantes** (`data-variant`):

- `first` — a primeira descoberta: "A tua jornada começa"
- `standard` — o caso normal
- `complete` — o último monumento: "Jornada concluída", coroa, bloco de fecho,
  sem próxima história, e os CTAs passam a "Ver o meu álbum" / "Rever o percurso"

**Animações** (todas anuladas com `prefers-reduced-motion`): entrada da folha em
420 ms (fade + escala + subida), revelação do monumento (blur 18px → 0),
contagem do XP, barra do valor anterior para o novo, blocos escalonados a 70 ms,
e uma vibração de 30 ms quando o dispositivo a suporta.

**Como recebe os dados:** `Discovery.buildCelebration()` recebe o lote do XP, o
resultado da sequência, as medalhas e o nível retidos, o progresso real da
jornada e o progresso anterior. Não calcula recompensas — o valor de cada uma
vem sempre do domínio (`xp.js`). Nada da celebração é persistido, por isso um
refresh nunca a repete.

### 10.2 Os restantes modais

| Modal | Abre quando | Para que serve |
|---|---|---|
| `#badgeModal` | Medalha desbloqueada **fora** de uma descoberta | Ícone animado, nome, descrição e mensagem |
| `#achievementModal` | Clique numa medalha já conquistada | Ficha da conquista com estado "Conquistado!" |
| `#monumentModal` | Clique num monumento da lista de descobertos | Ficha rápida: foto, descrição, XP e **"Localização"** → leva ao mapa centrado |
| `#monumentPhotosModal` | Monumento descoberto no mapa / lista / percurso / CTA da celebração | Página completa do monumento (secção 9) |
| `#xpHistoryModal` | "Ver histórico" no cartão de XP | Histórico paginado com "Carregar mais" |
| `#journeyModal` | "Ver percurso completo" | O percurso inteiro, agrupado por zona |
| `#levelJourneyModal` | Clique no nível (perfil ou cartão) | Os quatro níveis com estado: conquistado / actual / por conquistar |
| `#levelUpModal` | Subida de nível **fora** de uma descoberta | Brasão, nome, patente, descrição |
| `#streakDayModal` | Clique num dia com actividade | O que foi feito nesse dia |
| `#streakCelebrationModal` | Primeira actividade do dia por foto ou experiência | Chama, contagem e XP ganho |
| `#cameraModal` | "Tirar foto" | Vídeo ao vivo + botão redondo de captura |
| `#xpToast` | Ganho de XP sem novo dia | Aviso discreto (`aria-live="polite"`) |

### Regra de ouro: uma celebração de cada vez

Medalhas de progresso, marcos de sequência e subidas de nível partilham a
**mesma fila** (`badgeQueue`).

Durante uma descoberta, um **portão** (`discoveryCapture`) desvia tudo o que for
desbloqueado para dentro da própria celebração, em vez de o pôr na fila. E
enquanto a celebração estiver aberta, `scheduleNextBadge()` não abre nada: ao
fechá-la, a fila retoma passados 400 ms. O resultado é sempre **um modal de cada
vez**, e uma descoberta rica — nível + zona + medalha — continua a ser um só
ecrã.

### Regra do aviso único — `announceReward()`

```
Se a sequência abriu um NOVO DIA
   → mostra a celebração da sequência, que já inclui o XP ganho
Senão
   → mostra o toast discreto, com quanto falta para o próximo nível
```

Nunca há dois avisos sobrepostos pela mesma acção.

---

## 11. Persistência (`localStorage`)

| Chave | Conteúdo |
|---|---|
| `heritageUser` | Perfil completo: dados, foto, `scannedMonuments`, `xp` (carteira), `explorationStreak`, `levelSeen` |
| `heritageSettings` | `{ theme, lang, achievementAlerts }` |
| `monument_note_<id>` | Texto da experiência de um monumento |
| `monument_tags_<id>` | Etiquetas de memória de um monumento |
| `monument_photos_<id>` | Álbum de um monumento |

Tanto `xp.js` como `streak.js` recebem o armazenamento por **adaptador
injectado** (`configureStorage({ load, save })`) — trocar `localStorage` por uma
base de dados não obriga a reescrever nenhuma regra de domínio.

`saveUserData()` mantém `user.points` como espelho do XP total, para que
qualquer código antigo continue a ler um valor correcto.

---

## 12. Percurso completo do utilizador

```
ABRIR A APP
  │
  ├─ sem sessão ──► ECRÃ DE AUTENTICAÇÃO
  │                   ├─ Criar conta ──► perfil novo (0 XP, nível 1 Explorador)
  │                   └─ Entrar ───────► perfil recuperado + migrações
  │
  └─ com sessão ──► entra directamente
                      │
                      ▼
              SCANNER (vista por omissão)
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
     SCANNER        PERFIL          MAPA        [⚙ DEFINIÇÕES]
        │             │              │
        │             │              ├─ marcador azul  → popup informativo
        │             │              ├─ marcador verde → PÁGINA DO MONUMENTO
        │             │              ├─ zonas          → progresso, +100 XP cada
        │             │              └─ lista          → PÁGINA DO MONUMENTO
        │             │
        │             ├─ identidade + estatísticas
        │             ├─ nível      → modal dos 4 níveis
        │             ├─ XP         → histórico completo
        │             ├─ sequência  → detalhe do dia / marcos
        │             └─ descobertos → ficha rápida → mapa
        │
        ├─ "Escanear QR Code" → câmara + lanterna
        │       │
        │       ▼
        │   LER QR ──► inválido      → "QR não reconhecido"
        │          ──► já descoberto → "Já descobriu este monumento"
        │          ──► VÁLIDO
        │                │
        │                ├─ +25 a 50 XP (valor do monumento)
        │                ├─ +100 XP se completou uma zona
        │                ├─ conta o dia na sequência
        │                ├─ pode desbloquear medalha (25/50/75/100 %)
        │                ├─ pode subir de nível (250/600/1200 XP)
        │                └─ avança a etapa da jornada
        │                       │
        │                       ▼
        │              CELEBRAÇÃO DE DESCOBERTA
        │              (monumento · XP · progresso · especiais
        │               · próxima história — uma só folha)
        │                       │
        │                       ├─ Adicionar ao meu álbum → ÁLBUM
        │                       ├─ Continuar jornada     → MAPA / PERCURSO
        │                       └─ Agora não             → fecha
        │
        └─ jornada → PERCURSO COMPLETO (zonas em ordem editorial)
                       │
                       ├─ etapa descoberta → PÁGINA DO MONUMENTO
                       └─ etapa actual     → MAPA centrado

              PÁGINA DO MONUMENTO
                 ├─ escrever experiência  → +10 XP (1.ª vez, ≥ 10 caracteres)
                 ├─ tirar / carregar foto → +5 XP (3 primeiras), até 10 fotos
                 ├─ etiquetas de memória
                 └─ guardar → conta o dia na sequência
```

---

## 13. Princípios de desenho do código

Regras que o código respeita de forma consistente e que devem manter-se:

1. **O domínio não toca no DOM nem no `localStorage`.** `xp.js`, `levels.js`,
   `streak.js` e `journey.js` recebem tudo por injecção.
2. **O valor de cada recompensa é decidido no domínio**, nunca por quem chama —
   quem chama envia a **acção**, não o montante.
3. **O nível nunca é guardado**: é sempre derivado do XP total. Só se persiste
   `levelSeen`, para não repetir a celebração depois de um *refresh*.
4. **Nada é anunciado antes de ser gravado.** Se o XP não persistir, a descoberta
   é desfeita.
5. **Idempotência por `rewardKey`**: a lista de chaves nunca é truncada, mesmo
   quando o histórico visível é.
6. **Datas sempre locais**, nunca UTC — a meia-noite não pode roubar um dia de
   sequência.
7. **Acrescentar conteúdo é acrescentar configuração**: um nível novo é uma
   entrada em `LEVEL_CONFIG` + texto no i18n; uma acção nova de XP é uma entrada
   em `XP_ACTION` e outra em `XP_CONFIG`; uma jornada nova é uma entrada em
   `JOURNEY_CONFIG`. Nenhum limiar (250, 600, 1200) existe fora da configuração.
8. **Nenhum texto visível está fixo no código**: tudo passa por `i18n.js`.
9. **A câmara é sempre libertada** — nunca fica ligada em segundo plano.
10. **Uma celebração de cada vez**, e um único aviso por acção. Durante uma
    descoberta, as recompensas entram na celebração em vez de abrirem modais
    próprios.
11. **A celebração não é estado**: não é guardada em lado nenhum, por isso um
    refresh nunca a repete e reabrir um monumento nunca volta a celebrá-lo.

---

## 14. Estado actual e próximos passos naturais

### Implementado

- Autenticação local (registo, login, sessão persistente, logout)
- Scanner de QR com lanterna e tratamento de erros
- 12 monumentos, 4 zonas, 1 jornada cultural
- Sistema de XP completo, com histórico e idempotência
- 4 níveis derivados do XP, com celebração
- Sequência diária com semana, marcos e detalhe do dia
- Álbum por monumento: fotografias, experiência escrita, etiquetas
- Mapa Leaflet com geolocalização e distâncias
- 3 idiomas, 3 temas, alertas configuráveis
- Celebração de descoberta com três variantes, hierarquia de recompensas e
  ligação directa ao álbum
- Testes de domínio: `xp.test.js`, `levels.test.js`, `streak.test.js`,
  `journey.test.js`, `discovery.test.js` (156 testes)

### Já previsto no código, por implementar

- **Acções de XP reservadas**: `QUIZ_COMPLETED`, `CULTURAL_CHALLENGE_COMPLETED`,
  `ROUTE_COMPLETED`, `ISLAND_COMPLETED`, `EVENT_ATTENDED`
- **Actividade de sequência reservada**: `MISSION_COMPLETED` (missões culturais)
- **Novas jornadas**: `JOURNEY_CONFIG` já tem `islandId` e `cityId` — a estrutura
  está pronta para outras ilhas e cidades

### Limitações conhecidas

- **Nível 4 inalcançável hoje**: o máximo de XP obtenível (1 165) fica abaixo do
  limiar de 1 200 (ver 7.4)
- Autenticação é simulada: um só utilizador por dispositivo, a senha não é
  verificada no login, e nada é encriptado
- Tudo vive no `localStorage` — as fotografias em Data URL podem esgotar a quota
  do browser
- Sem backend: não há sincronização entre dispositivos nem tabela de
  classificação entre exploradores
