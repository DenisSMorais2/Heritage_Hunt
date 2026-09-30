# Heritage Hunt CV — Roteiro de Funcionamento

> Documento de referência do percurso completo da aplicação: cada ecrã, cada
> elemento visível e para que serve. Gerado a partir da leitura do código
> (`index.html`, `script.js`, `xp.js`, `levels.js`, `streak.js`, `journey.js`,
> `engagement.js`, `missions.js`, `map.js`, `analytics.js`, `i18n.js` e
> respectivas camadas `*-ui.js`).

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
| `supabase-config.js` | URL e chave pública do projecto Supabase |
| `cloud.js` | Espelho na nuvem: sessão, perfil, experiências e ficheiros no Supabase |
| `image-compressor.js` | **Domínio** da compressão: medidas, degraus de qualidade, formato |
| `ranking.js` | **Domínio** do ranking: pódio, barra de posição, estados vazios |
| `ranking-ui.js` | O ecrã dos exploradores: pódio, lista, carregamento, erros |
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
| `engagement.js` | **Domínio** do loop: "o que posso descobrir a seguir?" — não é um sistema novo, liga os que já existem |
| `engagement-ui.js` | O cartão de foco (Scanner) e o cartão da próxima descoberta (Mapa) |
| `missions.js` | **Domínio** da missão da semana: catálogo, semana de Cabo Verde, progresso sem duplicados |
| `missions-ui.js` | Cartão da missão, objectivos e celebração sóbria de missão concluída |
| `map.js` | **Domínio** da geometria do mapa: distâncias, estados dos marcadores, troços e halos das zonas |
| `map-ui.js` | O ecrã do mapa: marcadores, linha da jornada, zonas e *bottom sheet* |
| `analytics.js` | **Domínio** do funil da beta: marcos de produto e dias de actividade — nunca localização |

Bibliotecas externas: **Tailwind** (CDN), **Font Awesome**, **Leaflet** (mapa),
**qr-scanner** (leitura de QR), fontes Google (Playfair Display / Cormorant).

### Ordem de carregamento (fim de `index.html`)

`image-compressor.js` → `supabase-config.js` → `cloud.js` → `i18n.js` →
`streak.js` → `streak-ui.js` → `xp.js` → `xp-ui.js` → `levels.js` →
`levels-ui.js` → `journey.js` → `journey-ui.js` → `discovery.js` →
`discovery-ui.js` → `analytics.js` → `missions.js` → `missions-ui.js` →
`engagement.js` → `engagement-ui.js` → `map.js` → `map-ui.js` → `ranking.js` →
`ranking-ui.js` → `script.js`

O domínio carrega sempre antes da UI que o consome; `script.js` é o último,
porque liga tudo.

Três dependências dentro desta ordem não são arbitrárias:

- `engagement.js` lê `journey.js`, `xp.js` e `levels.js` (por funções
  injectadas, nunca por acesso directo), por isso vem depois deles
- `engagement-ui.js` desenha o cartão da missão através de `MissionsUI`, por
  isso as missões vêm antes
- `map-ui.js` pergunta a próxima descoberta ao `engagement.js` — nunca a
  escolhe — por isso vem depois dele

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

### 5.0 Cartão de foco (`#engagementFocus`) — o topo do ecrã

Antes da câmara, uma frase. O ecrã de entrada não pergunta "o que queres
fazer?": responde a **"o que posso descobrir a seguir?"**.

O lugar é um só, e mostra **uma coisa de cada vez** — nunca sete cartões a
competir pela mesma atenção. `Engagement.getFocus(missão)` decide qual, por
esta ordem:

| Estado | O que aparece | Quem desenha |
|---|---|---|
| Missão da semana por terminar | Cartão da missão, com objectivos e progresso | `missions-ui.js` |
| Jornada completa (12/12) | Fecho da jornada: o que construiu, não o que falta | `engagement-ui.js` |
| Zero descobertas | Primeira descoberta: um objectivo, uma frase, um botão | `engagement-ui.js` |
| A explorar | Próxima descoberta, com fotografia, motivo e "Ver no mapa" | `engagement-ui.js` |

A missão vem primeiro porque é o objectivo mais curto que existe. Quando não
há missão por fechar, o lugar volta à próxima descoberta.

**O cartão da próxima descoberta** (`.hh-eng-next`) traz fotografia, nome,
zona, distância (só se a localização já for precisa — nunca se pede a
localização por causa dele), o **motivo** da escolha em linguagem corrente, e
um botão que leva ao Mapa já focado nesse lugar. A 11/12 ganha peso próprio
(`.is-major`): é o momento mais importante da jornada antes do fim.

Por baixo, quando há, **uma** linha de "Quase lá" (`.hh-eng-almost`) — e uma
só, mesmo que várias regras se apliquem ao mesmo tempo:

| Regra | Quando | Mensagem |
|---|---|---|
| `JOURNEY_ONE_LEFT` | Falta 1 monumento na jornada inteira | Vence tudo o resto |
| `ZONE_ONE_LEFT` | Falta 1 numa zona **começada** | A zona actual primeiro |
| `ZONE_FEW_LEFT` | Faltam 2 numa zona começada | Ainda é uma promessa credível |
| `LEVEL_CLOSE` | Faltam ≤ 60 XP para o nível seguinte | Uma descoberta atravessa-o |
| `JOURNEY_PROGRESS` | Nada iminente | O progresso da jornada informa na mesma |

Uma zona onde ainda não se descobriu nada **não** conta como "quase lá" — isso
é estar no início, não perto do fim.

