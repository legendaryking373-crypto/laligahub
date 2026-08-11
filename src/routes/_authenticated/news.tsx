import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { newsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/news")({
  head: () => ({
    meta: [
      { title: "LaLiga news — LALIGA" },
      {
        name: "description",
        content: "Latest LaLiga news and transfer headlines gathered from public football news feeds.",
      },
      { property: "og:title", content: "LaLiga news — LALIGA" },
      { property: "og:description", content: "Fresh LaLiga headlines, updated through the day." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data: news, isLoading } = useQuery(newsQuery());

  return (
    <AppShell>
      <h1 className="text-4xl">News</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Headlines from across the football press, refreshed every few minutes.
      </p>

      {isLoading && <p className="mt-5 text-sm text-muted-foreground">Loading headlines…</p>}

      <div className="mt-5 space-y-3">
        {(news ?? []).map((item) => (
          <a
            key={item.link}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="surface-panel block p-4 transition-all hover:border-primary/60"
          >
            <p className="font-semibold leading-snug">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.source}
              {item.pubDate ? ` · ${new Date(item.pubDate).toLocaleString()}` : ""}
            </p>
          </a>
        ))}
        {!isLoading && (news ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No headlines available right now.</p>
        )}
      </div>
    </AppShell>
  );
}
