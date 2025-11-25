import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface PlatformCardProps {
  name: string;
  icon: LucideIcon;
  status: "connected" | "disconnected";
  url: string;
  stats?: {
    totalJobs: number;
    successRate: number;
  };
}

export function PlatformCard({ name, icon: Icon, status, url, stats }: PlatformCardProps) {
  const isConnected = status === "connected";

  return (
    <Link href={url}>
      <Card 
        className="hover-elevate active-elevate-2 cursor-pointer transition-all"
        data-testid={`card-platform-${name.toLowerCase()}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                isConnected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">{name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <Badge 
                    variant={isConnected ? "default" : "secondary"}
                    className="text-xs"
                    data-testid={`badge-status-${name.toLowerCase()}`}
                  >
                    {status}
                  </Badge>
                  {stats && (
                    <span className="text-xs text-muted-foreground">
                      {stats.totalJobs} jobs · {stats.successRate}% success
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
