import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: { mode?: "signin" | "signup" }) => ({
    mode: search.mode === "signup" ? ("signup" as const) : ("signin" as const),
  }),

  head: () => ({
    meta: [
      { title: "Sign in — LALIGA" },
      {
        name: "description",
        content: "Sign in or create your LALIGA account to follow your club, player, scores and alerts.",
      },
      { property: "og:title", content: "Sign in — LALIGA" },
      { property: "og:description", content: "Access live LaLiga scores, stats and alerts." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentConfirmation(true);
          return;
        }
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.auth.getUser();
        await navigate({ to: "/home", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    await supabase.auth.getUser();
    await navigate({ to: "/home", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/">
        <BrandMark size={44} />
      </Link>

      <div className="surface-panel mt-8 w-full max-w-md p-6 shadow-brand">
        {sentConfirmation ? (
          <div className="space-y-3 text-center">
            <h1 className="text-2xl">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-semibold">{email}</span>. Click it
              to activate your account, then sign in.
            </p>
            <Button variant="outline" onClick={() => setSentConfirmation(false)}>
              Back
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl">{isSignup ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignup
                ? "Pick your club and player next."
                : "Sign in to your matchday dashboard."}
            </p>

            <Button variant="outline" className="mt-5 w-full" onClick={google} disabled={busy}>
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full font-bold uppercase" disabled={busy}>
                {isSignup ? "Sign up" : "Sign in"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setIsSignup((v) => !v)}
            >
              {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
