import { useState, useEffect } from "react";
import { X, Send, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  parent_id: string | null;
  user_id: string;
  profile?: { display_name: string | null; username: string | null; avatar_url: string | null };
  replies?: Comment[];
}

interface CommentPanelProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export function CommentPanel({ postId, open, onClose }: CommentPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data) return;

    // Fetch profiles for all comment authors
    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Build threaded structure
    const topLevel: Comment[] = [];
    const replyMap = new Map<string, Comment[]>();

    data.forEach((c) => {
      const comment: Comment = {
        ...c,
        profile: profileMap.get(c.user_id),
        replies: [],
      };
      if (c.parent_id) {
        if (!replyMap.has(c.parent_id)) replyMap.set(c.parent_id, []);
        replyMap.get(c.parent_id)!.push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    topLevel.forEach((c) => {
      c.replies = replyMap.get(c.id) || [];
    });

    setComments(topLevel);
  };

  useEffect(() => {
    if (open) fetchComments();
  }, [open, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo,
      });
      if (error) throw error;

      await supabase.from("activity_log").insert({
        user_id: user.id,
        activity_type: "comment",
        metadata: { post_id: postId },
      });

      setNewComment("");
      setReplyTo(null);
      fetchComments();
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? "ml-8" : ""} mb-3`}>
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium flex-shrink-0">
          {comment.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium">
              {comment.profile?.display_name || comment.profile?.username || "User"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-0.5">{comment.content}</p>
          <div className="flex items-center gap-4 mt-1">
            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-[10px] text-muted-foreground font-medium"
              >
                Reply
              </button>
            )}
          </div>

          {/* Replies toggle */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mt-1"
            >
              {expandedReplies.has(comment.id) ? (
                <><ChevronUp className="w-3 h-3" /> Hide replies</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}</>
              )}
            </button>
          )}

          {/* Replies */}
          {expandedReplies.has(comment.id) && comment.replies?.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[75vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Comments</h3>
              <button onClick={onClose}><X className="w-5 h-5" /></button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => <CommentItem key={c.id} comment={c} />)
              )}
            </div>

            {/* Reply indicator */}
            {replyTo && (
              <div className="px-4 py-1 bg-muted flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Replying to comment</span>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Input */}
            {user && (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || loading}
                  className="p-2 disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
