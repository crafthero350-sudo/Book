import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { streamAI } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { LisaAvatar } from "@/components/LisaAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm **Lisa** ![📚](https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/512.png) your personal book companion. I can summarize books, recommend reads, help you write stories, and bring characters to life. What can I help you with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "Recommend me a fantasy book",
    "Summarize The Alchemist",
    "Find a book about habits",
    "Why should I read Sapiens?",
  ];

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  };

  const addReactionMessage = () => {
    const reactions = [
      "😊 Ready when you are!", 
      "🤔 Hmm... what kind of stories do you love?",
      "📚 I can find a great read for you — just ask!",
      "✨ Want a book suggestion based on your mood?",
    ];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    setLastReaction(pick);
    addAssistantMessage(pick);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const update = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === allMessages.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamAI({
      endpoint: "ai-chat",
      body: { messages: allMessages.map((m) => ({ role: m.role, content: m.content })) },
      onDelta: update,
      onDone: () => setLoading(false),
      onError: (msg) => {
        toast.error(msg);
        setLoading(false);
      },
    });
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-sm overflow-hidden border border-border bg-card"
          >
            <LisaAvatar size={56} isTalking={false} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-3 left-3 z-50 max-w-md mx-auto bg-background rounded-lg shadow-sm border border-border flex flex-col"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="w-10 h-10">
                <LisaAvatar
                  size={40}
                  isTalking={loading}
                  onClick={() => {
                    addReactionMessage();
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold italic" style={{ fontFamily: "'Merriweather', serif" }}>Lisa</p>
                <p className="text-[11px] text-muted-foreground">Your AI Book Companion</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: "200px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-li:my-0.5">
                        <ReactMarkdown components={{ img: ({ alt, src }) => <img src={src} alt={alt || ""} className="inline-block align-text-bottom w-[18px] h-[18px]" draggable={false} /> }}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-primary/10 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-3 py-2 border-t border-border">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask about any book..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
                >
                  {loading ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse delay-100" />
                      <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse delay-200" />
                    </div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}