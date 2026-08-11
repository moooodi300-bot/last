ALTER TABLE settings ADD COLUMN IF NOT EXISTS cr_number text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS loyalty_enabled boolean DEFAULT true;
