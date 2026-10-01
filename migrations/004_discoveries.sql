-- ============================================================
-- Heritage Hunt CV — Descobertas
--
-- A aba das PUBLICACOES da Comunidade: o que alguem viu, soube
-- ou aprendeu num lugar, escrito para ficar.
--
-- DEPENDE DA 003. Precisa de `private.public_author`, que nasce
-- la. Correr esta antes da 003 falha — e e suposto falhar, em vez
-- de criar uma segunda copia da projeccao publica que um dia
-- divergia da primeira.
--
-- PUBLICACAO NAO E CONVERSA (ponto 33)
--
-- Sao os dois conceitos que o enunciado separa, e a separacao
-- esta no desenho das tabelas, nao so no ecra:
--
--   uma MENSAGEM pertence a uma conversa continua, nao tem
--   titulo, e envelhece depressa;
--
--   uma PUBLICACAO tem titulo, tipo e autor em destaque, e e
--   feita para ser encontrada semanas depois.
--
-- Por isso `posts` nao reutiliza `messages`: um titulo
-- obrigatorio e um tipo fechado nao cabem numa linha de chat sem
-- a encher de colunas nulas.
--
-- O QUE CONTINUA A NAO HAVER
--
--   - XP por publicar (pontos 34 e 35). Nenhuma chamada a
--     `award_xp` neste ficheiro. Publicar muito nao e publicar
--     bem, e um contador premiava o primeiro.
--   - `followers`. O ponto 43 pede para evitar a linguagem de
--     rede social generica, e seguir pessoas e precisamente
--     isso — ver a nota no fim.
--
-- Seguro de correr mais de uma vez.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Publicacoes
--
-- `kind` sao os seis tipos do desenho. E uma lista FECHADA de
-- proposito: sem ela, "dica" e "Dica" e "DICA" passavam a ser
-- tres filtros diferentes ao fim de um mes.
--
-- `monument_id` e `zone_id` sao a "Localizacao (opcional)". Uma
-- publicacao pode nao ter lugar nenhum — uma curiosidade sobre a
-- ilha nao e sobre um monumento — mas quando tem, e a mesma
-- entidade que o mapa e as conversas ja conhecem. E o que permite
-- "Ver no mapa" levar a algum lado.
-- ------------------------------------------------------------
create table if not exists public.posts (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,

    kind        text not null check (kind in ('tip', 'photo', 'curiosity', 'trail', 'place', 'question')),
    title       text not null,
    body        text not null default '',

    monument_id text references public.monuments(id) on delete set null,
    zone_id     text,
    island_id   text not null default 'sao_vicente',

    created_at  timestamptz not null default now(),
    edited_at   timestamptz,
    deleted_at  timestamptz,

    constraint posts_title_length check (char_length(btrim(title)) between 1 and 120),
    constraint posts_body_length  check (char_length(body) <= 2000)
);

comment on table public.posts is
    'Publicacoes da Comunidade. Conteudo persistente e organizado — ao contrario de messages, que e troca rapida.';

-- O feed e sempre "as mais recentes", com ou sem filtro de tipo.
create index if not exists posts_recent on public.posts (created_at desc) where deleted_at is null;
create index if not exists posts_kind_recent on public.posts (kind, created_at desc) where deleted_at is null;
create index if not exists posts_monument on public.posts (monument_id) where deleted_at is null;
create index if not exists posts_author on public.posts (user_id, created_at desc);


-- ------------------------------------------------------------
-- 2. Fotografias de uma publicacao
--
-- Em tabela propria e nao num array na linha: uma publicacao pode
-- ter varias, e cada uma precisa de `position` para a ordem ser a
-- que o autor escolheu, nao a que a base de dados devolver.
--
-- Como no album e no chat, aqui so vive o CAMINHO. O ficheiro
-- fica no bucket.
-- ------------------------------------------------------------
create table if not exists public.post_photos (
    post_id   uuid not null references public.posts(id) on delete cascade,
    path      text not null,
    position  integer not null default 0,
    width     integer,
    height    integer,
    bytes     integer,
    primary key (post_id, path)
);

create index if not exists post_photos_order on public.post_photos (post_id, position);


