import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";

interface ResultCardProps {
  title: string;
  description?: string;
  stats: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  author?: string;
  url?: string;
  image?: string;
  type?: string;
}

export function ResultCard({
  title,
  description,
  stats,
  author,
  url,
  image,
  type = "post",
}: ResultCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate active-elevate-2 transition-all">
      {image && (
        <div className="h-40 w-full overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>
            {author && (
              <p className="mt-1 text-xs text-muted-foreground">@{author}</p>
            )}
            {description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {type}
          </Badge>
        </div>

        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          {stats.views !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{stats.views.toLocaleString()}</span>
            </div>
          )}
          {stats.likes !== undefined && (
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{stats.likes.toLocaleString()}</span>
            </div>
          )}
          {stats.comments !== undefined && (
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{stats.comments.toLocaleString()}</span>
            </div>
          )}
          {stats.shares !== undefined && (
            <div className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              <span>{stats.shares.toLocaleString()}</span>
            </div>
          )}
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-primary hover:underline"
            data-testid="link-result"
          >
            View on Platform →
          </a>
        )}
      </CardContent>
    </Card>
  );
}
