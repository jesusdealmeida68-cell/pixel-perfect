-- Rebrand document numbering prefix from BDO- (Bellucci d'Oro) to GF- (Gestão Fácil)
CREATE OR REPLACE FUNCTION public.assign_document_number() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE y INT := EXTRACT(YEAR FROM COALESCE(NEW.issue_date, CURRENT_DATE))::INT; n INT;
BEGIN
  IF NEW.number IS NOT NULL AND NEW.number <> '' THEN RETURN NEW; END IF;
  INSERT INTO public.document_counters (user_id, year, last_number)
  VALUES (NEW.user_id, y, 1)
  ON CONFLICT (user_id, year) DO UPDATE SET last_number = public.document_counters.last_number + 1
  RETURNING last_number INTO n;
  NEW.number := 'GF-' || y::TEXT || '-' || lpad(n::TEXT, 4, '0');
  RETURN NEW;
END; $$;
