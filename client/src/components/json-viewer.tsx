import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonViewerProps {
  data: any;
  className?: string;
}

export function JsonViewer({ data, className = "" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "JSON data has been copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnifetch-result-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "JSON file is being downloaded.",
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={copyToClipboard}
          data-testid="button-copy-json"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={downloadJson}
          data-testid="button-download-json"
        >
          <Download className="h-3 w-3" />
          <span className="ml-1">Download</span>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <pre className="overflow-x-auto p-4 font-mono text-sm text-card-foreground">
          <code data-testid="json-content">{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
