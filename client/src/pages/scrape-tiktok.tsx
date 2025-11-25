import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultCard } from "@/components/result-card";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Video, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TikTokResult {
  meta: {
    username: string;
    total_posts: number;
    status: string;
  };
  data: Array<{
    video_id: string;
    url: string;
    description: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    author_name: string;
    thumbnail_url: string;
  }>;
  status: string;
}

export default function ScrapeTikTok() {
  const [result, setResult] = useState<TikTokResult | null>(null);
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const scrapeMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/scrape/tiktok", { username });
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus(data.status);
      if (data.data) {
        setResult(data);
      }
      toast({
        title: "Scraping complete!",
        description: `Fetched ${data.meta.total_posts} TikTok videos`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scraping failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string).replace("@", "");
    setResult(null);
    setJobId("");
    setStatus("");
    scrapeMutation.mutate(username);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Video className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">TikTok Scraper</h1>
            <p className="text-sm text-muted-foreground">Fetch videos from any TikTok channel</p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Enter Username</AlertTitle>
        <AlertDescription>
          Simply enter the TikTok username (without @) to fetch their latest videos
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Search</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">TikTok Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="username"
                  required
                  data-testid="input-tiktok-username"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter without @
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={scrapeMutation.isPending}
                data-testid="button-submit-tiktok"
              >
                {scrapeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Videos"
                )}
              </Button>

              {jobId && (
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Status</span>
                    {status && <JobStatusBadge status={status as any} />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Job: {jobId}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Results ({result.meta.total_posts} videos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.data.map((video) => (
                    <ResultCard
                      key={video.video_id}
                      title={video.description || "Untitled Video"}
                      author={video.author_name}
                      url={video.url}
                      image={video.thumbnail_url}
                      type="tiktok"
                      stats={{
                        views: video.views,
                        likes: video.likes,
                        comments: video.comments,
                        shares: video.shares,
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {!result && !scrapeMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Enter a username to fetch videos</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
