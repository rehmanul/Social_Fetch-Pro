import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Activity, Users, Settings, Youtube, Twitter, Instagram, Video } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Activity,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const platformItems = [
  {
    title: "YouTube",
    url: "/scrape/youtube",
    icon: Youtube,
  },
  {
    title: "Twitter",
    url: "/scrape/twitter",
    icon: Twitter,
  },
  {
    title: "Instagram",
    url: "/scrape/instagram",
    icon: Instagram,
  },
  {
    title: "TikTok",
    url: "/scrape/tiktok",
    icon: Video,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">OmniFetch</h2>
            <p className="text-xs text-muted-foreground">Social Scraper</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
            Platforms
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-lg border border-sidebar-border bg-sidebar p-3">
          <p className="text-xs font-medium text-sidebar-foreground">API Status</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" data-testid="status-indicator"></div>
            <span className="text-xs text-muted-foreground">All Systems Operational</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
