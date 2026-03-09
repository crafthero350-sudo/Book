
-- Add is_private to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Stories table
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text,
  image_url text,
  background_color text DEFAULT '#1a1a2e',
  text_style text DEFAULT 'normal',
  sticker_data jsonb DEFAULT '[]'::jsonb,
  shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  privacy text DEFAULT 'everyone',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Close friends
CREATE TABLE public.close_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Follow requests for private accounts
CREATE TABLE public.follow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  target_id uuid NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, target_id)
);
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- User settings
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  story_privacy text DEFAULT 'everyone',
  post_privacy text DEFAULT 'everyone',
  message_privacy text DEFAULT 'everyone',
  notifications_enabled boolean DEFAULT true,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Story viewers
CREATE TABLE public.story_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
ALTER TABLE public.story_viewers ENABLE ROW LEVEL SECURITY;

-- Storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- RLS: Stories
CREATE POLICY "Anyone can view stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- RLS: Close friends
CREATE POLICY "Users can view own close friends" ON public.close_friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add close friends" ON public.close_friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove close friends" ON public.close_friends FOR DELETE USING (auth.uid() = user_id);

-- RLS: Follow requests
CREATE POLICY "Users can view own requests" ON public.follow_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "Users can create requests" ON public.follow_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Target can update requests" ON public.follow_requests FOR UPDATE USING (auth.uid() = target_id);
CREATE POLICY "Users can delete own requests" ON public.follow_requests FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- RLS: User settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS: Story viewers
CREATE POLICY "Story owner and viewer can view" ON public.story_viewers FOR SELECT USING (
  auth.uid() = viewer_id OR EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
);
CREATE POLICY "Users can mark as viewed" ON public.story_viewers FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Storage policies for media bucket
CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_requests;

-- Trigger to auto-create settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
