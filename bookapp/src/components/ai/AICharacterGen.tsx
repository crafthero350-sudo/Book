import { useState } from "react";
import { Users, Loader2, Download, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AICharacterGen() {
  const { user } = useAuth();
  const [characterName, setCharacterName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateCharacter = async () => {
    if (!characterName || !bookTitle || !bookAuthor) {
      toast.error("Fill in character name, book title, and author");
      return;
    }

    setLoading(true);
    setImageUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-character", {
        body: { characterName, bookTitle, bookAuthor, description },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        toast.error("No image was generated. Try again with more details.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate character");
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    if (!imageUrl || !user) {
      toast.error("You must be logged in to save characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("saved_characters").insert({
      user_id: user.id,
      character_name: characterName,
      book_title: bookTitle,
      book_author: bookAuthor,
      description,
      image_url: imageUrl,
    });
    if (error) toast.error("Failed to save character");
    else toast.success("Character saved to your profile!");
    setSaving(false);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${characterName.replace(/\s+/g, "-")}-3d.png`;
    link.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold mb-1">3D Character Creator</h2>
        <p className="text-xs text-muted-foreground">
          Bring your favorite book characters to life as stunning 3D renders.
        </p>
      </div>

      <div className="space-y-3">
        <input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="Character name (e.g. Jay Gatsby)" className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground" />
        <input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="Book title (e.g. The Great Gatsby)" className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground" />
        <input value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} placeholder="Author (e.g. F. Scott Fitzgerald)" className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Extra details (optional)" rows={3} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground resize-none" />
      </div>

      <button onClick={generateCharacter} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-3 text-sm font-medium disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
        {loading ? "Creating 3D character..." : "Generate 3D Character"}
      </button>

      {imageUrl && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <img src={imageUrl} alt={`3D ${characterName}`} className="w-full aspect-square object-cover" />
          </div>
          <div className="text-center">
            <p className="font-display font-semibold">{characterName}</p>
            <p className="text-xs text-muted-foreground">from "{bookTitle}" by {bookAuthor}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={saveToProfile} disabled={saving} className="flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-full py-3 text-sm font-medium disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save to Profile"}
            </button>
            <button onClick={downloadImage} className="flex items-center justify-center gap-2 bg-muted rounded-full py-3 text-sm font-medium">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
