import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BlobSVG = () => (
  <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
    <path d="M50,250 Q0,150 80,80 Q160,10 260,50 Q360,90 350,200 Q340,310 250,350 Q160,390 80,340 Q0,290 50,250Z" fill="hsl(var(--primary))" opacity="0.15" />
    <circle cx="320" cy="100" r="60" fill="hsl(var(--accent))" opacity="0.25" />
    <path d="M30,320 Q60,280 100,300 Q140,320 130,360 Q120,400 70,390 Q20,380 30,320Z" fill="hsl(var(--accent))" opacity="0.3" />
    <path d="M280,280 Q320,250 360,280 Q400,310 380,350 Q360,390 320,380 Q280,370 260,340 Q240,310 280,280Z" fill="hsl(var(--primary))" opacity="0.1" />
  </svg>
);

const steps = [
  {
    title: "All your books in one place on BookApp.",
    subtitle: "Discover, read, and share your favorite stories with a vibrant community.",
    cta: "Start",
  },
  {
    title: "Pick your favorites",
    subtitle: "Tell us what you love and we'll curate the perfect reading experience.",
    cta: "Continue",
  },
  {
    title: "Meet Lisa, your AI companion",
    subtitle: "Get book summaries, writing help, recommendations, and bring characters to life — all in one chat.",
    cta: "Get Started",
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <BlobSVG />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 w-full max-w-sm text-center space-y-6"
        >
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-primary" : "w-2 bg-accent"
                }`}
              />
            ))}
          </div>

          {/* Decorative book cards for step 1 */}
          {step === 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative w-48 h-48 mx-auto mb-4"
            >
              <div className="absolute top-4 left-2 w-28 h-36 bg-primary/20 rounded-2xl rotate-[-12deg] border-2 border-primary/30" />
              <div className="absolute top-0 right-2 w-28 h-36 bg-accent/30 rounded-2xl rotate-[8deg] border-2 border-accent/40" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-36 bg-card rounded-2xl border-2 border-border shadow-sm flex items-center justify-center">
                <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/512.png" alt="📚" className="w-8 h-8" />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-4"
            >
              {["Crime & Mystery", "Romance", "Sci-Fi", "Philosophy"].map((genre, i) => (
                <div
                  key={genre}
                  className={`p-3 rounded-2xl border-2 text-center text-sm font-medium transition-all ${
                    i === 0
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {genre}
                </div>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-32 h-32 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
            >
              <span className="text-5xl">🤖</span>
            </motion.div>
          )}

          <h1 className="font-display text-3xl font-bold leading-tight text-foreground">
            {steps[step].title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {steps[step].subtitle}
          </p>

          <div className="space-y-3 pt-4">
            <button
              onClick={next}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-sm"
            >
              {steps[step].cta}
            </button>
            {step === 0 && (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => navigate("/auth")} className="text-primary font-semibold">
                  Log in
                </button>
              </p>
            )}
            {step > 0 && step < steps.length - 1 && (
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-3 rounded-full border-2 border-border text-foreground font-semibold text-sm"
              >
                Skip
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
