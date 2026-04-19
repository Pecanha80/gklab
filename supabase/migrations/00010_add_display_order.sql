-- Execute este comando no SQL Editor do seu projeto Supabase atual (nvtkraqyqcbpubpmmeba)

-- 1. Adiciona a coluna display_order
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Inicializa a ordem baseada na data de criação (preserva o estado atual)
WITH ordered_gks AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM goalkeepers
)
UPDATE goalkeepers
SET display_order = ordered_gks.row_num
FROM ordered_gks
WHERE goalkeepers.id = ordered_gks.id;
