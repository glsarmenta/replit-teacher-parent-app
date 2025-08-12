import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Announcements from "@/pages/announcements";
import Attendance from "@/pages/attendance";
import Messaging from "@/pages/messaging";
import Grades from "@/pages/grades";
import Forms from "@/pages/forms";
import Progression from "@/pages/progression";
import Billing from "@/pages/billing";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

// Layout
import Navbar from "@/components/layout/navbar";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/announcements" component={Announcements} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/messages" component={Messaging} />
          <Route path="/grades" component={Grades} />
          <Route path="/forms" component={Forms} />
          <Route path="/progression" component={Progression} />
          <Route path="/billing" component={Billing} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Toaster />
            <Router />
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
