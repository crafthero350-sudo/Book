import { useState, useEffect, useRef } from "react";
import { X, Image, Video, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const postTypes = [
  { value: "quote", label: "Quote" },
  { value: "review", label: "Review" },
  { value: "recommendation", label: "Recommendation" },
  { value: "discussion", label: "Discussion" },
] as const;

interface CreatePostSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface BookOption {
  id: string;
  title: string;
  author: string;
}

export function CreatePostSheet({ open, onClose, onCreated }: CreatePostSheetProps) {
  const { user } = useAuth();
  const [type, setType] = useState<string>("quote");
  const [content, setContent] = useState("");
  const [bookId, setBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      supabase.from("books").select("id, title, author").then(({ data }) => {
        if (data) setBooks(data);
      });
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      // Upload media if selected
      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop();
        const path = `${user.id}/posts/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("media").upload(path, mediaFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        type,
        content: content.trim(),
        book_id: bookId,
        image_url: imageUrl,
      });
      if (error) throw error;

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: user.id,
        activity_type: "post",
        metadata: { type },
      });

      toast.success("Post created!");
      setContent("");
      setBookId(null);
      setType("quote");
      removeMedia();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const isVideo = mediaFile?.type.startsWith("video/");

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
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={onClose}><X className="w-5 h-5 text-foreground" strokeWidth={1.5} /></button>
              <h3 className="text-sm font-semibold text-foreground">New Post</h3>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="text-sm font-semibold text-foreground disabled:text-muted-foreground"
              >
                {submitting ? "Posting..." : "Share"}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type picker */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {postTypes.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setType(pt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      type === pt.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>

              {/* Book selector */}
              <select
                value={bookId || ""}
                onChange={(e) => setBookId(e.target.value || null)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none appearance-none text-foreground"
              >
                <option value="">No book (optional)</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author}
                  </option>
                ))}
              </select>

              {/* Content */}
              <textarea
                placeholder={
                  type === "quote"
                    ? "Share a quote..."
                    : type === "review"
                    ? "Write your review..."
                    : type === "recommendation"
                    ? "What book would you recommend?"
                    : "Start a discussion..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground text-foreground"
              />

              {/* Media preview */}
              {mediaPreview && (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {isVideo ? (
                    <video src={mediaPreview} className="w-full max-h-[250px] object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="" className="w-full max-h-[250px] object-cover" />
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" strokeWidth={2} />
                  </button>
                </div>
              )}

              {/* Media upload buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-xl text-sm text-muted-foreground"
                >
                  <Image className="w-5 h-5" strokeWidth={1.5} />
                  Photo
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "video/*";
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-xl text-sm text-muted-foreground"
                >
                  <Video className="w-5 h-5" strokeWidth={1.5} />
                  Video
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
