ALTER TABLE public.products ADD COLUMN IF NOT EXISTS clicks int NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;
