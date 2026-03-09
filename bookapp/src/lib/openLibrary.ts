export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subtitle?: string;
  first_sentence?: { value: string } | string;
  publish_date?: string[];
}

export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  isbn?: string;
  openLibraryKey?: string;
}

const COVER_URL = (coverId: number, size: "S" | "M" | "L" = "L") =>
  `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;

export async function searchOpenLibrary(query: string, limit = 12): Promise<BookSearchResult[]> {
  const encoded = encodeURIComponent(query);
  const res = await fetch(`https://openlibrary.org/search.json?q=${encoded}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch from Open Library");
  const data = await res.json();
  const docs: OpenLibraryBook[] = data.docs || [];
  return docs.map((doc) => {
    const title = doc.title || "Untitled";
    const author = (doc.author_name && doc.author_name[0]) || "Unknown";
    const isbn = doc.isbn?.[0];
    const coverUrl = doc.cover_i ? COVER_URL(doc.cover_i, "L") : null;
    const description =
      typeof doc.first_sentence === "string"
        ? doc.first_sentence
        : typeof doc.first_sentence?.value === "string"
        ? doc.first_sentence.value
        : doc.subtitle || null;
    return {
      id: `openlibrary:${doc.key}`,
      title,
      author,
      cover_url: coverUrl,
      description,
      isbn,
      openLibraryKey: doc.key,
    };
  });
}

export function makePurchaseLinks({ title, author, isbn }: { title: string; author: string; isbn?: string }) {
  const query = encodeURIComponent(`${title} ${author}`);
  const links: { label: string; url: string }[] = [
    { label: "Amazon", url: `https://www.amazon.com/s?k=${query}` },
    { label: "Barnes & Noble", url: `https://www.barnesandnoble.com/s/${query}` },
    { label: "Book Depository", url: `https://www.bookdepository.com/search?searchTerm=${query}` },
    { label: "Bookshop.org", url: `https://bookshop.org/books?keywords=${query}` },
    { label: "Google Books", url: `https://www.google.com/search?tbm=bks&q=${query}` },
  ];

  if (isbn) {
    const clean = isbn.replace(/[^0-9Xx]/g, "");
    links.unshift({ label: "Amazon (ISBN)", url: `https://www.amazon.com/s?k=${clean}` });
    links.unshift({ label: "Bookshop (ISBN)", url: `https://bookshop.org/books?keywords=${clean}` });
  }

  return links;
}
