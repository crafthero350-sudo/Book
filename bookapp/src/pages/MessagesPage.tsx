import { useState, useEffect } from "react";
import { ArrowLeft, Search, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadConversations() {
      if (!user) return;

      // Get all messages involving this user
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!msgs || msgs.length === 0) {
        // Fall back to showing followed users
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .limit(30);

        if (follows && follows.length > 0) {
          const ids = follows.map((f) => f.following_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, avatar_url")
            .in("user_id", ids);

          setConversations(
            (profiles || []).map((p) => ({
              userId: p.user_id,
              displayName: p.display_name || p.username || "User",
              username: p.username || "",
              avatarUrl: p.avatar_url,
              lastMessage: "Tap to start chatting 📚",
              time: "",
              unreadCount: 0,
            }))
          );
        }
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const convoMap = new Map<
        string,
        { lastMsg: typeof msgs[0]; unread: number }
      >();

      for (const msg of msgs) {
        const partnerId =
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convoMap.has(partnerId)) {
          convoMap.set(partnerId, { lastMsg: msg, unread: 0 });
        }
        if (msg.receiver_id === user.id && !msg.read) {
          const entry = convoMap.get(partnerId)!;
          entry.unread++;
        }
      }

      const partnerIds = [...convoMap.keys()];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", partnerIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const convos: Conversation[] = partnerIds.map((pid) => {
        const entry = convoMap.get(pid)!;
        const profile = profileMap.get(pid);
        return {
          userId: pid,
          displayName: profile?.display_name || profile?.username || "User",
          username: profile?.username || "",
          avatarUrl: profile?.avatar_url || null,
          lastMessage: entry.lastMsg.content,
          time: formatDistanceToNow(new Date(entry.lastMsg.created_at), {
            addSuffix: true,
          }),
          unreadCount: entry.unread,
        };
      });

      setConversations(convos);
      setLoading(false);
    }
    loadConversations();
  }, [user]);

  const filtered = conversations.filter(
    (c) =>
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-14">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-11">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1">
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="text-lg font-bold text-foreground">Messages</h1>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="px-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Send className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                {search ? "No conversations found" : "Follow people to start messaging"}
              </p>
            </div>
          ) : (
            filtered.map((convo, i) => (
              <motion.button
                key={convo.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/chat/${convo.userId}`)}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-accent transition-colors"
              >
                {convo.avatarUrl ? (
                  <img
                    src={convo.avatarUrl}
                    alt={convo.displayName}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-foreground">
                      {convo.displayName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {convo.displayName}
                    </p>
                    {convo.time && (
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                        {convo.time}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs truncate ${
                        convo.unreadCount > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {convo.lastMessage}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