O estado "zero descobertas" é deliberadamente pobre: sem percentagens a zero,
sem medalhas por desbloquear, sem ranking. Um objectivo e um caminho para ele.

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

O mapa deixou de dizer *"aqui estão os monumentos"*. Passou a dizer, num
relance: **estou aqui; já explorei estes; estes faltam; estou quase a fechar
esta zona; vou aqui a seguir.**

A instância do Leaflet é **uma só** e cria-se **uma vez** (`MapUI.create()`).
Trocar de ecrã, entrar em ecrã inteiro ou mudar de idioma nunca recria o mapa:
só se redesenham as camadas (`MapUI.render()`) ou se corrige o tamanho
(`MapUI.invalidate()`).

**A caixa tem proporção, não altura.** `.hh-map-wrap` é `aspect-ratio: 4 / 3`,
com `46dvh` apenas como tecto. Amarrar a altura a `dvh` — como estava — tinha
duas consequências: a caixa mudava de **forma** entre ecrãs (quase quadrada num
telemóvel alto, uma faixa larga num ecrã baixo), e em telemóvel a barra do
browser a recolher no scroll mudava o `dvh` a meio da leitura. Agora a forma vem
da largura, que é a mesma em todos os ecrãs; em paisagem passa a `16 / 9`, onde
a altura é o recurso escasso. Em ecrã inteiro a proporção desliga-se: aí manda o
ecrã.

**E o Leaflet é avisado sempre que essa caixa muda.** Ele decide quantas
*tiles* desenhar uma única vez, com a medida que a caixa tinha no arranque —
rodar o telemóvel, a barra do browser a recolher, entrar ou sair do ecrã
inteiro deixavam-no com as *tiles* do tamanho antigo: faixas cinzentas de um
lado, imagem cortada do outro. Um `ResizeObserver` sobre a própria caixa apanha
as quatro causas de uma vez, reage só quando a medida mudou mesmo, e agrupa por
*frame* — durante uma rotação chega a última medida, não as sete intermédias.

| Elemento | Para que serve |
|---|---|
| `.hh-map-title` | "Mapa de Mindelo" + subtítulo |
| `#mapProgressCount` | Progresso da jornada, sempre à vista ("X / 12") |
| `.hh-legend` | Legenda dos três estados, cada um com o **seu** ícone |
| `#map` | O mapa, com marcadores, linha da jornada e halos das zonas |
| `#locateUserBtn` | Alvo de mira → `locateUser()` |
| `#mapSheet` | *Bottom sheet* do lugar seleccionado — substitui o popup branco do Leaflet |

**Os marcadores** (`L.divIcon`, HTML + CSS — nenhum PNG novo). Nenhum estado se
distingue **só** pela cor: cada um tem o seu ícone.

| Estado | Ícone | Tamanho | Pane |
|---|---|---|---|
| `NEXT` — a próxima descoberta | seta de localização | 46 px, com anel a pulsar | `hhNextPane` |
| `USER` — onde a pessoa está | ponto com halo | 26 px | pane do utilizador |
| `DISCOVERED` | visto | 34 px | `hhMonumentPane` |
| `UNDISCOVERED` | monumento | 34 px | `hhMonumentPane` |

**Só um marcador** pode estar em `NEXT`, e um monumento já descoberto nunca lá
chega. A hierarquia de atenção resolve-se pelos *panes* do Leaflet, não por
`!important`.

**A linha da Jornada** (`renderJourney()`) liga os monumentos pela **ordem
narrativa** do percurso, em três estados — concluído (dourado cheio), actual
(pontilhado claro) e futuro (azul ténue e esbatido). Fica **abaixo** dos
marcadores e sem interacção: é contexto, não o assunto.

> **Não há *routing*.** A linha não conhece ruas, e as distâncias são em linha
> recta (Haversine). Por isso nunca se escreve "a pé" nem "em N minutos".

**Os halos das zonas** (`renderZones()`) são círculos derivados **apenas** das
coordenadas dos monumentos de cada zona (raio mínimo 130 m). O projecto não tem
polígonos, GeoJSON nem limites oficiais — e não se inventam fronteiras. O
domínio devolve `isApproximate`, e a folha da zona diz isso à pessoa, por
escrito.

> **Não há cartão a pairar sobre o mapa.** O mapa é o mapa: a próxima
> descoberta anuncia-se no cartão acima dele (7.2.1) e destaca-se no próprio
> marcador `NEXT`. Um painel permanente por cima do mapa tapava exactamente
> aquilo que se foi lá ver.

**O *bottom sheet* `#mapSheet`** abre ao tocar num marcador ou num halo, com o
mapa sempre visível por trás:

| Toque em | O que a folha mostra |
|---|---|
| Monumento descoberto | Fotografia nítida, zona, distância, data da descoberta, descrição → **Abrir álbum** |
| Monumento por descobrir | Fotografia **com véu** e ícone de QR, mas o **nome legível** — é preciso saber para onde se vai → **Explorar** |
| Halo de uma zona | Nome, "X/Y", barra, o que falta, o aviso de que o halo é aproximado → **Ver o que falta** ou **Rever descobertas** |

**`MapUI.explore(id)`** (o destino de todos os "Ver no mapa") aterra no
monumento a zoom 17 — perto o suficiente para se ver a rua — e abre a folha
desse lugar em vez de empilhar outra por cima. Com `prefers-reduced-motion`,
salta em vez de voar.

