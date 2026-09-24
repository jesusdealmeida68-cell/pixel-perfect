-- CUSTOM TABLES ("Excel automático")
CREATE TABLE public.custom_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  title TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_tables TO authenticated;
GRANT ALL ON public.custom_tables TO service_role;
ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own custom tables" ON public.custom_tables FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER custom_tables_updated BEFORE UPDATE ON public.custom_tables FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX custom_tables_user_idx ON public.custom_tables (user_id, created_at DESC);
