import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type {
  Fixture,
  NewsItem,
  PlayerStat,
  Prediction,
  Squad,
  StandingRow,
  TeamInfo,
} from "./laliga-types";
import type { Transfer } from "./laliga-types";
import {
  LEAGUE_ID,
  apiGet,
  fetchNews,
  fetchTransfers,
  fetchUpcoming,
  resolveSeason,
} from "./laliga.server";

export const getStandings = createServerFn({ method: "GET" }).handler(async () => {
  const season = await resolveSeason();
  const data = await apiGet<{ league: { standings: StandingRow[][] } }>(
    `standings?league=${LEAGUE_ID}&season=${season}`,
    60 * 60 * 6,
  );
  return { season, rows: data[0]?.league.standings[0] ?? [] };
});

export const getTeams = createServerFn({ method: "GET" }).handler(async () => {
  const season = await resolveSeason();
  return apiGet<TeamInfo>(`teams?league=${LEAGUE_ID}&season=${season}`, 60 * 60 * 24);
});

export const getSeasonFixtures = createServerFn({ method: "GET" }).handler(async () => {
  const season = await resolveSeason();
  const fixtures = await apiGet<Fixture>(
    `fixtures?league=${LEAGUE_ID}&season=${season}`,
    60 * 60 * 3,
  );
  return [...fixtures].sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
});

export const getLiveFixtures = createServerFn({ method: "GET" }).handler(async () =>
  apiGet<Fixture>(`fixtures?live=all&league=${LEAGUE_ID}`, 60),
);

export const getTopScorers = createServerFn({ method: "GET" }).handler(async () => {
  const season = await resolveSeason();
  return apiGet<PlayerStat>(
    `players/topscorers?league=${LEAGUE_ID}&season=${season}`,
    60 * 60 * 12,
  );
});

export const getTopAssists = createServerFn({ method: "GET" }).handler(async () => {
  const season = await resolveSeason();
  return apiGet<PlayerStat>(
    `players/topassists?league=${LEAGUE_ID}&season=${season}`,
    60 * 60 * 12,
  );
});

export const getSquad = createServerFn({ method: "GET" })
  .inputValidator((input: { teamId: number }) => z.object({ teamId: z.number() }).parse(input))
  .handler(async ({ data }) => {
    const squads = await apiGet<Squad>(`players/squads?team=${data.teamId}`, 60 * 60 * 24);
    return squads[0] ?? null;
  });

export const getPrediction = createServerFn({ method: "GET" })
  .inputValidator((input: { fixtureId: number }) =>
    z.object({ fixtureId: z.number() }).parse(input),
  )
  .handler(async ({ data }) => {
    const predictions = await apiGet<Prediction>(
      `predictions?fixture=${data.fixtureId}`,
      60 * 60 * 6,
    );
    return predictions[0] ?? null;
  });

export const getNews = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsItem[]> => fetchNews(),
);

export const getActiveSeason = createServerFn({ method: "GET" }).handler(async () => {
  const season = await resolveSeason();
  return { season, label: `${season}/${String((season + 1) % 100).padStart(2, "0")}` };
});

export const getUpcomingFixtures = createServerFn({ method: "GET" }).handler(
  async (): Promise<Fixture[]> => (await fetchUpcoming(24)) as Fixture[],
);

export const getTransfers = createServerFn({ method: "GET" })
  .inputValidator((input: { teamId: number }) => z.object({ teamId: z.number() }).parse(input))
  .handler(async ({ data }): Promise<Transfer[]> =>
    (await fetchTransfers(data.teamId)) as Transfer[],
  );
