import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultCard } from "@/components/result-card";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Twitter, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TwitterResult {
  meta: {
    query: string;
    total_tweets: number;
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
  }>;
  status: string;
}

export default function ScrapeTwitter() {
  const [result, setResult] = useState<TwitterResult | null>(null);
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const scrapeMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest("POST", "/api/scrape/twitter", { query });
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus(data.status);
      if (data.data) {
        setResult(data);
      }
      toast({
        title: "Scraping complete!",
        description: `Fetched ${data.meta.total_tweets} tweets`,
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
    const query = formData.get("query") as string;
    setResult(null);
    setJobId("");
    setStatus("");
    scrapeMutation.mutate(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Twitter className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Twitter Scraper</h1>
            <p className="text-sm text-muted-foreground">Search and fetch tweets</p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Enter Search Query</AlertTitle>
        <AlertDescription>
          Enter keywords to search for tweets across Twitter
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
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  name="query"
                  placeholder="e.g. AI technology"
                  required
                  data-testid="input-twitter-query"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter keywords to search
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={scrapeMutation.isPending}
                data-testid="button-submit-twitter"
              >
                {scrapeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Tweets"
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
                  Results ({result.meta.total_tweets} tweets)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.data.map((tweet) => (
                    <ResultCard
                      key={tweet.video_id}
                      title={tweet.description}
                      author={tweet.author_name}
                      url={tweet.url}
                      type="tweet"
                      stats={{
                        views: tweet.views,
                        likes: tweet.likes,
                        comments: tweet.comments,
                        shares: tweet.shares,
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
            <Twitter className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Enter a search query to fetch tweets</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
