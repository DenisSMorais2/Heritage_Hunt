-- ============================================================
-- Heritage Hunt CV — a capa do álbum
--
-- Uma coluna. Nada mais.
--
-- POR QUE AQUI, E NÃO NUMA TABELA NOVA
--
-- A capa é uma escolha da PESSOA sobre um MONUMENTO — exactamente
-- a mesma natureza da nota e das etiquetas, que já vivem em
-- `monument_entries`. A linha "esta pessoa, este monumento" já
-- existe: acrescentar-lhe uma coluna é acrescentar um campo a um
-- registo que já se escreve, não criar um segundo sítio para
-- dizer a mesma coisa.
--
-- Consequências de graça:
--   - sobe pela fila de sincronização que já existe (`queueEntry`),
--     por isso funciona offline sem uma linha de código nova;
--   - o RLS de `monument_entries` já protege cada explorador, e
--     uma coluna nova numa tabela com RLS não precisa de política
--     própria;
--   - uma gravação continua a ser UMA escrita.
--
-- POR QUE NÃO HÁ CHAVE ESTRANGEIRA PARA `monument_photos`
--
-- Seria a modelação mais estrita, e é deliberadamente evitada: a
-- fotografia pode ainda não ter subido (fica pendente em casa) e
-- a escolha de capa é válida na mesma. Uma chave estrangeira
-- recusaria essa escrita e a capa escolhida offline perdia-se.
--
-- Uma escolha que aponta para uma fotografia que já não existe
-- fica órfã, e o cliente trata disso: `Album.coverIsOrphan()`
-- limpa-a ao abrir o álbum, e a capa cai para a primeira
-- fotografia — ou para a imagem oficial do monumento.
--
-- Seguro de correr mais de uma vez.
-- ============================================================

begin;

alter table public.monument_entries
    add column if not exists cover_photo_id text;

comment on column public.monument_entries.cover_photo_id is
    'Fotografia escolhida como capa do álbum deste monumento. Sem chave estrangeira de propósito: uma fotografia ainda pendente pode ser capa. Uma escolha órfã é limpa pelo cliente.';

commit;

-- ============================================================
-- DEPOIS DE CORRER
-- ============================================================
--
-- Nada a verificar do lado do XP: a capa NÃO rende pontos. É uma
-- recompensa visual — o álbum passa a ter a cara da pessoa — e
-- criar XP para ela seria inventar economia nova onde o enunciado
-- pede memória.
--
-- ============================================================
-- ROLLBACK
-- ============================================================
--
--   alter table public.monument_entries
--       drop column if exists cover_photo_id;
--
-- Apagar a coluna apaga as escolhas de capa. As fotografias ficam
-- todas: a capa é só um apontador para uma delas, e sem ele o
-- álbum volta a usar a primeira fotografia de cada monumento.
