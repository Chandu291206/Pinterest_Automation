-- Step 1: Add product_id column to pins
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS product_id uuid;

-- Step 2: Populate product_id from affiliate_link_id where present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pins' AND column_name = 'affiliate_link_id'
  ) THEN
    UPDATE public.pins
    SET product_id = affiliate_link_id
    WHERE product_id IS NULL;
  END IF;
END $$;

-- Step 3: Add FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pins_product_id_fkey'
  ) THEN
    ALTER TABLE public.pins
      ADD CONSTRAINT pins_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Make product_id NOT NULL when data is present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pins WHERE product_id IS NULL) THEN
    ALTER TABLE public.pins ALTER COLUMN product_id SET NOT NULL;
  END IF;
END $$;

-- Step 5: Drop old affiliate_link_id column if still present
ALTER TABLE public.pins DROP COLUMN IF EXISTS affiliate_link_id;

-- Step 6: Drop affiliate_links table if still present
DROP TABLE IF EXISTS public.affiliate_links;

-- Step 7: Update index
DROP INDEX IF EXISTS idx_pins_affiliate_link_id;
CREATE INDEX IF NOT EXISTS idx_pins_product_id ON public.pins (product_id);
