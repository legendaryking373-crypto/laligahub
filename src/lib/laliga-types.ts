export interface TeamRef {
  id: number;
  name: string;
  logo: string;
}

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    venue: { name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: { round: string };
  teams: {
    home: TeamRef & { winner: boolean | null };
    away: TeamRef & { winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

export interface StandingRow {
  rank: number;
  team: TeamRef;
  points: number;
  goalsDiff: number;
  form: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface TeamInfo {
  team: TeamRef & { code: string | null; founded: number | null; country: string };
  venue: {
    name: string | null;
    city: string | null;
    capacity: number | null;
    image: string | null;
  };
}

export interface PlayerStatLine {
  team: TeamRef;
  games: {
    appearences: number | null;
    minutes: number | null;
    rating: string | null;
    position: string | null;
  };
  goals: { total: number | null; assists: number | null };
  cards: { yellow: number | null; red: number | null };
  shots: { total: number | null; on: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
}

export interface PlayerStat {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    nationality: string;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
  };
  statistics: PlayerStatLine[];
}

export interface SquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string;
}

export interface Squad {
  team: TeamRef;
  players: SquadPlayer[];
}

export interface Prediction {
  predictions: {
    winner: { id: number | null; name: string | null };
    advice: string | null;
    under_over: string | null;
    percent: { home: string; draw: string; away: string };
  };
  teams: { home: TeamRef; away: TeamRef };
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  published: string;
}

export const LIVE_STATUSES = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];

export function isLive(fixture: Fixture): boolean {
  return LIVE_STATUSES.includes(fixture.fixture.status.short);
}

export function isFinished(fixture: Fixture): boolean {
  return ["FT", "AET", "PEN"].includes(fixture.fixture.status.short);
}

export function scoreLine(fixture: Fixture): string {
  const { home, away } = fixture.goals;
  if (home === null || away === null) return "vs";
  return `${home} - ${away}`;
}

export interface Transfer {
  player: { id: number; name: string };
  update: string;
  transfers: {
    date: string;
    type: string | null;
    teams: { in: TeamRef; out: TeamRef };
  }[];
}
