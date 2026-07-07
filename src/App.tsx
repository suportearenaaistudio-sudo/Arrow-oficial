import { LazyMotion, domAnimation } from 'framer-motion';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VaultProvider } from "@/contexts/VaultContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VisualQualityProvider } from "@/contexts/VisualQualityContext";
import { RainSoundProvider } from "@/contexts/RainSoundContext";
import { FocusTimerProvider } from "@/contexts/FocusTimerContext";
import AppLayout from "@/components/layout/AppLayout";

// Pages
import VaultSetup from "./pages/VaultSetup";
import Dashboard from "./pages/Dashboard";
import Planning from "./pages/Planning";
import Cycles from "./pages/Cycles";
import Goals from "./pages/Goals";
import GoalDetail from "./pages/GoalDetail";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Finances from "./pages/Finances";
import Notes from "./pages/Notes";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import Vision from "./pages/Vision";
import Pomodoro from "./pages/Pomodoro";
import Assistant from "./pages/Assistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VaultProvider>
        <ThemeProvider>
        <VisualQualityProvider>
        <RainSoundProvider>
        <FocusTimerProvider>
        <Sonner position="top-right" />
        <LazyMotion features={domAnimation}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/setup" element={<VaultSetup />} />

            {/* Protected (inside AppLayout) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/cycles" element={<Cycles />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goal-detail/:id" element={<GoalDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Catch-all for routes outside layout */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </LazyMotion>
        </FocusTimerProvider>
        </RainSoundProvider>
        </VisualQualityProvider>
        </ThemeProvider>
      </VaultProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