-- ------------------------------------------------------------
-- 3. Reaccoes
--
-- Duas, as do desenho: "Ajudou-me" e "Interessante".
--
-- Sao DIFERENTES de um gosto, e a diferenca importa: uma diz que
-- a publicacao teve consequencia pratica, a outra que valeu a
-- pena ler. Guardar as duas na mesma tabela com `kind` deixa
-- acrescentar uma terceira sem migrar nada — e deixa contar as
-- duas numa so passagem.
-- ------------------------------------------------------------
create table if not exists public.post_reactions (
    post_id    uuid not null references public.posts(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    kind       text not null check (kind in ('helpful', 'interesting')),
    created_at timestamptz not null default now(),
    primary key (post_id, user_id, kind)
);

create index if not exists post_reactions_post on public.post_reactions (post_id, kind);


-- ------------------------------------------------------------
-- 4. Guardados
--
-- O "Guardar" do desenho. Privado por natureza: ninguem ve o que
-- os outros guardaram, e por isso a politica de leitura e so da
-- propria linha.
-- ------------------------------------------------------------
create table if not exists public.post_saves (
    post_id    uuid not null references public.posts(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (post_id, user_id)
);


-- ------------------------------------------------------------
-- 5. Comentarios
--
-- Pertencem a UMA publicacao — e a diferenca para uma mensagem de
-- chat, que pertence a uma conversa continua.
--
-- `reply_to` e raso, como no chat: responde-se a um comentario,
-- nunca se abre uma arvore. E `on delete set null` para apagar um
-- comentario nao levar as respostas com ele.
-- ------------------------------------------------------------
create table if not exists public.post_comments (
    id         uuid primary key default gen_random_uuid(),
    post_id    uuid not null references public.posts(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    body       text not null,
    reply_to   uuid references public.post_comments(id) on delete set null,
    created_at timestamptz not null default now(),
    edited_at  timestamptz,
    deleted_at timestamptz,

    constraint post_comments_body_length check (char_length(btrim(body)) between 1 and 1000)
);

create index if not exists post_comments_recent on public.post_comments (post_id, created_at desc);

-- O polegar que o desenho mostra por baixo de cada comentario.
create table if not exists public.comment_helpful (
    comment_id uuid not null references public.post_comments(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (comment_id, user_id)
);


-- ------------------------------------------------------------
-- 6. Denuncias de publicacoes
--
-- Mesma forma de `message_reports` da 003, incluindo a razao que
-- so existe por causa deste jogo: revelar onde esta o QR.
-- ------------------------------------------------------------
create table if not exists public.post_reports (
    post_id     uuid not null references public.posts(id) on delete cascade,
    reporter_id uuid not null references auth.users(id) on delete cascade,
    reason      text not null check (reason in ('qr_location', 'incorrect', 'spam', 'harassment', 'other')),
    created_at  timestamptz not null default now(),
    primary key (post_id, reporter_id)
);


-- ------------------------------------------------------------
-- 7. RLS
--
-- Le-se tudo (a Comunidade e publica a quem tem sessao); escreve-
-- se so o que e seu. `with check (user_id = auth.uid())` no
-- UPDATE e o que impede mudar o autor de uma publicacao a partir
-- do frontend.
--
-- `post_saves` e a excepcao: tambem SO SE LE o que e seu. O que
-- cada um guardou nao e dado publico.
-- ------------------------------------------------------------
alter table public.posts           enable row level security;
alter table public.post_photos     enable row level security;
alter table public.post_reactions  enable row level security;
alter table public.post_saves      enable row level security;
alter table public.post_comments   enable row level security;
alter table public.comment_helpful enable row level security;
alter table public.post_reports    enable row level security;

drop policy if exists posts_select_all on public.posts;
create policy posts_select_all on public.posts
    for select to authenticated using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
    for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Sem DELETE: apagar e marcar `deleted_at`, para nao partir
-- comentarios nem reaccoes ja escritos.

drop policy if exists post_photos_select_all on public.post_photos;
create policy post_photos_select_all on public.post_photos
    for select to authenticated using (true);

drop policy if exists post_photos_write_own on public.post_photos;
create policy post_photos_write_own on public.post_photos
    for all to authenticated
    using (exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid())))
    with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid())));

drop policy if exists post_reactions_select_all on public.post_reactions;
create policy post_reactions_select_all on public.post_reactions
    for select to authenticated using (true);

