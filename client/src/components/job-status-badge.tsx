import { Badge } from "@/components/ui/badge";
import { Clock, Play, CheckCircle, XCircle } from "lucide-react";

type JobStatus = "queued" | "running" | "completed" | "failed" | "success" | string;

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: any; icon: any; className: string }> = {
  queued: {
    label: "Queued",
    variant: "secondary",
    icon: Clock,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  running: {
    label: "Running",
    variant: "default",
    icon: Play,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  success: {
    label: "Success",
    variant: "default",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

export function JobStatusBadge({ status, className = "" }: JobStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: "secondary",
    icon: Clock,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
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
