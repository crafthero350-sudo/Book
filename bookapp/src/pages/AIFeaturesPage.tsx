import { useState } from "react";
import { ArrowLeft, Sparkles, BookOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { AISummary } from "@/components/ai/AISummary";
import { AICharacterGen } from "@/components/ai/AICharacterGen";

const tabs = [
  { id: "recommend", label: "Recommendations", icon: Sparkles },
  { id: "summary", label: "Summaries", icon: BookOpen },
  { id: "character", label: "3D Characters", icon: Users },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AIFeaturesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("recommend");

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-semibold">AI Studio</h1>
        </div>
        <div className="flex px-2 pb-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "gold-gradient text-primary-foreground gold-shadow"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4"
      >
        {activeTab === "recommend" && <AIRecommendations />}
        {activeTab === "summary" && <AISummary />}
        {activeTab === "character" && <AICharacterGen />}
      </motion.div>
    </div>
  );
}
