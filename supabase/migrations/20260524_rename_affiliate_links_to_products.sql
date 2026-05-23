DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'affiliate_links'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    ALTER TABLE public.affiliate_links RENAME TO products;
  END IF;
END $$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_description text;

UPDATE public.products
SET slug = LOWER(REGEXP_REPLACE(COALESCE(product_name, 'product'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL OR slug = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_slug_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_campaign_id ON public.products (campaign_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
