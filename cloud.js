// ============================================================
// cloud.js — a nuvem do Heritage Hunt (Supabase)
//
// ARQUITECTURA: espelho, com a escrita local sempre em primeiro.
//
// O `localStorage` continua a ser a fonte SINCRONA da verdade. O
// dominio (`xp.js`, `streak.js`) grava exactamente como sempre
// gravou e nunca espera pela rede — por isso a regra de ouro do
// ROADMAP mantem-se intacta: nada e anunciado antes de estar
// gravado, e uma descoberta desfaz-se se a escrita falhar.
//
// Esta camada e um espelho por cima disso:
//   - PUXA o progresso quando a sessao abre (entrar noutro
//     telemovel encontra tudo la);
//   - EMPURRA o progresso depois de cada gravacao local, com um
//     atraso curto para nao fazer um pedido por cada XP ganho.
//
// Consequencia desejada: sem rede, a app funciona na mesma. O que
// ficou por enviar fica em fila e sobe assim que a ligacao voltar.
//
// AS FOTOGRAFIAS VIVEM NO STORAGE, nunca dentro de uma linha da
// base de dados. Sobem sempre comprimidas (ver image-compressor.js)
// e para um bucket PRIVADO: quem as ve recebe um link assinado e
// temporario, nunca um endereco publico.
//
// `toRow()` continua a montar a linha do perfil campo a campo, por
// isso nenhum Data URL pode escorregar para dentro da tabela: o que
// la vai e o CAMINHO do ficheiro, nao a imagem.
// ============================================================

