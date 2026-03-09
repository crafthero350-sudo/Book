import { motion } from "framer-motion";

export function CoinMascot({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={className}
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFDE5A" />
            <stop offset="100%" stopColor="#F7A927" />
          </linearGradient>
          <radialGradient id="shine" cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#coinGrad)" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
        <circle cx="60" cy="60" r="50" fill="url(#shine)" />
        <path d="M40 55C40 50.5817 43.5817 47 48 47H72C76.4183 47 80 50.5817 80 55V65C80 69.4183 76.4183 73 72 73H48C43.5817 73 40 69.4183 40 65V55Z" fill="rgba(0,0,0,0.1)" />
        <path
          d="M48 51C48 49.8954 48.8954 49 50 49H70C71.1046 49 72 49.8954 72 51V59C72 60.1046 71.1046 61 70 61H50C48.8954 61 48 60.1046 48 59V51Z"
          fill="rgba(255,255,255,0.9)"
        />
        <circle cx="52" cy="58" r="3" fill="rgba(0,0,0,0.4)" />
        <circle cx="68" cy="58" r="3" fill="rgba(0,0,0,0.4)" />
        <path
          d="M50 68C52 72 58 72 60 68"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}
