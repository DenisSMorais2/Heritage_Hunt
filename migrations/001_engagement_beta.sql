-- ============================================================
-- Heritage Hunt CV — loop de engajamento da beta
--
-- Duas colunas e uma regra. Nada mais.
--
-- POR QUE NAO HA TABELAS NOVAS
--
-- O enunciado sugeria `weekly_missions` e
-- `user_weekly_mission_progress`. Nenhuma das duas e necessaria:
--
--   - o CATALOGO de missoes e conteudo, e todo o conteudo desta
--     app (monumentos, zonas, niveis, jornadas) vive em codigo,
--     em ficheiros de configuracao. Uma tabela para 9 missoes
--     seria infraestrutura a mais para dados que nao mudam sem
--     um deploy (ver WEEKLY_MISSION_CONFIG em missions.js);
--
--   - o PROGRESSO segue o padrao que `xp` e `exploration_streak`
--     ja usam: um agregado `jsonb` dentro do perfil. Assim uma
--     gravacao continua a ser UMA escrita atomica, e a missao
--     sobe pela fila de sincronizacao que ja existe — por isso
--     funciona offline sem uma linha de codigo nova.
--
-- Seguro de correr mais de uma vez.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Missao da semana e funil da beta
--
-- `weekly_mission`  { weekKey, missionId, refs, completedAt,
--                     rewardedAt, history }
--
-- `analytics`       { first: { MARCO: iso }, activeDays: [...],
--                     missionWeeks: [...], counts: {...} }
--
-- O que o `analytics` NAO contem, por desenho (ponto 43 do
-- enunciado): localizacao, percursos, tempo em ecra, ou qualquer
-- texto que a pessoa tenha escrito. Guarda marcos de produto e
-- chaves de dia — nada que identifique onde alguem esteve.
--
-- O RLS de `profiles` ja protege as duas: cada explorador so le e
-- escreve a sua linha. Colunas novas numa tabela com RLS nao
-- precisam de politica propria.
-- ------------------------------------------------------------
alter table public.profiles
    add column if not exists weekly_mission jsonb not null default '{}'::jsonb,
    add column if not exists analytics      jsonb not null default '{}'::jsonb;

comment on column public.profiles.weekly_mission is
    'Missao semanal: semana, missao atribuida, referencias de progresso e historico. Escrito pelo cliente, como xp e exploration_streak.';

comment on column public.profiles.analytics is
    'Funil da beta: marcos alcancados e dias de actividade. Sem localizacao, sem percursos, sem conteudo escrito.';

-- ------------------------------------------------------------
-- 2. A regra de XP da missao
--
-- CRITICO: `xp_rules` e o espelho de XP_CONFIG em xp.js. O
-- cliente decide SE recompensa; o servidor decide QUANTO vale.
-- Sem esta linha, `award_xp` nao sabe quanto vale a accao e o XP
-- da missao nunca chega a `xp_events` — a carteira local subia e
-- o ranking ficava atras, calado.
--
-- 50 XP tem de ser igual ao `amount` de
-- XP_CONFIG.WEEKLY_MISSION_COMPLETED em xp.js.
-- ------------------------------------------------------------
insert into public.xp_rules (action, amount)
values ('WEEKLY_MISSION_COMPLETED', 50)
on conflict (action) do update set amount = excluded.amount;

commit;

-- ============================================================
-- DEPOIS DE CORRER — duas verificacoes que valem o tempo
-- ============================================================
--
-- 1) `award_xp` aceita a accao nova?
--
--    A funcao verifica pre-requisitos (um monumento tem de estar
--    descoberto antes de aceitar uma fotografia). A missao NAO
--    tem pre-requisito de entidade: a entidade e a semana. Se a
--    funcao tiver um CHECK, um enum ou um CASE fechado sobre
--    `action`, o evento e recusado em silencio.
--
--      select pg_get_functiondef('public.award_xp'::regproc);
--
--    Procura por: constraint em xp_events.action, CASE sem ELSE,
--    ou validacao de `p_monument_id`/`p_zone_id` obrigatorios.
--
--    Se for recusado, o jogo nao da por isso (a carteira local e
--    a fonte da experiencia) mas o RANKING fica a menos 50 XP por
--    semana e por explorador. Vale confirmar antes da beta.
--
-- 2) O teto de XP mudou.
--
--    Era 1165 (12 monumentos + 4 zonas). Passa a 1165 + 50 por
--    cada semana em que a missao for concluida. Continua a ser um
--    valor que o CONTEUDO permite, nao um numero a escolha — que
--    e a propriedade que interessa.
--
-- ============================================================
-- ROLLBACK
-- ============================================================
--
--   alter table public.profiles
--       drop column if exists weekly_mission,
--       drop column if exists analytics;
--
--   delete from public.xp_rules where action = 'WEEKLY_MISSION_COMPLETED';
--
-- Apagar as colunas apaga o progresso das missoes e o funil. Os
-- `xp_events` ja registados ficam: sao historico, e o ranking de
-- semanas passadas nao deve mudar por causa de um rollback.
