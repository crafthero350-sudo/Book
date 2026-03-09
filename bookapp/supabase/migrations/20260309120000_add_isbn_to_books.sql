-- Add ISBN column to books for better external book mapping
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS isbn TEXT;
