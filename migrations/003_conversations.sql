-- ============================================================
-- Heritage Hunt CV — Conversas
--
-- "Exploradores ajudam exploradores a descobrir Cabo Verde."
--
-- O QUE ESTA CAMADA E, E O QUE NAO E
--
-- Nao e um sistema de mensagens. E uma forma de uma duvida sobre
-- um lugar encontrar quem ja la esteve. Por isso nao ha conversas
-- criadas a vontade, nao ha grupos privados e nao ha DMs: ha
-- conversas AMARRADAS A ENTIDADES que a app ja conhece — a ilha,
-- as quatro zonas e os doze monumentos.
--
-- Consequencia pratica: `conversations` e um catalogo semeado,
-- como `monuments`. O cliente nunca insere uma conversa; procura a
-- que corresponde ao sitio onde esta. Isso resolve de uma vez a
-- unicidade (ponto 52) e tira do frontend qualquer id fixo
-- (ponto 50) — a conversa geral descobre-se por `kind='general'`,
-- nunca por um uuid escrito a mao.
--
-- POR QUE QUASE TUDO PASSA POR FUNCOES
--
-- `profiles` tem `profiles_select_own`: cada explorador le a SUA
-- linha e mais nenhuma. Isso e deliberado e nao vai mudar aqui.
-- Mas um chat tem de mostrar o nome e o avatar de quem escreveu.
--
-- A saida e a mesma que `get_weekly_ranking` ja usa: uma funcao
-- SECURITY DEFINER devolve uma PROJECCAO PUBLICA — nome, avatar,
-- XP e se descobriu este monumento — e mais nada. O email, as
-- definicoes, a sequencia e o `scanned_monuments` ficam onde
-- estao, invisiveis (pontos 21 e 22). Nunca se concede SELECT em
-- `profiles` a outros exploradores.
--
-- O QUE O SERVIDOR DECIDE
--
-- Pela mesma regra de `award_xp`: o cliente decide SE age, o
-- servidor decide se PODE. O comprimento do texto, o ritmo de
-- envio, a posse da mensagem e a forma do payload sao verificados
-- aqui, nao no browser.
--
-- SEM XP (pontos 34 e 35)
--
-- Nao ha nenhuma chamada a `award_xp` neste ficheiro, e nao deve
-- passar a haver. Conversar nao da XP; se desse, premiava quem
-- escreve muito em vez de quem ajuda.
--
-- Seguro de correr mais de uma vez.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. O catalogo de conversas
--
-- `kind` diz a que entidade a conversa pertence, e o CHECK de
-- forma garante que as colunas batem certo com ela: uma conversa
-- de zona tem `zone_id` e nao tem `monument_id`, e por ai fora.
-- Sem este CHECK seria possivel gravar uma conversa de monumento
-- sem monumento — e a unicidade abaixo deixaria de valer.
-- ------------------------------------------------------------
create table if not exists public.conversations (
    id          uuid primary key default gen_random_uuid(),
    kind        text not null check (kind in ('general', 'zone', 'monument')),
    monument_id text references public.monuments(id) on delete cascade,
    zone_id     text,
    island_id   text not null default 'sao_vicente',
    created_at  timestamptz not null default now(),

    constraint conversations_shape check (
        (kind = 'general'  and monument_id is null     and zone_id is null) or
        (kind = 'zone'     and monument_id is null     and zone_id is not null) or
        (kind = 'monument' and monument_id is not null and zone_id is null)
    )
);

comment on table public.conversations is
    'Catalogo semeado de conversas. Uma por ilha (geral), uma por zona e uma por monumento. O cliente nunca insere aqui.';

-- A unicidade que o ponto 52 pede. Indices PARCIAIS, um por
-- `kind`: e o que impede duas conversas para a Torre de Belem sem
-- impedir que varias conversas de zona existam lado a lado.
create unique index if not exists conversations_one_general_per_island
    on public.conversations (island_id) where kind = 'general';

create unique index if not exists conversations_one_per_zone
    on public.conversations (zone_id) where kind = 'zone';

