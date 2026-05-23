ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_source text NOT NULL DEFAULT 'amazon'
  CHECK (affiliate_source IN ('amazon', 'flipkart', 'shareasale', 'cj', 'other'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='asin'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN asin TO source_id;
  END IF;
END $$;