const HeritageCloud = (function () {
    'use strict';

    // Atraso entre a ultima gravacao local e o envio. Curto o
    // suficiente para nao se notar, longo o suficiente para que uma
    // descoberta inteira (XP + zona + sequencia) suba de uma vez.
    const PUSH_DELAY = 1200;
    const RETRY_DELAY = 8000;

    // Bucket privado das fotografias. Os links assinados duram uma
    // hora e sao renovados cinco minutos antes de expirar, para que
    // um album aberto ha muito tempo nunca mostre imagens partidas.
    const PHOTO_BUCKET = 'monument-photos';
    const SIGNED_URL_TTL = 3600;
    const SIGNED_URL_MARGIN = 300;

    let client = null;
    let available = false;
    let sessionUserId = null;

    // O que esta a espera de subir. Guardamos o ESTADO, nao a
    // diferenca: o ultimo estado ganha sempre, e um envio falhado
    // nunca deixa a nuvem a meio caminho.
    let pendingProfile = null;
    let profileTimer = null;
    let retryTimer = null;

    const pendingEntries = {};   // monumentId -> { note, tags }
    let entriesTimer = null;

    let status = 'idle';         // idle | syncing | synced | offline | error
    const statusListeners = [];

    // --- Arranque ------------------------------------------------

    function init() {
        const config = window.SUPABASE_CONFIG;

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.warn('[cloud] biblioteca do Supabase nao carregou — a app fica so local');
            return false;
        }
        if (!config || !config.url || !config.publishableKey) {
            console.warn('[cloud] falta supabase-config.js — a app fica so local');
            return false;
        }

        client = window.supabase.createClient(config.url, config.publishableKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        });

        available = true;

        // Quando a rede volta, tentamos logo o que ficou pendente.
        window.addEventListener('online', function () { flush(); });

        // Fechar o separador nao pode perder o que ainda nao subiu.
        window.addEventListener('pagehide', function () { flush(); });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') flush();
        });

        return true;
    }

    function isAvailable() {
        return available;
    }

    function setStatus(next) {
        if (status === next) return;
        status = next;
        statusListeners.forEach(function (listener) {
            // Um ouvinte partido nao pode travar a sincronizacao.
            try { listener(next); } catch (e) { /* ignorado de proposito */ }
        });
    }

    function onStatusChange(listener) {
        if (typeof listener === 'function') statusListeners.push(listener);
    }

    function getStatus() {
        return status;
    }

    // --- Traducao de erros ---------------------------------------
    //
    // Esta camada nunca devolve texto: devolve uma CHAVE de i18n.
    // Nenhum texto visivel nasce aqui (principio 8 do ROADMAP).

    function errorCode(error) {
        if (!error) return 'cloudUnknownError';

        const message = (error.message || '').toLowerCase();

        if (message.indexOf('invalid login') !== -1) return 'wrongCredentials';
        if (message.indexOf('email not confirmed') !== -1) return 'cloudEmailNotConfirmed';
        if (message.indexOf('already registered') !== -1) return 'cloudEmailTaken';
        if (message.indexOf('user already') !== -1) return 'cloudEmailTaken';
        if (message.indexOf('password should be') !== -1) return 'passwordTooShort';
        if (message.indexOf('invalid email') !== -1) return 'cloudInvalidEmail';
        if (message.indexOf('rate limit') !== -1) return 'cloudTooManyTries';
        if (message.indexOf('failed to fetch') !== -1) return 'cloudOffline';
        if (message.indexOf('networkerror') !== -1) return 'cloudOffline';
        if (message.indexOf('network') !== -1) return 'cloudOffline';

        return 'cloudUnknownError';
    }

    // --- Autenticacao --------------------------------------------

    async function signUp(name, email, password) {
        if (!available) return { ok: false, code: 'cloudUnavailable' };

        let result;
        try {
            result = await client.auth.signUp({
                email: email,
                password: password,
                options: { data: { name: name } }
            });
        } catch (error) {
            return { ok: false, code: errorCode(error) };
        }

        if (result.error) return { ok: false, code: errorCode(result.error) };

        // Se o projecto exigir confirmacao por email, ha utilizador
        // criado mas nao ha sessao: ainda nao se entra.
        if (!result.data.session) {
            return { ok: false, code: 'cloudConfirmEmail', pendingConfirmation: true };
        }

        sessionUserId = result.data.user.id;
        return { ok: true, userId: sessionUserId, email: result.data.user.email };
    }

    async function signIn(email, password) {
        if (!available) return { ok: false, code: 'cloudUnavailable' };

        let result;
        try {
            result = await client.auth.signInWithPassword({
                email: email,
                password: password
            });
        } catch (error) {
            return { ok: false, code: errorCode(error) };
        }

        if (result.error) return { ok: false, code: errorCode(result.error) };

        sessionUserId = result.data.user.id;
        return { ok: true, userId: sessionUserId, email: result.data.user.email };
    }

    async function signOut() {
        if (!available) return { ok: true };

        // O que ainda nao subiu sobe ANTES de a sessao morrer: sair
        // da conta nunca pode ser a maneira de perder progresso.
        try {
            await flushNow();
        } catch (error) {
            // Sem rede nao ha nada a fazer: a sessao fecha na mesma,
            // e o que ficou por subir continua guardado em casa.
        }

        cancelTimers();
        pendingProfile = null;
        Object.keys(pendingEntries).forEach(function (key) { delete pendingEntries[key]; });

        let result = null;
        try {
            result = await client.auth.signOut();
        } catch (error) {
            result = { error: error };
        }

        sessionUserId = null;
        setStatus('idle');

        if (result && result.error) return { ok: false, code: errorCode(result.error) };
        return { ok: true };
    }

    // Devolve a sessao que o browser guardou, se ainda for valida.
    async function restoreSession() {
        if (!available) return null;

        let result;
        try {
            result = await client.auth.getSession();
        } catch (error) {
            return null;
        }

        if (result.error || !result.data || !result.data.session) return null;

        const user = result.data.session.user;
        sessionUserId = user.id;
        return { userId: user.id, email: user.email };
    }

    function getUserId() {
        return sessionUserId;
    }

    // --- Colunas do loop de engajamento --------------------------
    //
    // `weekly_mission` e `analytics` chegaram depois do resto do
    // esquema. Uma instalacao sem a migracao aplicada NAO pode ficar
    // sem sincronizar nada: se o Postgres disser que a coluna nao
    // existe, deixamos de a enviar e a app segue, com a missao e o
    // funil guardados so neste aparelho.
    //
    // Isto e uma rede de seguranca para a beta, nao o caminho normal:
    // ver migrations/001_engagement_beta.sql.
    let engagementColumns = true;

    const BASE_COLUMNS = 'name, email, points, level_seen, xp, exploration_streak, ' +
        'scanned_monuments, settings, avatar_path, ranking_opt_in';

    function profileColumns() {
        return engagementColumns
            ? BASE_COLUMNS + ', weekly_mission, analytics'
            : BASE_COLUMNS;
    }

    function isMissingEngagementColumn(error) {
        if (!error) return false;

        // 42703 = undefined_column no Postgres
        if (error.code === '42703') return true;

        const message = (error.message || '').toLowerCase();
        return message.indexOf('weekly_mission') !== -1 || message.indexOf('analytics') !== -1;
    }

    // --- Perfil: puxar -------------------------------------------

    async function pullProfile() {
        if (!available || !sessionUserId) return null;

        setStatus('syncing');

        let result;
        try {
            result = await client
                .from('profiles')
                .select(profileColumns())
                .eq('id', sessionUserId)
                .maybeSingle();
        } catch (error) {
            setStatus('offline');
            return null;
        }

        // Projecto sem a migracao do loop aplicada: as colunas novas
        // ainda nao existem. Em vez de deixar o perfil inteiro sem
        // sincronizar, desligamos as duas e voltamos a tentar sem
        // elas — a app continua a funcionar, so com a missao e o
        // funil guardados apenas neste aparelho.
        if (result.error && isMissingEngagementColumn(result.error)) {
            engagementColumns = false;
            console.warn('[cloud] colunas weekly_mission/analytics em falta — aplica a migracao do loop de engajamento');

            try {
                result = await client
                    .from('profiles')
                    .select(profileColumns())
                    .eq('id', sessionUserId)
                    .maybeSingle();
            } catch (error) {
                setStatus('offline');
                return null;
            }
        }

        if (result.error) {
            setStatus('error');
            return null;
        }

        // Conta sem linha de perfil (criada antes deste esquema, ou
        // gatilho que nao chegou a correr): nasce vazia agora.
        if (!result.data) {
            setStatus('synced');
            return null;
        }

        setStatus('synced');

        const row = result.data;
        return {
            name: row.name || '',
            email: row.email || '',
            points: row.points || 0,
            levelSeen: row.level_seen || 1,
            xp: isFilledObject(row.xp) ? row.xp : null,
            explorationStreak: isFilledObject(row.exploration_streak) ? row.exploration_streak : null,
            scannedMonuments: Array.isArray(row.scanned_monuments) ? row.scanned_monuments : [],
            settings: isFilledObject(row.settings) ? row.settings : null,
            avatarPath: row.avatar_path || null,
            rankingOptIn: row.ranking_opt_in !== false,
            weeklyMission: isFilledObject(row.weekly_mission) ? row.weekly_mission : null,
            analytics: isFilledObject(row.analytics) ? row.analytics : null
        };
    }

    function isFilledObject(value) {
        return !!value && typeof value === 'object' && Object.keys(value).length > 0;
    }

    // --- Perfil: empurrar ----------------------------------------

    // A linha e montada campo a campo DE PROPOSITO. Tudo o que for
    // imagem — a foto de perfil e o album dos monumentos — fica de
    // fora por construcao, e nao por filtro.
    function toRow(user, settings) {
        const row = {
            id: sessionUserId,
            name: user.name || '',
            email: user.email || '',
            points: user.xp && typeof user.xp.total === 'number' ? user.xp.total : (user.points || 0),
            level_seen: user.levelSeen || 1,
            xp: user.xp || {},
            exploration_streak: user.explorationStreak || {},
            scanned_monuments: stripImages(user.scannedMonuments || []),
            settings: settings || {},
            // O avatar e um caminho no Storage, nunca a imagem.
            avatar_path: user.avatarPath || null,
            // Participar no ranking e uma escolha de quem usa a app,
            // por isso e o cliente que a declara. O que o cliente NAO
            // pode declarar e quanto XP tem — isso vive no ledger.
            ranking_opt_in: settings && settings.rankingOptIn === false ? false : true
        };

        // A missao da semana e o funil sobem como `jsonb` inteiros,
        // como a carteira e a sequencia: assim uma gravacao continua
        // a ser UMA escrita atomica.
        //
        // O funil NAO leva localizacao, percursos nem conteudo
        // escrito: leva marcos e chaves de dia (ponto 43).
        if (engagementColumns) {
            row.weekly_mission = user.weeklyMission || {};
            row.analytics = user.analytics || {};
        }

        return row;
    }

    // Os monumentos descobertos sao guardados inteiros, e um
    // monumento traz imagem. Sobe so o que identifica a descoberta.
    function stripImages(monuments) {
        return monuments.map(function (monument) {
            const copy = {};
            Object.keys(monument).forEach(function (key) {
                const value = monument[key];
                const isDataImage = typeof value === 'string' && value.indexOf('data:image') === 0;
                if (!isDataImage) copy[key] = value;
            });
            return copy;
        });
    }

    function queueProfile(user, settings) {
        if (!available || !sessionUserId || !user) return;

        pendingProfile = toRow(user, settings);

        if (profileTimer) clearTimeout(profileTimer);
        profileTimer = setTimeout(function () {
            profileTimer = null;
            pushProfile();
        }, PUSH_DELAY);
    }

    async function pushProfile() {
        if (!available || !sessionUserId || !pendingProfile) return;

        const row = pendingProfile;
        setStatus('syncing');

        let result;
        try {
            result = await client.from('profiles').upsert(row, { onConflict: 'id' });
        } catch (error) {
            result = { error: error };
        }

        // Sem a migracao aplicada, a linha inteira era recusada e o
        // perfil deixava de sincronizar. Preferimos perder as duas
        // colunas novas a perder o progresso todo.
        if (result.error && engagementColumns && isMissingEngagementColumn(result.error)) {
            engagementColumns = false;
            console.warn('[cloud] colunas weekly_mission/analytics em falta — aplica a migracao do loop de engajamento');

            delete row.weekly_mission;
            delete row.analytics;

            try {
                result = await client.from('profiles').upsert(row, { onConflict: 'id' });
            } catch (error) {
                result = { error: error };
            }
        }

        if (result.error) {
            // Fica em fila. Se entretanto houve nova gravacao, e a
            // nova que sobe — o ultimo estado ganha sempre.
            setStatus(navigator.onLine ? 'error' : 'offline');
            scheduleRetry();
            return;
        }

        // So limpamos se nada de novo entrou durante o pedido.
        if (pendingProfile === row) pendingProfile = null;
        setStatus('synced');
    }

    // --- Experiencias por monumento ------------------------------

    async function pullEntries() {
        if (!available || !sessionUserId) return [];

        let result;
        try {
            result = await client
                .from('monument_entries')
                .select('monument_id, note, tags')
                .eq('user_id', sessionUserId);
        } catch (error) {
            return [];
        }

        if (result.error || !Array.isArray(result.data)) return [];

        return result.data.map(function (row) {
            return {
                monumentId: row.monument_id,
                note: row.note || '',
                tags: Array.isArray(row.tags) ? row.tags : []
            };
        });
    }

    function queueEntry(monumentId, note, tags) {
        if (!available || !sessionUserId || !monumentId) return;

        pendingEntries[monumentId] = {
            note: note || '',
            tags: Array.isArray(tags) ? tags : []
        };

        if (entriesTimer) clearTimeout(entriesTimer);
        entriesTimer = setTimeout(function () {
            entriesTimer = null;
            pushEntries();
        }, PUSH_DELAY);
    }

    async function pushEntries() {
        if (!available || !sessionUserId) return;

        const ids = Object.keys(pendingEntries);
        if (!ids.length) return;

        const rows = ids.map(function (monumentId) {
            const entry = pendingEntries[monumentId];
            return {
                user_id: sessionUserId,
                monument_id: monumentId,
                note: entry.note,
                tags: entry.tags
            };
        });

        setStatus('syncing');

        let result;
        try {
            result = await client
                .from('monument_entries')
                .upsert(rows, { onConflict: 'user_id,monument_id' });
        } catch (error) {
            result = { error: error };
        }

        if (result.error) {
            setStatus(navigator.onLine ? 'error' : 'offline');
            scheduleRetry();
            return;
        }

        // So sai da fila o que foi mesmo enviado: uma escrita feita
        // durante o pedido sobe no envio seguinte.
        rows.forEach(function (sent) {
            const current = pendingEntries[sent.monument_id];
            if (current && current.note === sent.note) delete pendingEntries[sent.monument_id];
        });

        setStatus('synced');
    }

    // --- Fotografias: ficheiros no Storage -----------------------
    //
    // O caminho comeca SEMPRE pelo id de quem e dono, porque e essa
    // primeira pasta que a politica do bucket compara com quem pede.
    // Mudar esta forma e mudar a seguranca.

    function photoPath(monumentId, photoId, extension) {
        return sessionUserId + '/' + monumentId + '/' + photoId + '.' + extension;
    }

    function avatarPath(extension) {
        return sessionUserId + '/avatar.' + extension;
    }

    async function uploadImage(path, blob, contentType) {
        if (!available || !sessionUserId) return { ok: false, code: 'cloudUnavailable' };

        let result;
        try {
            result = await client.storage
                .from(PHOTO_BUCKET)
                .upload(path, blob, { contentType: contentType, upsert: true });
        } catch (error) {
            result = { error: error };
        }

        if (result.error) {
            setStatus(navigator.onLine ? 'error' : 'offline');
            return { ok: false, code: errorCode(result.error) };
        }

        setStatus('synced');
        return { ok: true, path: path };
    }

    async function removeImages(paths) {
        if (!available || !sessionUserId || !paths || !paths.length) return { ok: true };

        let result;
        try {
            result = await client.storage.from(PHOTO_BUCKET).remove(paths);
        } catch (error) {
            result = { error: error };
        }

        paths.forEach(function (path) { delete signedUrlCache[path]; });

        if (result.error) return { ok: false, code: errorCode(result.error) };
        return { ok: true };
    }

    // --- Links assinados -----------------------------------------
    //
    // O bucket e privado, por isso cada imagem precisa de um link
    // temporario. Assinamos em lote e guardamos: abrir o mesmo album
    // duas vezes seguidas nao volta a pedir nada ao servidor.

    const signedUrlCache = {};   // path -> { url, expiresAt }

    function cachedUrl(path) {
        const entry = signedUrlCache[path];
        if (!entry) return null;
        if (entry.expiresAt - Date.now() < SIGNED_URL_MARGIN * 1000) return null;
        return entry.url;
    }

    async function signImageUrls(paths) {
        const resolved = {};
        if (!available || !sessionUserId || !paths || !paths.length) return resolved;

        const missing = [];
        paths.forEach(function (path) {
            const known = cachedUrl(path);
            if (known) resolved[path] = known;
            else if (missing.indexOf(path) === -1) missing.push(path);
        });

        if (!missing.length) return resolved;

        let result;
        try {
            result = await client.storage
                .from(PHOTO_BUCKET)
                .createSignedUrls(missing, SIGNED_URL_TTL);
        } catch (error) {
            result = { error: error };
        }

        if (result.error || !Array.isArray(result.data)) return resolved;

        const expiresAt = Date.now() + SIGNED_URL_TTL * 1000;
        result.data.forEach(function (entry) {
            if (!entry || entry.error || !entry.signedUrl) return;
            signedUrlCache[entry.path] = { url: entry.signedUrl, expiresAt: expiresAt };
            resolved[entry.path] = entry.signedUrl;
        });

        return resolved;
    }

    // --- Fotografias: metadados ----------------------------------
    //
    // Estas escritas NAO passam pela fila com atraso: uma fotografia
    // so conta depois de o ficheiro ter subido, e quem chama precisa
    // de saber se correu bem antes de atribuir XP (ponto 4).

    async function savePhotoRow(photo) {
        if (!available || !sessionUserId) return { ok: false, code: 'cloudUnavailable' };

        let result;
        try {
            result = await client.from('monument_photos').upsert({
                user_id: sessionUserId,
                photo_id: photo.id,
                monument_id: photo.monumentId,
                path: photo.path,
                width: photo.width || null,
                height: photo.height || null,
                bytes: photo.bytes || null,
                original_bytes: photo.originalBytes || null,
                format: photo.format || null,
                created_at: photo.createdAt || new Date().toISOString()
            }, { onConflict: 'user_id,photo_id' });
        } catch (error) {
            result = { error: error };
        }

        if (result.error) return { ok: false, code: errorCode(result.error) };
        return { ok: true };
    }

    async function deletePhotoRow(photoId) {
        if (!available || !sessionUserId) return { ok: false, code: 'cloudUnavailable' };

        let result;
        try {
            result = await client
                .from('monument_photos')
                .delete()
                .eq('user_id', sessionUserId)
                .eq('photo_id', photoId);
        } catch (error) {
            result = { error: error };
        }

        if (result.error) return { ok: false, code: errorCode(result.error) };
        return { ok: true };
    }

    async function pullPhotos() {
        if (!available || !sessionUserId) return [];

        let result;
        try {
            result = await client
                .from('monument_photos')
                .select('photo_id, monument_id, path, width, height, bytes, original_bytes, format, created_at')
                .eq('user_id', sessionUserId)
                .order('created_at', { ascending: true });
        } catch (error) {
            return [];
        }

        if (result.error || !Array.isArray(result.data)) return [];

        return result.data.map(function (row) {
            return {
                id: row.photo_id,
                monumentId: row.monument_id,
                path: row.path,
                width: row.width,
                height: row.height,
                bytes: row.bytes,
                originalBytes: row.original_bytes,
                format: row.format,
                createdAt: row.created_at
            };
        });
    }

    // --- Ledger de XP (a base do ranking) ------------------------
    //
    // A carteira local continua a mandar no JOGO. Este ledger e a
    // sombra dela do lado do servidor, e e a UNICA coisa que o
    // ranking le.
    //
    // Repare-se no que NAO vai nesta chamada: o montante. O servidor
    // e que sabe quanto vale cada accao. Daqui so segue o que
    // aconteceu — e a chave que impede que conte duas vezes.

    async function recordXpEvent(transaction) {
        if (!available || !sessionUserId || !transaction) {
            return { ok: false, code: 'cloudUnavailable' };
        }
        if (!transaction.action || !transaction.rewardKey) {
            return { ok: false, code: 'cloudUnknownError' };
        }

        let result;
        try {
            result = await client.rpc('award_xp', {
                p_action:      transaction.action,
                p_reward_key:  transaction.rewardKey,
                p_monument_id: asText(transaction.monumentId),
                p_zone_id:     asText(transaction.zoneId),
                p_created_at:  transaction.createdAt || null
            });
        } catch (error) {
            result = { error: error };
        }

        if (result.error) {
            setStatus(navigator.onLine ? 'error' : 'offline');
            return { ok: false, code: errorCode(result.error) };
        }

        return { ok: true, result: result.data };
    }

    function asText(value) {
        if (value === null || value === undefined || value === '') return null;
        return String(value);
    }

    /**
     * Repoe no ledger tudo o que a carteira local conhece.
     *
     * E esta a rede de seguranca de todo o sistema: uma descoberta
     * feita sem rede, ou um envio que falhou, entra aqui no arranque
     * seguinte. O servidor ignora o que ja tem — a chave de
     * recompensa garante-o — por isso repetir nao custa nada.
     *
     * A ordem e do MAIS ANTIGO para o mais novo, porque o servidor
     * exige que o monumento ja esteja descoberto antes de aceitar
     * uma fotografia ou uma experiencia sobre ele.
     */
    async function syncXpLedger(history) {
        if (!available || !sessionUserId) return { ok: false, sent: 0 };
        if (!Array.isArray(history) || !history.length) return { ok: true, sent: 0 };

        const oldestFirst = history.slice().sort(function (a, b) {
            const left = a && a.createdAt ? a.createdAt : '';
            const right = b && b.createdAt ? b.createdAt : '';
            return left < right ? -1 : (left > right ? 1 : 0);
        });

        let sent = 0;

        for (let i = 0; i < oldestFirst.length; i++) {
            const outcome = await recordXpEvent(oldestFirst[i]);
            if (!outcome.ok) return { ok: false, sent: sent };
            sent++;
        }

        return { ok: true, sent: sent };
    }

    // --- Ranking -------------------------------------------------
    //
    // Uma so chamada, ja agregada. Nunca se trazem eventos de XP
    // para o browser: alem de nao escalar, seria o historico de
    // outras pessoas a passar por aqui sem razao nenhuma.

    async function getWeeklyRanking(limit, islandId) {
        if (!available || !sessionUserId) return { ok: false, code: 'cloudUnavailable' };

        let result;
        try {
            result = await client.rpc('get_weekly_ranking', {
                p_limit: limit || 20,
                p_island_id: islandId || null
            });
        } catch (error) {
            result = { error: error };
        }

        if (result.error) {
            setStatus(navigator.onLine ? 'error' : 'offline');
            return { ok: false, code: errorCode(result.error) };
        }

        const data = result.data;
        if (!data || data.ok !== true) {
            return { ok: false, code: 'cloudUnknownError' };
        }

        setStatus('synced');

        return {
            ok: true,
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
            participants: data.participants || 0,
            optedIn: data.optedIn !== false,
            limit: data.limit || 20,
            top: Array.isArray(data.top) ? data.top : [],
            me: data.me || null
        };
    }

    // --- Fila e reenvio ------------------------------------------

    function scheduleRetry() {
        if (retryTimer) return;
        retryTimer = setTimeout(function () {
            retryTimer = null;
            flush();
        }, RETRY_DELAY);
    }

    function cancelTimers() {
        if (profileTimer) { clearTimeout(profileTimer); profileTimer = null; }
        if (entriesTimer) { clearTimeout(entriesTimer); entriesTimer = null; }
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    }

    // Envia ja o que estiver a espera, sem cumprir o atraso.
    function flush() {
        if (profileTimer) { clearTimeout(profileTimer); profileTimer = null; }
        if (entriesTimer) { clearTimeout(entriesTimer); entriesTimer = null; }
        if (pendingProfile) pushProfile();
        if (Object.keys(pendingEntries).length) pushEntries();
    }

    async function flushNow() {
        if (profileTimer) { clearTimeout(profileTimer); profileTimer = null; }
        if (entriesTimer) { clearTimeout(entriesTimer); entriesTimer = null; }
        if (pendingProfile) await pushProfile();
        if (Object.keys(pendingEntries).length) await pushEntries();
    }

    function hasPendingWork() {
        return !!pendingProfile || Object.keys(pendingEntries).length > 0;
    }

    return {
        init: init,
        isAvailable: isAvailable,
        onStatusChange: onStatusChange,
        getStatus: getStatus,

        signUp: signUp,
        signIn: signIn,
        signOut: signOut,
        restoreSession: restoreSession,
        getUserId: getUserId,

        pullProfile: pullProfile,
        queueProfile: queueProfile,

        pullEntries: pullEntries,
        queueEntry: queueEntry,

        photoPath: photoPath,
        avatarPath: avatarPath,
        uploadImage: uploadImage,
        removeImages: removeImages,
        signImageUrls: signImageUrls,
        savePhotoRow: savePhotoRow,
        deletePhotoRow: deletePhotoRow,
        pullPhotos: pullPhotos,

        recordXpEvent: recordXpEvent,
        syncXpLedger: syncXpLedger,
        getWeeklyRanking: getWeeklyRanking,

        flush: flush,
        flushNow: flushNow,
        hasPendingWork: hasPendingWork
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeritageCloud: HeritageCloud };
}