create unique index if not exists conversations_one_per_monument
    on public.conversations (monument_id) where kind = 'monument';


-- ------------------------------------------------------------
-- 2. Mensagens
--
-- `kind` segue o ponto 12: texto, imagem ou referencia a uma
-- entidade da app. Nada de audio nem video.
--
-- A imagem NAO vive aqui. `media_path` e o caminho no bucket
-- `chat-photos`, pela mesma razao que o album guarda caminhos e
-- nao Data URLs (ponto 13): uma linha de Postgres nao e sitio
-- para um ficheiro.
--
-- `deleted_at` em vez de DELETE (ponto 45): apagar a linha
-- partiria as respostas que apontam para ela. A mensagem fica,
-- vazia, e o cliente mostra "Mensagem removida".
-- ------------------------------------------------------------
create table if not exists public.messages (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,

    kind            text not null default 'text' check (kind in ('text', 'image', 'reference')),
    body            text not null default '',
    media_path      text,

    -- Resposta rasa: aponta para uma mensagem, nunca cria uma
    -- arvore (ponto 36). Se a mensagem citada desaparecer, a
    -- resposta sobrevive sem referencia.
    reply_to        uuid references public.messages(id) on delete set null,

    reference_kind  text check (reference_kind in ('monument', 'zone')),
    reference_id    text,

    created_at      timestamptz not null default now(),
    edited_at       timestamptz,
    deleted_at      timestamptz,

    -- Ponto 47: um tecto de tamanho, verificado no servidor.
    constraint messages_body_length check (char_length(body) <= 1000),

    -- Cada `kind` tem de trazer o que precisa e nada do que nao
    -- usa. Uma mensagem de texto vazia nao chega a existir.
    constraint messages_shape check (
        (kind = 'text'      and char_length(btrim(body)) > 0 and media_path is null and reference_kind is null) or
        (kind = 'image'     and media_path is not null       and reference_kind is null) or
        (kind = 'reference' and reference_kind is not null   and reference_id is not null and media_path is null)
    )
);

comment on table public.messages is
    'Mensagens das conversas. Soft delete via deleted_at para nao partir respostas. Imagens ficam no bucket chat-photos.';

-- A leitura e sempre "as ultimas N desta conversa" e depois "as
-- anteriores a esta data" (ponto 28). Este indice serve as duas.
create index if not exists messages_conversation_created
    on public.messages (conversation_id, created_at desc);

-- Usado pelo limite de ritmo em `send_message`.
create index if not exists messages_user_created
    on public.messages (user_id, created_at desc);


-- ------------------------------------------------------------
-- 3. Participacao
--
-- Ponto 24: as conversas sao publicas, por isso NAO ha uma linha
-- por explorador e por conversa a espera de ser criada. Esta
-- tabela existe so para guardar o que e mesmo pessoal: ate onde
-- cada um ja leu.
--
-- A linha nasce na primeira vez que alguem abre ou escreve. Quem
-- nunca abriu uma conversa nao ocupa espaco nenhum.
-- ------------------------------------------------------------
create table if not exists public.conversation_members (
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    last_read_at    timestamptz not null default to_timestamp(0),
    joined_at       timestamptz not null default now(),
    primary key (conversation_id, user_id)
);

comment on table public.conversation_members is
    'Estado pessoal por conversa (ate onde li). Nao e lista de acesso: as conversas sao publicas a quem tem sessao.';


