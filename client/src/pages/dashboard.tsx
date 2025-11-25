import { StatCard } from "@/components/stat-card";
import { PlatformCard } from "@/components/platform-card";
import { Activity, CheckCircle, Users, Database, Youtube, Twitter, Instagram, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/job-status-badge";
import { useQuery } from "@tanstack/react-query";
import { Job } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalJobs: number;
    successRate: number;
    activeAccounts: number;
    dataVolume: string;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/recent"],
  });

  const { data: platformStats } = useQuery<Record<string, { totalJobs: number; successRate: number }>>({
    queryKey: ["/api/platforms/stats"],
  });

  const platforms = [
    { name: "YouTube", icon: Youtube, url: "/scrape/youtube", status: "connected" as const },
    { name: "Twitter", icon: Twitter, url: "/scrape/twitter", status: "connected" as const },
    { name: "Instagram", icon: Instagram, url: "/scrape/instagram", status: "connected" as const },
    { name: "TikTok", icon: Video, url: "/scrape/tiktok", status: "connected" as const },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your scraping operations and platform status
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Jobs"
              value={stats?.totalJobs || 0}
              icon={Activity}
              trend={{ value: 12, isPositive: true }}
              testId="stat-total-jobs"
            />
            <StatCard
              title="Success Rate"
              value={`${stats?.successRate || 0}%`}
              icon={CheckCircle}
              trend={{ value: 5, isPositive: true }}
              testId="stat-success-rate"
            />
            <StatCard
              title="Active Accounts"
              value={stats?.activeAccounts || 0}
              icon={Users}
              testId="stat-active-accounts"
            />
            <StatCard
              title="Data Volume"
              value={stats?.dataVolume || "0 MB"}
              icon={Database}
              testId="stat-data-volume"
            />
          </>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Platform Status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.name}
              {...platform}
              stats={platformStats?.[platform.name.toLowerCase()]}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentJobs && recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  data-testid={`job-row-${job.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {job.platform}
                      </span>
                      <JobStatusBadge status={job.status as any} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {job.error && (
                    <p className="text-xs text-destructive max-w-xs truncate">
                      {job.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">No jobs yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start scraping from a platform to see jobs here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
