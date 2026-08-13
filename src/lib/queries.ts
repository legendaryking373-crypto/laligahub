import { queryOptions } from "@tanstack/react-query";

import {
  getLiveFixtures,
  getNews,
  getPrediction,
  getSeasonFixtures,
  getSquad,
  getStandings,
  getTeams,
  getTopAssists,
  getTopScorers,
  getTransfers,
  getUpcomingFixtures,
} from "./laliga.functions";

export const standingsQuery = () =>
  queryOptions({ queryKey: ["standings"], queryFn: () => getStandings(), staleTime: 1000 * 60 * 30 });

export const teamsQuery = () =>
  queryOptions({ queryKey: ["teams"], queryFn: () => getTeams(), staleTime: 1000 * 60 * 60 });

export const fixturesQuery = () =>
  queryOptions({
    queryKey: ["fixtures"],
    queryFn: () => getSeasonFixtures(),
    staleTime: 1000 * 60 * 30,
  });

export const liveQuery = () =>
  queryOptions({
    queryKey: ["live"],
    queryFn: () => getLiveFixtures(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

export const scorersQuery = () =>
  queryOptions({ queryKey: ["scorers"], queryFn: () => getTopScorers(), staleTime: 1000 * 60 * 60 });

export const assistsQuery = () =>
  queryOptions({ queryKey: ["assists"], queryFn: () => getTopAssists(), staleTime: 1000 * 60 * 60 });

export const squadQuery = (teamId: number) =>
  queryOptions({
    queryKey: ["squad", teamId],
    queryFn: () => getSquad({ data: { teamId } }),
    staleTime: 1000 * 60 * 60,
  });

export const predictionQuery = (fixtureId: number) =>
  queryOptions({
    queryKey: ["prediction", fixtureId],
    queryFn: () => getPrediction({ data: { fixtureId } }),
    staleTime: 1000 * 60 * 60,
  });

export const newsQuery = () =>
  queryOptions({ queryKey: ["news"], queryFn: () => getNews(), staleTime: 1000 * 60 * 10 });

export const upcomingQuery = () =>
  queryOptions({
    queryKey: ["upcoming"],
    queryFn: () => getUpcomingFixtures(),
    staleTime: 1000 * 60 * 15,
  });

export const transfersQuery = (teamId: number) =>
  queryOptions({
    queryKey: ["transfers", teamId],
    queryFn: () => getTransfers({ data: { teamId } }),
    staleTime: 1000 * 60 * 60 * 6,
    enabled: teamId > 0,
  });