drop policy if exists post_reactions_write_own on public.post_reactions;
create policy post_reactions_write_own on public.post_reactions
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Guardados: privado dos dois lados.
drop policy if exists post_saves_own on public.post_saves;
create policy post_saves_own on public.post_saves
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists post_comments_select_all on public.post_comments;
create policy post_comments_select_all on public.post_comments
    for select to authenticated using (true);

drop policy if exists post_comments_insert_own on public.post_comments;
create policy post_comments_insert_own on public.post_comments
    for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists post_comments_update_own on public.post_comments;
create policy post_comments_update_own on public.post_comments
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists comment_helpful_select_all on public.comment_helpful;
create policy comment_helpful_select_all on public.comment_helpful
    for select to authenticated using (true);

drop policy if exists comment_helpful_write_own on public.comment_helpful;
create policy comment_helpful_write_own on public.comment_helpful
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists post_reports_own on public.post_reports;
create policy post_reports_own on public.post_reports
    for all to authenticated
    using ((select auth.uid()) = reporter_id)
    with check ((select auth.uid()) = reporter_id);


-- ------------------------------------------------------------
-- 8. Uma publicacao, pronta para desenhar
--
-- Autor em projeccao publica (a mesma funcao da 003 — nunca uma
-- segunda copia), contagens das duas reaccoes, se EU reagi, se
-- guardei, quantos comentarios e os caminhos das fotografias.
--
-- Tudo numa so ida. Um feed que precisasse de uma chamada por
-- cartao para saber se eu ja reagi seria um feed que pisca.
-- ------------------------------------------------------------
create or replace function private.post_json(p_post_id uuid, p_viewer uuid, p_full boolean default false)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
    select jsonb_build_object(
        'id',          p.id,
        'kind',        p.kind,
        'title',       p.title,
        -- No feed vai um resumo; na pagina da publicacao vai tudo.
        -- Mandar 2000 caracteres por cartao para mostrar tres
        -- linhas era desperdicar a ligacao de quem esta na rua.
        'body',        case when p_full then p.body else left(p.body, 280) end,
        'truncated',   (not p_full and char_length(p.body) > 280),
        'monumentId',  p.monument_id,
        'zoneId',      p.zone_id,
        'createdAt',   p.created_at,
        'editedAt',    p.edited_at,
        'mine',        p.user_id = p_viewer,
        'author',      private.public_author(p.user_id, p.monument_id),
        'photos',      coalesce((
                           select jsonb_agg(ph.path order by ph.position, ph.path)
                           from public.post_photos ph where ph.post_id = p.id
                       ), '[]'::jsonb),
        'helpful',     (select count(*)::integer from public.post_reactions r
                        where r.post_id = p.id and r.kind = 'helpful'),
        'interesting', (select count(*)::integer from public.post_reactions r
                        where r.post_id = p.id and r.kind = 'interesting'),
        'myHelpful',   exists (select 1 from public.post_reactions r
                               where r.post_id = p.id and r.kind = 'helpful' and r.user_id = p_viewer),
        'myInteresting', exists (select 1 from public.post_reactions r
                                 where r.post_id = p.id and r.kind = 'interesting' and r.user_id = p_viewer),
        'saved',       exists (select 1 from public.post_saves s
                               where s.post_id = p.id and s.user_id = p_viewer),
        'comments',    (select count(*)::integer from public.post_comments c
                        where c.post_id = p.id and c.deleted_at is null)
    )
    from public.posts p
    where p.id = p_post_id and p.deleted_at is null;
$$;


