import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { teamsQuery, transfersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/transfers")({
  head: () => ({
    meta: [
      { title: "Transfers — LALIGA" },
      {
        name: "description",
        content: "LaLiga transfer moves club by club: incoming and outgoing players with dates and fees.",
      },
      { property: "og:title", content: "Transfers — LALIGA" },
      { property: "og:description", content: "Every LaLiga in and out, club by club." },
    ],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  const { data: profile } = useProfile();
  const { data: teams } = useQuery(teamsQuery());
  const [teamId, setTeamId] = useState(0);

  useEffect(() => {
    if (teamId === 0 && profile?.favorite_team_id) setTeamId(profile.favorite_team_id);
  }, [profile?.favorite_team_id, teamId]);

  const activeId = teamId || (teams?.[0]?.team.id ?? 0);
  const { data: transfers, isLoading } = useQuery(transfersQuery(activeId));

  const moves = (transfers ?? [])
    .flatMap((entry) =>
      entry.transfers.map((move) => ({
        player: entry.player.name,
        date: move.date,
        type: move.type,
        in: move.teams.in,
        out: move.teams.out,
      })),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 60);

  return (
    <AppShell>
      <h1 className="reveal text-4xl">Transfers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ins and outs for every LaLiga club, newest first.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(teams ?? []).map((entry) => (
          <Button
            key={entry.team.id}
            size="sm"
            variant={entry.team.id === activeId ? "default" : "outline"}
            className="press gap-2"
            onClick={() => setTeamId(entry.team.id)}
          >
            <img src={entry.team.logo} alt="" className="size-4" />
            {entry.team.name}
          </Button>
        ))}
      </div>

      <div className="stagger mt-6 space-y-2">
        {moves.map((move, index) => (
          <div
            key={`${move.player}-${move.date}-${index}`}
            className="surface-panel lift flex flex-wrap items-center gap-3 p-4"
          >
            <ArrowLeftRight className="size-4 text-primary" />
            <span className="font-semibold">{move.player}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={move.out.logo} alt="" className="size-4" />
              {move.out.name} → <img src={move.in.logo} alt="" className="size-4" />
              {move.in.name}
            </span>
            <span className="ml-auto text-xs uppercase text-muted-foreground">
              {move.type ?? "—"} · {move.date}
            </span>
          </div>
        ))}
      </div>

      {!isLoading && moves.length === 0 && (
        <div className="surface-panel pop mt-5 p-6 text-sm text-muted-foreground">
          No transfer activity reported for this club yet.
        </div>
      )}
    </AppShell>
  );
}
