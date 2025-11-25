import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatusBadge } from "@/components/job-status-badge";
import { JsonViewer } from "@/components/json-viewer";
import { Job } from "@shared/schema";
import { Search, Eye, Trash2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch = job.id.toLowerCase().includes(search.toLowerCase()) ||
      job.platform.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platformFilter === "all" || job.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Jobs Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all scraping jobs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-medium">All Jobs</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-jobs"
                />
              </div>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32" data-testid="select-platform-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover-elevate"
                  data-testid={`job-item-${job.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {job.platform}
                      </span>
                      <JobStatusBadge status={job.status as any} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      ID: {job.id}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                    {job.error && (
                      <p className="mt-1 text-xs text-destructive truncate">
                        Error: {job.error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedJob(job)}
                      data-testid={`button-view-${job.id}`}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="ml-1">View</span>
                    </Button>
                    {job.status === "failed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-retry-${job.id}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-delete-${job.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search || platformFilter !== "all" || statusFilter !== "all"
                  ? "No jobs match your filters"
                  : "No jobs yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform</p>
                  <p className="mt-1 text-sm capitalize text-foreground">{selectedJob.platform}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <JobStatusBadge status={selectedJob.status as any} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="mt-1 text-sm text-foreground">
                    {new Date(selectedJob.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedJob.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(selectedJob.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Input</p>
                <JsonViewer data={selectedJob.input} />
              </div>

              {selectedJob.result && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Result</p>
                  <JsonViewer data={selectedJob.result} />
                </div>
              )}

              {selectedJob.error && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Error</p>
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{selectedJob.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
