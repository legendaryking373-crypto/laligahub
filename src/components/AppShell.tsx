import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAlerts } from "@/hooks/useAlerts";
import { useProfile } from "@/hooks/useProfile";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/home", label: "Today" },
  { to: "/scores", label: "Scores" },
  { to: "/standings", label: "Table" },
  { to: "/teams", label: "Teams" },
  { to: "/players", label: "Players" },
  { to: "/transfers", label: "Transfers" },
  { to: "/news", label: "News" },
] as const;

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle colour mode"
      onClick={() => {
        const next: ThemeMode = mode === "dark" ? "light" : "dark";
        setMode(next);
        applyTheme(next);
      }}
    >
      {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { data: alerts } = useAlerts();
  const [open, setOpen] = useState(false);

  const unread = (alerts ?? []).filter((a) => !a.read).length;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Link to="/home" className="shrink-0">
            <BrandMark size={32} />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "underline-sweep press rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === item.to && "bg-secondary text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link to="/alerts" className="relative">
              <Button variant="ghost" size="icon" aria-label="Alerts">
                <Bell className="size-4" />
              </Button>
              {unread > 0 && (
                <span className="pop absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <ThemeToggle />
            {profile?.favorite_team_logo && (
              <Link to="/profile" aria-label="Your profile">
                <img
                  src={profile.favorite_team_logo}
                  alt={profile.favorite_team_name ?? "Your team"}
                  className="press size-8 rounded-full border border-border bg-elevated p-1 transition-transform hover:rotate-6"
                />
              </Link>
            )}
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>

        {open && (
          <nav className="grid grid-cols-3 gap-1 border-t border-border p-3 md:hidden">
            {NAV.concat([{ to: "/profile", label: "Profile" }] as unknown as typeof NAV).map(
              (item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "press rounded-md bg-secondary px-3 py-2 text-center text-xs font-bold uppercase transition-colors",
                    pathname === item.to && "bg-primary text-primary-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        )}
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-6">
        <div className="pointer-events-none fixed left-1/2 top-0 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl glow-breathe" />
        <div key={pathname} className="reveal">
          {children}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 text-xs text-muted-foreground">
        Match data by API-Sports · headlines from public news feeds. Unofficial fan app.
      </footer>
    </div>
  );
}
