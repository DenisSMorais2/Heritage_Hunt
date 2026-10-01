-- ============================================================
-- Heritage Hunt CV — Pistas
--
-- A terceira aba da Comunidade, e a que fecha o ciclo:
--
--   DUVIDA -> PISTAS -> (nao chegou) -> CONVERSA -> DICA
--          -> DESCOBERTA -> deixar uma pista ao proximo
--
-- DEPENDE DA 003 (usa `private.public_author`) e e irma da 004.
-- Correr por ordem.
--
-- PISTA NAO E PUBLICACAO NEM MENSAGEM
--
-- E o terceiro conceito, e tem a regra que os outros dois nao
-- tem: uma pista pertence a UM monumento e so pode ser escrita
-- por quem JA O DESCOBRIU (ponto 19).
--
-- Por isso nao reutiliza `posts`: uma publicacao e livre, uma
-- pista e credenciada. Meter as duas na mesma tabela obrigava a
-- uma coluna que explicasse quando a regra se aplica — e uma
-- regra condicional e uma regra que um dia se esquece.
--
-- A REGRA VIVE NO RLS, NAO NO ECRA
--
-- `clues_insert_discovered` verifica em `xp_events` que quem
-- escreve ja descobriu aquele monumento. Pode fazer-se dentro de
-- uma politica porque `xp_events_select_own` ja deixa cada um ler
-- os seus proprios eventos.
--
-- Pode parecer bastar verificar no RPC, como `award_xp` faz. Nao
-- basta: o RPC e conveniencia, a politica e a fronteira. Quem
-- chamasse `insert into clues` directamente com a chave publica
-- passaria por cima de um RPC — nao passa por cima do RLS.
--
-- SEM XP (pontos 34 e 35)
--
-- Deixar uma pista nao da XP. Daria uma corrida a escrever doze
-- pistas inuteis, uma por monumento. O que se ganha e o
-- "Ajudou-me" de quem veio a seguir — que nao e um numero no
-- perfil, e um sinal para quem le.
--
-- Seguro de correr mais de uma vez.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Pistas
--
-- `body` tem 400 caracteres, nao 1000 nem 2000. E deliberado: uma
-- pista e uma frase que aponta uma direccao. Dar espaco para tres
-- paragrafos e convidar a descrever o sitio exacto — que e
-- precisamente o que nao se quer (ponto 17).
-- ------------------------------------------------------------
create table if not exists public.clues (
    id          uuid primary key default gen_random_uuid(),
    monument_id text not null references public.monuments(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    body        text not null,
    created_at  timestamptz not null default now(),
    edited_at   timestamptz,
    deleted_at  timestamptz,

    constraint clues_body_length check (char_length(btrim(body)) between 1 and 400)
);

comment on table public.clues is
    'Pistas por monumento. So quem descobriu o monumento pode escrever — a regra esta na politica de INSERT, nao no cliente.';

-- Uma pessoa, uma pista por monumento. Nao e um limite tecnico:
-- e o que impede alguem encher a lista de um monumento sozinho, e
-- obriga a pensar na frase em vez de ir acrescentando.
create unique index if not exists clues_one_per_explorer
    on public.clues (monument_id, user_id) where deleted_at is null;

create index if not exists clues_by_monument
    on public.clues (monument_id, created_at desc) where deleted_at is null;

create table if not exists public.clue_helpful (
    clue_id    uuid not null references public.clues(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (clue_id, user_id)
);

create table if not exists public.clue_reports (
    clue_id     uuid not null references public.clues(id) on delete cascade,
    reporter_id uuid not null references auth.users(id) on delete cascade,
    reason      text not null check (reason in ('qr_location', 'incorrect', 'spam', 'harassment', 'other')),
    created_at  timestamptz not null default now(),
    primary key (clue_id, reporter_id)
);

comment on column public.clue_reports.reason is
    'qr_location e a razao principal aqui: uma pista que revela o sitio exacto estraga a descoberta para toda a gente.';


-- ------------------------------------------------------------
-- 2. RLS
--
-- Ler: toda a gente com sessao. Quem ainda nao descobriu PRECISA
-- de ler — e para isso que as pistas existem.
--
-- Escrever: so quem descobriu. A verificacao esta aqui, na
-- fronteira, e nao so no RPC.
-- ------------------------------------------------------------
alter table public.clues        enable row level security;
alter table public.clue_helpful enable row level security;
alter table public.clue_reports enable row level security;

drop policy if exists clues_select_all on public.clues;
create policy clues_select_all on public.clues
    for select to authenticated using (true);

drop policy if exists clues_insert_discovered on public.clues;
create policy clues_insert_discovered on public.clues
    for insert to authenticated
    with check (
        (select auth.uid()) = user_id
        and exists (
            select 1 from public.xp_events e
            where e.user_id = (select auth.uid())
              and e.action = 'MONUMENT_DISCOVERED'
              -- QUALIFICADO DE PROPOSITO. Escrito `= monument_id`,
              -- o Postgres resolveria o nome no escopo mais
              -- interno — `e.monument_id` — e a condicao passava a
              -- ser `e.monument_id = e.monument_id`, verdadeira
              -- para qualquer descoberta. A regra inteira caía.
              and e.monument_id = clues.monument_id
        )
    );

drop policy if exists clues_update_own on public.clues;
create policy clues_update_own on public.clues
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Sem DELETE: apagar e marcar `deleted_at`.

drop policy if exists clue_helpful_select_all on public.clue_helpful;
create policy clue_helpful_select_all on public.clue_helpful
    for select to authenticated using (true);

drop policy if exists clue_helpful_write_own on public.clue_helpful;
create policy clue_helpful_write_own on public.clue_helpful
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists clue_reports_own on public.clue_reports;
create policy clue_reports_own on public.clue_reports
    for all to authenticated
    using ((select auth.uid()) = reporter_id)
    with check ((select auth.uid()) = reporter_id);


-- ------------------------------------------------------------
-- 3. Uma pista, pronta para desenhar
--
-- O `discovered` do autor chega pela projeccao publica da 003 e
-- aqui vale sempre true — so quem descobriu escreve. Vem na
-- mesma, para o selo "Descobriu" ser desenhado pelo mesmo codigo
-- que o desenha no chat.
-- ------------------------------------------------------------
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
        'author',     private.public_author(c.user_id, c.monument_id),
        'helpful',    (select count(*)::integer from public.clue_helpful h where h.clue_id = c.id),
        'myHelpful',  exists (select 1 from public.clue_helpful h
                              where h.clue_id = c.id and h.user_id = p_viewer)
    )
    from public.clues c
    where c.id = p_clue_id;
$$;


-- ------------------------------------------------------------
-- 4. As pistas de um monumento
--
-- Ordenadas por quem ajudou mais, nao por quem chegou primeiro.
-- Numa lista de pistas, a que resolveu o problema a dezoito
-- pessoas vale mais acima do que a mais recente — e o contrario
-- do feed, onde o que importa e a novidade.
--
-- `canWrite` diz ao ecra se deve mostrar "Deixar uma pista" ou a
-- linha fechada do desenho ("Descobre este monumento para
-- poderes deixar pistas"). E a mesma verificacao da politica de
-- INSERT, exposta para o ecra nao ter de adivinhar.
-- ------------------------------------------------------------
create or replace function public.list_clues(p_monument_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_user  uuid := (select auth.uid());
    v_ids   uuid[];
    v_rows  jsonb;
    v_can   boolean;
    v_mine  boolean;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if not exists (select 1 from public.monuments m where m.id = p_monument_id) then
        return jsonb_build_object('ok', false, 'reason', 'unknown_monument');
    end if;

    select exists (
        select 1 from public.xp_events e
        where e.user_id = v_user
          and e.action = 'MONUMENT_DISCOVERED'
          and e.monument_id = p_monument_id
    ) into v_can;

    select exists (
        select 1 from public.clues c
        where c.monument_id = p_monument_id and c.user_id = v_user and c.deleted_at is null
    ) into v_mine;

    select array_agg(q.id order by q.helpful desc, q.created_at desc)
    into v_ids
    from (
        select c.id,
               c.created_at,
               (select count(*) from public.clue_helpful h where h.clue_id = c.id) as helpful
        from public.clues c
        where c.monument_id = p_monument_id
          and c.deleted_at is null
    ) q;

    v_ids := coalesce(v_ids, '{}'::uuid[]);

    select coalesce(jsonb_agg(private.clue_json(id, v_user)), '[]'::jsonb)
    into v_rows
    from unnest(v_ids) as id;

    return jsonb_build_object(
        'ok',         true,
        'clues',      v_rows,
        -- Ja descobri este monumento?
        'canWrite',   v_can,
        -- Ja deixei a minha pista? (uma por explorador)
        'hasMine',    v_mine
    );
end;
$$;


-- ------------------------------------------------------------
-- 5. A vista geral da aba Pistas
--
-- Um monumento por linha, com quantas pistas tem e se eu ja o
-- descobri. E o indice da aba: mostra onde ha ajuda e onde falta.
--
-- Os que eu ainda nao descobri aparecem na mesma — sao esses que
-- me interessam quando estou perdido a frente de um.
-- ------------------------------------------------------------
create or replace function public.list_clue_monuments()
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
                   'monumentId', q.id,
                   'zoneId',     q.zone_id,
                   'clues',      q.clues,
                   'discovered', q.discovered,
                   'hasMine',    q.has_mine
               ) order by q.clues desc, q.id
           ), '[]'::jsonb)
    into v_rows
    from (
        select m.id,
               m.zone_id,
               (select count(*)::integer from public.clues c
                where c.monument_id = m.id and c.deleted_at is null) as clues,
               exists (select 1 from public.xp_events e
                       where e.user_id = v_user and e.action = 'MONUMENT_DISCOVERED'
                         and e.monument_id = m.id) as discovered,
               exists (select 1 from public.clues c
                       where c.monument_id = m.id and c.user_id = v_user
                         and c.deleted_at is null) as has_mine
        from public.monuments m
    ) q;

    return jsonb_build_object('ok', true, 'monuments', v_rows);