**A revelação depois de uma descoberta** (`markRevealed()` →
`playPendingReveal()`) só corre quando o mapa está mesmo visível: durante a
celebração o mapa está escondido, e animar às escondidas era gastar a animação.
A intenção fica pendente até haver ecrã, e é consumida mesmo que o marcador já
não exista — nunca fica à espera para sempre. É uma revelação curta (760 ms),
sem confetti: a celebração já aconteceu.

**`locateUser()` / `getUserLocation()`** — pede geolocalização, coloca o
marcador do utilizador com círculo de precisão e calcula a distância ao
monumento mais próximo. A localização **nunca** é pedida só para desenhar
distâncias: sem ela, os cartões mostram-se na mesma, apenas sem distância.

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

### 7.2.1 Cartão "Próxima descoberta" (`#engagementMapCard`)

No topo do ecrã, **acima** do mapa, o mesmo cartão do Scanner — é daqui que o
*loop* arranca: "o Mercado Municipal está por descobrir" → **Ver no mapa** →
`MapUI.explore()`. Desenhado por `engagement-ui.js`, com os dados de
`Engagement.getNextDiscovery()`.

É o **único** cartão de próxima descoberta neste ecrã. Dentro do mapa, essa
informação vive apenas no marcador `NEXT` e, quando se toca nele, na folha do
lugar.

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
| `#missionModal` | Missão da semana concluída | Ícone, objectivos feitos, +50 XP e "Continuar a explorar" |
| `#mapSheet` | Toque num marcador ou num halo de zona | *Bottom sheet* do lugar, com o mapa visível por trás (secção 7.1) |
| `#cameraModal` | "Tirar foto" | Vídeo ao vivo + botão redondo de captura |
| `#xpToast` | Ganho de XP sem novo dia | Aviso discreto (`aria-live="polite"`) |

### Regra de ouro: uma celebração de cada vez

Medalhas de progresso, marcos de sequência, subidas de nível e a missão da
semana partilham a **mesma fila** (`badgeQueue`).

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

## 11. Persistência (`localStorage` + Supabase)

### A regra que governa as duas camadas

O `localStorage` é a fonte **síncrona** da verdade. O domínio grava como sempre
gravou e **nunca espera pela rede** — é isso que mantém intacta a regra de ouro:
nada é anunciado antes de estar gravado, e uma descoberta desfaz-se se a escrita
falhar. O Supabase é um **espelho** por cima disso: puxa quando a sessão abre,
empurra depois de cada gravação local.

Consequência desejada: sem rede a app funciona na mesma, e o que ficou por
enviar sobe assim que a ligação voltar.

### Chaves locais

| Chave | Conteúdo |
|---|---|
| `heritageUser` | Perfil: dados, foto, `cloudId`, `scannedMonuments`, `xp` (carteira), `explorationStreak`, `levelSeen`, `weeklyMission`, `analytics` |
| `heritageSettings` | `{ theme, lang, achievementAlerts }` |
| `monument_note_<id>__<dono>` | Texto da experiência de um monumento |
| `monument_tags_<id>__<dono>` | Etiquetas de memória de um monumento |
| `monument_photos_<id>__<dono>` | Álbum de um monumento: **metadados**, não imagens |

As chaves de monumento têm **dono** (`monumentKey()`): desde que há contas a
sério, duas pessoas podem usar o mesmo telemóvel, e o álbum de uma não pode
aparecer à outra. Conteúdo gravado antes das contas é adoptado pela conta que
entrar com o mesmo email (`adoptLegacyMonumentKeys()`).

### Tabelas na nuvem

| Tabela | Conteúdo |
|---|---|
| `profiles` | Uma linha por conta: `name`, `points`, `level_seen`, `xp`, `exploration_streak`, `scanned_monuments`, `settings`, `weekly_mission`, `analytics` |
| `monument_entries` | Uma linha por monumento visitado: `note`, `tags` |
| `monument_photos` | Metadados do álbum: `path`, medidas, `bytes`, `original_bytes` |
| `monument-photos` *(bucket)* | Os ficheiros das fotografias, privados |
| `xp_events` | **Ledger de XP validado no servidor** — a base do ranking |
| `monuments`, `xp_rules` | Catálogo de referência: quanto vale cada coisa |

Ambas com **RLS**: cada explorador só lê e escreve o que é seu.

Os agregados de domínio (carteira, sequência, missão da semana, funil) sobem como `jsonb` **inteiros**,
de propósito — assim uma gravação continua a ser **uma escrita atómica**, tal
como o ponto 4 da secção 13 exige.

### As fotografias vivem no Storage, comprimidas

Um bucket **privado** (`monument-photos`), com o caminho sempre na forma
`<id do dono>/<monumento>/<foto>.<ext>` — é a **primeira pasta** que a política
do bucket compara com quem pede, por isso mudar essa forma é mudar a segurança.
Quem vê uma fotografia recebe um **link assinado** que dura uma hora, nunca um
endereço público.

Nenhuma imagem entra numa linha da base de dados: `toRow()` monta o perfil campo
a campo, e o que lá vai é o **caminho** do ficheiro. A tabela `monument_photos`
guarda os metadados; o avatar é uma coluna `avatar_path`.

**Nada sobe por comprimir** (ver secção 11.1). O limite de 1 MB por ficheiro no
bucket é uma rede de segurança, não o caminho normal.

### Fotografias pendentes

Sem rede, a fotografia é guardada **em casa**, marcada `pending`, e conta na
mesma — porque foi mesmo gravada, que é o que o ponto 4 da secção 13 exige.
Sobe sozinha ao entrar na app, quando a ligação volta, e liberta nesse momento a
quota do browser que estava a ocupar.

