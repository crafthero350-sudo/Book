import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Image } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function ChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load other user's profile
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setOtherUser(data);
      });
  }, [userId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!user || !userId) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(200);

    if (data) setMessages(data);

    // Mark unread as read
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", userId)
      .eq("receiver_id", user.id)
      .eq("read", false);
  }, [user, userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !userId) return;

    const channel = supabase
      .channel(`dm-${user.id}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const msg = payload.new as Message;
          // Only add if it belongs to this conversation
          if (
            (msg.sender_id === user.id && msg.receiver_id === userId) ||
            (msg.sender_id === userId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });

            // Mark as read if we're the receiver
            if (msg.receiver_id === user.id) {
              supabase
                .from("direct_messages")
                .update({ read: true })
                .eq("id", msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user || !userId || sending) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg("");

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: userId,
      content,
    });

    if (error) {
      setNewMsg(content);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const displayName = otherUser?.display_name || otherUser?.username || "User";

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center gap-3 px-3 h-14">
            <button onClick={() => navigate("/messages")} className="p-1">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={() => navigate(`/user/${userId}`)}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              {otherUser?.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold text-foreground">
                    {displayName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {otherUser?.username ? `@${otherUser.username}` : ""}
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">
                Start your conversation with {displayName} 📚
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.id;
              const showTime =
                i === 0 ||
                new Date(msg.created_at).getTime() -
                  new Date(messages[i - 1].created_at).getTime() >
                  300000;

              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-center text-[10px] text-muted-foreground my-3">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "bg-foreground text-background rounded-2xl rounded-br-md"
                          : "bg-secondary text-foreground rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t border-border px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2.5">
              <input
                ref={inputRef}
                type="text"
                placeholder="Message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className={`p-2.5 rounded-full transition-colors ${
                newMsg.trim()
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
