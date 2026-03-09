import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, Check, ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NotionEmoji } from "@/components/NotionEmoji";
import { searchOpenLibrary, BookSearchResult, makePurchaseLinks } from "@/lib/openLibrary";

interface BookData {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  price: number | null;
  isbn?: string;
  source?: "local" | "online";
  openLibraryKey?: string;
}

interface UserBook {
  id: string;
  book_id: string;
  status: string;
  progress: number;
  current_page: number;
  book: { id: string; title: string; author: string; cover_url: string | null };
}

interface PostResult {
  id: string;
  content: string;
  type: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null; username: string | null; avatar_url: string | null };
}

type SearchFilter = "all" | "books" | "posts" | "reels" | "web";

export default function SearchScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [books, setBooks] = useState<BookData[]>([]);
  const [onlineResults, setOnlineResults] = useState<BookSearchResult[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [userBookIds, setUserBookIds] = useState<Set<string>>(new Set());
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [postResults, setPostResults] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);

  const fetchBooks = useCallback(async () => {
    const { data } = await supabase
      .from("books")
      .select("id, title, author, cover_url, description, price, isbn")
      .order("title");
    if (data) setBooks((data as BookData[]).map((b) => ({ ...b, source: "local" })));
    setLoading(false);
  }, []);

  const fetchOnlineBooks = useCallback(async (q: string) => {
    if (!q.trim()) {
      setOnlineResults([]);
      setOnlineError(null);
      return;
    }
    setOnlineLoading(true);
    try {
      const results = await searchOpenLibrary(q, 12);
      setOnlineResults(results);
      setOnlineError(null);
    } catch (err: any) {
      setOnlineError(err.message || "Unable to fetch online results");
    } finally {
      setOnlineLoading(false);
    }
  }, []);

  const fetchUserBooks = useCallback(async () => {
    if (!user) return;
    const [ubRes, ubDetailRes] = await Promise.all([
      supabase.from("user_books").select("book_id").eq("user_id", user.id),
      supabase.from("user_books").select("id, book_id, status, progress, current_page, book:books(id, title, author, cover_url)").eq("user_id", user.id).order("updated_at", { ascending: false }),
    ]);
    if (ubRes.data) setUserBookIds(new Set(ubRes.data.map((ub) => ub.book_id)));
    if (ubDetailRes.data) {
      setUserBooks(ubDetailRes.data.map((ub: any) => ({ ...ub, progress: ub.progress || 0, current_page: ub.current_page || 0 })));
    }
  }, [user]);

  const searchPosts = useCallback(async (q: string) => {
    if (!q.trim()) { setPostResults([]); return; }
    const { data: postsData } = await supabase
      .from("posts")
      .select("id, content, type, image_url, created_at, user_id")
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!postsData?.length) { setPostResults([]); return; }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    setPostResults(postsData.map((p) => ({ ...p, profile: profileMap.get(p.user_id) })));
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchUserBooks();
  }, [fetchBooks, fetchUserBooks]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim()) {
        searchPosts(query);
        if (activeFilter === "all" || activeFilter === "web") {
          fetchOnlineBooks(query);
        }
      } else {
        setPostResults([]);
        setOnlineResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchPosts, activeFilter, fetchOnlineBooks]);

  const addToLibrary = async (bookId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("user_books").insert({ user_id: user.id, book_id: bookId, status: "want_to_read" });
      if (error) throw error;
      setUserBookIds((prev) => new Set([...prev, bookId]));
      toast.success("Added to library!");
      fetchUserBooks();
    } catch (err: any) { toast.error(err.message || "Failed to add book"); }
  };

  const addOnlineBookToLibrary = async (book: BookData) => {
    if (!user) return;
    try {
      // Use ISBN when available to avoid duplicates
      let bookId: string | null = null;
      if (book.isbn) {
        const { data } = await supabase.from("books").select("id").eq("isbn", book.isbn).maybeSingle();
        if (data) bookId = data.id;
      }

      if (!bookId) {
        const { data, error } = await supabase
          .from("books")
          .insert({
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
            description: book.description,
            isbn: book.isbn || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        bookId = data.id;
      }

      const { data: existing } = await supabase
        .from("user_books")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase.from("user_books").insert({ user_id: user.id, book_id: bookId, status: "want_to_read" });
        if (error) throw error;
      }

      toast.success("Added to your library!");
      fetchUserBooks();
    } catch (err: any) {
      toast.error(err.message || "Failed to add book");
    }
  };

  const removeFromLibrary = async (bookId: string) => {
    if (!user) return;
    await supabase.from("user_books").delete().eq("user_id", user.id).eq("book_id", bookId);
    setUserBookIds((prev) => { const n = new Set(prev); n.delete(bookId); return n; });
    fetchUserBooks();
    toast.success("Removed from library");
  };

  const updateProgress = async (userBookId: string, newProgress: number) => {
    const status = newProgress >= 100 ? "finished" : newProgress > 0 ? "reading" : "want_to_read";
    await supabase.from("user_books").update({
      progress: Math.min(newProgress, 100), status,
      ...(newProgress >= 100 ? { finished_at: new Date().toISOString() } : {}),
      ...(newProgress > 0 && status === "reading" ? { started_at: new Date().toISOString() } : {}),
    }).eq("id", userBookId);
    if (user) {
      await supabase.from("activity_log").insert({ user_id: user.id, activity_type: "reading", metadata: { progress: newProgress } });
    }
    fetchUserBooks();
  };

  const filteredBooks = query
    ? books.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()))
    : books;

  const showBooks = activeFilter === "all" || activeFilter === "books";
  const showWeb = (activeFilter === "all" || activeFilter === "web") && query.trim();
  const showPosts = (activeFilter === "all" || activeFilter === "posts" || activeFilter === "reels") && query.trim();

  // Book detail view
  if (selectedBook) {
    const ub = userBooks.find((u) => u.book_id === selectedBook.id);
    const inLibrary = userBookIds.has(selectedBook.id);
    const purchaseLinks = makePurchaseLinks({
      title: selectedBook.title,
      author: selectedBook.author,
      isbn: selectedBook.isbn,
    });
    const openLibraryUrl = selectedBook.openLibraryKey
      ? `https://openlibrary.org${selectedBook.openLibraryKey}`
      : null;

    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setSelectedBook(null)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-display text-lg font-bold truncate">{selectedBook.title}</h1>
          </div>
        </header>
        <div className="px-4 pt-6 space-y-6">
          <div className="flex gap-4">
            <div className="w-32 aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-sm flex-shrink-0">
              {selectedBook.cover_url ? (
                <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">{selectedBook.title}</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-display text-xl font-bold">{selectedBook.title}</h2>
              <p className="text-sm text-muted-foreground">by {selectedBook.author}</p>
              {selectedBook.price != null && selectedBook.price > 0 && (
                <p className="text-lg font-bold text-accent">${selectedBook.price.toFixed(2)}</p>
              )}
              {ub && ub.status === "reading" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{ub.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${ub.progress}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{100 - ub.progress}% remaining</p>
                </div>
              )}
              {ub && ub.status === "finished" && (
                <span className="inline-flex items-center gap-1 text-xs text-accent font-medium bg-accent/10 px-2 py-1 rounded-full"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.png" alt="✓" className="w-3.5 h-3.5" /> Finished</span>
              )}
            </div>
          </div>
          {selectedBook.description && (
            <div>
              <h3 className="font-semibold text-sm mb-1">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedBook.description}</p>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {inLibrary ? (
              <>
                {ub?.status === "reading" && (
                  <button onClick={() => updateProgress(ub.id, Math.min(ub.progress + 10, 100))} className="flex-1 min-w-[160px] py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    +10% Progress
                  </button>
                )}
                {ub?.status === "want_to_read" && (
                  <button onClick={() => updateProgress(ub.id, 1)} className="flex-1 min-w-[160px] py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    Start Reading
                  </button>
                )}
                <button onClick={() => { removeFromLibrary(selectedBook.id); setSelectedBook(null); }} className="px-6 py-3 rounded-full border-2 border-border text-foreground font-semibold text-sm">
                  Remove
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  selectedBook.source === "online"
                    ? addOnlineBookToLibrary(selectedBook as unknown as BookSearchResult)
                    : addToLibrary(selectedBook.id)
                }
                className="flex-1 min-w-[160px] py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
              >
                Add to Library
              </button>
            )}
          </div>

          {(selectedBook.price != null && selectedBook.price > 0) || purchaseLinks.length > 0 ? (
            <div className="space-y-3">
              {selectedBook.price != null && selectedBook.price > 0 && (
                <button className="w-full py-3.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm">
                  Buy for ${selectedBook.price.toFixed(2)}
                </button>
              )}

              {purchaseLinks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Buy from</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {purchaseLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-card transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {openLibraryUrl && (
                <a
                  href={openLibraryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-card transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Open Library
                </a>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const filters: { value: SearchFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "books", label: "Books" },
    { value: "web", label: "Web" },
    { value: "posts", label: "Posts" },
    { value: "reels", label: "Reels" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <h1 className="font-display text-2xl font-bold mb-3">Search</h1>
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-3 py-2.5">
            <SearchIcon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search books, posts, reels..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-6">
        {/* Post/Reel search results */}
        {showPosts && postResults.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><NotionEmoji emoji="📝" size={20} /> Posts & Reels</h2>
            <div className="space-y-2">
              {postResults.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border"
                >
                  {p.profile?.avatar_url ? (
                    <img src={p.profile.avatar_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {(p.profile?.display_name || "?")[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{p.profile?.username || "user"}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{p.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{p.content}</p>
                  </div>
                  {p.image_url && (
                    <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Books section */}
        {showWeb && (
          <section>
            <h2 className="font-display text-lg font-bold mb-3">Web search results</h2>
            {onlineLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : onlineError ? (
              <p className="text-center text-red-500 text-sm py-8">{onlineError}</p>
            ) : onlineResults.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No results from the web. Try a different search.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {onlineResults.map((book, i) => {
                  const inLibrary = !!(book.isbn && books.some((b) => b.isbn && b.isbn === book.isbn));
                  return (
                    <motion.button
                      key={book.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedBook({ ...book, source: "online" })}
                      className="flex flex-col gap-1.5 text-left"
                    >
                      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-muted">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center font-display">{book.title}</div>
                        )}
                        {inLibrary && (
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-3 h-3" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold truncate">{book.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                        {book.isbn && <p className="text-[11px] font-medium text-muted-foreground mt-0.5">ISBN: {book.isbn}</p>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {showBooks && (
          <section>
            <h2 className="font-display text-lg font-bold mb-3">
              {query ? "Book Results" : "Explore Books"}
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredBooks.map((book, i) => (
                  <motion.button
                    key={book.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedBook(book)}
                    className="flex flex-col gap-1.5 text-left"
                  >
                    <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-muted">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center font-display">{book.title}</div>
                      )}
                      {userBookIds.has(book.id) && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold truncate">{book.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                      {book.price != null && book.price > 0 && (
                        <p className="text-[11px] font-bold text-accent mt-0.5">${book.price.toFixed(2)}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
            {!loading && filteredBooks.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-12">No books found</p>
            )}
          </section>
        )}

        {/* No results */}
        {query && !onlineLoading && !loading && (
          (() => {
            const hasAnyResults =
              (showBooks && filteredBooks.length > 0) ||
              (showPosts && postResults.length > 0) ||
              (showWeb && onlineResults.length > 0);
            return !hasAnyResults ? (
              <p className="text-center text-muted-foreground text-sm mt-12">
                No results found for "
                <span className="font-semibold text-foreground">{query}</span>"
              </p>
            ) : null;
          })()
        )}
      </div>
    </div>
  );
}
