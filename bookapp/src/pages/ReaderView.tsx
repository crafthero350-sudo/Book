import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Bookmark, MessageCircle, Share, Highlighter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { books, sampleBookContent } from "@/data/mockData";

export default function ReaderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [direction, setDirection] = useState(0);

  if (!book) return null;

  const totalPages = sampleBookContent.length;

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage((p) => p - 1);
    }
  };

  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? 300 : -300,
      opacity: 0,
      rotateY: d > 0 ? -15 : 15,
    }),
    center: { x: 0, opacity: 1, rotateY: 0 },
    exit: (d: number) => ({
      x: d > 0 ? -300 : 300,
      opacity: 0,
      rotateY: d > 0 ? 15 : -15,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => navigate(-1)} className="p-1">
                <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
              <div className="w-8" />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Reading area */}
      <div
        className="flex-1 relative page-flip overflow-hidden"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Tap zones */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); goNext(); }} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="px-8 py-10 min-h-[70vh]"
          >
            <p className="text-base leading-8 whitespace-pre-line">
              {sampleBookContent[currentPage]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            className="border-t border-border bg-background/90 backdrop-blur-lg"
          >
            {/* Progress */}
            <div className="px-6 pt-3">
              <div className="book-progress-bar">
                <div
                  className="book-progress-fill"
                  style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1.5">
                Page {currentPage + 1} of {totalPages}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-around py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button className="p-2">
                <Highlighter className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </button>
              <button className="p-2">
                <MessageCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </button>
              <button className="p-2">
                <Bookmark className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </button>
              <button className="p-2">
                <Share className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
