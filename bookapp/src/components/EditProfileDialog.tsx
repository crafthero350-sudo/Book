import { useState, useRef, useEffect } from "react";
import { X, Camera, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ open, onClose }: EditProfileDialogProps) {
  const { profile, user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [links, setLinks] = useState("");
  const [gender, setGender] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAvatarPreview(profile.avatar_url || "");
      setAvatarFile(null);
      // Load extra fields from DB
      loadExtraFields();
    }
  }, [open, profile]);

  const loadExtraFields = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("pronouns, links, gender" as any)
      .eq("user_id", user.id)
      .single();
    if (data) {
      setPronouns((data as any).pronouns || "");
      setLinks((data as any).links || "");
      setGender((data as any).gender || "");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    let avatarUrl = profile?.avatar_url || "";

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        pronouns: pronouns.trim() || null,
        links: links.trim() || null,
        gender: gender || null,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      refreshProfile?.();
      onClose();
    }
    setSaving(false);
  };

  const initials = (displayName || username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
              <button onClick={onClose} className="p-1">
                <X className="w-5 h-5 text-foreground" />
              </button>
              <h2 className="text-sm font-semibold text-foreground">Edit profile</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-semibold text-primary disabled:opacity-50"
              >
                {saving ? "..." : "Done"}
              </button>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center py-5">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative group"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-muted-foreground">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-primary mt-2"
              >
                Edit picture or avatar
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Fields */}
            <div className="border-t border-border">
              {/* Name */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Name"
                  maxLength={50}
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                />
              </div>

              {/* Username */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  placeholder="Username"
                  maxLength={30}
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                />
              </div>

              {/* Pronouns */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Pronouns</span>
                <input
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="Pronouns"
                  maxLength={30}
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                />
              </div>

              {/* Bio */}
              <div className="flex items-start px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0 pt-0.5">Bio</span>
                <div className="flex-1">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    rows={2}
                    maxLength={150}
                    className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{bio.length}/150</p>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Links</span>
                <input
                  type="text"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="Add links"
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                />
              </div>

              {/* Banners */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Banners</span>
                <div className="flex-1 flex items-center justify-end">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Music */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Music</span>
                <span className="flex-1 text-sm text-muted-foreground">Add music to your profile</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Gender */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="w-24 text-sm font-medium text-foreground shrink-0">Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex-1 text-sm text-foreground bg-transparent outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-background">Gender</option>
                  <option value="male" className="bg-background">Male</option>
                  <option value="female" className="bg-background">Female</option>
                  <option value="other" className="bg-background">Other</option>
                  <option value="prefer_not" className="bg-background">Prefer not to say</option>
                </select>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Action Links */}
            <div className="border-t border-border mt-2">
              <button className="w-full text-left px-4 py-3 border-b border-border">
                <span className="text-sm font-medium text-primary">Switch to professional account</span>
              </button>
              <button className="w-full text-left px-4 py-3 border-b border-border">
                <span className="text-sm font-medium text-primary">Personal information settings</span>
              </button>
            </div>

            <div className="h-8" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
