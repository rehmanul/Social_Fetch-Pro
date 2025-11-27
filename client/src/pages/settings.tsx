import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Settings } from "@shared/schema";

type ApiSettings = Omit<Settings, "updatedAt"> & { updatedAt?: string };

function normalizeSettings(settings: ApiSettings): Settings {
  return {
    ...settings,
    updatedAt: settings.updatedAt ? new Date(settings.updatedAt) : undefined,
  };
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading, error } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings");
      const payload = (await res.json()) as ApiSettings;
      return normalizeSettings(payload);
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: Partial<Settings>) => {
      const res = await apiRequest("PUT", "/api/settings", payload);
      const body = (await res.json()) as ApiSettings;
      return normalizeSettings(body);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings"], data);
      toast({
        title: "Settings saved",
        description: "Preferences updated and persisted on the server.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : "Unexpected error",
      });
    },
  });

  const toggleSetting = (key: keyof Omit<Settings, "updatedAt">) => {
    if (!settings) return;
    mutate({ [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure application preferences
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="auto-retry"
            label="Auto-retry Failed Jobs"
            description="Automatically retry failed scraping jobs."
            checked={settings?.autoRetry ?? false}
            disabled={isLoading || isPending}
            onCheckedChange={() => toggleSetting("autoRetry")}
          />
          <SettingRow
            id="notifications"
            label="Enable Notifications"
            description="Show desktop notifications for job completion."
            checked={settings?.notifications ?? false}
            disabled={isLoading || isPending}
            onCheckedChange={() => toggleSetting("notifications")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="cache"
            label="Enable Result Caching"
            description="Cache results to minimize redundant platform requests."
            checked={settings?.cacheResults ?? false}
            disabled={isLoading || isPending}
            onCheckedChange={() => toggleSetting("cacheResults")}
          />
          <SettingRow
            id="proxy"
            label="Use Proxy Rotation"
            description="Rotate residential proxies for scraping requests."
            checked={settings?.proxyRotation ?? false}
            disabled={isLoading || isPending}
            onCheckedChange={() => toggleSetting("proxyRotation")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">2025.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Build</span>
              <span className="text-sm font-medium">Production</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Config status</span>
              <span className="text-sm font-medium">
                {isLoading
                  ? "Loading…"
                  : error
                    ? "Load failed"
                    : "Saved"}
              </span>
            </div>
            {settings?.updatedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm font-medium">
                  {settings.updatedAt.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type SettingRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: () => void;
};

function SettingRow({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        data-testid={`switch-${id}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
