import { useState, useEffect, useCallback } from "react";
import { Heart, Send, PlusSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StoriesRow } from "@/components/StoriesRow";
import { PostCard, type PostData } from "@/components/PostCard";
import { CreatePostSheet } from "@/components/CreatePostSheet";
import { StoryCreator } from "@/components/StoryCreator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const unreadCount = useUnreadMessages();

  const fetchPosts = useCallback(async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", userIds);

    const bookIds = postsData.map((p) => p.book_id).filter(Boolean) as string[];
    let booksMap = new Map();
    if (bookIds.length > 0) {
      const { data: booksData } = await supabase
        .from("books")
        .select("id, title, author, cover_url")
        .in("id", bookIds);
      booksData?.forEach((b) => booksMap.set(b.id, b));
    }

    let likedPostIds = new Set<string>();
    let savedPostIds = new Set<string>();
    if (user) {
      const postIds = postsData.map((p) => p.id);
      const [likesRes, bookmarksRes] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      ]);
      likesRes.data?.forEach((l) => likedPostIds.add(l.post_id!));
      bookmarksRes.data?.forEach((b) => savedPostIds.add(b.post_id));
    }

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const enriched: PostData[] = postsData.map((p) => ({
      ...p,
      likes_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
      updated_at: p.updated_at,
      profile: profileMap.get(p.user_id),
      book: p.book_id ? booksMap.get(p.book_id) || null : null,
      user_liked: likedPostIds.has(p.id),
      user_saved: savedPostIds.has(p.id),
    }));

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Instagram-style Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-11">
          <h1 className="text-[22px] font-bold italic tracking-tight text-foreground" style={{ fontFamily: "'Merriweather', serif" }}>
            BookApp
          </h1>
          <div className="flex items-center gap-1 md:hidden">
            <button onClick={() => setShowStoryCreator(true)} className="p-2">
              <PlusSquare className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            </button>
            <button className="p-2" onClick={() => navigate("/notifications")}>
              <Heart className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            </button>
            <button className="p-2 relative" onClick={() => navigate("/messages")}>
              <Send className="w-6 h-6 text-foreground -rotate-[20deg]" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <button className="p-2 relative" onClick={() => navigate("/messages")}>
              <Send className="w-6 h-6 text-foreground -rotate-[20deg]" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <StoriesRow />
      <div className="border-b border-border" />

      {/* Feed */}
      <div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-muted-foreground text-sm">No posts yet. Share your first book thought!</p>
            <button
              onClick={() => setShowStoryCreator(true)}
              className="mt-4 px-6 py-2 bg-foreground text-background rounded-lg text-sm font-medium"
            >
              Create
            </button>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} onRefresh={fetchPosts} />
          ))
        )}
      </div>

      <CreatePostSheet open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchPosts} />
      <StoryCreator open={showStoryCreator} onClose={() => setShowStoryCreator(false)} onCreated={fetchPosts} />
    </div>
  );
}
