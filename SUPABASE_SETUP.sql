-- =============================================
-- Padel Liga Kac - Supabase Database Setup
-- Pokreni ovaj SQL u Supabase SQL Editoru
-- =============================================

-- Tabela timova
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela kola
CREATE TABLE public.rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela meceva
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  home_sets INTEGER CHECK (home_sets >= 0 AND home_sets <= 2),
  away_sets INTEGER CHECK (away_sets >= 0 AND away_sets <= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Svi korisnici mogu citati podatke
CREATE POLICY "public read teams"   ON public.teams   FOR SELECT USING (true);
CREATE POLICY "public read rounds"  ON public.rounds  FOR SELECT USING (true);
CREATE POLICY "public read matches" ON public.matches FOR SELECT USING (true);

-- Samo ulogovani admin moze pisati
CREATE POLICY "auth write teams"   ON public.teams   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write rounds"  ON public.rounds  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write matches" ON public.matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- Nakon sto pokrenes SQL, idi na:
-- Authentication -> Users -> Add user
-- i kreiraj admin korisnika sa email/lozinkom
-- =============================================
