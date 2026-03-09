import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { NotionEmoji } from "@/components/NotionEmoji";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const questions = [
  {
    q: "What draws you to a book first?",
    options: ["A beautiful cover", "A friend's recommendation", "The first sentence", "The author's reputation"],
    key: "attraction",
  },
  {
    q: "Your ideal reading spot?",
    options: ["Cozy couch with tea", "Busy café", "Library silence", "Under a tree outdoors"],
    key: "environment",
  },
  {
    q: "What genre speaks to your soul?",
    options: ["Literary Fiction", "Fantasy & Sci-Fi", "Non-Fiction & Self-Help", "Mystery & Thriller"],
    key: "genre",
  },
  {
    q: "How do you read?",
    options: ["One book at a time, deeply", "Multiple books at once", "Skim fast, absorb later", "Audiobooks while multitasking"],
    key: "style",
  },
  {
    q: "What matters most in a story?",
    options: ["Complex characters", "Thought-provoking ideas", "Gripping plot twists", "Beautiful prose"],
    key: "priority",
  },
];

const personalities: Record<string, { name: string; emoji: string; desc: string }> = {
  "The Dreamer": { name: "The Dreamer", emoji: "🌙", desc: "You lose yourself in rich worlds and complex characters. Fiction is your portal to infinite lives." },
  "The Explorer": { name: "The Explorer", emoji: "🧭", desc: "Curious and wide-ranging, you jump between genres seeking fresh perspectives and big ideas." },
  "The Scholar": { name: "The Scholar", emoji: "📖", desc: "You crave depth and understanding. Non-fiction and thought-provoking works fuel your intellectual fire." },
  "The Adventurer": { name: "The Adventurer", emoji: "⚡", desc: "You read for thrills and can't put a book down once the tension builds. Plot-driven stories are your jam." },
  "The Aesthete": { name: "The Aesthete", emoji: "🎨", desc: "Beautiful language moves you. You savor prose like fine wine and appreciate the art of storytelling." },
};

function getPersonality(answers: number[]): string {
  const scores: Record<string, number> = {
    "The Dreamer": 0, "The Explorer": 0, "The Scholar": 0, "The Adventurer": 0, "The Aesthete": 0,
  };
  // Q1: attraction
  if (answers[0] === 0) scores["The Aesthete"] += 2;
  if (answers[0] === 1) scores["The Explorer"] += 2;
  if (answers[0] === 2) scores["The Dreamer"] += 2;
  if (answers[0] === 3) scores["The Scholar"] += 2;
  // Q2: environment
  if (answers[1] === 0) scores["The Dreamer"] += 2;
  if (answers[1] === 1) scores["The Explorer"] += 2;
  if (answers[1] === 2) scores["The Scholar"] += 2;
  if (answers[1] === 3) scores["The Aesthete"] += 2;
  // Q3: genre
  if (answers[2] === 0) scores["The Aesthete"] += 2;
  if (answers[2] === 1) scores["The Dreamer"] += 2;
  if (answers[2] === 2) scores["The Scholar"] += 2;
  if (answers[2] === 3) scores["The Adventurer"] += 2;
  // Q4: style
  if (answers[3] === 0) scores["The Dreamer"] += 2;
  if (answers[3] === 1) scores["The Explorer"] += 2;
  if (answers[3] === 2) scores["The Adventurer"] += 2;
  if (answers[3] === 3) scores["The Explorer"] += 1;
  // Q5: priority
  if (answers[4] === 0) scores["The Dreamer"] += 2;
  if (answers[4] === 1) scores["The Scholar"] += 2;
  if (answers[4] === 2) scores["The Adventurer"] += 2;
  if (answers[4] === 3) scores["The Aesthete"] += 2;

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export default function ReadingQuizPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const p = getPersonality(newAnswers);
      setResult(p);
      saveResult(p);
    }
  };

  const saveResult = async (personality: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ reading_personality: personality })
      .eq("user_id", user.id);
    if (error) toast.error("Failed to save result");
    else {
      toast.success("Reading personality saved!");
      await refreshProfile();
    }
    setSaving(false);
  };

  const p = result ? personalities[result] : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold">Reading Personality Quiz</h1>
        </div>
      </header>

      <div className="px-4 pt-8 max-w-sm mx-auto">
        {!result ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-muted-foreground">Question {step + 1} of {questions.length}</p>
              <h2 className="font-display text-2xl font-bold">{questions[step].q}</h2>

              <div className="space-y-3">
                {questions[step].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full text-left px-5 py-4 rounded-2xl border-2 border-border bg-card text-sm font-medium hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : p ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <NotionEmoji emoji={p.emoji} size={48} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your reading personality is</p>
              <h2 className="font-display text-3xl font-bold text-primary">{p.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Saved to your profile"}</span>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              View Profile
            </button>
            <button
              onClick={() => { setStep(0); setAnswers([]); setResult(null); }}
              className="w-full py-3 rounded-full border-2 border-border text-foreground font-semibold text-sm"
            >
              Retake Quiz
            </button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
