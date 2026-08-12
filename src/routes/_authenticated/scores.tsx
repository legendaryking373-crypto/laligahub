import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FixtureCard } from "@/components/FixtureCard";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { isFinished, isLive } from "@/lib/laliga-types";
import { fixturesQuery, liveQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/scores")({
  head: () => ({
    meta: [
      { title: "Live scores & fixtures — LALIGA" },
      {
        name: "description",
        content: "LaLiga live scores, results and upcoming fixtures with win probability for every match.",
      },
      { property: "og:title", content: "Live scores & fixtures — LALIGA" },
      { property: "og:description", content: "Every LaLiga score, result and kick-off time." },
    ],
  }),
  component: ScoresPage,
});

type Tab = "live" | "upcoming" | "results";

function ScoresPage() {
  const [tab, setTab] = useState<Tab>("live");
  const { data: profile } = useProfile();
  const { data: live } = useQuery(liveQuery());
  const { data: fixtures } = useQuery(fixturesQuery());

  const upcoming = (fixtures ?? []).filter((f) => !isFinished(f) && !isLive(f)).slice(0, 30);
  const results = (fixtures ?? []).filter(isFinished).reverse().slice(0, 30);
  const list = tab === "live" ? (live ?? []) : tab === "upcoming" ? upcoming : results;

  return (
    <AppShell>
      <h1 className="reveal text-4xl">Scores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live matches refresh every minute. Tap “Probability” on any match for model odds.
      </p>

      <div className="mt-5 flex gap-2">
        {(
          [
            ["live", `Live (${live?.length ?? 0})`],
            ["upcoming", "Upcoming"],
            ["results", "Results"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={tab === value ? "default" : "outline"}
            size="sm"
            className="press font-bold uppercase"
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div key={tab} className="stagger mt-5 grid gap-3 md:grid-cols-2">
        {list.map((fixture) => (
          <FixtureCard
            key={fixture.fixture.id}
            fixture={fixture}
            highlightTeamId={profile?.favorite_team_id ?? null}
          />
        ))}
      </div>

      {list.length === 0 && (
        <div className="surface-panel pop mt-5 p-6 text-sm text-muted-foreground">
          {tab === "live"
            ? "No LaLiga match is in play right now."
            : "Nothing to show for this filter yet."}
        </div>
      )}
    </AppShell>
  );
}
