-- ============================================================
-- Heritage Hunt CV — Procurar lugares e pessoas
--
-- A caixa de pesquisa das Descobertas diz "Pesquisar
-- publicacoes, lugares, pessoas". Ate aqui so a primeira palavra
-- era verdade: a `list_posts` comparava `title` e `body` e mais
-- nada. Escrever o nome de quem escreveu, ou o nome do lugar
-- visivel em cada cartao, respondia "Nada corresponde".
--
-- DEPENDE DA 004. Correr depois dela.
--
-- AS PESSOAS O SERVIDOR PROCURA; OS LUGARES CHEGAM RESOLVIDOS
--
-- Os nomes das pessoas estao em `profiles.name` — e uma juncao e
-- esta aqui.
--
-- Os nomes dos lugares NAO estao na base de dados. A tabela
-- `monuments` guarda id, pontos e zona; o nome e a descricao sao
-- conteudo traduzido em tres linguas e vivem no cliente ("o
-- catalogo e conteudo, nao infraestrutura"). Copia-los para ca
-- era passar a ter duas verdades sobre o mesmo nome, e a que o
-- ecra mostra nunca seria esta.
--
-- Entao o cliente resolve o nome escrito nos ids que conhece e
-- manda-os em `p_place_ids`. O servidor nunca precisa de saber
-- como os lugares se chamam — so de os reconhecer.
--
-- A LISTA VAZIA E A LISTA AUSENTE NAO SAO A MESMA COISA
--
-- `p_place_ids` nulo significa "nao procurei lugares". Uma lista
-- vazia significaria "procurei e nao encontrei nenhum" — e nesse
-- caso o cliente manda nulo na mesma, porque o termo ainda pode
-- casar com o titulo, o corpo ou um nome de pessoa. Quem decide
-- isso e o `or`: os lugares ALARGAM a procura, nunca a estreitam.
--
-- PORQUE E QUE A FUNCAO E APAGADA E NAO SO SUBSTITUIDA
--
-- `create or replace` nao muda a assinatura: acrescentar um
-- parametro criava uma SEGUNDA funcao com o mesmo nome, e o
-- PostgREST recusa-se a escolher entre duas candidatas. Apaga-se
-- a antiga primeiro — e por isso esta migration tem de correr
-- inteira, nao por pedacos.
--
-- ACENTOS
--
-- `unaccent` continua por instalar, por isso o `ilike` sobre
-- titulo, corpo e nome de pessoa continua sensivel a acentos.
-- Nos LUGARES isso ja nao se nota: a comparacao acontece no
-- cliente, que normaliza antes ("palacio" encontra "Palácio do
-- Povo"). E a diferenca entre as duas e uma limitacao conhecida,
-- nao um esquecimento.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Sai a assinatura antiga
-- ------------------------------------------------------------
drop function if exists public.list_posts(text, text, text, timestamptz, integer);


-- ------------------------------------------------------------
-- 2. O feed, agora com pessoas e lugares
--
-- `p_monument_id` (singular) continua a ser o que era: o filtro
-- de "publicacoes DESTE monumento", usado pela folha do lugar.
-- `p_place_ids` (plural) e outra coisa — faz parte da procura e
-- so entra quando ha termo escrito.
-- ------------------------------------------------------------
create or replace function public.list_posts(
    p_kind        text        default null,
    p_query       text        default null,
    p_monument_id text        default null,
    p_place_ids   text[]      default null,
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
    v_user   uuid := (select auth.uid());
    v_limit  integer := greatest(1, least(coalesce(p_limit, 20), 50));
    v_q      text := nullif(btrim(coalesce(p_query, '')), '');
    v_places text[] := nullif(coalesce(p_place_ids, '{}'::text[]), '{}'::text[]);
    v_ids    uuid[];
    v_rows   jsonb;
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
          and (
                v_q is null
                or p.title ilike '%' || v_q || '%'
                or p.body  ilike '%' || v_q || '%'
                -- A pessoa que escreveu
                or exists (
                    select 1
                    from public.profiles pr
                    where pr.id = p.user_id
                      and pr.name ilike '%' || v_q || '%'
                )
                -- O lugar, ja resolvido em ids pelo cliente. A
                -- ilha entra para "Mindelo" trazer tambem as
                -- publicacoes que nao marcaram lugar nenhum.
                or (
                    v_places is not null
                    and (
                        p.monument_id = any (v_places)
                        or p.zone_id  = any (v_places)
                        or p.island_id = any (v_places)
                    )
                )
          )
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

comment on function public.list_posts(text, text, text, text[], timestamptz, integer) is
    'Feed das Descobertas. A procura compara titulo, corpo e nome de quem escreveu; os lugares chegam em p_place_ids porque os nomes vivem no cliente.';


-- ------------------------------------------------------------
-- 3. Permissoes
--
-- As mesmas da assinatura antiga: so quem tem sessao.
-- ------------------------------------------------------------
grant execute on function public.list_posts(text, text, text, text[], timestamptz, integer) to authenticated;
revoke execute on function public.list_posts(text, text, text, text[], timestamptz, integer) from public, anon;
