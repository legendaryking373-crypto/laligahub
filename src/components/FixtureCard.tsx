import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { predictionQuery } from "@/lib/queries";
import { isFinished, isLive, type Fixture } from "@/lib/laliga-types";
import { cn } from "@/lib/utils";
import { useState } from "react";

function kickoff(fixture: Fixture): string {
  return new Date(fixture.fixture.date).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProbabilityBar({ fixtureId }: { fixtureId: number }) {
  const { data, isLoading } = useQuery(predictionQuery(fixtureId));

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading win probability…</p>;
  }
  if (!data) {
    return <p className="text-xs text-muted-foreground">No probability model for this match.</p>;
  }

  const pct = (value: string) => Number(value.replace("%", "")) || 0;
  const home = pct(data.predictions.percent.home);
  const draw = pct(data.predictions.percent.draw);
  const away = pct(data.predictions.percent.away);

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <span style={{ width: `${home}%` }} className="bar-grow bg-primary" />
        <span style={{ width: `${draw}%`, animationDelay: "0.08s" }} className="bar-grow bg-muted-foreground/60" />
        <span style={{ width: `${away}%`, animationDelay: "0.16s" }} className="bar-grow bg-chart-3" />
      </div>
      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
        <span>Home {home}%</span>
        <span>Draw {draw}%</span>
        <span>Away {away}%</span>
      </div>
      {data.predictions.advice && (
        <p className="text-xs text-muted-foreground">Model tip: {data.predictions.advice}</p>
      )}
    </div>
  );
}

export function FixtureCard({
  fixture,
  highlightTeamId,
  showProbability = false,
}: {
  fixture: Fixture;
  highlightTeamId?: number | null;
  showProbability?: boolean;
}) {
  const [showProb, setShowProb] = useState(showProbability);
  const live = isLive(fixture);
  const done = isFinished(fixture);
  const { home, away } = fixture.teams;
  const involves = highlightTeamId === home.id || highlightTeamId === away.id;

  return (
    <article
      className={cn(
        "surface-panel lift group p-4",
        involves && "border-primary/60 shadow-brand",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fixture.league.round}
        </span>
        {live ? (
          <Badge className="gap-1 bg-live text-live-foreground hover:bg-live">
            <span className="live-ring pulse-live size-1.5 rounded-full bg-live-foreground" />
            {fixture.fixture.status.elapsed ?? 0}&rsquo;
          </Badge>
        ) : done ? (
          <Badge variant="secondary">Full time</Badge>
        ) : (
          <Badge variant="outline">{kickoff(fixture)}</Badge>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={home.logo} alt="" className="size-8 shrink-0 object-contain transition-transform duration-300 group-hover:scale-110" />
          <span className="truncate text-sm font-semibold">{home.name}</span>
        </div>
        <div className="text-stat pop text-2xl tabular-nums">
          {fixture.goals.home ?? "–"}
          <span className="mx-1 text-muted-foreground">:</span>
          {fixture.goals.away ?? "–"}
        </div>
        <div className="flex items-center justify-end gap-2 overflow-hidden">
          <span className="truncate text-right text-sm font-semibold">{away.name}</span>
          <img src={away.logo} alt="" className="size-8 shrink-0 object-contain transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {fixture.fixture.venue.name ?? "Venue TBC"}
          {fixture.fixture.venue.city ? ` · ${fixture.fixture.venue.city}` : ""}
        </span>
        {!showProb && (
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowProb(true)}>
            Probability
          </Button>
        )}
      </div>

      {showProb && (
        <div className="mt-3 border-t border-border pt-3">
          <ProbabilityBar fixtureId={fixture.fixture.id} />
        </div>
      )}
    </article>
  );
}