-- ------------------------------------------------------------
-- 4. "Ajudou-me"
--
-- Ponto 37: uma reaccao so. Nao ha coluna para o tipo porque nao
-- ha tipos — a existencia da linha E a reaccao. Oito emojis
-- transformariam ajuda em popularidade.
-- ------------------------------------------------------------
create table if not exists public.message_helpful (
    message_id uuid not null references public.messages(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (message_id, user_id)
);


-- ------------------------------------------------------------
-- 5. Denuncias
--
-- Ponto 18 e 48: recolher, nao julgar. Nada aqui apaga nem
-- esconde uma mensagem; isso fica para revisao humana.
--
-- A chave primaria dupla faz com que denunciar duas vezes seja
-- silenciosamente a mesma denuncia.
-- ------------------------------------------------------------
create table if not exists public.message_reports (
    message_id  uuid not null references public.messages(id) on delete cascade,
    reporter_id uuid not null references auth.users(id) on delete cascade,
    reason      text not null check (reason in ('qr_location', 'incorrect', 'spam', 'harassment', 'other')),
    created_at  timestamptz not null default now(),
    primary key (message_id, reporter_id)
);

comment on column public.message_reports.reason is
    'qr_location = revela onde esta o QR. E a razao que existe por causa deste jogo; as outras sao as normais.';


-- ------------------------------------------------------------
-- 6. RLS
--
-- O catalogo le-se; nao se escreve. As mensagens leem-se todas
-- (as conversas sao publicas) mas cada um so escreve as suas — e
-- `with check (user_id = auth.uid())` no UPDATE e o que impede
-- mudar o autor de uma mensagem a partir do frontend (ponto 44).
--
-- Mesmo com estas politicas, a LEITURA do chat passa pelas
-- funcoes mais abaixo: um SELECT directo a `messages` traz ids de
-- utilizador e nada mais, porque `profiles` continua fechado.
-- ------------------------------------------------------------
alter table public.conversations        enable row level security;
alter table public.messages             enable row level security;
alter table public.conversation_members enable row level security;
alter table public.message_helpful      enable row level security;
alter table public.message_reports      enable row level security;

drop policy if exists conversations_readable on public.conversations;
create policy conversations_readable on public.conversations
    for select to authenticated using (true);

drop policy if exists messages_select_all on public.messages;
create policy messages_select_all on public.messages
    for select to authenticated using (true);

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own on public.messages
    for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Sem politica de DELETE: apagar e marcar `deleted_at` (ponto 45).

drop policy if exists conversation_members_own on public.conversation_members;
create policy conversation_members_own on public.conversation_members
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists message_helpful_select on public.message_helpful;
create policy message_helpful_select on public.message_helpful
    for select to authenticated using (true);

drop policy if exists message_helpful_write_own on public.message_helpful;
create policy message_helpful_write_own on public.message_helpful
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Uma denuncia e entre quem denuncia e a moderacao. Nem o autor
-- da mensagem a ve.
drop policy if exists message_reports_own on public.message_reports;
create policy message_reports_own on public.message_reports
    for all to authenticated
    using ((select auth.uid()) = reporter_id)
    with check ((select auth.uid()) = reporter_id);


-- ------------------------------------------------------------
-- 7. A projeccao publica de um explorador
--
-- O unico sitio deste ficheiro que toca em `profiles`. Devolve
-- exactamente o que o ponto 22 permite e nem um campo a mais.
--
-- `xpTotal` vem de `xp_events`, nao de `profiles.xp`: o ledger e
-- a verdade do servidor (e o que o ranking soma). O NIVEL nao e
-- calculado aqui de proposito — os patamares vivem em `levels.js`
-- e duplica-los em SQL era garantir que um dia divergiam.
--
-- `discovered` responde ao ponto 20: este explorador ja descobriu
-- ESTE monumento? Vale null fora de conversas de monumento.
-- ------------------------------------------------------------
create or replace function private.public_author(p_user_id uuid, p_monument_id text default null)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
    select jsonb_build_object(
        'userId',     p.id,
        'name',       coalesce(nullif(btrim(p.name), ''), ''),
        'avatarPath', p.avatar_path,
        'xpTotal',    coalesce((
            select sum(e.amount)::integer
            from public.xp_events e
            where e.user_id = p.id
        ), 0),
        'discovered', case
            when p_monument_id is null then null
            else exists (
                select 1 from public.xp_events e
                where e.user_id = p.id
                  and e.action = 'MONUMENT_DISCOVERED'
                  and e.monument_id = p_monument_id
            )
        end
    )
    from public.profiles p
    where p.id = p_user_id;
$$;


-- ------------------------------------------------------------
-- 8. Uma mensagem, pronta para desenhar
--
-- Monta o objecto que o cliente recebe: a mensagem, o autor em
-- projeccao publica, a contagem de "Ajudou-me" e a citacao da
-- resposta ja resolvida (ponto 36), para o ecra nao ter de ir
-- buscar nada a seguir.
--
-- Uma mensagem removida chega sem corpo e sem imagem. O cliente
-- mostra "Mensagem removida" e as respostas continuam a fazer
-- sentido.
-- ------------------------------------------------------------
create or replace function private.message_json(p_message_id uuid, p_monument_id text, p_viewer uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
    select jsonb_build_object(
        'id',            m.id,
        'kind',          m.kind,
        'body',          case when m.deleted_at is null then m.body else '' end,
        'mediaPath',     case when m.deleted_at is null then m.media_path else null end,
        'referenceKind', m.reference_kind,
        'referenceId',   m.reference_id,
        'createdAt',     m.created_at,
        'editedAt',      m.edited_at,
        'deleted',       m.deleted_at is not null,
        'mine',          m.user_id = p_viewer,
        'author',        private.public_author(m.user_id, p_monument_id),
        'helpfulCount',  (select count(*)::integer from public.message_helpful h where h.message_id = m.id),
        'helpfulByMe',   exists (
                            select 1 from public.message_helpful h
                            where h.message_id = m.id and h.user_id = p_viewer
                         ),
        'replyTo',       (
            select jsonb_build_object(
                'id',      r.id,
                'body',    case when r.deleted_at is null then left(r.body, 140) else '' end,
                'deleted', r.deleted_at is not null,
                'author',  private.public_author(r.user_id, null) -> 'name'
            )
            from public.messages r where r.id = m.reply_to
        )
    )
    from public.messages m
    where m.id = p_message_id;
$$;


-- ------------------------------------------------------------
-- 9. A lista de conversas
--
-- Devolve o catalogo inteiro com o que a lista do ponto 7 mostra:
-- ultima mensagem, quando, e quantas por ler.
--
-- As nao lidas comparam-se com `last_read_at`. Quem nunca abriu a
-- conversa tem `last_read_at` em 1970 — e a contagem seria a
-- conversa toda. Por isso o default e deliberado e a contagem e
-- limitada: o que interessa e "ha coisas novas", nao o numero
-- exacto de 400.
-- ------------------------------------------------------------
create or replace function public.list_conversations()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_rows jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select coalesce(jsonb_agg(
               jsonb_build_object(
                   'id',          c.id,
                   'kind',        c.kind,
                   'monumentId',  c.monument_id,
                   'zoneId',      c.zone_id,
                   'islandId',    c.island_id,
                   'lastAt',      c.last_at,
                   'lastMessage', c.last_message,
                   'unread',      c.unread,
                   'joined',      c.joined
               )
               order by c.last_at desc nulls last
           ), '[]'::jsonb)
    into v_rows
    from (
        select
            conv.id,
            conv.kind,
            conv.monument_id,
            conv.zone_id,
            conv.island_id,
            last_msg.created_at as last_at,
            case when last_msg.id is null then null else jsonb_build_object(
                -- O preview nao traz o texto de uma imagem nem de
                -- uma referencia: traz o TIPO, e o cliente escreve
                -- "Fotografia" no idioma de quem le (ponto 56).
                'kind',   last_msg.kind,
                'body',   case
                              when last_msg.deleted_at is not null then ''
                              when last_msg.kind = 'text'          then left(last_msg.body, 120)
                              else ''
                          end,
                'at',     last_msg.created_at,
                'author', private.public_author(last_msg.user_id, null) -> 'name'
            ) end as last_message,
            (
                -- Limitado a 100: o que a lista precisa de dizer e
                -- "ha coisas novas", nao o numero exacto quando sao
                -- muitas. Contar tudo seria varrer a conversa
                -- inteira por cada linha da lista.
                select count(*)::integer
                from (
                    select 1 from public.messages u
                    where u.conversation_id = conv.id
                      and u.user_id <> v_user
                      and u.deleted_at is null
                      and u.created_at > coalesce(mem.last_read_at, to_timestamp(0))
                    limit 100
                ) capped
            ) as unread,
            (mem.user_id is not null) as joined
        from public.conversations conv
        left join public.conversation_members mem
               on mem.conversation_id = conv.id and mem.user_id = v_user
        left join lateral (
            select m.id, m.kind, m.body, m.user_id, m.created_at, m.deleted_at
            from public.messages m
            where m.conversation_id = conv.id
            order by m.created_at desc
            limit 1
        ) last_msg on true
    ) c;

    return jsonb_build_object('ok', true, 'conversations', v_rows);
end;
$$;


-- ------------------------------------------------------------
-- 10. Ler mensagens
--
-- Duas direccoes, uma funcao:
--
--   p_before  as anteriores a esta data — o "Carregar anteriores"
--             do ponto 28;
--   p_after   as posteriores — usado quando o Realtime avisa que
--             chegou algo e quando a ligacao volta e e preciso
--             apanhar o que se perdeu.
--
-- Devolve sempre por ordem crescente, que e a ordem de leitura
-- (ponto 29). `hasMore` evita que o cliente tenha de adivinhar se
-- vale a pena pedir outra pagina.
-- ------------------------------------------------------------
create or replace function public.get_messages(
    p_conversation_id uuid,
    p_before          timestamptz default null,
    p_after           timestamptz default null,
    p_limit           integer     default 40
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user     uuid := (select auth.uid());
    v_limit    integer := greatest(1, least(coalesce(p_limit, 40), 100));
    v_monument text;
    v_ids      uuid[];
    v_rows     jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select monument_id into v_monument
    from public.conversations where id = p_conversation_id;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'unknown_conversation');
    end if;

    -- Duas leituras diferentes, duas ordenacoes diferentes. Separa-las
    -- e mais claro do que um ORDER BY com CASE, e deixa o indice
    -- (conversation_id, created_at desc) servir as duas.
    if p_after is not null then
        -- Novidades: da marca para a frente, do mais antigo ao mais
        -- recente, que e a ordem por que serao acrescentadas.
        select array_agg(q.id order by q.created_at)
        into v_ids
        from (
            select m.id, m.created_at
            from public.messages m
            where m.conversation_id = p_conversation_id
              and m.created_at > p_after
            order by m.created_at
            limit v_limit
        ) q;
    else
        -- Pagina: as mais recentes (ou as anteriores a um ponto),
        -- contadas para tras e devolvidas ja na ordem de leitura.
        select array_agg(q.id order by q.created_at)
        into v_ids
        from (
            select m.id, m.created_at
            from public.messages m
            where m.conversation_id = p_conversation_id
              and (p_before is null or m.created_at < p_before)
            order by m.created_at desc
            limit v_limit
        ) q;
    end if;

    v_ids := coalesce(v_ids, '{}'::uuid[]);

    select coalesce(jsonb_agg(private.message_json(id, v_monument, v_user)), '[]'::jsonb)
    into v_rows
    from unnest(v_ids) as id;

    return jsonb_build_object(
        'ok',       true,
        'messages', v_rows,
        -- Encheu a pagina: e provavel que ainda haja mais atras.
        'hasMore',  (p_after is null and array_length(v_ids, 1) = v_limit)
    );
end;
$$;


-- ------------------------------------------------------------
-- 11. Enviar
--
-- Aqui e que o servidor decide. O cliente ja mostrou a mensagem
-- como "a enviar" (ponto 26), mas quem confirma e esta funcao.
--
-- O LIMITE DE RITMO (ponto 47) e a unica defesa contra spam nesta
-- versao e por isso e simples de proposito: um tecto por minuto.
-- Nao tenta perceber se a mensagem e repetida nem se e util —
-- so impede que um ciclo descontrolado encha uma conversa.
--
-- `user_id` nunca vem de fora: e sempre `auth.uid()`. E a regra
-- do ponto 44 aplicada no sitio onde nao pode ser contornada.
-- ------------------------------------------------------------
create or replace function public.send_message(
    p_conversation_id uuid,
    p_body            text    default '',
    p_kind            text    default 'text',
    p_media_path      text    default null,
    p_reply_to        uuid    default null,
    p_reference_kind  text    default null,
    p_reference_id    text    default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user   uuid := (select auth.uid());
    v_recent integer;
    v_body   text := coalesce(btrim(p_body), '');
    v_id     uuid;
    v_at     timestamptz;
    v_mon    text;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select monument_id into v_mon from public.conversations where id = p_conversation_id;
    if not found then
        return jsonb_build_object('ok', false, 'reason', 'unknown_conversation');
    end if;

    if char_length(v_body) > 1000 then
        return jsonb_build_object('ok', false, 'reason', 'too_long');
    end if;

    -- 12 mensagens por minuto. Quem conversa a serio nunca chega
    -- la; um ciclo em fuga chega no primeiro segundo.
    select count(*)::integer into v_recent
    from public.messages m
    where m.user_id = v_user
      and m.created_at > now() - interval '1 minute';

    if v_recent >= 12 then
        return jsonb_build_object('ok', false, 'reason', 'rate_limited');
    end if;

    -- Uma resposta so pode citar uma mensagem da mesma conversa.
    if p_reply_to is not null and not exists (
        select 1 from public.messages r
        where r.id = p_reply_to and r.conversation_id = p_conversation_id
    ) then
        return jsonb_build_object('ok', false, 'reason', 'invalid_reply');
    end if;

    begin
        insert into public.messages
            (conversation_id, user_id, kind, body, media_path, reply_to, reference_kind, reference_id)
        values
            (p_conversation_id, v_user, coalesce(p_kind, 'text'), v_body,
             p_media_path, p_reply_to, p_reference_kind, p_reference_id)
        returning id, created_at into v_id, v_at;
    exception when check_violation then
        -- O CHECK de forma apanhou um payload incoerente (texto
        -- vazio, imagem sem ficheiro, referencia sem alvo).
        return jsonb_build_object('ok', false, 'reason', 'invalid_message');
    end;

    -- Quem escreve ja leu o que estava la. Poupa um badge por ler
    -- na conversa onde a pessoa acabou de participar.
    insert into public.conversation_members (conversation_id, user_id, last_read_at)
    values (p_conversation_id, v_user, v_at)
    on conflict (conversation_id, user_id)
        do update set last_read_at = greatest(public.conversation_members.last_read_at, excluded.last_read_at);

    return jsonb_build_object(
        'ok',      true,
        'message', private.message_json(v_id, v_mon, v_user)
    );
end;
$$;


-- ------------------------------------------------------------
-- 12. Marcar como lida
--
-- `greatest` para que uma chamada atrasada nunca ande para tras
-- com o que ja foi lido.
-- ------------------------------------------------------------
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    insert into public.conversation_members (conversation_id, user_id, last_read_at)
    values (p_conversation_id, v_user, now())
    on conflict (conversation_id, user_id)
        do update set last_read_at = greatest(public.conversation_members.last_read_at, excluded.last_read_at);

    return jsonb_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 13. Editar, apagar, agradecer, denunciar
--
-- Apagar escreve `deleted_at` — nunca remove a linha (ponto 45).
-- ------------------------------------------------------------
create or replace function public.edit_message(p_message_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_body text := coalesce(btrim(p_body), '');
    v_mon  text;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;
    if char_length(v_body) = 0 or char_length(v_body) > 1000 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_message');
    end if;

    update public.messages m
       set body = v_body, edited_at = now()
     where m.id = p_message_id
       and m.user_id = v_user
       and m.deleted_at is null
       and m.kind = 'text';

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;

    select c.monument_id into v_mon
    from public.conversations c
    join public.messages m on m.conversation_id = c.id
    where m.id = p_message_id;

    return jsonb_build_object('ok', true,
        'message', private.message_json(p_message_id, v_mon, v_user));
end;
$$;

create or replace function public.delete_message(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    update public.messages m
       set deleted_at = now()
     where m.id = p_message_id
       and m.user_id = v_user
       and m.deleted_at is null;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.set_message_helpful(p_message_id uuid, p_on boolean default true)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_n    integer;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if p_on then
        insert into public.message_helpful (message_id, user_id)
        values (p_message_id, v_user)
        on conflict do nothing;
    else
        delete from public.message_helpful
        where message_id = p_message_id and user_id = v_user;
    end if;

    select count(*)::integer into v_n
    from public.message_helpful where message_id = p_message_id;

    return jsonb_build_object('ok', true, 'helpfulCount', v_n, 'helpfulByMe', p_on);
end;
$$;

create or replace function public.report_message(p_message_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    insert into public.message_reports (message_id, reporter_id, reason)
    values (p_message_id, v_user, p_reason)
    on conflict (message_id, reporter_id) do update set reason = excluded.reason;

    -- Ponto 48: agradecer e dizer que vai ser analisada. Nunca
    -- prometer que foi removida.
    return jsonb_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 14. Quem pode chamar o que
--
-- As funcoes sao SECURITY DEFINER: sem isto, qualquer sessao
-- autenticada passaria a ler `profiles` por tabela interposta.
-- ------------------------------------------------------------
revoke all on function private.public_author(uuid, text) from public, anon, authenticated;
revoke all on function private.message_json(uuid, text, uuid) from public, anon, authenticated;

grant execute on function public.list_conversations()                                        to authenticated;
grant execute on function public.get_messages(uuid, timestamptz, timestamptz, integer)       to authenticated;
grant execute on function public.send_message(uuid, text, text, text, uuid, text, text)      to authenticated;
grant execute on function public.mark_conversation_read(uuid)                                to authenticated;
grant execute on function public.edit_message(uuid, text)                                    to authenticated;
grant execute on function public.delete_message(uuid)                                        to authenticated;
grant execute on function public.set_message_helpful(uuid, boolean)                          to authenticated;
grant execute on function public.report_message(uuid, text)                                  to authenticated;

revoke execute on function public.list_conversations() from public, anon;
revoke execute on function public.get_messages(uuid, timestamptz, timestamptz, integer) from public, anon;
revoke execute on function public.send_message(uuid, text, text, text, uuid, text, text) from public, anon;


-- ------------------------------------------------------------
-- 15. Realtime
--
-- So `messages` entra na publicacao. `conversations` e um
-- catalogo que nao muda sozinho, e `conversation_members` guarda
-- estado pessoal que ninguem precisa de observar.
--
-- O Realtime respeita o RLS: cada cliente so recebe o que
-- `messages_select_all` o deixaria ler. A linha que chega traz
-- `user_id` e nao traz autor — por isso o cliente usa o evento
-- como AVISO e vai buscar a mensagem montada com `get_messages`
-- (ponto 25: a persistencia confirma primeiro).
-- ------------------------------------------------------------
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'messages'
    ) then
        alter publication supabase_realtime add table public.messages;
    end if;
end;
$$;


-- ------------------------------------------------------------
-- 16. O bucket das fotografias de chat
--
-- Separado de `monument-photos` por uma razao de privacidade, nao
-- de arrumacao: o album e PESSOAL (so o dono le as suas
-- fotografias) e uma fotografia partilhada numa conversa publica
-- e, por definicao, para os outros verem. Misturar os dois
-- obrigaria a abrir o bucket do album.
--
-- Caminho: <user_id>/<conversation_id>/<ficheiro>. O `user_id` vem
-- primeiro porque e sobre ele que a politica de escrita decide.
--
-- Os mesmos limites do album: webp/jpeg/png e nada de originais
-- pesados (ponto 13 — a compressao e a do `image-compressor.js`).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 2097152,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
    set file_size_limit  = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists chat_photos_insert_own on storage.objects;
create policy chat_photos_insert_own on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'chat-photos'
        and ((select auth.uid())::text = (storage.foldername(name))[1])
    );

drop policy if exists chat_photos_delete_own on storage.objects;
create policy chat_photos_delete_own on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'chat-photos'
        and ((select auth.uid())::text = (storage.foldername(name))[1])
    );

-- Legivel por quem tem sessao: as conversas sao publicas, logo as
-- fotografias nelas tambem o sao. Continua a ser um bucket
-- privado — o acesso e sempre por link assinado e temporario,
-- nunca por URL publico.
drop policy if exists chat_photos_readable on storage.objects;
create policy chat_photos_readable on storage.objects
    for select to authenticated
    using (bucket_id = 'chat-photos');


-- ------------------------------------------------------------
-- 17. Semear o catalogo
--
-- Uma conversa geral por ilha, uma por zona e uma por monumento,
-- a partir do que `monuments` ja diz. Correr isto outra vez
-- depois de acrescentar monumentos cria as conversas que faltam e
-- nao duplica as que existem.
--
-- Nao ha titulos nesta tabela de proposito: o nome de uma zona ou
-- de um monumento ja vive no `i18n.js`, em tres idiomas. Guardar
-- "Centro Historico" aqui era inventar uma quarta copia que
-- ninguem iria traduzir (ponto 56).
-- ------------------------------------------------------------
insert into public.conversations (kind, island_id)
select 'general', 'sao_vicente'
on conflict do nothing;

insert into public.conversations (kind, zone_id, island_id)
select distinct 'zone', m.zone_id, m.island_id
from public.monuments m
where m.zone_id is not null
on conflict do nothing;

insert into public.conversations (kind, monument_id, island_id)
select 'monument', m.id, m.island_id
from public.monuments m
on conflict do nothing;

commit;

-- ============================================================
-- DEPOIS DE CORRER — o que vale a pena confirmar
-- ============================================================
--
-- 1) O catalogo ficou completo?
--
--      select kind, count(*) from public.conversations group by kind;
--
--    Esperado hoje: general 1, zone 4, monument 12.
--
-- 2) O Realtime esta mesmo ligado?
--
--      select tablename from pg_publication_tables
--      where pubname = 'supabase_realtime' and schemaname = 'public';
--
--    Tem de aparecer `messages`. Se nao aparecer, o chat continua
--    a funcionar — so deixa de ser imediato para os outros, porque
--    o cliente passa a depender de abrir a conversa outra vez.
--
-- 3) `profiles` continua fechado?
--
--      select policyname, cmd from pg_policies
--      where tablename = 'profiles';
--
--    Tem de continuar a ser so `*_own`. Se alguma vez aparecer um
--    SELECT aberto aqui, a projeccao publica das funcoes deixou de
--    ser a unica porta — e passa a haver email a sair.
--
-- ============================================================
-- ROLLBACK
-- ============================================================
--
--   alter publication supabase_realtime drop table public.messages;
--
--   drop function if exists public.report_message(uuid, text);
--   drop function if exists public.set_message_helpful(uuid, boolean);
--   drop function if exists public.delete_message(uuid);
--   drop function if exists public.edit_message(uuid, text);
--   drop function if exists public.mark_conversation_read(uuid);
--   drop function if exists public.send_message(uuid, text, text, text, uuid, text, text);
--   drop function if exists public.get_messages(uuid, timestamptz, timestamptz, integer);
--   drop function if exists public.list_conversations();
--   drop function if exists private.message_json(uuid, text, uuid);
--   drop function if exists private.public_author(uuid, text);
--
--   drop table if exists public.message_reports;
--   drop table if exists public.message_helpful;
--   drop table if exists public.conversation_members;
--   drop table if exists public.messages;
--   drop table if exists public.conversations;
--
--   delete from storage.objects where bucket_id = 'chat-photos';
--   delete from storage.buckets where id = 'chat-photos';
--
-- Apagar `messages` apaga conversas que ajudaram pessoas a
-- encontrar monumentos. Nao ha como as recuperar depois.
-- ============================================================
