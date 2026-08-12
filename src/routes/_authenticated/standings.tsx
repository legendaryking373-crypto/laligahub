import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { standingsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/standings")({
  head: () => ({
    meta: [
      { title: "LaLiga table — LALIGA" },
      {
        name: "description",
        content: "Full LaLiga standings: points, played, won, drawn, lost, goal difference and form.",
      },
      { property: "og:title", content: "LaLiga table — LALIGA" },
      { property: "og:description", content: "Live LaLiga standings and form guide." },
    ],
  }),
  component: StandingsPage,
});

function StandingsPage() {
  const { data, isLoading } = useQuery(standingsQuery());
  const { data: profile } = useProfile();

  return (
    <AppShell>
      <h1 className="reveal text-4xl">Table</h1>
      <p className="reveal mt-1 text-sm text-muted-foreground">
        Season {data?.season ? `${data.season}/${String((data.season + 1) % 100).padStart(2, "0")}` : "—"}
      </p>

      <div className="surface-panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">#</th>
              <th className="p-3">Club</th>
              <th className="p-3 text-center">P</th>
              <th className="p-3 text-center">W</th>
              <th className="p-3 text-center">D</th>
              <th className="p-3 text-center">L</th>
              <th className="p-3 text-center">GF</th>
              <th className="p-3 text-center">GA</th>
              <th className="p-3 text-center">GD</th>
              <th className="p-3 text-center">Pts</th>
              <th className="p-3">Form</th>
            </tr>
          </thead>
          <tbody className="stagger">
            {(data?.rows ?? []).map((row) => (
              <tr
                key={row.team.id}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/70",
                  row.team.id === profile?.favorite_team_id && "bg-accent/40",
                )}
              >
                <td className="p-3 text-stat">{row.rank}</td>
                <td className="p-3">
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: String(row.team.id) }}
                    className="flex items-center gap-2 font-semibold hover:text-primary"
                  >
                    <img src={row.team.logo} alt="" className="size-6 object-contain" />
                    <span className="truncate">{row.team.name}</span>
                  </Link>
                </td>
                <td className="p-3 text-center tabular-nums">{row.all.played}</td>
                <td className="p-3 text-center tabular-nums">{row.all.win}</td>
                <td className="p-3 text-center tabular-nums">{row.all.draw}</td>
                <td className="p-3 text-center tabular-nums">{row.all.lose}</td>
                <td className="p-3 text-center tabular-nums">{row.all.goals.for}</td>
                <td className="p-3 text-center tabular-nums">{row.all.goals.against}</td>
                <td className="p-3 text-center tabular-nums">
                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                </td>
                <td className="p-3 text-center text-stat">{row.points}</td>
                <td className="p-3">
                  <span className="flex gap-1">
                    {(row.form ?? "").split("").map((result, index) => (
                      <span
                        key={`${result}-${index}`}
                        className={cn(
                          "flex size-5 items-center justify-center rounded text-[10px] font-bold",
                          result === "W" && "bg-live text-live-foreground",
                          result === "L" && "bg-primary text-primary-foreground",
                          result === "D" && "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {result}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="p-5 text-sm text-muted-foreground">Loading the table…</p>}
      </div>
    </AppShell>
  );
}
