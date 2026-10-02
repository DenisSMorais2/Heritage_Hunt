-- ============================================================
-- Heritage Hunt CV — Cada tipo de publicacao e uma coisa
--
-- Ate aqui os seis tipos eram a mesma publicacao com uma
-- etiqueta diferente: titulo obrigatorio, corpo, fotos, lugar.
-- Escolher "Trilho" em vez de "Dica" nao mudava nada do que se
-- preenchia nem do que se guardava.
--
-- DEPENDE DA 004 (e corre depois da 007, que mexeu na
-- `list_posts`).
--
-- DUAS MUDANCAS, E SO DUAS
--
-- 1. O TITULO DEIXA DE SER OBRIGATORIO PARA TODOS.
--    Uma dica, uma fotografia, uma curiosidade e uma pergunta
--    nao tem titulo: o texto (ou a imagem) E a publicacao.
--    Obrigar a um titulo era obrigar a escrever duas vezes a
--    mesma coisa e encher o feed de "Dica sobre o Palacio".
--    Continuam a ter titulo o TRILHO (nome do percurso) e o
--    LUGAR (nome do lugar) — onde o titulo tem nome proprio.
--
--    A coluna continua `not null`: o vazio e `''`, nao `null`.
--    Uma coisa a menos para testar em cada consulta.
--
-- 2. NASCE `metadata jsonb`.
--    Um trilho tem partida, destino, distancia, duracao e
--    dificuldade. Uma curiosidade tem fonte. Uma fotografia tem
--    etiquetas de momento. Nada disto justifica cinco tabelas
--    novas nem cinco colunas que ficam nulas em cinco sextos das
--    linhas.
--
-- MAS `metadata` NAO E UM SACO
--
-- `private.clean_post_metadata` conhece as chaves de cada tipo,
-- os tamanhos e as listas fechadas. O que vier a mais e deitado
-- fora ANTES de ser escrito. O cliente faz a mesma limpeza para
-- o ecra responder depressa; esta e a que conta, porque o
-- cliente nao e de confianca (e o mesmo principio das politicas
-- RLS: a regra vive aqui).
--
-- AS REGRAS DE CADA TIPO TAMBEM VIVEM AQUI
--
-- `create_post` passou a saber que uma fotografia sem imagem nao
-- e uma fotografia, e que um trilho sem partida nem destino nao
-- se segue. Sao as mesmas regras que o formulario mostra — mas
-- um `curl` a esta funcao nao ve formulario nenhum.
--
-- O QUE NAO MUDA
--
-- Nem a tabela `posts` ganha tipos novos, nem `post_photos`,
-- `post_reactions`, `post_saves`, `post_comments` ou as
-- politicas RLS sao tocadas. As publicacoes que ja existem
-- ficam validas: `metadata` nasce a '{}' e os titulos que ja la
-- estao continuam la.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A coluna
-- ------------------------------------------------------------
alter table public.posts
    add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.posts.metadata is
    'Dados proprios do tipo (trilho: partida/destino/distancia/duracao/dificuldade; curiosidade: fonte; fotografia e lugar: etiquetas). Limpo por private.clean_post_metadata — so entram chaves conhecidas.';

-- Um objecto, nunca uma lista nem um numero solto.
alter table public.posts drop constraint if exists posts_metadata_object;
alter table public.posts
    add constraint posts_metadata_object check (jsonb_typeof(metadata) = 'object');


-- ------------------------------------------------------------
-- 2. O titulo passa a poder ser vazio
--
-- O tecto de 120 mantem-se. O chao desce de 1 para 0.
-- ------------------------------------------------------------
alter table public.posts drop constraint if exists posts_title_length;
alter table public.posts
    add constraint posts_title_length check (char_length(btrim(title)) <= 120);


-- ------------------------------------------------------------
-- 3. Que tipos tem titulo
--
-- Uma funcao e nao uma lista escrita em tres sitios: quando um
-- setimo tipo aparecer, muda-se aqui.
-- ------------------------------------------------------------
create or replace function private.post_kind_has_title(p_kind text)
returns boolean
language sql
immutable
set search_path to ''
as $$
    select p_kind in ('trail', 'place');
$$;


-- ------------------------------------------------------------
-- 4. A limpeza dos metadados
--
-- Devolve SEMPRE um objecto. Chave desconhecida, tipo errado,
-- etiqueta fora da lista ou texto gigante nao dao erro — sao
-- simplesmente deitados fora. Recusar a publicacao inteira por
-- causa de uma etiqueta estranha seria perder o que a pessoa
-- escreveu por causa do que ela nao escreveu.
-- ------------------------------------------------------------
create or replace function private.clean_post_metadata(p_kind text, p_metadata jsonb)
returns jsonb
language plpgsql
immutable
set search_path to ''
as $$
declare
    v_in    jsonb := case when jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) = 'object'
                          then p_metadata else '{}'::jsonb end;
    v_out   jsonb := '{}'::jsonb;
    v_key   text;
    v_text  text;
    v_tags  jsonb;
    v_allow text[];
