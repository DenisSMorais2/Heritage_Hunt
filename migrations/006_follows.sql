-- ============================================================
-- Heritage Hunt CV — Seguir exploradores
--
-- Seguir alguem aqui nao e colecionar pessoas: e dizer "o que
-- esta pessoa partilha torna as minhas exploracoes melhores".
-- Tudo nesta migration serve esse criterio, e varias coisas
-- faltam DE PROPOSITO por causa dele (ver "O que nao esta aqui").
--
-- DEPENDE DA 003, 004 e 005. Correr por ordem.
--
-- A RELACAO E UNILATERAL
--
-- A segue B. B nao aprova, B nao tem de retribuir. Nao ha
-- pedidos, nao ha aceitar, nao ha amizade. Duas colunas e uma
-- data chegam para isso, e tudo o que se construa por cima
-- continua a ler as mesmas duas colunas.
--
-- O ESTADO VIAJA COM O AUTOR, NAO A PARTE
--
-- A decisao central desta migration nao e a tabela — e estender
-- `private.public_author` com quem esta a ver.
--
-- Todas as projeccoes de autor do projecto passam por essa
-- funcao: mensagens, publicacoes, comentarios e pistas. Ao
-- devolver `isFollowing` e `followsYou` ali, um feed de vinte
-- publicacoes traz o estado dos vinte botoes na MESMA query.
--
-- A alternativa era o ecra perguntar "sigo este?" por cada
-- cartao: vinte idas a rede para desenhar uma lista. E o N+1 que
-- os pontos 37 e 38 proibem, e evita-se na origem em vez de se
-- remendar com cache no cliente.
--
-- SEM XP, SEM CONTADORES GUARDADOS, SEM RANKING
--
-- Seguir nao escreve em `xp_events` — nenhum caminho daqui la
-- vai (ponto 30). Dar XP por seguidores pagaria a quem colecciona
-- gente, e este projecto paga a quem descobre lugares.
--
-- Os contadores tambem nao vivem em `profiles`: contam-se quando
-- se perguntam (ponto 18). Com dois indices isto e barato, e um
-- numero guardado e um numero que um dia fica errado.
--
-- Nao ha "mais seguido" nem "top exploradores" (ponto 31). Nao
-- existe funcao nenhuma aqui que ordene pessoas por seguidores.
--
-- SEGUIR NAO E PERMISSAO
--
-- Nada nesta migration da acesso a mais nada (ponto 26). Quem
-- segue ve o mesmo que qualquer pessoa com sessao ja via: a
-- projeccao publica. Email, localizacao, album e fotografias
-- privadas continuam fora, porque continuam fora de
-- `public_author` — que e o unico sitio por onde um perfil sai.
--
-- O QUE NAO ESTA AQUI
--
-- Sem feed exclusivo de seguidos (ponto 22). O follow entra como
-- SINAL DE RELEVANCIA no feed normal, nao como separador. A aba
-- "A seguir" e possivel mais tarde sem tocar na tabela: basta um
-- filtro em `list_posts` (ponto 23).
--
-- Sem DMs (ponto 25), sem notificacoes push (ponto 29), sem
-- bloqueio — este projecto ainda nao tem bloqueio e nao e esta
-- tarefa que o inventa (ponto 43).
--
-- Seguro de correr mais de uma vez.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. A relacao
--
-- A CHAVE PRIMARIA E O PAR. Nao ha coluna `id`: o que identifica
-- uma relacao e exactamente quem segue quem. Uma chave sintetica
-- obrigaria a um UNIQUE a parte para dizer a mesma coisa, e
-- deixava a porta aberta a duas linhas iguais com ids diferentes
-- (ponto 16).
--
-- O CHECK recusa seguir-se a si proprio NA BASE DE DADOS, nao no
-- ecra (ponto 8). O ecra tambem esconde o botao, mas e o CHECK
-- que torna o estado impossivel.
--
-- `on delete cascade` para `auth.users` e o padrao do projecto, e
-- aqui resolve o ponto 44 sozinho: apagar uma conta leva as
-- relacoes dos dois lados, e nenhuma query fica a apontar para um
-- perfil que ja nao existe.
-- ------------------------------------------------------------
create table if not exists public.follows (
    follower_id  uuid not null references auth.users(id) on delete cascade,
    following_id uuid not null references auth.users(id) on delete cascade,
    created_at   timestamptz not null default now(),

    primary key (follower_id, following_id),
    constraint follows_no_self check (follower_id <> following_id)
);

