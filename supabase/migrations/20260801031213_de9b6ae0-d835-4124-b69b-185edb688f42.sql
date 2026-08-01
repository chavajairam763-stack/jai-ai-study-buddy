CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  trigger_type text NOT NULL DEFAULT 'schedule',
  schedule text NOT NULL DEFAULT 'daily',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own automations" ON public.automations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER automations_set_updated_at BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();