begin
    if p_kind = 'curiosity' then
        v_text := btrim(coalesce(v_in ->> 'source', ''));
        if v_text <> '' then
            v_out := v_out || jsonb_build_object('source', left(v_text, 200));
        end if;

    elsif p_kind = 'trail' then
        foreach v_key in array array['start', 'end', 'distance', 'duration'] loop
            v_text := btrim(coalesce(v_in ->> v_key, ''));
            if v_text <> '' then
                v_out := v_out || jsonb_build_object(v_key, left(v_text, 80));
            end if;
        end loop;

        if coalesce(v_in ->> 'difficulty', '') in ('easy', 'moderate', 'hard') then
            v_out := v_out || jsonb_build_object('difficulty', v_in ->> 'difficulty');
        end if;

    elsif p_kind in ('photo', 'place') then
        v_allow := case
            when p_kind = 'photo'
            then array['history', 'view', 'architecture', 'nature', 'sunset', 'culture']
            else array['view', 'photo', 'history', 'nature', 'family', 'sunset', 'culture']
        end;

        if jsonb_typeof(v_in -> 'tags') = 'array' then
            -- Fora da lista sai; repetida conta uma vez, na posicao
            -- da primeira; e quatro chegam — um cartao com sete
            -- etiquetas deixa de dizer para que serve o lugar.
            select coalesce(jsonb_agg(q.tag order by q.first_ord), '[]'::jsonb)
            into v_tags
            from (
                select tag, min(ord) as first_ord
                from jsonb_array_elements_text(v_in -> 'tags') with ordinality as t(tag, ord)
                where tag = any (v_allow)
                group by tag
                order by min(ord)
                limit 4
            ) q;

            if jsonb_array_length(v_tags) > 0 then
                v_out := v_out || jsonb_build_object('tags', v_tags);
            end if;
        end if;
    end if;

    -- 'tip' e 'question' nao tem metadados nenhuns, e e de
    -- proposito: quem tem uma duvida quer perguntar, nao
    -- preencher.
    return v_out;
end;
$$;


-- ------------------------------------------------------------
-- 5. Criar uma publicacao, com as regras do seu tipo
--
-- A assinatura cresce com `p_metadata`. Como na 007, isso obriga
-- a apagar a antiga: `create or replace` criaria uma segunda
-- funcao com o mesmo nome e o PostgREST nao sabe escolher.
--
-- As razoes devolvidas sao o NOME DO CAMPO que falta
-- ('need_body', 'need_photo', 'need_start'...), para o ecra
-- poder apontar ao sitio certo.
-- ------------------------------------------------------------
drop function if exists public.create_post(text, text, text, text, text, jsonb);

create or replace function public.create_post(
    p_kind        text,
    p_title       text default '',
    p_body        text default '',
    p_monument_id text default null,
    p_zone_id     text default null,
    p_photos      jsonb default '[]'::jsonb,
    p_metadata    jsonb default '{}'::jsonb
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
    v_meta   jsonb;
    v_photos integer := jsonb_array_length(coalesce(p_photos, '[]'::jsonb));
    v_recent integer;
    v_id     uuid;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if p_kind not in ('tip', 'photo', 'curiosity', 'trail', 'place', 'question') then
        return jsonb_build_object('ok', false, 'reason', 'invalid_kind');
    end if;

    -- Um titulo escrito num tipo que nao tem titulo nao e um erro:
    -- e lixo de uma troca de tipo a meio. Deita-se fora, como no
    -- cliente.
    if not private.post_kind_has_title(p_kind) then
        v_title := '';
    end if;

    v_meta := private.clean_post_metadata(p_kind, p_metadata);

    -- ---- As regras de cada tipo -----------------------------
    if private.post_kind_has_title(p_kind) and v_title = '' then
        return jsonb_build_object('ok', false, 'reason', 'need_title');
    end if;
    if char_length(v_title) > 120 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_title');
    end if;
    if char_length(v_body) > 2000 then
        return jsonb_build_object('ok', false, 'reason', 'too_long');
    end if;

    -- Uma fotografia sem imagem nao e uma fotografia.
    if p_kind = 'photo' and v_photos < 1 then
        return jsonb_build_object('ok', false, 'reason', 'need_photo');
    end if;

    -- Todos os outros vivem do texto.
    if p_kind <> 'photo' and btrim(v_body) = '' then
        return jsonb_build_object('ok', false, 'reason', 'need_body');
    end if;

    -- Um trilho sem partida nem destino nao se segue.
    if p_kind = 'trail' then
        if coalesce(v_meta ->> 'start', '') = '' then
            return jsonb_build_object('ok', false, 'reason', 'need_start');
        end if;
        if coalesce(v_meta ->> 'end', '') = '' then
            return jsonb_build_object('ok', false, 'reason', 'need_end');
        end if;
    end if;

    if v_photos > 4 then
        return jsonb_build_object('ok', false, 'reason', 'too_many_photos');
    end if;

    -- ---- Ritmo ----------------------------------------------
    select count(*)::integer into v_recent
    from public.posts p
    where p.user_id = v_user and p.created_at > now() - interval '1 hour';

    if v_recent >= 6 then
        return jsonb_build_object('ok', false, 'reason', 'rate_limited');
    end if;

    begin
        insert into public.posts (user_id, kind, title, body, monument_id, zone_id, metadata)
        values (v_user, p_kind, v_title, v_body, p_monument_id, p_zone_id, v_meta)
        returning id into v_id;
    exception when check_violation or foreign_key_violation then
        return jsonb_build_object('ok', false, 'reason', 'invalid_post');
    end;

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
-- 6. Os metadados viajam com a publicacao
--
-- Sem isto o cartao do trilho nao sabia a distancia e tinha de
-- ir buscar a publicacao inteira so para a mostrar.
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
        'body',        case when p_full then p.body else left(p.body, 280) end,
        'truncated',   (not p_full and char_length(p.body) > 280),
        'metadata',    coalesce(p.metadata, '{}'::jsonb),
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
-- 7. Permissoes
-- ------------------------------------------------------------
grant execute on function public.create_post(text, text, text, text, text, jsonb, jsonb) to authenticated;
revoke execute on function public.create_post(text, text, text, text, text, jsonb, jsonb) from public, anon;

comment on function public.create_post(text, text, text, text, text, jsonb, jsonb) is
    'Cria uma publicacao com as regras do seu tipo: titulo so no trilho e no lugar, imagem obrigatoria na fotografia, partida e destino obrigatorios no trilho.';
