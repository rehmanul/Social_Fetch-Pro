import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JsonViewer } from "@/components/json-viewer";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Video, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScrapeTikTok() {
  const [result, setResult] = useState<any>(null);
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const scrapeMutation = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest("POST", "/api/scrape/tiktok", { url });
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus(data.status);
      if (data.result) {
        setResult(data.result);
      }
      toast({
        title: "Scraping started",
        description: "TikTok video data is being extracted with hybrid signing.",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Video className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">TikTok Scraper</h1>
            <p className="text-sm text-muted-foreground">Hybrid Signing Architecture</p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cryptographic Signing</AlertTitle>
        <AlertDescription>
          TikTok uses sophisticated client-side cryptography. This scraper employs a
          Node.js sidecar service for X-Bogus signature generation.
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
                <Label htmlFor="url">Video URL</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://www.tiktok.com/@user/video/..."
                  required
                  data-testid="input-tiktok-url"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter a TikTok video URL
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
                    Scraping...
                  </>
                ) : (
                  "Start Scraping"
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
                <Video className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No results yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a URL to see video data
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
            <h4 className="text-sm font-medium text-foreground">Hybrid Architecture</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Python backend calls a Node.js sidecar service to generate X-Bogus and
              signature headers required by TikTok's API. This bypasses the cryptographic
              verification that Python alone cannot handle.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Extracted Data</h4>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              <li>• Video ID and metadata</li>
              <li>• View, like, and comment counts</li>
              <li>• Creator information</li>
              <li>• Music and effects details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