É o mesmo mecanismo que migra os álbuns antigos: uma fotografia guardada antes
desta mudança nasce pendente e, ao subir, passa pelo compressor — e é aí que
está o maior ganho de espaço de toda esta alteração.

### Apagar não deixa órfãos

Uma fotografia que já vive na nuvem só sai do aparelho **depois** de sair de lá.
Se o ficheiro subiu mas o registo falhou, o ficheiro é apagado. Um ficheiro que
ninguém sabe mostrar seria espaço ocupado para sempre.

---

## 11.1. Compressão (`image-compressor.js`)

Porque existe: o armazenamento é finito e partilhado por todos os exploradores.
Uma fotografia de telemóvel pesa vários MB; a mesma fotografia, no tamanho em
que é realmente vista, pesa uma fracção disso.

| Perfil | Maior aresta | Alvo | Tecto |
|---|---|---|---|
| `ALBUM` | 1600 px | 180 KB | 900 KB |
| `AVATAR` | 512 px | 60 KB | 300 KB |

Regras que o compressor respeita:

1. **Nunca aumenta uma imagem.** Esticar uma foto pequena só gastaria espaço a
   inventar pixéis que não existem.
2. **A qualidade desce por degraus** (0.82 → 0.45), e pára no primeiro que
   couber — quem já cabia à primeira não é degradado.
3. **WebP quando o browser o suporta**, JPEG quando não; tipicamente 25 a 35 %
   abaixo do JPEG com a mesma qualidade aparente.
4. **A orientação EXIF é respeitada** (`createImageBitmap`), ou fotos tiradas de
   lado subiam deitadas.
5. **Comprime-se uma só vez.** Uma fotografia já comprimida que esteja pendente
   sobe tal como está; perder qualidade duas vezes não poupa nada que compense.
6. **A aritmética não toca no DOM**, e é por isso que tem testes
   (`image-compressor.test.js`, 26 testes).

---

## 11.2. Ranking de exploradores

O ranking é uma **camada social**: mostra que mais alguém anda lá fora a
descobrir os mesmos lugares. Nunca interrompe uma descoberta — o centro do
produto continua a ser explorar, descobrir, aprender e guardar memórias.

Tem **aba própria** na barra de navegação, ao lado de Scanner, Perfil e Mapa,
e é também alcançável pelo cartão *Comunidade* no perfil. Por isso é uma
**vista**, e não um modal: a barra de baixo tem de continuar visível por cima
dela. O troféu passou para o Ranking e o Perfil ficou com a pessoa — dois
troféus lado a lado não se distinguem.

O ranking é a única vista que **esconde o cabeçalho global**: tem herói próprio,
com a fotografia do porto a chegar ao topo do ecrã. Dois cabeçalhos empilhados
seriam dois títulos a discutir.

### O problema que obrigou a um ledger

`profiles.xp` é um JSONB que o **próprio cliente escreve por inteiro**. Serve
bem para o jogo — a carteira local é a fonte da verdade da experiência — mas não
serve para um ranking: bastava a consola do browser para ficar em primeiro.

Por isso o ranking **não lê `profiles.xp`**. Lê `xp_events`, um ledger onde:

1. **o montante vem sempre do servidor**, de `xp_rules` e `monuments`, nunca de
   quem chama — o cliente envia a *acção*, nunca o valor;
2. **a idempotência é uma restrição `UNIQUE (user_id, reward_key)`**, e não uma
   convenção. É a mesma `rewardKey` que o `xp.js` já usava;
3. **os pré-requisitos são verificados**: só se fotografa ou se escreve sobre um
   monumento já descoberto, e uma zona só conta quando todos os seus monumentos
   estão descobertos;
4. **não existe política de `INSERT`** na tabela. A única porta é a função
   `award_xp`, e essa ausência é a fechadura.

Resultado: o XP máximo possível é o que o conteúdo permite — 12 monumentos e
4 zonas dão **1165** — e não um número à escolha.

> ⚠️ **`xp_rules` é o espelho de `XP_CONFIG` em `xp.js`.** Quem acrescentar uma
> acção de XP tem de a acrescentar nos **dois** sítios. O cliente decide *se*
> recompensa; o servidor decide *quanto vale*. Se divergirem, o ranking mente.

### Isto não é um segundo sistema de XP

As regras do jogo continuam todas em `xp.js`. O ledger não decide nada sobre a
experiência: é uma sombra verificável, escrita a partir de `awardXP()`, o único
sítio por onde o XP passa. Se a subida falhar, o jogo não dá por isso — e
`syncXpLedger()` repõe tudo no arranque seguinte, sem risco de duplicar.

### A semana

De **segunda-feira 00:00 a domingo 23:59, hora de Cabo Verde** — o fuso do país,
não o do aparelho, para que dois exploradores lado a lado vejam a mesma semana.
Calculado em Postgres por `week_start()`; o relógio do browser nunca decide nada.

**O XP total nunca é reposto a zero.** À segunda-feira não se apaga nada: a
consulta passa simplesmente a somar os eventos da semana nova. Quem tinha 3250 XP
continua com 3250 XP e aparece com 0 XP semanais.

### Posições e empates

A ordem é sempre determinista: **XP da semana → descobertas → quem lá chegou
primeiro**. Duas pessoas só partilham posição quando estão empatadas nos três
critérios — aí mostram-se mesmo como `#6` e `#6`, sem desempate artificial.

