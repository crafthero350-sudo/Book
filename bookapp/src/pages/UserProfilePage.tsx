import { useState, useEffect } from "react";
import { ArrowLeft, Grid3X3, Lock, MoreHorizontal } from "lucide-react";
import { NotionEmoji } from "@/components/NotionEmoji";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  reading_streak: number | null;
  reading_personality: string | null;
  is_private: boolean;
}

interface UserPost {
  id: string;
  image_url: string | null;
  book_id: string | null;
  content: string;
  book_cover?: string | null;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ booksRead: 0, posts: 0, comments: 0 });
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { status, loading: followLoading, toggleFollow, followersCount, followingCount, isPrivate } = useFollow(userId || null);

  const isSelf = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      setProfile(data as any);

      const [booksRes, postsRes, commentsRes] = await Promise.all([
        supabase.from("user_books").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "finished"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      setStats({ booksRead: booksRes.count || 0, posts: postsRes.count || 0, comments: commentsRes.count || 0 });

      // Fetch posts for grid
      const { data: postsData } = await supabase.from("posts").select("id, image_url, book_id, content").eq("user_id", userId).order("created_at", { ascending: false });
      if (postsData) {
        const bookIds = postsData.map(p => p.book_id).filter(Boolean) as string[];
        let bookCovers = new Map<string, string>();
        if (bookIds.length > 0) {
          const { data: books } = await supabase.from("books").select("id, cover_url").in("id", bookIds);
          books?.forEach(b => { if (b.cover_url) bookCovers.set(b.id, b.cover_url); });
        }
        setPosts(postsData.map(p => ({ ...p, book_cover: p.book_id ? bookCovers.get(p.book_id) || null : null })));
      }

      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile.display_name || profile.username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const canViewContent = !isPrivate || status === "following" || isSelf;
  const followButtonLabel = status === "following" ? "Following" : status === "requested" ? "Requested" : "Follow";

  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-11">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-6 h-6" strokeWidth={1.5} /></button>
          <h1 className="text-[15px] font-bold flex-1">{profile.username || "user"}</h1>
          <button className="p-1"><MoreHorizontal className="w-6 h-6" strokeWidth={1.5} /></button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Profile Info */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name || "avatar"} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-lg font-bold leading-tight">{stats.posts}</p>
              <p className="text-[11px] text-muted-foreground">posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold leading-tight">{followersCount}</p>
              <p className="text-[11px] text-muted-foreground">followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold leading-tight">{followingCount}</p>
              <p className="text-[11px] text-muted-foreground">following</p>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-3">
          <p className="text-[13px] font-semibold">{profile.display_name || "Reader"}</p>
          {profile.bio && <p className="text-[13px] text-muted-foreground mt-0.5">{profile.bio}</p>}
          {profile.reading_personality && <p className="text-[13px] mt-0.5 flex items-center gap-1.5"><NotionEmoji emoji="📚" size={16} /> {profile.reading_personality}</p>}
        </div>

        {/* Follow / Message buttons */}
        {!isSelf && (
          <div className="flex gap-1.5 mt-3">
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-semibold text-center ${
                status === "following"
                  ? "bg-secondary text-foreground"
                  : status === "requested"
                  ? "bg-secondary text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {followButtonLabel}
            </button>
            <button className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground text-[13px] font-semibold text-center">
              Message
            </button>
          </div>
        )}
      </div>

      {/* Private account gate */}
      {!canViewContent ? (
        <div className="text-center py-16 mt-4 border-t border-border">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3 border-2 border-muted-foreground rounded-full p-2.5" strokeWidth={1.5} />
          <p className="text-sm font-semibold">This Account is Private</p>
          <p className="text-xs text-muted-foreground mt-1">Follow to see their posts and reading activity</p>
        </div>
      ) : (
        <>
          {/* Tab */}
          <div className="flex border-b border-border mt-4">
            <div className="flex-1 py-3 flex justify-center border-b-[1.5px] border-foreground">
              <Grid3X3 className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-3 gap-px">
            {posts.map((p) => (
              <div key={p.id} className="aspect-square bg-secondary">
                {(p.image_url || p.book_cover) ? (
                  <img src={p.image_url || p.book_cover!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-[10px] text-muted-foreground text-center line-clamp-4">{p.content}</p>
                  </div>
                )}
              </div>
            ))}
            {posts.length === 0 && (
              <div className="col-span-3 py-16 text-center">
                <Grid3X3 className="w-10 h-10 mx-auto text-muted-foreground mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No posts yet</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
