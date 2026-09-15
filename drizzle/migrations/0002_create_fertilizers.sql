CREATE TABLE public.fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'chemical',
  nutrients text,
  crops text[] NOT NULL DEFAULT '{}',
  problems text[] NOT NULL DEFAULT '{}',
  dosage text,
  timing text,
  price_range text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fertilizers_active_idx ON public.fertilizers (is_active);

GRANT SELECT ON public.fertilizers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.fertilizers TO authenticated;
GRANT ALL ON public.fertilizers TO service_role;

ALTER TABLE public.fertilizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active fertilizers"
  ON public.fertilizers FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert fertilizers"
  ON public.fertilizers FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update fertilizers"
  ON public.fertilizers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));