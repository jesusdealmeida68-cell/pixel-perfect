
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- COMPANY
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users,
  name TEXT NOT NULL DEFAULT 'Bellucci d''Oro',
  owner_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  socials TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  default_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own company settings" ON public.company_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER company_settings_updated BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CLIENTS
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  first_contact_date DATE,
  status TEXT NOT NULL DEFAULT 'negociacao',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX clients_user_idx ON public.clients (user_id, created_at DESC);

-- JOBS
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  title TEXT NOT NULL,
  service TEXT,
  description TEXT,
  start_date DATE,
  due_date DATE,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'negociacao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own jobs" ON public.jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX jobs_user_idx ON public.jobs (user_id, created_at DESC);

-- DOCUMENTS
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  number TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'orcamento',
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs ON DELETE SET NULL,
  title TEXT,
  service TEXT,
  description TEXT,
  diagnosis TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  fees NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_costs NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  deadline TEXT,
  conditions TEXT,
  notes TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE UNIQUE INDEX documents_number_idx ON public.documents (user_id, number);

-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  client_id UUID REFERENCES public.clients ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'nota',
  message TEXT NOT NULL,
  amount NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activities" ON public.activities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX activities_user_idx ON public.activities (user_id, created_at DESC);

-- AUTO NUMBERING
CREATE TABLE public.document_counters (
  user_id UUID NOT NULL REFERENCES auth.users,
  year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year)
);
GRANT SELECT ON public.document_counters TO authenticated;
GRANT ALL ON public.document_counters TO service_role;
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own counters" ON public.document_counters FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.assign_document_number() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE y INT := EXTRACT(YEAR FROM COALESCE(NEW.issue_date, CURRENT_DATE))::INT; n INT;
BEGIN
  IF NEW.number IS NOT NULL AND NEW.number <> '' THEN RETURN NEW; END IF;
  INSERT INTO public.document_counters (user_id, year, last_number)
  VALUES (NEW.user_id, y, 1)
  ON CONFLICT (user_id, year) DO UPDATE SET last_number = public.document_counters.last_number + 1
  RETURNING last_number INTO n;
  NEW.number := 'BDO-' || y::TEXT || '-' || lpad(n::TEXT, 4, '0');
  RETURN NEW;
END; $$;

ALTER TABLE public.documents ALTER COLUMN number DROP NOT NULL;
CREATE TRIGGER documents_number BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.assign_document_number();
