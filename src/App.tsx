import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RainSoundProvider } from "@/contexts/RainSoundContext";
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Auth from "./pages/Auth";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" />
      <AuthProvider>
        <ThemeProvider>
        <RainSoundProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected (inside AppLayout) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/cycles" element={<Cycles />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goal-detail/:id" element={<GoalDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </RainSoundProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
