ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS interval_hours int NOT NULL DEFAULT 1;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS last_pin_at timestamptz;
