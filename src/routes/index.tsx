import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Activity, BarChart3, Bell, Newspaper, Trophy, Users } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LALIGA — Live Scores, Stats, Probabilities & News" },
      {
        name: "description",
        content:
          "Follow LaLiga live: real-time scores, match win probability, full standings, team and player stats, alerts for your club and news headlines.",
      },
      { property: "og:title", content: "LALIGA — Live Scores, Stats & News" },
      {
        property: "og:description",
        content:
          "Live LaLiga scores, win probability, standings, team and player stats, and alerts for the club you follow.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Activity, title: "Live scores", body: "Minute-by-minute goals, status and kick-off times." },
  { icon: BarChart3, title: "Win probability", body: "Model-backed home / draw / away odds per match." },
  { icon: Trophy, title: "Full table", body: "Standings, form, goal difference and European places." },
  { icon: Users, title: "Team & player stats", body: "Squads, ratings, goals, assists, cards, minutes." },
  { icon: Bell, title: "Push alerts", body: "Goal and kick-off notifications for the club you follow." },
  { icon: Newspaper, title: "News", body: "Fresh LaLiga headlines from across the football press." },
];

function Landing() {
  const navigate = useNavigate();

  // Signed-in visitors (including Google OAuth returns) land straight on the dashboard.
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) navigate({ to: "/home", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/home", replace: true });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4">
        <BrandMark size={40} className="float" />
        <Link to="/auth">
          <Button variant="ghost">Sign in</Button>
        </Link>
      </header>

      <section className="relative overflow-hidden">
        <div className="glow-breathe pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 text-center">
          <p className="reveal text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Spanish first division
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">
            <span className="reveal text-display inline-block">Every goal.</span>{" "}
            <span className="reveal text-display inline-block text-primary" style={{ animationDelay: "0.12s" }}>Every stat.</span>{" "}
            <span className="reveal text-display inline-block" style={{ animationDelay: "0.24s" }}>Every matchday.</span>
          </h1>
          <p className="reveal mx-auto mt-6 max-w-xl text-lg text-muted-foreground" style={{ animationDelay: "0.34s" }}>
            Live LaLiga scores, win probabilities, deep team and player numbers, and alerts for the
            club and player you follow.
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.44s" }}>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="press px-8 text-base font-bold uppercase tracking-wide shadow-brand">
                Create free account
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="press px-8 text-base font-bold uppercase">
                I already have one
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface-panel lift group p-5">
              <feature.icon className="size-6 text-primary transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" />
              <h2 className="mt-4 text-lg">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Unofficial fan app. Match data by API-Sports; headlines from public news feeds.
        </p>
      </section>
    </div>
  );
}
