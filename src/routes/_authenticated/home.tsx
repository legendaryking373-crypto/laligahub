import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { AppShell } from "@/components/AppShell";
import { FixtureCard } from "@/components/FixtureCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notifyBrowser, useAlertActions } from "@/hooks/useAlerts";
import { useProfile } from "@/hooks/useProfile";
import { isFinished, isLive, type Fixture } from "@/lib/laliga-types";
import {
  fixturesQuery,
  liveQuery,
  newsQuery,
  scorersQuery,
  standingsQuery,
  upcomingQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Matchday — LALIGA" },
      {
        name: "description",
        content: "Your LaLiga matchday: live scores, your club's next fixture, player form and headlines.",
      },
      { property: "og:title", content: "Matchday — LALIGA" },
      { property: "og:description", content: "Live LaLiga scores and your club's latest." },
    ],
  }),
  component: HomePage,
});

function useLiveGoalAlerts(live: Fixture[] | undefined, teamId: number | null | undefined) {
  const { push } = useAlertActions();
  const seen = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (!live || !teamId) return;
    for (const fixture of live) {
      const involves = fixture.teams.home.id === teamId || fixture.teams.away.id === teamId;
      if (!involves) continue;
      const key = `${fixture.goals.home}-${fixture.goals.away}`;
      const previous = seen.current.get(fixture.fixture.id);
      seen.current.set(fixture.fixture.id, key);
      if (previous && previous !== key) {
        const title = `GOAL! ${fixture.teams.home.name} ${fixture.goals.home} - ${fixture.goals.away} ${fixture.teams.away.name}`;
        void push({ title, body: `${fixture.fixture.status.elapsed ?? 0}' · LaLiga`, kind: "goal" });
        notifyBrowser(title, "LALIGA live update");
      }
    }
  }, [live, teamId, push]);
}

function HomePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: live } = useQuery(liveQuery());
  const { data: fixtures } = useQuery(fixturesQuery());
  const { data: standings } = useQuery(standingsQuery());
  const { data: scorers } = useQuery(scorersQuery());
  const { data: news } = useQuery(newsQuery());
  const { data: nextUp } = useQuery(upcomingQuery());

  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarded) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, profileLoading, navigate]);

  useLiveGoalAlerts(live, profile?.favorite_team_id);

  const teamId = profile?.favorite_team_id ?? null;
  const teamFixtures = (fixtures ?? []).filter(
    (f) => f.teams.home.id === teamId || f.teams.away.id === teamId,
  );
  const nextFixture =
    (nextUp ?? []).find((f) => f.teams.home.id === teamId || f.teams.away.id === teamId) ??
    teamFixtures.find((f) => !isFinished(f) && !isLive(f));
  const lastResults = teamFixtures.filter(isFinished).slice(-3).reverse();
  const upcoming = (nextUp && nextUp.length > 0
    ? nextUp
    : (fixtures ?? []).filter((f) => !isFinished(f) && !isLive(f))
  ).slice(0, 4);
  const myRow = (standings?.rows ?? []).find((row) => row.team.id === teamId);
  const myPlayer = (scorers ?? []).find((p) => p.player.id === profile?.favorite_player_id);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-4xl">
            {profile?.favorite_team_name ? (
              <>
                <span className="text-display">Hala</span>{" "}
                <span className="text-display text-primary">{profile.favorite_team_name}</span>
              </>
            ) : (
              <span className="text-display">Matchday</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Season{" "}
            {standings?.season
              ? `${standings.season}/${String((standings.season + 1) % 100).padStart(2, "0")}`
              : "—"}{" "}
            · {live?.length ?? 0} match
            {(live?.length ?? 0) === 1 ? "" : "es"} live right now
          </p>
        </div>
        <Link to="/onboarding">
          <Button variant="outline" size="sm" className="press">
            Change club or player
          </Button>
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg uppercase tracking-wide">
          <span className="live-ring inline-block size-2 rounded-full bg-live" />
          Live now
        </h2>
        {live && live.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 stagger">
            {live.map((fixture) => (
              <FixtureCard
                key={fixture.fixture.id}
                fixture={fixture}
                highlightTeamId={teamId}
                showProbability
              />
            ))}
          </div>
        ) : (
          <div className="surface-panel pop p-5 text-sm text-muted-foreground">
            No LaLiga match is in play right now. Upcoming kick-offs are below.
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3 stagger">
        <section className="lg:col-span-2 space-y-6">
          {nextFixture && (
            <div>
              <h2 className="mb-3 text-lg uppercase tracking-wide">
                Next up for {profile?.favorite_team_name}
              </h2>
              <FixtureCard fixture={nextFixture} highlightTeamId={teamId} showProbability />
            </div>
          )}

          {lastResults.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg uppercase tracking-wide">Recent results</h2>
              <div className="grid gap-3 sm:grid-cols-2 stagger">
                {lastResults.map((fixture) => (
                  <FixtureCard key={fixture.fixture.id} fixture={fixture} highlightTeamId={teamId} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg uppercase tracking-wide">Around the league</h2>
            <div className="grid gap-3 sm:grid-cols-2 stagger">
              {upcoming.map((fixture) => (
                <FixtureCard
                  key={fixture.fixture.id}
                  fixture={fixture}
                  highlightTeamId={teamId}
                  showProbability
                />
              ))}
            </div>
            {upcoming.length === 0 && (
              <div className="surface-panel p-5 text-sm text-muted-foreground">
                No kick-offs scheduled yet — fixtures appear as soon as the next round is released.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          {myRow && (
            <div className="surface-panel lift p-5">
              <h2 className="text-lg uppercase tracking-wide">Table position</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-stat text-5xl text-primary">{myRow.rank}</span>
                <div className="text-sm">
                  <p className="font-semibold">{myRow.points} pts</p>
                  <p className="text-muted-foreground">
                    {myRow.all.win}W {myRow.all.draw}D {myRow.all.lose}L · GD{" "}
                    {myRow.goalsDiff > 0 ? `+${myRow.goalsDiff}` : myRow.goalsDiff}
                  </p>
                </div>
              </div>
              {myRow.form && (
                <div className="mt-3 flex gap-1">
                  {myRow.form.split("").map((result, index) => (
                    <span
                      key={`${result}-${index}`}
                      className={`flex size-6 items-center justify-center rounded text-xs font-bold ${
                        result === "W"
                          ? "bg-live text-live-foreground"
                          : result === "L"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              )}
              <Link to="/standings" className="mt-4 inline-block text-sm font-semibold text-primary">
                Full table →
              </Link>
            </div>
          )}

          {myPlayer && (
            <div className="surface-panel lift p-5">
              <h2 className="text-lg uppercase tracking-wide">Your player</h2>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={myPlayer.player.photo}
                  alt=""
                  className="size-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{myPlayer.player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {myPlayer.statistics[0]?.team.name} · {myPlayer.statistics[0]?.games.position}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Goals", value: myPlayer.statistics[0]?.goals.total ?? 0 },
                  { label: "Assists", value: myPlayer.statistics[0]?.goals.assists ?? 0 },
                  { label: "Rating", value: Number(myPlayer.statistics[0]?.games.rating ?? 0).toFixed(1) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-md bg-secondary p-2">
                    <p className="text-stat text-xl">{stat.value}</p>
                    <p className="text-[11px] uppercase text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <Link to="/players" className="mt-4 inline-block text-sm font-semibold text-primary">
                All player stats →
              </Link>
            </div>
          )}

          <div className="surface-panel lift p-5">
            <h2 className="text-lg uppercase tracking-wide">Headlines</h2>
            <ul className="mt-3 space-y-3">
              {(news ?? []).slice(0, 5).map((item) => (
                <li key={item.link}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium hover:text-primary"
                  >
                    {item.title}
                  </a>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.source}</p>
                </li>
              ))}
              {(news ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">No headlines loaded yet.</li>
              )}
            </ul>
            <Link to="/news" className="mt-4 inline-block text-sm font-semibold text-primary">
              More news →
            </Link>
          </div>

          <div className="surface-panel lift p-5">
            <h2 className="text-lg uppercase tracking-wide">Alerts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Turn on goal and kick-off notifications for {profile?.favorite_team_name ?? "your club"}.
            </p>
            <Link to="/alerts">
              <Button variant="outline" size="sm" className="mt-3">
                Notification settings
              </Button>
            </Link>
            <Badge variant="secondary" className="mt-3 block w-fit">
              {profile?.notify_goals ? "Goal alerts on" : "Goal alerts off"}
            </Badge>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