comment on table public.follows is
    'Quem segue quem. Relacao unilateral e publica. Sem XP, sem contadores guardados, sem ranking de popularidade.';

-- A chave primaria ja serve "quem eu sigo". Este indice serve a
-- pergunta inversa — "quem me segue" — que e a do contador de
-- seguidores e a do estado "Seguir de volta".
create index if not exists follows_by_following
    on public.follows (following_id, created_at desc);

create index if not exists follows_by_follower
    on public.follows (follower_id, created_at desc);


-- ------------------------------------------------------------
-- 2. RLS
--
-- SELECT aberto a quem tem sessao: a relacao e publica, como os
-- perfis que ela liga (ponto 12).
--
-- INSERT e DELETE so com `follower_id = auth.uid()`. E aqui que
-- o ponto 13 se cumpre: mesmo que alguem monte o payload a mao
-- com a chave publica, a politica recusa seguir em nome de
-- outra pessoa. O RPC e conveniencia; isto e a fronteira.
--
-- Sem politica de UPDATE. Uma relacao nao se altera — cria-se ou
-- apaga-se. Sem politica, nenhum UPDATE passa.
-- ------------------------------------------------------------
alter table public.follows enable row level security;

drop policy if exists follows_select_all on public.follows;
create policy follows_select_all on public.follows
    for select to authenticated using (true);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
    for insert to authenticated
    with check ((select auth.uid()) = follower_id);

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows
    for delete to authenticated
    using ((select auth.uid()) = follower_id);


-- ------------------------------------------------------------
-- 3. O autor passa a saber quem o esta a ver
--
-- `p_viewer` entra com `default null` de proposito: as chamadas
-- antigas que ainda nao o passam continuam a funcionar e recebem
-- `null` nos tres campos novos — nunca `false`, que seria uma
-- afirmacao errada.
--
--   isFollowing — eu sigo esta pessoa
--   followsYou  — esta pessoa segue-me
--   isMe        — sou eu (o ecra esconde o botao, ponto 8)
--
-- Continua a nao sair daqui email, localizacao nem seja o que
-- for privado (ponto 27).
--
-- O DROP NAO E OPCIONAL. `create or replace` compara a
-- assinatura INTEIRA: com um argumento a mais, criaria uma
-- SOBRECARGA em vez de substituir. Ficavam duas `public_author`
-- vivas, e as chamadas de dois argumentos com `null` — que ha
-- em `message_json` e `comment_json` — deixavam de compilar:
--
--   function private.public_author(uuid, unknown) is not unique
--
-- Largar a antiga primeiro deixa uma so candidata, e as chamadas
-- de dois argumentos resolvem-se nela pelo `default`.
-- ------------------------------------------------------------
drop function if exists private.public_author(uuid, text);

create or replace function private.public_author(
    p_user_id     uuid,
    p_monument_id text default null,
    p_viewer      uuid default null
)
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
        end,
        'isMe',        case when p_viewer is null then null else p.id = p_viewer end,
        'isFollowing', case when p_viewer is null then null else exists (
                           select 1 from public.follows f
                           where f.follower_id = p_viewer and f.following_id = p.id
                       ) end,
        'followsYou',  case when p_viewer is null then null else exists (
                           select 1 from public.follows f
                           where f.follower_id = p.id and f.following_id = p_viewer
                       ) end
    )
    from public.profiles p
    where p.id = p_user_id;
$$;