end;
$$;


-- ------------------------------------------------------------
-- 6. Deixar uma pista
--
-- A politica de INSERT ja recusa quem nao descobriu. Este RPC
-- existe para a recusa ter NOME: o ecra precisa de distinguir
-- "ainda nao descobriste" de "ja deixaste a tua" de "ficou
-- demasiado longa", e um erro de RLS diz sempre a mesma coisa.
-- ------------------------------------------------------------
create or replace function public.add_clue(p_monument_id text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_body text := btrim(coalesce(p_body, ''));
    v_id   uuid;
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if char_length(v_body) < 1 or char_length(v_body) > 400 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_clue');
    end if;

    -- Ponto 19, com nome proprio.
    if not exists (
        select 1 from public.xp_events e
        where e.user_id = v_user
          and e.action = 'MONUMENT_DISCOVERED'
          and e.monument_id = p_monument_id
    ) then
        return jsonb_build_object('ok', false, 'reason', 'not_discovered');
    end if;

    if exists (
        select 1 from public.clues c
        where c.monument_id = p_monument_id and c.user_id = v_user and c.deleted_at is null
    ) then
        return jsonb_build_object('ok', false, 'reason', 'already_left');
    end if;

    insert into public.clues (monument_id, user_id, body)
    values (p_monument_id, v_user, v_body)
    returning id into v_id;

    return jsonb_build_object('ok', true, 'clue', private.clue_json(v_id, v_user));
end;
$$;


-- ------------------------------------------------------------
-- 7. Editar, apagar, agradecer, denunciar
-- ------------------------------------------------------------
create or replace function public.edit_clue(p_clue_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_body text := btrim(coalesce(p_body, ''));
begin
    if v_user is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;
    if char_length(v_body) < 1 or char_length(v_body) > 400 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_clue');
    end if;

    update public.clues
       set body = v_body, edited_at = now()
     where id = p_clue_id and user_id = v_user and deleted_at is null;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;

    return jsonb_build_object('ok', true, 'clue', private.clue_json(p_clue_id, v_user));
end;
$$;

create or replace function public.delete_clue(p_clue_id uuid)
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

    update public.clues set deleted_at = now()
    where id = p_clue_id and user_id = v_user and deleted_at is null;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.set_clue_helpful(p_clue_id uuid, p_on boolean default true)
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
        insert into public.clue_helpful (clue_id, user_id) values (p_clue_id, v_user)
        on conflict do nothing;
    else
        delete from public.clue_helpful where clue_id = p_clue_id and user_id = v_user;
    end if;

    select count(*)::integer into v_n from public.clue_helpful where clue_id = p_clue_id;
    return jsonb_build_object('ok', true, 'helpful', v_n, 'myHelpful', p_on);
end;
$$;

create or replace function public.report_clue(p_clue_id uuid, p_reason text)
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

    insert into public.clue_reports (clue_id, reporter_id, reason)
    values (p_clue_id, v_user, p_reason)
    on conflict (clue_id, reporter_id) do update set reason = excluded.reason;

    return jsonb_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 8. Quem pode chamar o que
-- ------------------------------------------------------------
revoke all on function private.clue_json(uuid, uuid) from public, anon, authenticated;

grant execute on function public.list_clues(text)                   to authenticated;
grant execute on function public.list_clue_monuments()              to authenticated;
grant execute on function public.add_clue(text, text)               to authenticated;
grant execute on function public.edit_clue(uuid, text)              to authenticated;
grant execute on function public.delete_clue(uuid)                  to authenticated;
grant execute on function public.set_clue_helpful(uuid, boolean)    to authenticated;
grant execute on function public.report_clue(uuid, text)            to authenticated;

revoke execute on function public.list_clues(text) from public, anon;
revoke execute on function public.add_clue(text, text) from public, anon;

commit;

-- ============================================================
-- DEPOIS DE CORRER — a verificacao que importa
-- ============================================================
--
-- A regra do ponto 19 esta mesmo na fronteira?
--
--      select policyname, with_check
--      from pg_policies
--      where tablename = 'clues' and cmd = 'INSERT';
--
--    O `with_check` tem de mencionar `xp_events` e
--    'MONUMENT_DISCOVERED'. Se nao mencionar, a regra ficou so no
--    RPC — e um INSERT directo com a chave publica passa.
--
-- Para confirmar na pratica, com a sessao de alguem que NAO
-- descobriu o monumento 5:
--
--      insert into public.clues (monument_id, user_id, body)
--      values ('5', auth.uid(), 'teste');
--
--    Tem de falhar com "new row violates row-level security".
--
-- ============================================================
-- ROLLBACK
-- ============================================================
--
--   drop function if exists public.report_clue(uuid, text);
--   drop function if exists public.set_clue_helpful(uuid, boolean);
--   drop function if exists public.delete_clue(uuid);
--   drop function if exists public.edit_clue(uuid, text);
--   drop function if exists public.add_clue(text, text);
--   drop function if exists public.list_clue_monuments();
--   drop function if exists public.list_clues(text);
--   drop function if exists private.clue_json(uuid, uuid);
--
--   drop table if exists public.clue_reports;
--   drop table if exists public.clue_helpful;
--   drop table if exists public.clues;
--
-- Apagar `clues` apaga a ajuda que exploradores deixaram uns aos
-- outros. E o tipo de conteudo que leva meses a juntar.
-- ============================================================
