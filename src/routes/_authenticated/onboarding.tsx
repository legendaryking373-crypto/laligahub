import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { scorersQuery, teamsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Choose your club — LALIGA" },
      {
        name: "description",
        content: "Pick the LaLiga club and player you follow to personalise scores, stats and alerts.",
      },
      { property: "og:title", content: "Choose your club — LALIGA" },
      { property: "og:description", content: "Personalise your LALIGA matchday feed." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const save = useSaveProfile();
  const { data: teams, isLoading: teamsLoading } = useQuery(teamsQuery());
  const { data: scorers } = useQuery(scorersQuery());

  const [step, setStep] = useState<1 | 2>(1);
  const [teamId, setTeamId] = useState<number | null>(profile?.favorite_team_id ?? null);
  const [playerFilter, setPlayerFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedTeam = (teams ?? []).find((t) => t.team.id === teamId);

  const players = (scorers ?? []).filter((entry) => {
    const line = entry.statistics[0];
    const matchesTeam = !teamId || line?.team.id === teamId;
    const matchesText = entry.player.name.toLowerCase().includes(playerFilter.toLowerCase());
    return (playerFilter ? matchesText : matchesTeam || true) && matchesText;
  });

  const teamPlayers = players.filter((p) => !teamId || p.statistics[0]?.team.id === teamId);
  const shownPlayers = playerFilter ? players : teamPlayers.length > 0 ? teamPlayers : players;

  async function finish(player?: { id: number; name: string; photo: string }) {
    if (!selectedTeam) return;
    setBusy(true);
    try {
      await save({
        favorite_team_id: selectedTeam.team.id,
        favorite_team_name: selectedTeam.team.name,
        favorite_team_logo: selectedTeam.team.logo,
        favorite_player_id: player?.id ?? null,
        favorite_player_name: player?.name ?? null,
        favorite_player_photo: player?.photo ?? null,
        onboarded: true,
      });
      navigate({ to: "/home" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your choices");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <BrandMark size={36} />

      {step === 1 ? (
        <>
          <h1 className="mt-8 text-4xl">Pick your club</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll pin their fixtures, form and goal alerts to the top of your feed.
          </p>

          {teamsLoading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading LaLiga clubs…</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {(teams ?? []).map((entry) => (
                <button
                  key={entry.team.id}
                  type="button"
                  onClick={() => setTeamId(entry.team.id)}
                  className={cn(
                    "surface-panel flex flex-col items-center gap-2 p-4 transition-all hover:border-primary/60",
                    teamId === entry.team.id && "border-primary shadow-brand",
                  )}
                >
                  <img src={entry.team.logo} alt="" className="size-12 object-contain" />
                  <span className="text-center text-xs font-semibold">{entry.team.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              className="font-bold uppercase"
              disabled={!teamId}
              onClick={() => setStep(2)}
            >
              Next: pick a player
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-4xl">Pick a player to follow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Top scorers first — search to find anyone else in the list.
          </p>

          <Input
            className="mt-5 max-w-sm"
            placeholder="Search players…"
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shownPlayers.slice(0, 24).map((entry) => (
              <button
                key={entry.player.id}
                type="button"
                disabled={busy}
                onClick={() =>
                  finish({
                    id: entry.player.id,
                    name: entry.player.name,
                    photo: entry.player.photo,
                  })
                }
                className="surface-panel flex items-center gap-3 p-3 text-left transition-all hover:border-primary/60"
              >
                <img src={entry.player.photo} alt="" className="size-12 rounded-full object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{entry.player.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.statistics[0]?.team.name} · {entry.statistics[0]?.goals.total ?? 0} goals
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => finish()}>
              Skip for now
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