-- ------------------------------------------------------------
-- 4. As quatro projeccoes passam a levar o viewer
--
-- Sao recriadas tal e qual, com UMA alteracao cada: o terceiro
-- argumento do `public_author`. E so por isto que o botao do
-- feed, do comentario, da pista e do chat ja nasce com o estado
-- certo, sem uma unica query extra.
--
-- As citacoes (`replyTo`) continuam a levar so o nome: ali nao
-- ha botao nenhum para desenhar. O `null::text` ali e preciso:
-- sem o tipo, `null` e `unknown` e o Postgres nao sabe que e o
-- monumento e nao o viewer.
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
        'author',        private.public_author(m.user_id, p_monument_id, p_viewer),
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
                'author',  private.public_author(r.user_id, null::text) -> 'name'
            )
            from public.messages r where r.id = m.reply_to
        )
    )
    from public.messages m
    where m.id = p_message_id;
$$;

create or replace function private.clue_json(p_clue_id uuid, p_viewer uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
    select jsonb_build_object(
        'id',         c.id,
        'monumentId', c.monument_id,
        'body',       case when c.deleted_at is null then c.body else '' end,
        'createdAt',  c.created_at,
        'editedAt',   c.edited_at,
        'deleted',    c.deleted_at is not null,
        'mine',       c.user_id = p_viewer,
        'author',     private.public_author(c.user_id, c.monument_id, p_viewer),
        'helpful',    (select count(*)::integer from public.clue_helpful h where h.clue_id = c.id),
        'myHelpful',  exists (select 1 from public.clue_helpful h
                              where h.clue_id = c.id and h.user_id = p_viewer)
    )
    from public.clues c
    where c.id = p_clue_id;
$$;

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
        'author',    private.public_author(c.user_id, p_monument_id, p_viewer),
        'helpful',   (select count(*)::integer from public.comment_helpful h where h.comment_id = c.id),
        'myHelpful', exists (select 1 from public.comment_helpful h
                             where h.comment_id = c.id and h.user_id = p_viewer),
        'replyTo',   (
            select jsonb_build_object(
                'id',      r.id,
                'author',  private.public_author(r.user_id, null::text) -> 'name',
                'deleted', r.deleted_at is not null)
            from public.post_comments r where r.id = c.reply_to
        )
    )
    from public.post_comments c
    where c.id = p_comment_id;
$$;

-- A publicacao ganha tambem `rankAt`, que a 6 explica.
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
        'body',        case when p_full then p.body else left(p.body, 280) end,
        'truncated',   (not p_full and char_length(p.body) > 280),
        'monumentId',  p.monument_id,
        'zoneId',      p.zone_id,
        'createdAt',   p.created_at,
        'editedAt',    p.edited_at,
        'mine',        p.user_id = p_viewer,
        'author',      private.public_author(p.user_id, p.monument_id, p_viewer),
        'rankAt',      p.created_at + private.follow_boost(p.user_id, p_viewer),
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
-- 5. Seguir e deixar de seguir
--
-- A politica ja recusa o que nao e meu, e o CHECK ja recusa
-- seguir-me a mim. Estes RPCs existem para a recusa ter NOME: o
-- ecra precisa de distinguir "nao podes seguir-te" de "essa
-- pessoa nao existe" de "ja segues" (ponto 14).
--
-- `on conflict do nothing` torna seguir IDEMPOTENTE: dois toques
-- rapidos nao sao erro, dao o mesmo resultado. O ecra tambem
-- desactiva o botao enquanto espera (ponto 16), mas a verdade
-- nao pode depender do ecra.
--
-- Devolvem os contadores ja actualizados para o perfil nao ter
-- de voltar a perguntar.
-- ------------------------------------------------------------
create or replace function public.follow_explorer(p_user_id uuid)
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

    if p_user_id is null or p_user_id = v_user then
        return jsonb_build_object('ok', false, 'reason', 'cannot_follow_self');
    end if;

    if not exists (select 1 from public.profiles p where p.id = p_user_id) then
        return jsonb_build_object('ok', false, 'reason', 'unknown_explorer');
    end if;

    -- Travao contra seguir em massa. Nao e uma funcionalidade, e
    -- uma defesa: 60 numa hora esta muito acima de qualquer uso
    -- honesto e muito abaixo de um varrimento automatico.
    if (select count(*) from public.follows f
        where f.follower_id = v_user and f.created_at > now() - interval '1 hour') >= 60 then
        return jsonb_build_object('ok', false, 'reason', 'rate_limited');
    end if;

    insert into public.follows (follower_id, following_id)
    values (v_user, p_user_id)
    on conflict (follower_id, following_id) do nothing;

    return jsonb_build_object(
        'ok',          true,
        'userId',      p_user_id,
        'isFollowing', true,
        'followsYou',  exists (select 1 from public.follows f
                               where f.follower_id = p_user_id and f.following_id = v_user),
        'followers',   (select count(*)::integer from public.follows f where f.following_id = p_user_id),
        'following',   (select count(*)::integer from public.follows f where f.follower_id = p_user_id)
    );
