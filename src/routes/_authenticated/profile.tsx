import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — LALIGA" },
      {
        name: "description",
        content: "Your LALIGA account: the club and player you follow, plus sign-out.",
      },
      { property: "og:title", content: "Your profile — LALIGA" },
      { property: "og:description", content: "Manage your LALIGA account and favourites." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <h1 className="text-4xl">Profile</h1>

      <div className="surface-panel mt-5 p-6">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="text-lg font-semibold">{profile?.display_name ?? "LaLiga fan"}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs uppercase text-muted-foreground">Club</p>
            <div className="mt-2 flex items-center gap-3">
              {profile?.favorite_team_logo && (
                <img src={profile.favorite_team_logo} alt="" className="size-10 object-contain" />
              )}
              <span className="font-semibold">{profile?.favorite_team_name ?? "Not chosen"}</span>
            </div>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs uppercase text-muted-foreground">Player</p>
            <div className="mt-2 flex items-center gap-3">
              {profile?.favorite_player_photo && (
                <img
                  src={profile.favorite_player_photo}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              )}
              <span className="font-semibold">{profile?.favorite_player_name ?? "Not chosen"}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/onboarding">
            <Button variant="outline">Change club or player</Button>
          </Link>
          <Link to="/alerts">
            <Button variant="outline">Notification settings</Button>
          </Link>
          <Button variant="destructive" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
