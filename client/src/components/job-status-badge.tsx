import { Badge } from "@/components/ui/badge";
import { Clock, Play, CheckCircle, XCircle } from "lucide-react";

type JobStatus = "queued" | "running" | "completed" | "failed";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig = {
  queued: {
    label: "Queued",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  running: {
    label: "Running",
    variant: "default" as const,
    icon: Play,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

export function JobStatusBadge({ status, className = "" }: JobStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className} flex items-center gap-1`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
