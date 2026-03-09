import { motion, AnimatePresence } from "framer-motion";

export function LisaAvatar({
  size = 44,
  isTalking = false,
  onClick,
  className,
}: {
  size?: number;
  isTalking?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const mouthVariants = {
    still: { scaleY: 1 },
    talk: {
      scaleY: [1, 0.6, 1],
      transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const blink = {
    open: { scaleY: 1 },
    close: { scaleY: 0.2 },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className || ""}`}
      style={{ width: size, height: size }}
      aria-label="Lisa, your book companion"
    >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: [1, 0.98, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatType: "reverse" }}
        className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-400 shadow-inner"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="lisa-face" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="60%" stopColor="#ffe599" />
              <stop offset="100%" stopColor="#f2c94c" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#lisa-face)" stroke="rgba(0,0,0,0.18)" strokeWidth="4" />

          {/* Eyes */}
          <motion.g animate={{ y: isTalking ? -1 : 0 }} transition={{ duration: 0.25 }}>
            <motion.ellipse
              cx="34"
              cy="40"
              rx="8"
              ry="9"
              fill="#1f2937"
              animate={isTalking ? "close" : "open"}
              variants={blink}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 3.5, delay: 0.6 }}
            />
            <motion.ellipse
              cx="66"
              cy="40"
              rx="8"
              ry="9"
              fill="#1f2937"
              animate={isTalking ? "close" : "open"}
              variants={blink}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 3.5, delay: 1.1 }}
            />
          </motion.g>

          {/* Mouth */}
          <motion.path
            d="M30,63 C38,74 62,74 70,63"
            fill="transparent"
            stroke="#1f2937"
            strokeWidth="4"
            strokeLinecap="round"
            variants={mouthVariants}
            animate={isTalking ? "talk" : "still"}
          />

          {/* Sparkles */}
          <AnimatePresence>
            {isTalking && (
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d="M22 28 L26 32 L22 36 L18 32 Z"
                  fill="rgba(255,255,255,0.8)"
                  className="animate-pulse"
                />
                <path
                  d="M78 30 L81 34 L78 38 L75 34 Z"
                  fill="rgba(255,255,255,0.7)"
                  className="animate-pulse"
                />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>
    </button>
  );
}
