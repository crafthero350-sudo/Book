import { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  actor_id: string;
  actor_name: string;
  actor_avatar: string | null;
  content?: string;
  post_id?: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const results: Notification[] = [];

      // Fetch likes on my posts
      const { data: myPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user.id);
      const myPostIds = myPosts?.map((p) => p.id) || [];

      if (myPostIds.length > 0) {
        const { data: likes } = await supabase
          .from("likes")
          .select("id, user_id, post_id, created_at")
          .in("post_id", myPostIds)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        if (likes) {
          likes.forEach((l) => {
            results.push({
              id: `like-${l.id}`,
              type: "like",
              actor_id: l.user_id,
              actor_name: "",
              actor_avatar: null,
              post_id: l.post_id,
              created_at: l.created_at,
            });
          });
        }

        // Fetch comments on my posts
        const { data: comments } = await supabase
          .from("comments")
          .select("id, user_id, post_id, content, created_at")
          .in("post_id", myPostIds)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        if (comments) {
          comments.forEach((c) => {
            results.push({
              id: `comment-${c.id}`,
              type: "comment",
              actor_id: c.user_id,
              actor_name: "",
              actor_avatar: null,
              content: c.content,
              post_id: c.post_id,
              created_at: c.created_at,
            });
          });
        }
      }

      // Fetch new followers
      const { data: follows } = await supabase
        .from("follows")
        .select("id, follower_id, created_at")
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (follows) {
        follows.forEach((f) => {
          results.push({
            id: `follow-${f.id}`,
            type: "follow",
            actor_id: f.follower_id,
            actor_name: "",
            actor_avatar: null,
            created_at: f.created_at,
          });
        });
      }

      // Sort by date
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Fetch all actor profiles
      const actorIds = [...new Set(results.map((n) => n.actor_id))];
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url")
          .in("user_id", actorIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        results.forEach((n) => {
          const p = profileMap.get(n.actor_id);
          if (p) {
            n.actor_name = p.display_name || p.username || "User";
            n.actor_avatar = p.avatar_url;
          }
        });
      }

      setNotifications(results.slice(0, 50));
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500" fill="currentColor" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getMessage = (n: Notification) => {
    switch (n.type) {
      case "like":
        return "liked your post";
      case "comment":
        return `commented: "${n.content?.slice(0, 50)}${(n.content?.length || 0) > 50 ? "…" : ""}"`;
      case "follow":
        return "started following you";
      default:
        return "";
    }
  };

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-14">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 h-11">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-bold">Notifications</h1>
        </div>
      </header>

      <div className="px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" strokeWidth={1} />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              When someone interacts with your posts, you'll see it here
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => {
                if (n.type === "follow") {
                  navigate(`/user/${n.actor_id}`);
                } else if (n.post_id) {
                  navigate("/");
                }
              }}
              className="flex items-start gap-3 w-full py-3 border-b border-border text-left"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {n.actor_avatar ? (
                    <img src={n.actor_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(n.actor_name || "?")
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                  {getIcon(n.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] leading-snug">
                  <span className="font-semibold">{n.actor_name}</span>{" "}
                  <span className="text-muted-foreground">{getMessage(n)}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
