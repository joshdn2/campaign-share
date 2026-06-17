-- Enable trigram support for fast substring / fuzzy-ish search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes on the fields searched by the navbar and results page.
-- These make `ILIKE '%term%'` queries efficient for the expected data size
-- (hundreds to low-thousands of nodes/blocks).
CREATE INDEX IF NOT EXISTS idx_node_title_trgm ON "Node" USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_node_excerpt_trgm ON "Node" USING gin (excerpt gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_node_block_text_trgm ON "NodeBlock" USING gin ((content->>'text') gin_trgm_ops) WHERE type = 'TEXT';
