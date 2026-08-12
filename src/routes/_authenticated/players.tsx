import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { assistsQuery, scorersQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/players")({
  head: () => ({
    meta: [
      { title: "Player stats — LALIGA" },
      {
        name: "description",
        content: "LaLiga player stats: top scorers, assist leaders, ratings, minutes, cards and shots.",
      },
      { property: "og:title", content: "Player stats — LALIGA" },
      { property: "og:description", content: "Top scorers and assist leaders in LaLiga." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const [board, setBoard] = useState<"goals" | "assists">("goals");
  const [search, setSearch] = useState("");
  const { data: scorers } = useQuery(scorersQuery());
  const { data: assists } = useQuery(assistsQuery());
  const { data: profile } = useProfile();
  const save = useSaveProfile();

  const list = (board === "goals" ? scorers : assists) ?? [];
  const filtered = list.filter((entry) =>
    entry.player.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function follow(player: { id: number; name: string; photo: string }) {
    try {
      await save({
        favorite_player_id: player.id,
        favorite_player_name: player.name,
        favorite_player_photo: player.photo,
      });
      toast.success(`You now follow ${player.name}`);
    } catch {
      toast.error("Could not update your player");
    }
  }

  return (
    <AppShell>
      <h1 className="reveal text-4xl">Players</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Season leaderboards with goals, assists, minutes, ratings and discipline.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(
          [
            ["goals", "Top scorers"],
            ["assists", "Top assists"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={board === value ? "default" : "outline"}
            className="press font-bold uppercase"
            onClick={() => setBoard(value)}
          >
            {label}
          </Button>
        ))}
        <Input
          className="ml-auto max-w-xs"
          placeholder="Search players…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div key={board} className="stagger mt-5 space-y-3">
        {filtered.map((entry, index) => {
          const line = entry.statistics[0];
          const isFollowing = profile?.favorite_player_id === entry.player.id;
          return (
            <div
              key={entry.player.id}
              className={cn(
                "surface-panel lift group flex flex-wrap items-center gap-4 p-4",
                isFollowing && "border-primary/70",
              )}
            >
              <span className="text-stat w-8 text-xl text-muted-foreground">{index + 1}</span>
              <img src={entry.player.photo} alt="" className="size-12 rounded-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="min-w-[9rem] flex-1">
                <p className="font-semibold">{entry.player.name}</p>
                <p className="text-xs text-muted-foreground">
                  {line?.team.name} · {line?.games.position ?? "—"} ·{" "}
                  {entry.player.nationality ?? "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["G", line?.goals.total ?? 0],
                  ["A", line?.goals.assists ?? 0],
                  ["Apps", line?.games.appearences ?? 0],
                  ["Min", line?.games.minutes ?? 0],
                  ["Rating", Number(line?.games.rating ?? 0).toFixed(1)],
                  ["YC", line?.cards.yellow ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-md bg-secondary px-3 py-1.5 text-center transition-colors group-hover:bg-accent">
                    <p className="text-stat text-sm">{value}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant={isFollowing ? "secondary" : "outline"}
                disabled={isFollowing}
                onClick={() =>
                  follow({
                    id: entry.player.id,
                    name: entry.player.name,
                    photo: entry.player.photo,
                  })
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No players match that search.</p>
        )}
      </div>
    </AppShell>
  );
}
