import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { FixtureCard } from "@/components/FixtureCard";
import { Button } from "@/components/ui/button";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { isFinished, isLive } from "@/lib/laliga-types";
import { fixturesQuery, squadQuery, standingsQuery, teamsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/teams/$teamId")({
  head: () => ({
    meta: [
      { title: "Club profile — LALIGA" },
      {
        name: "description",
        content: "LaLiga club profile: squad list, league record, fixtures and results.",
      },
      { property: "og:title", content: "Club profile — LALIGA" },
      { property: "og:description", content: "Squad, record and fixtures for this LaLiga club." },
    ],
  }),
  component: TeamDetail,
});

function TeamDetail() {
  const { teamId } = Route.useParams();
  const id = Number(teamId);
  const { data: teams } = useQuery(teamsQuery());
  const { data: standings } = useQuery(standingsQuery());
  const { data: fixtures } = useQuery(fixturesQuery());
  const { data: squad } = useQuery(squadQuery(id));
  const { data: profile } = useProfile();
  const save = useSaveProfile();

  const entry = (teams ?? []).find((t) => t.team.id === id);
  const row = standings?.rows.find((r) => r.team.id === id);
  const teamFixtures = (fixtures ?? []).filter(
    (f) => f.teams.home.id === id || f.teams.away.id === id,
  );
  const next = teamFixtures.filter((f) => !isFinished(f) && !isLive(f)).slice(0, 3);
  const recent = teamFixtures.filter(isFinished).reverse().slice(0, 3);
  const isFollowing = profile?.favorite_team_id === id;

  async function follow() {
    if (!entry) return;
    try {
      await save({
        favorite_team_id: entry.team.id,
        favorite_team_name: entry.team.name,
        favorite_team_logo: entry.team.logo,
      });
      toast.success(`You now follow ${entry.team.name}`);
    } catch {
      toast.error("Could not update your club");
    }
  }

  return (
    <AppShell>
      <div className="surface-panel flex flex-wrap items-center gap-4 p-6">
        {entry && <img src={entry.team.logo} alt="" className="size-20 object-contain" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">{entry?.team.name ?? "Club"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entry?.venue?.name ?? "—"} · Founded {entry?.team.founded ?? "—"}
          </p>
        </div>
        <Button onClick={follow} disabled={isFollowing} className="font-bold uppercase">
          {isFollowing ? "Following" : "Follow club"}
        </Button>
      </div>

      {row && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Rank", row.rank],
            ["Points", row.points],
            ["Played", row.all.played],
            ["Won", row.all.win],
            ["Drawn", row.all.draw],
            ["Lost", row.all.lose],
            ["Goal diff", row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff],
          ].map(([label, value]) => (
            <div key={String(label)} className="surface-panel p-4 text-center">
              <p className="text-stat text-2xl text-primary">{value}</p>
              <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg uppercase tracking-wide">Next fixtures</h2>
          <div className="space-y-3">
            {next.map((fixture) => (
              <FixtureCard key={fixture.fixture.id} fixture={fixture} highlightTeamId={id} />
            ))}
            {next.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming fixtures listed.</p>
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg uppercase tracking-wide">Recent results</h2>
          <div className="space-y-3">
            {recent.map((fixture) => (
              <FixtureCard key={fixture.fixture.id} fixture={fixture} highlightTeamId={id} />
            ))}
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">No results yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg uppercase tracking-wide">Squad</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(squad ?? []).map((player) => (
            <div key={player.id} className="surface-panel flex items-center gap-3 p-3">
              <img src={player.photo} alt="" className="size-12 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{player.name}</p>
                <p className="text-xs text-muted-foreground">
                  {player.position}
                  {player.number ? ` · #${player.number}` : ""}
                  {player.age ? ` · ${player.age}y` : ""}
                </p>
              </div>
            </div>
          ))}
          {(squad ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Squad list unavailable.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