### As descobertas ao lado do XP

Decisão de produto, não enfeite. Sem elas, o ranking seria «quem juntou mais
pontos»; com elas percebe-se que aqueles pontos são **lugares onde a pessoa
esteve**. O XP determina a posição; as descobertas explicam o que representa.

### O ecrã

Herói com a fotografia do porto, pódio de três com coroas discretas e o primeiro
lugar um degrau acima, lista a partir do quarto, e uma barra fixa por cima da
navegação para quem está fora do top visível. Estados próprios para carregar
(esqueleto, nunca «0 XP» nem «#0»), erro com *Tentar novamente*, e vazio com
um caminho de volta ao que a app é: **Explorar monumentos**.

Duas coisas do desenho ficaram deliberadamente de fora, ambas pela mesma razão
— não mostrar comandos que não fazem nada (a regra que o próprio briefing fixa):

- **A seta `>` em cada linha.** Tocar levaria a um perfil público de outro
  explorador, que não existe e que o MVP diz para não construir.
- **O menu do selector de período.** Só existe a semana actual; um menu com uma
  só opção é um botão morto. O *Esta semana* ficou como etiqueta.

Ambas voltam no dia em que houver para onde ir.

### Ranking desativado

Quem escolhe não participar **continua a ter a aba Ranking** e continua a poder
abri-la. O que muda é o conteúdo: em vez do pódio e da lista, a página mostra um
estado próprio.

Isto **não é um erro nem uma lista vazia** — é uma escolha respeitada, e a
interface tem de o dizer com clareza. Daí as regras que este estado segue:

1. **Nenhuma linguagem de aviso.** Nada de vermelho, triângulo ou cinzento de
   coisa partida. O emblema é o troféu da app, dourado, com uma barra fina;
   à volta, o percurso tracejado e as estrelas de bússola da identidade.
2. **Nenhuma pressão.** Nunca «estás a perder posições», «outros estão à tua
   frente» ou «volta já». O texto convida e explica, e mais nada.
3. **A saída está sempre à vista**, e a tranquilização também: um cartão
   secundário lembra que o XP, as descobertas e as memórias continuam iguais.
4. **O convite nunca liga nada sozinho.** Tocar em *Participar no ranking* abre
   uma folha que diz primeiro o que passa a ser visível, e só depois pergunta.
   Uma mudança que torna o nome e a fotografia públicos não acontece com um
   toque distraído.

`Ranking.viewState()` decide qual dos quatro estados mostrar, e a decisão de não
participar **vence tudo o resto** — é avaliada antes de se olhar para quem há.
Uma resposta em falta nunca conta como desativado: desativado é uma escolha
deliberada, não uma falha de rede.

Ao aceitar, a escrita acontece primeiro e a vista só transita depois. Não há
recarregamento da página, e o aviso é um *toast* do mesmo feitio dos outros da
app — entrar no ranking merece uma frase, não confetti.

### Privacidade

Participar é uma escolha (`profiles.ranking_opt_in`), e **acompanha a conta**,
não o aparelho. Quem sai continua a ganhar XP, a subir de nível, a manter a
sequência e a descobrir — apenas não aparece na lista.

O interruptor existe em **dois sítios** — nas definições e no painel *Sobre o
ranking* — e há ainda dois caminhos que levam ao mesmo sítio: o convite do estado
desativado e o *Participar agora* no fim do painel. Todos passam por
`toggleRankingOptIn()`, que sincroniza as superfícies e só depois envia. Quem quer perceber o que isto é, ou sair,
encontra tudo no sítio onde a dúvida nasce.

O que o ranking expõe: **nome, avatar, XP semanal e descobertas**. Nunca email,
nunca localização, nunca álbuns ou experiências, e nunca o id de outra pessoa —
«quem sou eu» diz-se com um booleano. A agregação acontece toda em Postgres: o
browser recebe no máximo 20 linhas já somadas, e nunca um evento alheio.

Os avatares dos outros exigiram uma política de Storage própria: só ficheiros com
**uma** pasta no caminho (`<id>/avatar.ext`, ao contrário de
`<id>/<monumento>/<foto>.ext`) e só de quem optou por participar. O álbum
mantém-se privado.

### Adaptadores

Tanto `xp.js` como `streak.js` recebem o armazenamento por **adaptador
injectado** (`configureStorage({ load, save })`) — foi essa injecção que
permitiu acrescentar a nuvem sem tocar numa única regra de domínio.

`saveUserData()` mantém `user.points` como espelho do XP total, para que
qualquer código antigo continue a ler um valor correcto.

---

## 11.3. Loop de descoberta (`engagement.js`)

Este módulo existe para responder a **uma** pergunta: *"o que posso descobrir a
seguir?"*.

Não é um sistema novo. O XP vive em `xp.js`, o nível em `levels.js`, o percurso
em `journey.js`, a sequência em `streak.js`. O `engagement.js` **liga** o que já
existe e escolhe, de tudo o que está a acontecer, a **uma** coisa que vale a
pena dizer a seguir. Não guarda nada: tudo é derivado do estado real.

### A escolha da próxima descoberta

`getNextDiscovery()` devolve um monumento e, com ele, o **motivo** — e é o
motivo que decide a frase que a pessoa lê:

| Motivo | Quando |
|---|---|
| `LAST_IN_JOURNEY` | Falta um único lugar para fechar a jornada inteira |
| `FIRST` | Ainda não descobriu nada — o objectivo tem de ser simples |
| `LAST_IN_ZONE` | Falta um único lugar para completar uma zona |
| `JOURNEY_STEP` | A etapa seguinte do percurso editorial |
| `NEAREST` | Defensivo: o percurso não resolveu, fica o mais próximo |

O motivo é escolhido **aqui**, com regras testáveis, e não dentro do
componente. A interface recebe ids e números e traduz-os
(`engagement.reason.<motivo>`, `engagement.almost.<regra>`): o domínio não
conhece traduções.

### Uma decisão, um sítio

A próxima descoberta aparece em três sítios — cartão de foco do Scanner,
cartão acima do mapa e marcador `NEXT`. São **três desenhos da mesma
decisão**, todos a perguntar ao `engagement.js`. Nem o `map-ui.js` nem o
`discovery-ui.js` escolhem o que vem a seguir.

### O que este módulo não faz

- não toca no DOM nem no `localStorage`;
- não atribui XP, não mexe em níveis, zonas nem na sequência;
- não conhece as missões: o estado da missão **entra por parâmetro** em
  `getFocus(missão)`, para que a regra de prioridade continue testável sozinha.

---

## 11.4. Missão da semana (`missions.js`)

Uma razão simples para voltar durante a semana. **Não** há missões diárias,
temporadas, passes nem dezenas de tipos — há uma missão, e ela muda à
segunda-feira.

### O catálogo é conteúdo, não infraestrutura

`WEEKLY_MISSION_CONFIG` tem **9 missões**, em código, como `JOURNEY_CONFIG`,
`LEVEL_CONFIG` e `STREAK_MILESTONES`. Acrescentar uma missão é acrescentar uma
entrada e o texto no `i18n.js`. Nenhuma tabela nova precisa de existir para
isso.

| Missão | Objectivos |
|---|---|
| `first_steps` | 1 descoberta + 1 fotografia |
| `keep_the_story` | 1 descoberta + 1 experiência escrita |
| `explore_mindelo` | 2 descobertas + 1 fotografia |
| `city_memories` | 2 fotografias em monumentos **diferentes** + 1 experiência |
| `historic_centre` | 1 descoberta no Centro Histórico + 1 experiência |
| `sea_front` | 1 descoberta na Frente-Mar + 1 fotografia |
| `close_a_zone` | Completar 1 zona |
| `album_keeper` | 2 fotografias em monumentos diferentes |
| `two_memories` | 2 experiências escritas |

Os quatro tipos de objectivo — `DISCOVER_MONUMENT`, `ADD_PHOTO`,
`WRITE_EXPERIENCE`, `COMPLETE_ZONE` — são acções que a app **já** fazia.
Nenhuma interacção nova foi inventada para as missões existirem.

As contagens são pequenas de propósito: uma missão descreve uso natural, nunca
"adiciona 10 fotografias". As duas últimas não exigem descobrir nada — são as
que continuam a fazer sentido a 12/12.

### A semana é de Cabo Verde, não do aparelho

Segunda 00:00 a domingo 23:59, **hora de Cabo Verde** — o mesmo fuso que o
`week_start()` do Postgres usa para o ranking. Não é um detalhe: se a missão
usasse a hora do aparelho, uma missão fechada ao domingo à noite podia cair
numa semana diferente daquela em que o XP que ela gerou entra no ranking. Cabo
Verde é UTC−1 todo o ano, por isso a conversão é uma subtracção, não uma tabela.

A chave da semana é a data da segunda-feira (`YYYY-MM-DD`), e a escolha da
missão é **determinística** a partir dela: o mesmo instante dá a mesma missão em
qualquer aparelho, sem servidor.

Só entram no sorteio as missões cujos objectivos a conta **ainda consegue**
cumprir — a quem já descobriu tudo nunca sai "descobre 2 monumentos".

### Progresso por referências, não por contadores

Cada acção guarda uma **referência** (`m_<monumento>`, `z_<zona>`,
`p_<foto>`), não um `+1`. Daí resultam duas propriedades de graça:

- duas fotografias do mesmo monumento **não** contam duas vezes quando o
  objectivo pede monumentos diferentes — é assim que se evita o *spam*;
- ao sincronizar, o progresso de dois aparelhos é a **união** das referências,
  e juntar nunca conta a mesma acção duas vezes.

Quando dois aparelhos atribuíram missões **diferentes** para a mesma semana
antes de sincronizarem, ganha a mais avançada; se qualquer um dos lados já
pagou a recompensa, não se paga outra vez.

### A recompensa

50 XP, pela acção `WEEKLY_MISSION_COMPLETED`, **pelo caminho único do XP** — e
por isso entra no `xp_events` do servidor e no ranking semanal como qualquer
outro ponto. Não há pontos especiais para o ranking.

- o valor vive em `XP_CONFIG`, como todos os outros; `missions.js` só diz *que*
  acção recompensa, nunca *quanto* vale;
- `uniquePerEntity` com a chave da semana garante que rende **uma vez** nessa
  semana e volta a poder render na seguinte — a mesma idempotência que trava o
  resto do XP;
- conta como actividade do dia na sequência, com a semântica
  `MISSION_COMPLETED` que já estava reservada;
- `markRewarded()` devolve `true` uma única vez: a celebração nunca volta depois
  de um *refresh* — o mesmo papel do `levelSeen`.

### A celebração

`#missionModal`, desenhada por `missions-ui.js`: um ícone, os objectivos, a
recompensa e um convite. Entra na **fila de celebrações** que já existe, por
isso nunca abre por cima da celebração de uma descoberta. O botão "Continuar"
leva sempre a uma acção útil — um botão que não sabe para onde vai não devia
existir.

---

## 11.5. Analytics da beta (`analytics.js`)

Mede **comportamento de produto, não pessoas**.

O que guarda, e só isto:

- que um marco do funil aconteceu, e quando;
- em que **dias** a app foi aberta (chaves de dia, nada de horas);
- quantas vezes um cartão levou a uma acção.

O que **nunca** guarda: localização (nem uma vez, muito menos contínua),
movimento, percursos, tempo em ecrã, texto de experiências, nomes de
fotografias ou qualquer conteúdo escrito pela pessoa.

### O funil

`ACCOUNT_CREATED` → `FIRST_SCAN` → `FIRST_DISCOVERY` → `SECOND_DISCOVERY` →
`FOUR_MONUMENTS_DISCOVERED` → … → `ALL_MONUMENTS_DISCOVERED`, mais os marcos de
regresso (`APP_RETURNED_OTHER_DAY`) e da missão. Cada marco conta **uma vez por
conta, para sempre** — a data do primeiro, e nada mais.

Guarda 120 dias de actividade e 26 semanas: chega para se ver o regresso sem o
perfil crescer sem fim.

### Onde vive

Dentro do perfil, como a carteira de XP e a sequência. Sobe para
`profiles.analytics` pela fila de sincronização que **já** existe — por isso
funciona offline sem uma linha de código nova, e o funil responde-se com uma
consulta a essa coluna: sem tabela de eventos, sem RPC, sem infraestrutura nova.

---

## 11.6. A migração da beta (`migrations/001_engagement_beta.sql`)

Duas colunas e uma regra. Nada mais. Seguro de correr mais de uma vez.

```sql
alter table public.profiles
    add column if not exists weekly_mission jsonb not null default '{}'::jsonb,
    add column if not exists analytics      jsonb not null default '{}'::jsonb;

insert into public.xp_rules (action, amount)
values ('WEEKLY_MISSION_COMPLETED', 50)
on conflict (action) do update set amount = excluded.amount;
```

**Porque não há tabelas novas.** O catálogo de missões é conteúdo, e todo o
conteúdo desta app vive em código. O progresso segue o padrão que `xp` e
`exploration_streak` já usavam: um agregado `jsonb` dentro do perfil — assim
uma gravação continua a ser **uma** escrita atómica, e sobe pela fila que já
existe. O RLS de `profiles` protege as duas colunas sem política própria.

**A linha em `xp_rules` é crítica.** `xp_rules` é o espelho de `XP_CONFIG`: o
cliente decide **se** recompensa, o servidor decide **quanto** vale. Sem ela, o
XP da missão nunca chega a `xp_events` — a carteira local subia e o ranking
ficava atrás, calado. Os 50 têm de ser iguais aos de
`XP_CONFIG.WEEKLY_MISSION_COMPLETED`.

Depois de correr, vale confirmar que `award_xp` aceita uma acção **sem
monumento nem zona** (a entidade da missão é a semana). E notar que o tecto de
XP mudou: 1 165 passa a 1 165 + 50 por cada semana em que a missão for
concluída.

---

## 12. Percurso completo do utilizador

```
ABRIR A APP
  │
  ├─ sem sessão ──► ECRÃ DE AUTENTICAÇÃO (Supabase Auth)
  │                   ├─ Criar conta ──► perfil novo (0 XP, nível 1 Explorador)
  │                   └─ Entrar ───────► perfil puxado da nuvem + migrações
  │
  └─ com sessão ──► entra directamente (sem rede, entra com o que é local)
                      │
                      ▼
              SCANNER (vista por omissão)
                      │
                      ├─ CARTÃO DE FOCO: missão da semana
                      │                  OU próxima descoberta
                      │                  OU a primeira descoberta
                      │                  OU o fecho da jornada
                      │                       └─ Ver no mapa ─┐
        ┌─────────────┼──────────────┐                        │
        ▼             ▼              ▼                        │
     SCANNER        PERFIL          MAPA  ◄───────────────────┘   RANKING   [⚙]
        │             │              │
        │             │              ├─ marcador NEXT  → folha: Explorar
        │             │              ├─ por descobrir  → folha com véu, nome legível
        │             │              ├─ descoberto     → folha → ÁLBUM
        │             │              ├─ halo de zona   → progresso + o que falta
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
        │                ├─ avança a etapa da jornada
        │                └─ conta para a missão da semana
        │                       └─ missão fechada → +50 XP → CELEBRAÇÃO DA MISSÃO
        │                          (na mesma fila: nunca por cima da descoberta)
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
                              e conta para a missão da semana
```

---

## 13. Princípios de desenho do código

Regras que o código respeita de forma consistente e que devem manter-se:

1. **O domínio não toca no DOM nem no `localStorage`.** `xp.js`, `levels.js`,
   `streak.js`, `journey.js`, `engagement.js`, `missions.js`, `map.js` e
   `analytics.js` recebem tudo por injecção.
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
   `JOURNEY_CONFIG`; uma missão nova é uma entrada em `WEEKLY_MISSION_CONFIG`. Nenhum limiar (250, 600, 1200) existe fora da configuração.
8. **Nenhum texto visível está fixo no código**: tudo passa por `i18n.js`.
9. **A câmara é sempre libertada** — nunca fica ligada em segundo plano.
10. **Uma celebração de cada vez**, e um único aviso por acção. Durante uma
    descoberta, as recompensas entram na celebração em vez de abrirem modais
    próprios.
11. **Uma decisão, um sítio.** A próxima descoberta é escolhida **só** no
    `engagement.js` e desenhada em quatro lugares. Nenhum componente decide por
    conta própria o que vem a seguir.
12. **Não se inventa o que não existe.** Sem geometria de zonas, desenha-se um
    halo assumidamente aproximado; sem rotas, não se escreve "a pé" nem
    "em N minutos".
13. **A celebração não é estado**: não é guardada em lado nenhum, por isso um
    refresh nunca a repete e reabrir um monumento nunca volta a celebrá-lo.

---

## 14. Estado actual e próximos passos naturais

### Implementado

- Autenticação real com Supabase Auth (registo, login, sessão persistente,
  logout), com a senha verificada no servidor
- Progresso sincronizado na nuvem: entrar noutro aparelho encontra tudo lá
- Fotografias no Supabase Storage, comprimidas antes de subir, com fila
  para o que foi tirado sem rede
- Ranking semanal de exploradores, com XP validado no servidor, opt-out,
  pódio, barra de posição própria e estados de carregamento, vazio e erro
- Estado desativado com identidade própria, convite confirmado antes de
  activar, painel *Sobre o ranking* e transição imediata ao aderir
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
- **Loop de descoberta**: um único sítio a responder "o que posso descobrir a
  seguir?", com motivo em linguagem corrente e uma só linha de "Quase lá"
- **Missão da semana**: 9 missões em catálogo, semana de Cabo Verde,
  determinística e igual em todos os aparelhos, 50 XP pelo caminho normal do XP
- **Mapa de exploração**: marcadores com estado (incluindo o da próxima
  descoberta), linha da jornada em três estados, halos aproximados das zonas,
  *bottom sheet* do lugar e revelação depois da descoberta
- **Funil da beta** dentro do perfil, sem localização, sem percursos e sem
  tabela de eventos
- Migração `001_engagement_beta.sql`: duas colunas `jsonb` e a regra de XP da
  missão
- Testes de domínio: `xp.test.js`, `levels.test.js`, `streak.test.js`,
  `journey.test.js`, `discovery.test.js`, `image-compressor.test.js`,
  `ranking.test.js`, `engagement.test.js`, `missions.test.js`, `map.test.js`
  (328 testes)

### Já previsto no código, por implementar

- **Acções de XP reservadas**: `QUIZ_COMPLETED`, `CULTURAL_CHALLENGE_COMPLETED`,
  `ROUTE_COMPLETED`, `ISLAND_COMPLETED`, `EVENT_ATTENDED`
- **Novas jornadas**: `JOURNEY_CONFIG` já tem `islandId` e `cityId` — a estrutura
  está pronta para outras ilhas e cidades

### Limitações conhecidas

- **Nível 4 só com missões**: as descobertas e as zonas rendem 1 165 XP, abaixo
  do limiar de 1 200 (ver 7.4). A missão da semana é o que atravessa a
  diferença — 50 XP por semana concluída. Quem nunca fizer uma missão continua
  a não chegar a Lenda de Mindelo
- **Um álbum só se vê com ligação.** As imagens deixaram de estar no aparelho,
  por isso offline mostram-se vazias — excepto as que ainda estão pendentes.
  Guardar miniaturas locais resolveria, ao custo de voltar a gastar quota
- **Conflito entre aparelhos resolve-se pelo XP mais alto** (`pickProfile()`).
  O progresso desta app só cresce, por isso o critério é seguro e previsível —
  mas dois aparelhos a explorar em paralelo sem rede não fundem as descobertas:
  ganha o retrato com mais XP
- **Não há interruptor global do ranking.** O estado desativado responde a
  `profiles.ranking_opt_in`, que é por pessoa. Um `ranking_enabled` para toda a
  app — para desligar a funcionalidade de uma vez — não existe, e exigiria uma
  tabela de configuração que ainda não se justifica
- **Os halos das zonas são aproximados, e dizem-no.** O projecto não tem
  geometria de zonas — só listas de monumentos. O círculo vem das coordenadas
  dos próprios monumentos, nunca de um limite administrativo, e a folha da zona
  avisa a pessoa disso por escrito
- **O mapa não faz *routing*.** A linha da Jornada é a ordem narrativa dos
  monumentos, e as distâncias são em linha recta. Por isso nunca se escreve "a
  pé" nem "em N minutos"
- **A missão da semana é atribuída no cliente.** É determinística e em hora de
  Cabo Verde, por isso dois aparelhos chegam à mesma missão sem servidor — mas
  um relógio muito errado no aparelho vê a semana errada até se corrigir
- **O funil lê-se por consulta.** Não há painel: as respostas da beta saem de um
  `select` sobre `profiles.analytics`. Foi a troca deliberada por não criar
  uma tabela de eventos
- **O ranking filtra por ilha mas só existe São Vicente.** `profiles.island_id`
  e o parâmetro da consulta já estão lá; faltam as outras ilhas no conteúdo.
  Não há filtros de Amigos nem de Cabo Verde — e não se mostram botões que
  ainda não funcionam
- **`get_weekly_ranking` chama `weekly_standings` três vezes** (top, total e a
  minha posição) dentro de um CTE `materialized`. Chega bem para esta escala;
  com milhares de exploradores por semana, passa a valer a pena materializar
- **Overlays com `backdrop-filter` bloqueiam o compositor ao redimensionar a
  janela** neste browser. É anterior a este trabalho — reproduz-se na página do
  monumento, que não foi tocada — e não afecta o uso normal num telemóvel