end;
$$;

create or replace function public.unfollow_explorer(p_user_id uuid)
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

    delete from public.follows
    where follower_id = v_user and following_id = p_user_id;

    -- Apagar o que ja nao existe nao e erro: o estado final e o
    -- que a pessoa pediu.
    return jsonb_build_object(
        'ok',          true,
        'userId',      p_user_id,
        'isFollowing', false,
        'followsYou',  exists (select 1 from public.follows f
                               where f.follower_id = p_user_id and f.following_id = v_user),
        'followers',   (select count(*)::integer from public.follows f where f.following_id = p_user_id),
        'following',   (select count(*)::integer from public.follows f where f.follower_id = p_user_id)
    );
end;
$$;


-- ------------------------------------------------------------
-- 6. O peso do follow no feed
--
-- O ponto 21 pede um peso pequeno, nao um algoritmo. Isto e o
-- peso: uma publicacao de quem eu sigo conta como se fosse 12
-- horas mais recente do que e.
--
-- Porque um deslocamento no TEMPO e nao uma pontuacao: o feed ja
-- e ordenado por data com paginacao por cursor. Uma pontuacao a
-- parte partia o cursor e obrigava a ler a lista toda para saber
-- a pagina seguinte. Somando a propria data, a ordem continua a
-- ser uma ordem de datas — o cursor continua a funcionar, e a
-- regra cabe numa frase que se explica a qualquer pessoa.
--
-- 12 horas chegam para a publicacao de hoje de quem sigo aparecer
-- acima da de ontem de quem nao sigo, e nao chegam para enterrar
-- uma descoberta de ha uma hora de um desconhecido. O feed
-- continua misturado, que e o que o ponto 21 quer.
-- ------------------------------------------------------------
create or replace function private.follow_boost(p_author uuid, p_viewer uuid)
returns interval
language sql
stable
security definer
set search_path to ''
as $$
    select case
        when p_viewer is null or p_author = p_viewer then interval '0'
        when exists (
            select 1 from public.follows f
            where f.follower_id = p_viewer and f.following_id = p_author
        ) then interval '12 hours'
        else interval '0'
    end;
$$;

-- `p_before` passa a morder em `rankAt`, nao em `created_at`: tem
-- de ser o mesmo valor por que se ordena, senao a pagina seguinte
-- salta linhas.
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

    select array_agg(q.id order by q.rank_at desc)
    into v_ids
    from (
        select p.id,
               p.created_at + private.follow_boost(p.user_id, v_user) as rank_at
        from public.posts p
        where p.deleted_at is null
          and (p_kind is null or p.kind = p_kind)
          and (p_monument_id is null or p.monument_id = p_monument_id)
          and (p_before is null or p.created_at + private.follow_boost(p.user_id, v_user) < p_before)
          and (v_q is null or p.title ilike '%' || v_q || '%' or p.body ilike '%' || v_q || '%')
        order by rank_at desc
        limit v_limit
    ) q;

    v_ids := coalesce(v_ids, '{}'::uuid[]);

    -- `with ordinality` preserva a ordem que o array ja traz, sem
    -- voltar a chamar `post_json` so para reordenar.
    select coalesce(jsonb_agg(private.post_json(t.id, v_user, false) order by t.ord), '[]'::jsonb)
    into v_rows
    from unnest(v_ids) with ordinality as t(id, ord);

    return jsonb_build_object(
        'ok',      true,
        'posts',   v_rows,
        'hasMore', array_length(v_ids, 1) = v_limit
    );
