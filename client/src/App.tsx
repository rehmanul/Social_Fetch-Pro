import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import Accounts from "@/pages/accounts";
import ScrapeYouTube from "@/pages/scrape-youtube";
import ScrapeTwitter from "@/pages/scrape-twitter";
import ScrapeInstagram from "@/pages/scrape-instagram";
import ScrapeTikTok from "@/pages/scrape-tiktok";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/scrape/youtube" component={ScrapeYouTube} />
      <Route path="/scrape/twitter" component={ScrapeTwitter} />
      <Route path="/scrape/instagram" component={ScrapeInstagram} />
      <Route path="/scrape/tiktok" component={ScrapeTikTok} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <header className="flex items-center justify-between border-b border-border p-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-y-auto p-8">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
