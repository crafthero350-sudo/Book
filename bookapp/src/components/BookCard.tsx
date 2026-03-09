import { motion } from "framer-motion";
import type { Book } from "@/data/mockData";

interface BookCardProps {
  book: Book;
  size?: "large" | "medium" | "small";
  index?: number;
  onClick?: () => void;
}

export function BookCard({ book, size = "medium", index = 0, onClick }: BookCardProps) {
  const sizeClasses = {
    large: "w-36 h-52",
    medium: "w-28 h-40",
    small: "w-20 h-28",
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className="flex flex-col gap-2 flex-shrink-0 text-left"
    >
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-sm bg-muted`}>
        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
      </div>
      <div className={size === "small" ? "w-20" : size === "medium" ? "w-28" : "w-36"}>
        <p className="text-xs font-medium truncate">{book.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
        {book.progress > 0 && book.progress < 100 && (
          <div className="book-progress-bar mt-1">
            <div className="book-progress-fill" style={{ width: `${book.progress}%` }} />
          </div>
        )}
        {book.progress === 100 && (
          <span className="text-[10px] text-muted-foreground">Finished</span>
        )}
      </div>
    </motion.button>
  );
}
