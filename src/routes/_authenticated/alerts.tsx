import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  requestNotificationPermission,
  useAlertActions,
  useAlerts,
} from "@/hooks/useAlerts";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — LALIGA" },
      {
        name: "description",
        content: "Manage LaLiga goal, kick-off and news notifications and read your alert history.",
      },
      { property: "og:title", content: "Alerts — LALIGA" },
      { property: "og:description", content: "Goal and kick-off notifications for your club." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data: alerts } = useAlerts();
  const { markAllRead, clearAll, push } = useAlertActions();
  const { data: profile } = useProfile();
  const save = useSaveProfile();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  async function toggle(key: "notify_goals" | "notify_kickoff" | "notify_news", value: boolean) {
    try {
      await save({ [key]: value });
    } catch {
      toast.error("Could not save that setting");
    }
  }

  async function enableBrowserPush() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Browser notifications enabled");
      await push({ title: "Notifications on", body: "You'll get goal alerts here.", kind: "info" });
    } else {
      toast.error("Your browser blocked notifications");
    }
  }

  const settings = [
    ["notify_goals", "Goal alerts", "Every goal in your club's matches."],
    ["notify_kickoff", "Kick-off reminders", "A nudge before your club plays."],
    ["notify_news", "News alerts", "Big headlines about your club."],
  ] as const;

  return (
    <AppShell>
      <h1 className="text-4xl">Alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        In-app alerts plus real browser notifications for {profile?.favorite_team_name ?? "your club"}.
      </p>

      <section className="surface-panel mt-5 p-5">
        <h2 className="text-lg uppercase tracking-wide">Notification settings</h2>
        <div className="mt-4 space-y-4">
          {settings.map(([key, label, description]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={Boolean(profile?.[key])}
                onCheckedChange={(value) => void toggle(key, value)}
              />
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-5" onClick={enableBrowserPush}>
          {permission === "granted" ? "Browser notifications on" : "Enable browser notifications"}
        </Button>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg uppercase tracking-wide">History</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void clearAll()}>
              Clear
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {(alerts ?? []).map((alert) => (
            <div
              key={alert.id}
              className={cn("surface-panel p-4", !alert.read && "border-primary/60")}
            >
              <p className="text-sm font-semibold">{alert.title}</p>
              {alert.body && <p className="text-xs text-muted-foreground">{alert.body}</p>}
              <p className="mt-1 text-[11px] uppercase text-muted-foreground">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {(alerts ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No alerts yet.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
