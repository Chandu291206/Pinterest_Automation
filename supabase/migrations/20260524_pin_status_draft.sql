ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_status_check;
ALTER TABLE public.pins ADD CONSTRAINT pins_status_check
  CHECK (status IN ('draft', 'approved', 'posted', 'rejected', 'failed', 'queued'));
