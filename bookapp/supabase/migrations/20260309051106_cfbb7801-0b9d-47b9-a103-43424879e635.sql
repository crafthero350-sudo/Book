ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS links text,
  ADD COLUMN IF NOT EXISTS gender text;