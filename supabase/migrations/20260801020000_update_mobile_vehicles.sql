ALTER TABLE mobile_vehicles ADD COLUMN IF NOT EXISTS working_hours int DEFAULT 8;
ALTER TABLE mobile_vehicles ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'van';
