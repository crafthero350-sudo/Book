import { useState, useEffect, useRef } from "react";
import { X, Settings, Camera, Type, Image, Smile, ChevronDown, Music, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { NotionEmoji } from "@/components/NotionEmoji";

const bgColors = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#e94560", "#f97316", "#22c55e", "#06b6d4",
  "#ec4899", "#8b5cf6", "#1e1e1e", "#374151",
];

const stickers = ["📚", "❤️", "🔥", "⭐", "💡", "🎯", "✨", "📖", "🧠", "💬", "🌟", "👏"];

interface StoryCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type StoryMode = "gallery" | "text" | "camera";

export function StoryCreator({ open, onClose, onCreated }: StoryCreatorProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<StoryMode>("gallery");
  const [content, setContent] = useState("");
  const [bgColor, setBgColor] = useState(bgColors[0]);
  const [textStyle, setTextStyle] = useState<"normal" | "bold" | "italic">("normal");
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState("everyone");
  const [showStickers, setShowStickers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMode("gallery");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedStickers([]);
      setBgColor(bgColors[0]);
    }
  }, [open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setMode("text");
    }
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !imageFile)) return;
    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/stories/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        content: content.trim() || null,
        image_url: imageUrl,
        background_color: bgColor,
        text_style: textStyle,
        sticker_data: selectedStickers,
        privacy,
      });

      if (error) throw error;

      toast.success("Story published!");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish story");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[60] bg-black flex flex-col"
        >
          {mode === "gallery" ? (
            <GalleryMode
              onClose={onClose}
              onSelectImage={(file) => {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
                setMode("text");
              }}
              onTextMode={() => setMode("text")}
              onCameraMode={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onFileChange={handleImageSelect}
            />
          ) : (
            <EditorMode
              content={content}
              setContent={setContent}
              bgColor={bgColor}
              setBgColor={setBgColor}
              textStyle={textStyle}
              setTextStyle={setTextStyle}
              imagePreview={imagePreview}
              selectedStickers={selectedStickers}
              setSelectedStickers={setSelectedStickers}
              showStickers={showStickers}
              setShowStickers={setShowStickers}
              privacy={privacy}
              setPrivacy={setPrivacy}
              submitting={submitting}
              onSubmit={handleSubmit}
              onBack={() => {
                if (imagePreview) {
                  setImageFile(null);
                  setImagePreview(null);
                }
                setMode("gallery");
              }}
              onClose={onClose}
              onSelectImage={handleImageSelect}
              canSubmit={!!(content.trim() || imageFile)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============ Gallery Mode ============ */
interface GalleryModeProps {
  onClose: () => void;
  onSelectImage: (file: File) => void;
  onTextMode: () => void;
  onCameraMode: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function GalleryMode({ onClose, onSelectImage, onTextMode, onCameraMode, fileInputRef, onFileChange }: GalleryModeProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose}>
          <X className="w-7 h-7 text-white" />
        </button>
        <h2 className="text-white font-semibold text-base">Add to story</h2>
        <button className="p-1">
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Feature cards */}
      <div className="flex gap-3 px-4 mt-1">
        <button
          onClick={onTextMode}
          className="flex-1 bg-neutral-800 rounded-xl py-5 flex flex-col items-center gap-2 border border-neutral-700"
        >
          <div className="relative">
            <span className="text-2xl">🎭</span>
            <span className="absolute -top-1 -right-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Add Yours</span>
          </div>
          <span className="text-white text-xs font-medium mt-1">Add Yours</span>
        </button>
        <button className="flex-1 bg-neutral-800 rounded-xl py-5 flex flex-col items-center gap-2 border border-neutral-700">
          <Music className="w-7 h-7 text-white" />
          <span className="text-white text-xs font-medium">Music</span>
        </button>
      </div>

      {/* Recents header */}
      <div className="flex items-center justify-between px-4 mt-5 mb-3">
        <button className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-base">Recents</span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
        <button className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-lg">
          <Image className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-medium">Select</span>
        </button>
      </div>

      {/* Photo grid - placeholder with camera + upload buttons */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          {/* Camera button */}
          <button
            onClick={onCameraMode}
            className="w-24 h-24 rounded-2xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center gap-2"
          >
            <Camera className="w-10 h-10 text-white/70" />
            <span className="text-white/50 text-[11px] font-medium">Camera</span>
          </button>

          {/* Upload from gallery */}
          <label className="w-24 h-24 rounded-2xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-700 transition-colors">
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSelectImage(file);
              }}
            />
            <Image className="w-10 h-10 text-white/70" />
            <span className="text-white/50 text-[11px] font-medium">Gallery</span>
          </label>
        </div>
      </div>

      {/* Hidden file input for camera mode */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Bottom mode selector */}
      <div className="flex items-center justify-center gap-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          onClick={onTextMode}
          className="text-white/50 text-sm font-medium hover:text-white transition-colors"
        >
          Text
        </button>
        <button className="text-white text-sm font-semibold border-b-2 border-white pb-0.5">
          Gallery
        </button>
      </div>
    </>
  );
}

/* ============ Editor Mode ============ */
interface EditorModeProps {
  content: string;
  setContent: (v: string) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  textStyle: "normal" | "bold" | "italic";
  setTextStyle: (v: "normal" | "bold" | "italic") => void;
  imagePreview: string | null;
  selectedStickers: string[];
  setSelectedStickers: React.Dispatch<React.SetStateAction<string[]>>;
  showStickers: boolean;
  setShowStickers: (v: boolean) => void;
  privacy: string;
  setPrivacy: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onClose: () => void;
  onSelectImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canSubmit: boolean;
}

function EditorMode(props: EditorModeProps) {
  const {
    content, setContent, bgColor, setBgColor, textStyle, setTextStyle,
    imagePreview, selectedStickers, setSelectedStickers, showStickers,
    setShowStickers, privacy, setPrivacy, submitting, onSubmit, onBack,
    onClose, onSelectImage, canSubmit,
  } = props;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <button onClick={onBack}>
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            className="bg-white/10 text-white text-xs rounded-full px-3 py-1.5 outline-none appearance-none"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
            <option value="close_friends">Close Friends</option>
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 flex items-center justify-center mx-4 rounded-2xl relative overflow-hidden"
        style={{ backgroundColor: imagePreview ? "transparent" : bgColor }}
      >
        {imagePreview && (
          <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="relative z-10 w-full px-8">
          <textarea
            placeholder="Type your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full bg-transparent text-white text-center outline-none resize-none placeholder:text-white/40 ${
              textStyle === "bold" ? "text-2xl font-bold" :
              textStyle === "italic" ? "text-xl italic font-light" :
              "text-lg"
            }`}
            rows={4}
            autoFocus={!imagePreview}
          />
          {selectedStickers.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              {selectedStickers.map((s, i) => (
                <NotionEmoji key={i} emoji={s} size={32} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticker picker */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="bg-neutral-900 rounded-t-2xl px-4 py-4"
          >
            <div className="grid grid-cols-6 gap-3">
              {stickers.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStickers((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={`p-2 rounded-lg flex items-center justify-center ${selectedStickers.includes(s) ? "bg-white/20" : ""}`}
                >
                  <NotionEmoji emoji={s} size={28} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom tools */}
      <div className="px-4 py-4 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Color picker — only when no image */}
        {!imagePreview && (
          <div className="flex gap-2 overflow-x-auto">
            {bgColors.map((c) => (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                className={`w-7 h-7 rounded-full flex-shrink-0 ${bgColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTextStyle(textStyle === "normal" ? "bold" : textStyle === "bold" ? "italic" : "normal")}
              className="text-white p-2"
            >
              <Type className="w-5 h-5" />
            </button>
            <label className="text-white p-2 cursor-pointer">
              <Image className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={onSelectImage} className="hidden" />
            </label>
            <button onClick={() => setShowStickers(!showStickers)} className="text-white p-2">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onSubmit}
            disabled={submitting || !canSubmit}
            className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Sharing..." : "Share Story"}
          </button>
        </div>
      </div>
    </>
  );
}
