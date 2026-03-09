import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const reelTypes = [
  { value: "quote", label: "Quote" },
  { value: "review", label: "Review" },
  { value: "recommendation", label: "Recommendation" },
  { value: "discussion", label: "Discussion" },
] as const;

interface CreateReelSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface BookOption {
  id: string;
  title: string;
  author: string;
}

export function CreateReelSheet({ open, onClose, onCreated }: CreateReelSheetProps) {
  const { user } = useAuth();
  const [type, setType] = useState<string>("quote");
  const [content, setContent] = useState("");
  const [bookId, setBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("books").select("id, title, author").then(({ data }) => {
        if (data) setBooks(data);
      });
    }
  }, [open]);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/reels/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("media").upload(path, imageFile);
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

      await supabase.from("activity_log").insert({
        user_id: user.id,
        activity_type: "reel",
        metadata: { type },
      });

      toast.success("Reel published!");
      setContent("");
      setBookId(null);
      setType("quote");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish reel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={onClose}><X className="w-5 h-5" /></button>
              <h3 className="text-sm font-semibold">New Reel</h3>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="text-sm font-semibold text-foreground disabled:text-muted-foreground"
              >
                Publish
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2 overflow-x-auto">
                {reelTypes.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setType(pt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      type === pt.value
                        ? "bg-foreground text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>

              <select
                value={bookId || ""}
                onChange={(e) => setBookId(e.target.value || null)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none appearance-none"
              >
                <option value="">Link a book (optional)</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author}
                  </option>
                ))}
              </select>

              {/* Image upload */}
              <div>
                <label className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl cursor-pointer text-sm text-muted-foreground">
                  📷 {imageFile ? imageFile.name : "Add image (optional)"}
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>

              <textarea
                placeholder={
                  type === "quote"
                    ? "Share an inspiring quote..."
                    : type === "review"
                    ? "Write your review..."
                    : type === "recommendation"
                    ? "Recommend a book..."
                    : "Start a discussion..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
              />

              {/* Preview */}
              {content.trim() && (
                <div className="rounded-xl overflow-hidden bg-stone-900 p-6 min-h-[200px] flex items-center justify-center">
                  <p className={`text-primary-foreground text-center leading-relaxed ${
                    type === "quote" ? "text-lg italic font-light" : "text-sm"
                  }`}>
                    {content.length > 150 ? content.slice(0, 150) + "..." : content}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
