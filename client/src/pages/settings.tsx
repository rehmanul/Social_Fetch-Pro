import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure application preferences</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-retry">Auto-retry Failed Jobs</Label>
              <p className="text-sm text-muted-foreground">
                Automatically retry failed scraping jobs
              </p>
            </div>
            <Switch id="auto-retry" data-testid="switch-auto-retry" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show desktop notifications for job completion
              </p>
            </div>
            <Switch id="notifications" data-testid="switch-notifications" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cache">Enable Result Caching</Label>
              <p className="text-sm text-muted-foreground">
                Cache results to minimize redundant API calls
              </p>
            </div>
            <Switch id="cache" defaultChecked data-testid="switch-cache" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proxy">Use Proxy Rotation</Label>
              <p className="text-sm text-muted-foreground">
                Rotate residential proxies for scraping requests
              </p>
            </div>
            <Switch id="proxy" data-testid="switch-proxy" />
          </div>
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
              <span className="text-sm text-muted-foreground">License</span>
              <span className="text-sm font-medium">MIT</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
