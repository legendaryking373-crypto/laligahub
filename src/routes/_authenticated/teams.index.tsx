import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { standingsQuery, teamsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/teams")({
  head: () => ({
    meta: [
      { title: "LaLiga clubs — LALIGA" },
      {
        name: "description",
        content: "All 20 LaLiga clubs with stadium, founding year, league position and squad stats.",
      },
      { property: "og:title", content: "LaLiga clubs — LALIGA" },
      { property: "og:description", content: "Browse every LaLiga club and their squad." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { data: teams, isLoading } = useQuery(teamsQuery());
  const { data: standings } = useQuery(standingsQuery());
  const [search, setSearch] = useState("");

  const rankOf = (id: number) => standings?.rows.find((row) => row.team.id === id)?.rank;
  const filtered = (teams ?? []).filter((entry) =>
    entry.team.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <h1 className="text-4xl">Clubs</h1>
      <Input
        className="mt-4 max-w-sm"
        placeholder="Search clubs…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading && <p className="mt-5 text-sm text-muted-foreground">Loading clubs…</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <Link
            key={entry.team.id}
            to="/teams/$teamId"
            params={{ teamId: String(entry.team.id) }}
            className="surface-panel flex items-center gap-4 p-4 transition-all hover:border-primary/60"
          >
            <img src={entry.team.logo} alt="" className="size-14 object-contain" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{entry.team.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {entry.venue?.name ?? "—"}
                {entry.venue?.capacity ? ` · ${entry.venue.capacity.toLocaleString()} seats` : ""}
              </p>
              {rankOf(entry.team.id) && (
                <p className="mt-1 text-xs font-semibold text-primary">
                  #{rankOf(entry.team.id)} in the table
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
