import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { streamAI } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const moodOptions = [
  "Something inspiring",
  "A page-turner thriller",
  "Deep philosophical read",
  "Light & fun",
  "Historical fiction",
  "Self-improvement",
];

export function AIRecommendations() {
  const [mood, setMood] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    const selectedMood = mood === "custom" ? customMood : mood;
    if (!selectedMood) { toast.error("Select a mood or preference"); return; }

    setResult("");
    setLoading(true);
    let soFar = "";

    await streamAI({
      endpoint: "ai-recommend",
      body: { mood: selectedMood },
      onDelta: (chunk) => {
        soFar += chunk;
        setResult(soFar);
      },
      onDone: () => setLoading(false),
      onError: (msg) => { toast.error(msg); setLoading(false); },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold mb-1">What are you in the mood for?</h2>
        <p className="text-xs text-muted-foreground">Pick a vibe and our AI will find your next perfect read.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {moodOptions.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mood === m ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
        <button
          onClick={() => setMood("custom")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mood === "custom" ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          Custom...
        </button>
      </div>

      {mood === "custom" && (
        <input
          value={customMood}
          onChange={(e) => setCustomMood(e.target.value)}
          placeholder="Describe what you're looking for..."
          className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      )}

      <button
        onClick={getRecommendations}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 gold-gradient text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-50 gold-shadow"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Finding books..." : "Get Recommendations"}
      </button>

      {result && (
        <div className="bg-card rounded-xl p-4 border border-border prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
