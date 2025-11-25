import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JsonViewer } from "@/components/json-viewer";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Instagram, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScrapeInstagram() {
  const [result, setResult] = useState<any>(null);
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const scrapeMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/scrape/instagram", { username });
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus(data.status);
      if (data.result) {
        setResult(data.result);
      }
      toast({
        title: "Scraping started",
        description: "Instagram profile data is being extracted.",
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
    const username = formData.get("username") as string;
    setResult(null);
    setJobId("");
    setStatus("");
    scrapeMutation.mutate(username);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
            <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Instagram Scraper</h1>
            <p className="text-sm text-muted-foreground">Mobile API Emulation</p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Session Management</AlertTitle>
        <AlertDescription>
          Instagram scraping uses mobile API emulation with persistent sessions.
          Configure your Instagram credentials in the Accounts page.
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="username"
                  required
                  data-testid="input-instagram-username"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter an Instagram username (without @)
                </p>
              </div>

              <div>
                <Label htmlFor="amount">Media Count</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="20"
                  defaultValue="20"
                  min="1"
                  max="100"
                  data-testid="input-instagram-amount"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={scrapeMutation.isPending}
                data-testid="button-submit-instagram"
              >
                {scrapeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Profile"
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
                <Instagram className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No results yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a username to see media
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
            <h4 className="text-sm font-medium text-foreground">Mobile API Emulation</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Uses instagrapi to mimic the official Instagram Android app, bypassing
              web-based login redirects and avoiding browser detection.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Extracted Data</h4>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              <li>• Media ID and type (photo/video/album)</li>
              <li>• Caption and hashtags</li>
              <li>• Like and comment counts</li>
              <li>• Timestamp and location (if available)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
