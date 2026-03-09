import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { AIChatBubble } from "@/components/AIChatBubble";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import OnboardingScreen from "@/pages/OnboardingScreen";
import HomeScreen from "@/pages/HomeScreen";
import ReadingNowScreen from "@/pages/ReadingNowScreen";
import ReaderView from "@/pages/ReaderView";
import ProfilePage from "@/pages/ProfilePage";
import SearchScreen from "@/pages/SearchScreen";
import ReelsScreen from "@/pages/ReelsScreen";
import SettingsPage from "@/pages/SettingsPage";
import UserProfilePage from "@/pages/UserProfilePage";
import AuthPage from "@/pages/AuthPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ReadingQuizPage from "@/pages/ReadingQuizPage";
import SetupProfilePage from "@/pages/SetupProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import MessagesPage from "@/pages/MessagesPage";
import ChatPage from "@/pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  // Redirect to setup if profile has no avatar (new user)
  if (profile && !profile.avatar_url) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  // If already set up, go home
  if (profile?.avatar_url) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SideNav />
            <div className="md:ml-[72px] xl:ml-[220px] bg-background min-h-screen relative">
              <div className="max-w-lg mx-auto">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/welcome" element={<OnboardingScreen />} />
                    <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/setup" element={<SetupRoute><SetupProfilePage /></SetupRoute>} />
                    <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
                    <Route path="/reels" element={<ProtectedRoute><ReelsScreen /></ProtectedRoute>} />
                    <Route path="/reading" element={<ProtectedRoute><ReadingNowScreen /></ProtectedRoute>} />
                    <Route path="/read/:id" element={<ProtectedRoute><ReaderView /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><ReadingQuizPage /></ProtectedRoute>} />
                    <Route path="/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                    <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatePresence>
                <BottomNav />
                <AIChatBubble />
              </div>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
