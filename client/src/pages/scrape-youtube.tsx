import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultCard } from "@/components/result-card";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Youtube, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface YouTubeResult {
  meta: {
    url: string;
    total_videos: number;
    status: string;
  };
  data: Array<{
    video_id: string;
    url: string;
    title: string;
    description: string;
    views: number;
    likes: number;
    comments: number;
    duration: number;
    channel: string;
    author_name: string;
    thumbnail_url: string;
  }>;
  status: string;
}

export default function ScrapeYouTube() {
  const [result, setResult] = useState<YouTubeResult | null>(null);
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const scrapeMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/scrape/youtube", { url });
      return res.json();
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus(data.status);
      if (data.data) {
        setResult(data);
      }
      toast({
        title: "Scraping complete!",
        description: `Fetched ${data.meta.total_videos} YouTube videos`,
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
    const url = formData.get("url") as string;
    setResult(null);
    setJobId("");
    setStatus("");
    scrapeMutation.mutate(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <Youtube className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">YouTube Scraper</h1>
            <p className="text-sm text-muted-foreground">Extract video metadata and stats</p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Enter Video URL</AlertTitle>
        <AlertDescription>
          Paste a YouTube video URL to extract metadata including views, likes, and more
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
                <Label htmlFor="url">Video URL</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  data-testid="input-youtube-url"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Paste a YouTube video link
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={scrapeMutation.isPending}
                data-testid="button-submit-youtube"
              >
                {scrapeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Extract Metadata"
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
                  Video Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {result.data.map((video) => (
                    <ResultCard
                      key={video.video_id}
                      title={video.title}
                      description={video.description}
                      author={video.channel}
                      url={video.url}
                      image={video.thumbnail_url}
                      type="youtube"
                      stats={{
                        views: video.views,
                        likes: video.likes,
                        comments: video.comments,
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
            <Youtube className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Enter a YouTube URL to extract metadata</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