end;
$$;


-- ------------------------------------------------------------
-- 7. O perfil publico de um explorador
--
-- A ORDEM DOS NUMEROS E A MENSAGEM (ponto 7).
--
-- Primeiro o que a pessoa descobriu e aquilo com que ajudou;
-- seguidores e a seguir vem depois, porque sao informacao
-- social secundaria e nao o placar do perfil.
--
-- `helpfulReceived` e quantas vezes o que esta pessoa escreveu
-- ajudou mesmo alguem — pistas, comentarios, mensagens e
-- publicacoes somados. E este o numero que merece destaque
-- (ponto 32), nao o de seguidores.
-- ------------------------------------------------------------
create or replace function public.get_explorer(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if not exists (select 1 from public.profiles p where p.id = p_user_id) then
        return jsonb_build_object('ok', false, 'reason', 'unknown_explorer');
    end if;

    return jsonb_build_object(
        'ok',     true,
        'author', private.public_author(p_user_id, null, v_user),

        'discoveries', (select count(distinct e.monument_id)::integer
                        from public.xp_events e
                        where e.user_id = p_user_id and e.action = 'MONUMENT_DISCOVERED'),

        'posts',   (select count(*)::integer from public.posts p
                    where p.user_id = p_user_id and p.deleted_at is null),

        'clues',   (select count(*)::integer from public.clues c
                    where c.user_id = p_user_id and c.deleted_at is null),

        'helpfulReceived', (
            (select count(*)::integer from public.clue_helpful h
             join public.clues c on c.id = h.clue_id where c.user_id = p_user_id)
          + (select count(*)::integer from public.comment_helpful h
             join public.post_comments c on c.id = h.comment_id where c.user_id = p_user_id)
          + (select count(*)::integer from public.message_helpful h
             join public.messages m on m.id = h.message_id where m.user_id = p_user_id)
          + (select count(*)::integer from public.post_reactions r
             join public.posts p on p.id = r.post_id
             where p.user_id = p_user_id and r.kind = 'helpful')
        ),

        'followers', (select count(*)::integer from public.follows f where f.following_id = p_user_id),
        'following', (select count(*)::integer from public.follows f where f.follower_id = p_user_id)
    );
end;
$$;


-- ------------------------------------------------------------
-- 8. Quem me segue, quem eu sigo
--
-- Paginadas por `created_at` da relacao (ponto 19): a relacao
-- mais recente primeiro. Cada linha traz ja o estado do seu
-- proprio botao, pela mesma razao do ponto 3 — uma lista de 30
-- pessoas nao pode ser 30 perguntas.
-- ------------------------------------------------------------
create or replace function public.list_followers(
    p_user_id uuid,
    p_before  timestamptz default null,
    p_limit   integer     default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_limit integer := greatest(1, least(coalesce(p_limit, 30), 50));
    v_rows  jsonb;
    v_count integer;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
               'author',    private.public_author(q.follower_id, null, v_user),
               'createdAt', q.created_at
           ) order by q.created_at desc), '[]'::jsonb),
           count(*)::integer
    into v_rows, v_count
    from (
        select f.follower_id, f.created_at
        from public.follows f
        where f.following_id = p_user_id
          and (p_before is null or f.created_at < p_before)
        order by f.created_at desc
        limit v_limit
    ) q;

    return jsonb_build_object('ok', true, 'explorers', v_rows, 'hasMore', v_count = v_limit);
end;
$$;

