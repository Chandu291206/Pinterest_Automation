alter table public.pins
add column if not exists error_message text;
