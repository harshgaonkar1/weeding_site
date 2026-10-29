-- =========================================================
-- Migration: Add 'relation' column to guests table
-- Emitly Multi-Wedding Logistics System
-- =========================================================

-- 1. Add relation column if it doesn't already exist
ALTER TABLE guests ADD COLUMN IF NOT EXISTS relation VARCHAR(100) DEFAULT NULL;

-- 2. Create index for fast lookups & filtering
CREATE INDEX IF NOT EXISTS idx_guests_relation ON guests (relation);

-- 3. Update existing seed records with sample relations if empty
UPDATE guests SET relation = 'Groom''s Friend' WHERE id = 'guest_viggnesh_02' AND relation IS NULL;
UPDATE guests SET relation = 'Bride''s Brother' WHERE id = 'guest_manish_04' AND relation IS NULL;
UPDATE guests SET relation = 'Bride''s Sister' WHERE id = 'guest_sophia_01' AND relation IS NULL;