-- ------------------------------------------------------------
-- 9. O feed
--
-- Filtra por tipo e por texto, pagina por data. A procura e um
-- `ilike` sobre titulo e corpo — chega para "pesquisar
-- publicacoes, lugares, pessoas" nesta escala, e nao obriga a
-- montar indices de texto completo para doze monumentos.
--
-- `unaccent` nao esta instalado, por isso a procura e sensivel a
-- acentos. E uma limitacao conhecida, nao um esquecimento: ver a
-- nota no fim.
-- ------------------------------------------------------------
create or replace function public.list_posts(
    p_kind        text        default null,
    p_query       text        default null,
    p_monument_id text        default null,
    p_before      timestamptz default null,
    p_limit       integer     default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
    v_q     text := nullif(btrim(coalesce(p_query, '')), '');
    v_ids   uuid[];
    v_rows  jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select array_agg(q.id order by q.created_at desc)
    into v_ids
    from (
        select p.id, p.created_at
        from public.posts p
        where p.deleted_at is null
          and (p_kind is null or p.kind = p_kind)
          and (p_monument_id is null or p.monument_id = p_monument_id)
          and (p_before is null or p.created_at < p_before)
          and (v_q is null or p.title ilike '%' || v_q || '%' or p.body ilike '%' || v_q || '%')
        order by p.created_at desc
        limit v_limit
    ) q;

    v_ids := coalesce(v_ids, '{}'::uuid[]);

    select coalesce(jsonb_agg(private.post_json(id, v_user, false)), '[]'::jsonb)
    into v_rows
    from unnest(v_ids) as id;

    return jsonb_build_object(
        'ok',      true,
        'posts',   v_rows,
        'hasMore', array_length(v_ids, 1) = v_limit
    );
end;
$$;


-- ------------------------------------------------------------
-- 10. Destaques
--
-- "Destaques da comunidade" do desenho. NAO e um ranking de
-- popularidade: e o que ajudou mais gente nos ultimos dias.
--
-- A janela de 14 dias e deliberada. Sem ela, as mesmas tres
-- publicacoes ficavam no topo para sempre e a seccao deixava de
-- ser um convite para passar a ser um museu.
--
-- "Ajudou-me" pesa o dobro de "Interessante" pela mesma razao
-- por que as duas existem separadas: ter consequencia pratica
-- vale mais do que ter sido agradavel de ler.
-- ------------------------------------------------------------
create or replace function public.list_highlights(p_limit integer default 5)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_limit integer := greatest(1, least(coalesce(p_limit, 5), 10));
    v_ids   uuid[];
    v_rows  jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select array_agg(q.id order by q.score desc, q.created_at desc)
    into v_ids
    from (
        select p.id,
               p.created_at,
               (select count(*) filter (where r.kind = 'helpful') * 2
                     + count(*) filter (where r.kind = 'interesting')
                from public.post_reactions r where r.post_id = p.id) as score
        from public.posts p
        where p.deleted_at is null
          and p.created_at > now() - interval '14 days'
        order by score desc, p.created_at desc
        limit v_limit
    ) q
    where q.score > 0;

    v_ids := coalesce(v_ids, '{}'::uuid[]);

    select coalesce(jsonb_agg(private.post_json(id, v_user, false)), '[]'::jsonb)
    into v_rows
    from unnest(v_ids) as id;

    return jsonb_build_object('ok', true, 'highlights', v_rows);
end;
$$;


-- ------------------------------------------------------------
-- 11. Uma publicacao inteira
-- ------------------------------------------------------------
create or replace function public.get_post(p_post_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_post jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    v_post := private.post_json(p_post_id, v_user, true);
    if v_post is null then
        return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;

    return jsonb_build_object('ok', true, 'post', v_post);
end;
$$;


-- ------------------------------------------------------------
-- 12. Publicar
--
-- Como em `send_message`, o servidor e que decide. As
-- fotografias ja subiram para o bucket antes desta chamada: aqui
-- so se gravam os caminhos, dentro da mesma transaccao da
-- publicacao — ou fica tudo, ou nao fica nada.
--
-- Limite de ritmo mais apertado que o do chat (6 por hora, nao 12
-- por minuto): uma publicacao leva tempo a escrever, e quem faz
-- seis numa hora nao esta a partilhar, esta a inundar.
-- ------------------------------------------------------------
create or replace function public.create_post(
    p_kind        text,
    p_title       text,
    p_body        text default '',
    p_monument_id text default null,
    p_zone_id     text default null,
    p_photos      jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user   uuid := (select auth.uid());
    v_title  text := btrim(coalesce(p_title, ''));
    v_body   text := coalesce(p_body, '');
    v_recent integer;
    v_id     uuid;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if char_length(v_title) < 1 or char_length(v_title) > 120 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_title');
    end if;
    if char_length(v_body) > 2000 then
        return jsonb_build_object('ok', false, 'reason', 'too_long');
    end if;

    select count(*)::integer into v_recent
    from public.posts p
    where p.user_id = v_user and p.created_at > now() - interval '1 hour';

    if v_recent >= 6 then
        return jsonb_build_object('ok', false, 'reason', 'rate_limited');
    end if;

    begin
        insert into public.posts (user_id, kind, title, body, monument_id, zone_id)
        values (v_user, p_kind, v_title, v_body, p_monument_id, p_zone_id)
        returning id into v_id;
    exception when check_violation or foreign_key_violation then
        return jsonb_build_object('ok', false, 'reason', 'invalid_post');
    end;

    -- As fotografias chegam como [{path, width, height, bytes}].
    -- `ordinality` da a posicao sem o cliente ter de a mandar.
    insert into public.post_photos (post_id, path, position, width, height, bytes)
    select v_id,
           item ->> 'path',
           (ord - 1)::integer,
           nullif(item ->> 'width', '')::integer,
           nullif(item ->> 'height', '')::integer,
           nullif(item ->> 'bytes', '')::integer
    from jsonb_array_elements(coalesce(p_photos, '[]'::jsonb)) with ordinality as t(item, ord)
    where item ->> 'path' is not null
    on conflict do nothing;

    return jsonb_build_object('ok', true, 'post', private.post_json(v_id, v_user, true));
end;
$$;


-- ------------------------------------------------------------
-- 13. Reagir, guardar, apagar, denunciar
-- ------------------------------------------------------------
create or replace function public.set_post_reaction(p_post_id uuid, p_kind text, p_on boolean default true)
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
    if p_kind not in ('helpful', 'interesting') then
        return jsonb_build_object('ok', false, 'reason', 'invalid_reaction');
    end if;

    if p_on then
        insert into public.post_reactions (post_id, user_id, kind)
        values (p_post_id, v_user, p_kind)
        on conflict do nothing;
    else
        delete from public.post_reactions
        where post_id = p_post_id and user_id = v_user and kind = p_kind;
    end if;

    return jsonb_build_object('ok', true, 'post', private.post_json(p_post_id, v_user, false));
end;
$$;

create or replace function public.set_post_saved(p_post_id uuid, p_on boolean default true)
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

    if p_on then
        insert into public.post_saves (post_id, user_id) values (p_post_id, v_user)
        on conflict do nothing;
    else
        delete from public.post_saves where post_id = p_post_id and user_id = v_user;
    end if;

    return jsonb_build_object('ok', true, 'saved', p_on);
end;
$$;

create or replace function public.delete_post(p_post_id uuid)
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

    update public.posts set deleted_at = now()
    where id = p_post_id and user_id = v_user and deleted_at is null;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.report_post(p_post_id uuid, p_reason text)
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

    insert into public.post_reports (post_id, reporter_id, reason)
    values (p_post_id, v_user, p_reason)
    on conflict (post_id, reporter_id) do update set reason = excluded.reason;

    return jsonb_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 14. Comentarios
-- ------------------------------------------------------------
create or replace function private.comment_json(p_comment_id uuid, p_monument_id text, p_viewer uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
    select jsonb_build_object(
        'id',        c.id,
        'body',      case when c.deleted_at is null then c.body else '' end,
        'createdAt', c.created_at,
        'editedAt',  c.edited_at,
        'deleted',   c.deleted_at is not null,
        'mine',      c.user_id = p_viewer,
        'author',    private.public_author(c.user_id, p_monument_id),
        'helpful',   (select count(*)::integer from public.comment_helpful h where h.comment_id = c.id),
        'myHelpful', exists (select 1 from public.comment_helpful h
                             where h.comment_id = c.id and h.user_id = p_viewer),
        'replyTo',   (
            select jsonb_build_object(
                'id',      r.id,
                'author',  private.public_author(r.user_id, null) -> 'name',
                'deleted', r.deleted_at is not null)
            from public.post_comments r where r.id = c.reply_to
        )
    )
    from public.post_comments c
    where c.id = p_comment_id;
$$;

create or replace function public.list_comments(
    p_post_id uuid,
    p_before  timestamptz default null,
    p_limit   integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_limit integer := greatest(1, least(coalesce(p_limit, 30), 100));
    v_mon   text;
    v_ids   uuid[];
    v_rows  jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select monument_id into v_mon from public.posts where id = p_post_id;
    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;

    -- Mais recentes primeiro, que e a ordem do desenho. Ao
    -- contrario do chat: ali le-se uma conversa de fio a pavio,
    -- aqui quer-se o que foi dito por ultimo.
    select array_agg(q.id order by q.created_at desc)
    into v_ids
    from (
        select c.id, c.created_at
        from public.post_comments c
        where c.post_id = p_post_id
          and (p_before is null or c.created_at < p_before)
        order by c.created_at desc
        limit v_limit
    ) q;

    v_ids := coalesce(v_ids, '{}'::uuid[]);

    select coalesce(jsonb_agg(private.comment_json(id, v_mon, v_user)), '[]'::jsonb)
    into v_rows
    from unnest(v_ids) as id;

    return jsonb_build_object(
        'ok', true, 'comments', v_rows,
        'hasMore', array_length(v_ids, 1) = v_limit
    );
end;
$$;

create or replace function public.add_comment(p_post_id uuid, p_body text, p_reply_to uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user   uuid := (select auth.uid());
    v_body   text := btrim(coalesce(p_body, ''));
    v_recent integer;
    v_mon    text;
    v_id     uuid;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;
    if char_length(v_body) < 1 or char_length(v_body) > 1000 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_message');
    end if;

    select monument_id into v_mon from public.posts where id = p_post_id and deleted_at is null;
    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;

    select count(*)::integer into v_recent
    from public.post_comments c
    where c.user_id = v_user and c.created_at > now() - interval '1 minute';

    if v_recent >= 10 then
        return jsonb_build_object('ok', false, 'reason', 'rate_limited');
    end if;

    if p_reply_to is not null and not exists (
        select 1 from public.post_comments r where r.id = p_reply_to and r.post_id = p_post_id
    ) then
        return jsonb_build_object('ok', false, 'reason', 'invalid_reply');
    end if;

    insert into public.post_comments (post_id, user_id, body, reply_to)
    values (p_post_id, v_user, v_body, p_reply_to)
    returning id into v_id;

    return jsonb_build_object('ok', true, 'comment', private.comment_json(v_id, v_mon, v_user));
end;
$$;

create or replace function public.delete_comment(p_comment_id uuid)
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

    update public.post_comments set deleted_at = now()
    where id = p_comment_id and user_id = v_user and deleted_at is null;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.set_comment_helpful(p_comment_id uuid, p_on boolean default true)
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
        insert into public.comment_helpful (comment_id, user_id) values (p_comment_id, v_user)
        on conflict do nothing;
    else
        delete from public.comment_helpful where comment_id = p_comment_id and user_id = v_user;
    end if;

    select count(*)::integer into v_n from public.comment_helpful where comment_id = p_comment_id;
    return jsonb_build_object('ok', true, 'helpful', v_n, 'myHelpful', p_on);
end;
$$;


-- ------------------------------------------------------------
-- 15. Quem pode chamar o que
-- ------------------------------------------------------------
revoke all on function private.post_json(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function private.comment_json(uuid, text, uuid) from public, anon, authenticated;

grant execute on function public.list_posts(text, text, text, timestamptz, integer) to authenticated;
grant execute on function public.list_highlights(integer)                           to authenticated;
grant execute on function public.get_post(uuid)                                     to authenticated;
grant execute on function public.create_post(text, text, text, text, text, jsonb)   to authenticated;
grant execute on function public.set_post_reaction(uuid, text, boolean)             to authenticated;
grant execute on function public.set_post_saved(uuid, boolean)                      to authenticated;
grant execute on function public.delete_post(uuid)                                  to authenticated;
grant execute on function public.report_post(uuid, text)                            to authenticated;
grant execute on function public.list_comments(uuid, timestamptz, integer)          to authenticated;
grant execute on function public.add_comment(uuid, text, uuid)                      to authenticated;
grant execute on function public.delete_comment(uuid)                               to authenticated;
grant execute on function public.set_comment_helpful(uuid, boolean)                 to authenticated;

revoke execute on function public.list_posts(text, text, text, timestamptz, integer) from public, anon;
revoke execute on function public.create_post(text, text, text, text, text, jsonb) from public, anon;


-- ------------------------------------------------------------
-- 16. O bucket das fotografias de publicacoes
--
-- Separado do chat pela mesma razao por que o chat e separado do
-- album: ciclos de vida diferentes. Uma publicacao e para ficar;
-- uma fotografia de conversa envelhece com a conversa. Buckets
-- separados deixam apagar um sem tocar no outro.
--
-- Caminho: <user_id>/<ficheiro>. Privado, acesso so por link
-- assinado.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', false, 3145728,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
    set file_size_limit    = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_photos_storage_insert_own on storage.objects;
create policy post_photos_storage_insert_own on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'post-photos'
        and ((select auth.uid())::text = (storage.foldername(name))[1])
    );

drop policy if exists post_photos_storage_delete_own on storage.objects;
create policy post_photos_storage_delete_own on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'post-photos'
        and ((select auth.uid())::text = (storage.foldername(name))[1])
    );

drop policy if exists post_photos_storage_readable on storage.objects;
create policy post_photos_storage_readable on storage.objects
    for select to authenticated
    using (bucket_id = 'post-photos');

commit;

-- ============================================================
-- DEPOIS DE CORRER
-- ============================================================
--
-- 1) As funcoes da 003 estavam mesmo la?
--
--      select proname from pg_proc p
--      join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'private' and proname = 'public_author';
--
--    Se nao devolver nada, a 003 nao correu e `private.post_json`
--    foi criada a apontar para uma funcao que nao existe. O feed
--    falha na primeira chamada.
--
-- 2) `profiles` continua fechado?
--
--      select policyname, cmd from pg_policies where tablename = 'profiles';
--
--    So politicas `*_own`. A projeccao publica das funcoes tem de
--    continuar a ser a unica porta.
--
-- ============================================================
-- LIMITACOES CONHECIDAS
-- ============================================================
--
-- PROCURA SENSIVEL A ACENTOS. `list_posts` usa `ilike`, e sem a
-- extensao `unaccent` procurar "historico" nao encontra
-- "historico" escrito com acento. Resolve-se com:
--
--      create extension if not exists unaccent;
--
-- e trocando `ilike` por `unaccent(...) ilike unaccent(...)` com
-- um indice por expressao. Fica de fora aqui porque instalar
-- extensoes merece ser uma decisao propria, nao um efeito
-- secundario desta migration.
--
-- SEM DENUNCIA DE COMENTARIOS. Ha `post_reports` mas nao
-- `comment_reports`: o desenho nao mostra esse menu nos
-- comentarios das Descobertas. Acrescenta-se com cinco linhas
-- iguais as de `post_reports` quando for preciso.
--
-- SEM "SEGUIR". O desenho tem um botao Seguir no autor de uma
-- publicacao. Nao esta implementado de proposito: o ponto 43 pede
-- para evitar a linguagem de rede social generica, e seguir
-- pessoas traz consigo um grafo social, um feed pessoal e
-- notificacoes — tres coisas que mudam o que a app e. Fica como
-- decisao de produto, nao como divida tecnica.
--
-- ============================================================
-- ROLLBACK
-- ============================================================
--
--   drop function if exists public.set_comment_helpful(uuid, boolean);
--   drop function if exists public.delete_comment(uuid);
--   drop function if exists public.add_comment(uuid, text, uuid);
--   drop function if exists public.list_comments(uuid, timestamptz, integer);
--   drop function if exists public.report_post(uuid, text);
--   drop function if exists public.delete_post(uuid);
--   drop function if exists public.set_post_saved(uuid, boolean);
--   drop function if exists public.set_post_reaction(uuid, text, boolean);
--   drop function if exists public.create_post(text, text, text, text, text, jsonb);
--   drop function if exists public.get_post(uuid);
--   drop function if exists public.list_highlights(integer);
--   drop function if exists public.list_posts(text, text, text, timestamptz, integer);
--   drop function if exists private.comment_json(uuid, text, uuid);
--   drop function if exists private.post_json(uuid, uuid, boolean);
--
--   drop table if exists public.post_reports;
--   drop table if exists public.comment_helpful;
--   drop table if exists public.post_comments;
--   drop table if exists public.post_saves;
--   drop table if exists public.post_reactions;
--   drop table if exists public.post_photos;
--   drop table if exists public.posts;
--
--   delete from storage.objects where bucket_id = 'post-photos';
--   delete from storage.buckets where id = 'post-photos';
--
-- Apagar `posts` apaga o que as pessoas escreveram sobre os
-- lugares onde estiveram. Nao ha como recuperar.
-- ============================================================