create or replace function public.list_following(
    p_user_id uuid,
    p_before  timestamptz default null,
    p_limit   integer     default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_limit integer := greatest(1, least(coalesce(p_limit, 30), 50));
    v_rows  jsonb;
    v_count integer;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
               'author',    private.public_author(q.following_id, null, v_user),
               'createdAt', q.created_at
           ) order by q.created_at desc), '[]'::jsonb),
           count(*)::integer
    into v_rows, v_count
    from (
        select f.following_id, f.created_at
        from public.follows f
        where f.follower_id = p_user_id
          and (p_before is null or f.created_at < p_before)
        order by f.created_at desc
        limit v_limit
    ) q;

    return jsonb_build_object('ok', true, 'explorers', v_rows, 'hasMore', v_count = v_limit);
end;
$$;


-- ------------------------------------------------------------
-- 9. Exploradores que talvez queiras acompanhar
--
-- A regra cabe numa frase, de proposito (pontos 33 e 34): quem
-- escreveu pistas e publicacoes que OUTROS acharam uteis nos
-- ultimos 30 dias, e que eu ainda nao sigo.
--
-- Nao e aleatorio e nao e popularidade: o criterio e ter ajudado,
-- nao ter seguidores. Um perfil com mil seguidores e zero pistas
-- uteis nao aparece aqui.
-- ------------------------------------------------------------
create or replace function public.list_suggested_explorers(p_limit integer default 5)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_limit integer := greatest(1, least(coalesce(p_limit, 5), 10));
    v_rows  jsonb;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
               'author', private.public_author(q.user_id, null, v_user),
               'helpful', q.helpful
           ) order by q.helpful desc), '[]'::jsonb)
    into v_rows
    from (
        select u.user_id, sum(u.helpful)::integer as helpful
        from (
            select c.user_id, count(*) as helpful
            from public.clue_helpful h
            join public.clues c on c.id = h.clue_id
            where h.created_at > now() - interval '30 days' and c.deleted_at is null
            group by c.user_id

            union all

            select p.user_id, count(*) as helpful
            from public.post_reactions r
            join public.posts p on p.id = r.post_id
            where r.kind = 'helpful' and r.created_at > now() - interval '30 days'
              and p.deleted_at is null
            group by p.user_id
        ) u
        where u.user_id <> v_user
          and not exists (
              select 1 from public.follows f
              where f.follower_id = v_user and f.following_id = u.user_id
          )
        group by u.user_id
        order by sum(u.helpful) desc
        limit v_limit
    ) q;

    return jsonb_build_object('ok', true, 'explorers', v_rows);
end;
$$;


-- ------------------------------------------------------------
-- 10. Permissoes
--
-- As `private.*` continuam fechadas: so as funcoes do servidor as
-- chamam. As `public.*` abrem-se a quem tem sessao e so a quem
-- tem sessao.
-- ------------------------------------------------------------
revoke all on function private.public_author(uuid, text, uuid) from public, anon, authenticated;
revoke all on function private.follow_boost(uuid, uuid)        from public, anon, authenticated;

grant execute on function public.follow_explorer(uuid)                             to authenticated;
grant execute on function public.unfollow_explorer(uuid)                           to authenticated;
grant execute on function public.get_explorer(uuid)                                to authenticated;
grant execute on function public.list_followers(uuid, timestamptz, integer)        to authenticated;
grant execute on function public.list_following(uuid, timestamptz, integer)        to authenticated;
grant execute on function public.list_suggested_explorers(integer)                 to authenticated;

revoke execute on function public.follow_explorer(uuid)   from public, anon;
revoke execute on function public.unfollow_explorer(uuid) from public, anon;
revoke execute on function public.get_explorer(uuid)      from public, anon;

commit;


-- ============================================================
-- Para desfazer (nao correr sem querer mesmo):
--
--   drop function if exists public.list_suggested_explorers(integer);
--   drop function if exists public.list_following(uuid, timestamptz, integer);
--   drop function if exists public.list_followers(uuid, timestamptz, integer);
--   drop function if exists public.get_explorer(uuid);
--   drop function if exists public.unfollow_explorer(uuid);
--   drop function if exists public.follow_explorer(uuid);
--   drop function if exists private.follow_boost(uuid, uuid);
--   drop table if exists public.follows;
--
-- `public_author`, as quatro projeccoes e `list_posts` teriam de
-- voltar as versoes das migrations 003, 004 e 005.
-- ============================================================
