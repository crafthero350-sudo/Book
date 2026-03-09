import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";
import avatar6 from "@/assets/avatars/avatar-6.png";
import avatar7 from "@/assets/avatars/avatar-7.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import avatar9 from "@/assets/avatars/avatar-9.png";
import avatar10 from "@/assets/avatars/avatar-10.png";

const avatars = [
  { id: "1", src: avatar1, label: "Messy Hair" },
  { id: "2", src: avatar2, label: "Wavy Hair" },
  { id: "3", src: avatar3, label: "Glasses Guy" },
  { id: "4", src: avatar4, label: "Bob Cut" },
  { id: "5", src: avatar5, label: "Side Part" },
  { id: "6", src: avatar6, label: "Ponytail" },
  { id: "7", src: avatar7, label: "Beard" },
  { id: "8", src: avatar8, label: "Bangs" },
  { id: "9", src: avatar9, label: "Buzz Cut" },
  { id: "10", src: avatar10, label: "Curly" },
];

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<"avatar" | "username">("avatar");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const selectedAvatarSrc = avatars.find((a) => a.id === selectedAvatar)?.src;

  const validateUsername = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9._]/g, "");
    setUsername(clean);
    if (clean.length < 3) {
      setUsernameError("At least 3 characters");
    } else if (clean.length > 20) {
      setUsernameError("Max 20 characters");
    } else {
      setUsernameError("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedAvatar || !username || username.length < 3) return;
    setSubmitting(true);

    try {
      // Check username uniqueness
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setUsernameError("Username already taken");
        setSubmitting(false);
        return;
      }

      // Upload avatar to storage
      const avatarSrc = avatars.find((a) => a.id === selectedAvatar)!.src;
      const res = await fetch(avatarSrc);
      const blob = await res.blob();
      const path = `${user.id}/avatar.png`;

      await supabase.storage.from("media").upload(path, blob, { upsert: true });
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          display_name: displayName || username,
          avatar_url: urlData.publicUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      
      // Fire confetti! 🎉
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6eb4'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);

      toast.success("Profile set up! 🎉");
      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, delay: 0.1 }}
          className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-4"
        >
          <BookOpen className="w-7 h-7 text-background" strokeWidth={1.5} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-foreground"
        >
          Welcome to BookApp
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm mt-1"
        >
          {step === "avatar" ? "Choose your avatar" : "Set up your profile"}
        </motion.p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-8 h-1 rounded-full transition-colors ${step === "avatar" ? "bg-foreground" : "bg-border"}`} />
        <div className={`w-8 h-1 rounded-full transition-colors ${step === "username" ? "bg-foreground" : "bg-border"}`} />
      </div>

      <AnimatePresence mode="wait">
        {step === "avatar" ? (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, x: -40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 px-6"
          >
            {/* Selected avatar preview */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                {selectedAvatarSrc ? (
                  <img src={selectedAvatarSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-sm">Pick one</span>
                )}
              </div>
            </div>

            {/* Avatar grid */}
            <div className="grid grid-cols-5 gap-3 mb-8">
              {avatars.map((avatar, i) => (
                <motion.button
                  key={avatar.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className="relative"
                >
                  <div
                    className={`w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatar.id
                        ? "border-foreground scale-105"
                        : "border-border"
                    }`}
                  >
                    <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                  </div>
                  {selectedAvatar === avatar.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-foreground flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-background" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Next button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => selectedAvatar && setStep("username")}
              disabled={!selectedAvatar}
              className="w-full py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="username"
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 px-6"
          >
            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-foreground">
                  {selectedAvatarSrc && (
                    <img src={selectedAvatarSrc} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                {username && (
                  <span className="text-sm font-semibold text-foreground">@{username}</span>
                )}
              </div>
            </div>

            {/* Display name */}
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground transition-colors"
              />
            </div>

            {/* Username */}
            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => validateUsername(e.target.value)}
                  placeholder="username"
                  maxLength={20}
                  className={`w-full bg-muted rounded-xl pl-8 pr-4 py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground border transition-colors ${
                    usernameError ? "border-red-400" : "border-border focus:border-foreground"
                  }`}
                />
              </div>
              {usernameError && (
                <p className="text-red-500 text-xs mt-1">{usernameError}</p>
              )}
              <p className="text-muted-foreground text-xs mt-1">Letters, numbers, dots, underscores only</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("avatar")}
                className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-medium text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={handleSubmit}
                disabled={!username || username.length < 3 || !!usernameError || submitting}
                className="flex-1 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm disabled:opacity-30 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {submitting ? "Setting up..." : "Get Started"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}
