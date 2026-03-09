import { useState, useEffect } from "react";
import { Settings, Grid3X3, Bookmark, Film, Trash2, Sparkles } from "lucide-react";
import { NotionEmoji } from "@/components/NotionEmoji";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EditProfileDialog } from "@/components/EditProfileDialog";

interface SavedCharacter {
  id: string;
  character_name: string;
  book_title: string;
  book_author: string;
  image_url: string;
}

interface UserPost {
  id: string;
  image_url: string | null;
  book_id: string | null;
  content: string;
  book_cover?: string | null;
}

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ booksRead: 0, posts: 0, discussions: 0 });
  const { followersCount, followingCount } = useFollow(user?.id || null);
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "characters">("posts");
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("user_books").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "finished"),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([booksRes, postsRes, commentsRes]) => {
      setStats({ booksRead: booksRes.count || 0, posts: postsRes.count || 0, discussions: commentsRes.count || 0 });
    });

    // Fetch user posts for grid
    supabase.from("posts").select("id, image_url, book_id, content").eq("user_id", user.id).order("created_at", { ascending: false }).then(async ({ data }) => {
      if (!data) return;
      const bookIds = data.map(p => p.book_id).filter(Boolean) as string[];
      let bookCovers = new Map<string, string>();
      if (bookIds.length > 0) {
        const { data: books } = await supabase.from("books").select("id, cover_url").in("id", bookIds);
        books?.forEach(b => { if (b.cover_url) bookCovers.set(b.id, b.cover_url); });
      }
      setPosts(data.map(p => ({ ...p, book_cover: p.book_id ? bookCovers.get(p.book_id) || null : null })));
    });

    supabase.from("saved_characters").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setCharacters(data as SavedCharacter[]);
    });
  }, [user]);

  const deleteCharacter = async (id: string) => {
    const { error } = await supabase.from("saved_characters").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const initials = (profile?.display_name || profile?.username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-11">
          <h1 className="text-[15px] font-bold">{profile?.username || "Profile"}</h1>
          <button onClick={() => navigate("/settings")} className="p-1">
            <Settings className="w-6 h-6 text-foreground" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Profile Info — Instagram layout */}
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-foreground flex-shrink-0 overflow-hidden ring-2 ring-border">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Stats row */}
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
          <p className="text-[13px] font-semibold">{profile?.display_name || "Reader"}</p>
          {profile?.bio && <p className="text-[13px] text-muted-foreground mt-0.5">{profile.bio}</p>}
          {profile?.reading_personality && (
            <p className="text-[13px] mt-0.5 flex items-center gap-1.5"><NotionEmoji emoji="📚" size={16} /> {profile.reading_personality}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 mt-3">
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground text-[13px] font-semibold text-center"
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate("/quiz")}
            className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground text-[13px] font-semibold text-center flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {profile?.reading_personality ? "Retake Quiz" : "Take Quiz"}
          </button>
        </div>
      </div>

      {/* Tabs — Grid | Saved | Characters */}
      <div className="flex border-b border-border mt-4">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 flex justify-center border-b-[1.5px] transition-colors ${
            activeTab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          <Grid3X3 className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3 flex justify-center border-b-[1.5px] transition-colors ${
            activeTab === "saved" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          <Bookmark className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setActiveTab("characters")}
          className={`flex-1 py-3 flex justify-center border-b-[1.5px] transition-colors ${
            activeTab === "characters" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          <Film className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-3 gap-px">
          {posts.map((p) => (
            <button key={p.id} className="aspect-square bg-secondary" onClick={() => navigate(`/?post=${p.id}`)}>
              {(p.image_url || p.book_cover) ? (
                <img src={p.image_url || p.book_cover!} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-[10px] text-muted-foreground text-center line-clamp-4">{p.content}</p>
                </div>
              )}
            </button>
          ))}
          {posts.length === 0 && (
            <div className="col-span-3 py-16 text-center">
              <Grid3X3 className="w-10 h-10 mx-auto text-muted-foreground mb-2" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="grid grid-cols-3 gap-px">
          <div className="col-span-3 py-16 text-center">
            <Bookmark className="w-10 h-10 mx-auto text-muted-foreground mb-2" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Saved posts will appear here</p>
          </div>
        </div>
      )}

      {activeTab === "characters" && (
        <div className="grid grid-cols-3 gap-px">
          {characters.map((char) => (
            <div key={char.id} className="aspect-square bg-secondary relative group">
              <img src={char.image_url} alt={char.character_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center text-background">
                  <p className="text-xs font-semibold">{char.character_name}</p>
                  <p className="text-[10px]">{char.book_title}</p>
                </div>
              </div>
              <button
                onClick={() => deleteCharacter(char.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
          {characters.length === 0 && (
            <div className="col-span-3 py-16 text-center">
              <Film className="w-10 h-10 mx-auto text-muted-foreground mb-2" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">No saved characters yet</p>
            </div>
          )}
        </div>
      )}
      <EditProfileDialog open={showEditProfile} onClose={() => setShowEditProfile(false)} />
    </div>
  );
}
