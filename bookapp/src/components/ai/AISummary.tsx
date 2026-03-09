import { useState, useEffect, useCallback } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { streamAI } from "@/lib/streamChat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface BookOption {
  id: string;
  title: string;
  author: string;
}

export function AISummary() {
  const [books, setBooks] = useState<BookOption[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const fetchBooks = useCallback(async () => {
    const { data } = await supabase.from("books").select("id, title, author").order("title");
    if (data) setBooks(data);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const getSummary = async () => {
    const title = useCustom ? customTitle : selectedBook?.title;
    const author = useCustom ? customAuthor : selectedBook?.author;
    if (!title || !author) { toast.error("Select or enter a book"); return; }

    setResult("");
    setLoading(true);
    let soFar = "";

    await streamAI({
      endpoint: "ai-summary",
      body: { bookTitle: title, bookAuthor: author },
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
        <h2 className="font-display text-lg font-semibold mb-1">AI Book Summaries</h2>
        <p className="text-xs text-muted-foreground">Get a rich, insightful summary of any book in seconds.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setUseCustom(false)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${!useCustom ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          From Library
        </button>
        <button
          onClick={() => setUseCustom(true)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${useCustom ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Any Book
        </button>
      </div>

      {!useCustom ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                selectedBook?.id === book.id ? "bg-primary/10 border border-primary" : "bg-muted"
              }`}
            >
              <p className="font-medium">{book.title}</p>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </button>
          ))}
          {books.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No books in library yet</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Book title..."
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <input
            value={customAuthor}
            onChange={(e) => setCustomAuthor(e.target.value)}
            placeholder="Author name..."
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}

      <button
        onClick={getSummary}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 gold-gradient text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-50 gold-shadow"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
        {loading ? "Generating summary..." : "Generate Summary"}
      </button>

      {result && (
        <div className="bg-card rounded-xl p-4 border border-border prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
