import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JsonViewer } from "@/components/json-viewer";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Twitter, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScrapeTwitter() {
  const [result, setResult] = useState<any>(null);
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
      if (data.result) {
        setResult(data.result);
      }
      toast({
        title: "Scraping started",
        description: "Twitter search is being executed via account swarm.",
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
            <p className="text-sm text-muted-foreground">Account Swarm & GraphQL Access</p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account Pool Required</AlertTitle>
        <AlertDescription>
          Twitter scraping uses a pool of authenticated accounts to distribute load and
          bypass rate limits. Configure accounts in the Accounts page.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  name="query"
                  placeholder="AI technology"
                  required
                  data-testid="input-twitter-query"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports standard Twitter advanced search syntax
                </p>
              </div>

              <div>
                <Label htmlFor="limit">Result Limit</Label>
                <Input
                  id="limit"
                  name="limit"
                  type="number"
                  placeholder="100"
                  defaultValue="100"
                  min="1"
                  max="1000"
                  data-testid="input-twitter-limit"
                />
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
                  "Start Search"
                )}
              </Button>

              {jobId && (
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Job Status</span>
                    {status && <JobStatusBadge status={status as any} />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Job ID: {jobId}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Result Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {scrapeMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : result ? (
              <JsonViewer data={result} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Twitter className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No results yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a query to see tweets
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">Account Swarm Strategy</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Uses twscrape to manage a pool of Twitter accounts, automatically rotating
              between them to avoid rate limits and distribute load.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Extracted Data</h4>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              <li>• Tweet ID, author, and content</li>
              <li>• Like and retweet counts</li>
              <li>• Timestamp and engagement metrics</li>
              <li>• Media attachments (if any)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
