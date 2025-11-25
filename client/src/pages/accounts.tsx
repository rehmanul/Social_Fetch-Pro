import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TwitterAccount, InstagramCredential } from "@shared/schema";
import { Plus, Trash2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Accounts() {
  const [isTwitterDialogOpen, setIsTwitterDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: twitterAccounts, isLoading: twitterLoading } = useQuery<TwitterAccount[]>({
    queryKey: ["/api/accounts/twitter"],
  });

  const { data: instagramAccount, isLoading: instagramLoading } = useQuery<InstagramCredential>({
    queryKey: ["/api/accounts/instagram"],
  });

  const addTwitterAccountMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email: string; emailPassword: string }) => {
      return apiRequest("POST", "/api/accounts/twitter", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/twitter"] });
      setIsTwitterDialogOpen(false);
      toast({
        title: "Account added",
        description: "Twitter account has been added to the swarm.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInstagramMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      return apiRequest("POST", "/api/accounts/instagram", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/instagram"] });
      toast({
        title: "Instagram account updated",
        description: "Your Instagram credentials have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTwitterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addTwitterAccountMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      email: formData.get("email") as string,
      emailPassword: formData.get("emailPassword") as string,
    });
  };

  const handleInstagramSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateInstagramMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "locked":
      case "challenge_required":
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case "banned":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Account Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage authentication credentials for platform scraping
        </p>
      </div>

      <Tabs defaultValue="twitter" className="w-full">
        <TabsList data-testid="tabs-accounts">
          <TabsTrigger value="twitter" data-testid="tab-twitter">Twitter Accounts</TabsTrigger>
          <TabsTrigger value="instagram" data-testid="tab-instagram">Instagram Account</TabsTrigger>
        </TabsList>

        <TabsContent value="twitter" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Twitter Account Swarm</CardTitle>
                <Dialog open={isTwitterDialogOpen} onOpenChange={setIsTwitterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-twitter">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Twitter Account</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTwitterSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          placeholder="@username"
                          required
                          data-testid="input-twitter-username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          data-testid="input-twitter-password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          data-testid="input-twitter-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailPassword">Email Password</Label>
                        <Input
                          id="emailPassword"
                          name="emailPassword"
                          type="password"
                          required
                          data-testid="input-twitter-email-password"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={addTwitterAccountMutation.isPending}
                        data-testid="button-submit-twitter"
                      >
                        {addTwitterAccountMutation.isPending ? "Adding..." : "Add Account"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {twitterLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : twitterAccounts && twitterAccounts.length > 0 ? (
                <div className="space-y-2">
                  {twitterAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                      data-testid={`twitter-account-${account.id}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            @{account.username}
                          </span>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getStatusIcon(account.status)}
                            <span className="capitalize">{account.status}</span>
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {account.email} · {account.loginCount} logins
                        </p>
                        {account.lastUsed && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Last used: {new Date(account.lastUsed).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-delete-twitter-${account.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">No Twitter accounts configured</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add accounts to enable Twitter scraping
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Instagram Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              {instagramLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <form onSubmit={handleInstagramSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="ig-username">Username</Label>
                    <Input
                      id="ig-username"
                      name="username"
                      defaultValue={instagramAccount?.username || ""}
                      placeholder="Instagram username"
                      required
                      data-testid="input-instagram-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ig-password">Password</Label>
                    <Input
                      id="ig-password"
                      name="password"
                      type="password"
                      placeholder="Instagram password"
                      required
                      data-testid="input-instagram-password"
                    />
                  </div>
                  {instagramAccount && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(instagramAccount.status)}
                        <span className="text-sm font-medium capitalize">
                          Status: {instagramAccount.status}
                        </span>
                      </div>
                      {instagramAccount.lastUsed && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last used: {new Date(instagramAccount.lastUsed).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateInstagramMutation.isPending}
                    data-testid="button-submit-instagram"
                  >
                    {updateInstagramMutation.isPending ? "Saving..." : "Save Credentials"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
