import { useState, useEffect, useRef, useCallback } from "react";
import { StoryCreator } from "@/components/StoryCreator";
import { Heart, MessageCircle, Bookmark, Send, Plus, ArrowLeft, MoreHorizontal, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { CommentPanel } from "@/components/CommentPanel";
import { CreateReelSheet } from "@/components/CreateReelSheet";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ReelData {
  id: string;
  content: string;
  type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  image_url: string | null;
  book_id: string | null;
  profile?: { display_name: string | null; username: string | null; avatar_url: string | null };
  book?: { title: string; author: string; cover_url: string | null } | null;
  user_liked?: boolean;
  user_saved?: boolean;
}

export default function ReelsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<ReelData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchReels = useCallback(async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!postsData?.length) { setReels([]); setLoading(false); return; }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const bookIds = postsData.map((p) => p.book_id).filter(Boolean) as string[];

    const [profilesRes, booksRes, likesRes, bookmarksRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", userIds),
      bookIds.length > 0
        ? supabase.from("books").select("id, title, author, cover_url").in("id", bookIds)
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postsData.map((p) => p.id))
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postsData.map((p) => p.id))
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map<string, any>(profilesRes.data?.map((p) => [p.user_id, p] as [string, any]) || []);
    const booksMap = new Map<string, any>(booksRes.data?.map((b) => [b.id, b] as [string, any]) || []);
    const likedIds = new Set(likesRes.data?.map((l: any) => l.post_id) || []);
    const savedIds = new Set(bookmarksRes.data?.map((b: any) => b.post_id) || []);

    setReels(postsData.map((p) => ({
      ...p,
      profile: profileMap.get(p.user_id),
      book: p.book_id ? booksMap.get(p.book_id) || null : null,
      user_liked: likedIds.has(p.id),
      user_saved: savedIds.has(p.id),
    } as ReelData)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    setCurrentIndex(Math.round(scrollTop / height));
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {/* Top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
          <button onClick={() => navigate("/")} className="pointer-events-auto p-1">
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
          <h1 className="text-base font-semibold text-white">Reels</h1>
          <button onClick={() => setShowStory(true)} className="pointer-events-auto p-1">
            <Camera className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        {reels.length === 0 ? (
          <div className="h-screen snap-start flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/50 text-sm mb-3">No reels yet</p>
              <button onClick={() => setShowStory(true)} className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-medium">
                Create
              </button>
            </div>
          </div>
        ) : (
          reels.map((reel, i) => (
            <ReelCard key={reel.id} reel={reel} isActive={i === currentIndex} onComment={() => setShowComments(true)} onRefresh={fetchReels} />
          ))
        )}
      </div>

      {reels[currentIndex] && (
        <CommentPanel postId={reels[currentIndex].id} open={showComments} onClose={() => { setShowComments(false); fetchReels(); }} />
      )}

      <CreateReelSheet open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchReels} />
      <StoryCreator open={showStory} onClose={() => setShowStory(false)} onCreated={fetchReels} />
    </>
  );
}

function ReelCard({ reel, isActive, onComment, onRefresh }: { reel: ReelData; isActive: boolean; onComment: () => void; onRefresh: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(reel.user_liked || false);
  const [saved, setSaved] = useState(reel.user_saved || false);
  const [likeCount, setLikeCount] = useState(reel.likes_count || 0);
  const { status, toggleFollow } = useFollow(user?.id !== reel.user_id ? reel.user_id : null);

  const toggleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => newLiked ? c + 1 : c - 1);
    if (newLiked) {
      await supabase.from("likes").insert({ user_id: user.id, post_id: reel.id });
    } else {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", reel.id);
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    const newSaved = !saved;
    setSaved(newSaved);
    if (newSaved) {
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: reel.id });
      toast.success("Saved");
    } else {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", reel.id);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: "Reel", text: reel.content.slice(0, 100), url: window.location.origin });
    } catch {
      await navigator.clipboard?.writeText(reel.content);
      toast.success("Copied to clipboard");
    }
  };

  const initials = (reel.profile?.display_name || reel.profile?.username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const formatCount = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString();

  return (
    <div className="h-screen snap-start relative flex flex-col justify-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-800 to-black">
        {reel.image_url && <img src={reel.image_url} alt="" className="w-full h-full object-cover opacity-50" />}
        {reel.book?.cover_url && !reel.image_url && (
          <img src={reel.book.cover_url} alt="" className="w-full h-full object-cover opacity-30 blur-sm scale-110" />
        )}
      </div>


      {/* Right side actions — Instagram style */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <div className="relative">
          <button
            onClick={() => navigate(`/user/${reel.user_id}`)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[11px] font-semibold text-white border border-white/30 overflow-hidden"
          >
            {reel.profile?.avatar_url ? (
              <img src={reel.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {user && user.id !== reel.user_id && status !== "following" && (
            <button
              onClick={toggleFollow}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <Heart className={`w-7 h-7 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} strokeWidth={1.5} />
          <span className="text-[11px] text-white font-medium">{formatCount(likeCount)}</span>
        </button>
        <button onClick={onComment} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" strokeWidth={1.5} />
          <span className="text-[11px] text-white font-medium">{formatCount(reel.comments_count || 0)}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Send className="w-7 h-7 text-white -rotate-45" strokeWidth={1.5} />
        </button>
        <button onClick={toggleSave}>
          <Bookmark className={`w-7 h-7 ${saved ? "fill-white text-white" : "text-white"}`} strokeWidth={1.5} />
        </button>
        <button>
          <MoreHorizontal className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom info */}
      <div className="relative z-10 px-4 pb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <button onClick={() => navigate(`/user/${reel.user_id}`)} className="text-sm font-semibold text-white">
            {reel.profile?.username || reel.profile?.display_name || "user"}
          </button>
          {user && user.id !== reel.user_id && (
            <button
              onClick={toggleFollow}
              className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                status === "following"
                  ? "bg-white/10 text-white/80 border border-white/20"
                  : "bg-white/20 text-white border border-white/30"
              }`}
            >
              {status === "following" ? "Following" : status === "requested" ? "Requested" : "Follow"}
            </button>
          )}
        </div>

        <p className="text-sm text-white/80 line-clamp-2 mb-1">{reel.content.slice(0, 100)}</p>

        {reel.book && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/50 flex items-center gap-1"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f4d6/512.png" alt="📖" className="w-3.5 h-3.5 inline" /> {reel.book.title} · {reel.book.author}</span>
          </div>
        )}
      </div>
    </div>
  );
}
