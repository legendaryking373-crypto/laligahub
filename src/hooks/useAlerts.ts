import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface Alert {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  read: boolean;
  created_at: string;
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async (): Promise<Alert[]> => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, title, body, kind, read, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
    staleTime: 1000 * 20,
  });
}

export function useAlertActions() {
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["alerts"] });

  return {
    async push(alert: { title: string; body?: string; kind?: string }) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      await supabase.from("alerts").insert({
        user_id: user.id,
        title: alert.title,
        body: alert.body ?? null,
        kind: alert.kind ?? "info",
      });
      await refresh();
    },
    async markAllRead() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      await supabase.from("alerts").update({ read: true }).eq("user_id", user.id).eq("read", false);
      await refresh();
    },
    async clearAll() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      await supabase.from("alerts").delete().eq("user_id", user.id);
      await refresh();
    },
  };
}

/** Fires a real OS-level notification when the user has granted permission. */
export function notifyBrowser(title: string, body?: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.png", tag: title });
  } catch {
    /* notification display is best-effort */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}
