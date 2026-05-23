CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.settings (key, value) VALUES
  ('pinterest_access_token', ''),
  ('pinterest_refresh_token', ''),
  ('pinterest_token_expires_at', '0'),
  ('llm_provider', 'openai'),
  ('openai_model', 'gpt-4o-mini'),
  ('default_posting_interval_hours', '1'),
  ('auto_post_bypass', 'false')
ON CONFLICT (key) DO NOTHING;
