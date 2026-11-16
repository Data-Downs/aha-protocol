/**
 * Shown: agents teach what they can do (aha-cohort/briefs/shown.md, Gate SH).
 *
 * An agent declares, beside its capabilities, what a person would not guess it
 * can do: tries (a question to ask, put under an opener in the early window),
 * setups (a connection or a fact that makes an answer fuller, offered once at
 * the moment an answer was thinner for lack of it) and, for the mediator,
 * peers (a colleague named once, from the person's own words). Declarations
 * are data; which one is shown, when, is decided in code from live state,
 * never by a model, and each is shown once. The record of what was shown is
 * kept only so nothing is shown twice, and is never read as a rate.
 */

/** What an entry needs before it can be shown (decision 5). Computed from
 *  live state by the agent, never asserted. Consents and level raises are
 *  never setups (decision 9). */
export type TeachingNeed =
  /** A platform connection, by provider (google, monzo, xero, companies_house). */
  | { kind: "connection"; provider: string }
  /** A grant on a connection, by capability (mail.read, calendar.write). */
  | { kind: "grant"; capability: string }
  /** A field on the agent's manifest (the child's name, the company number). */
  | { kind: "manifest"; field: string }
  /** A fact the agent keeps in its own store (Study's school senders). */
  | { kind: "local"; fact: string }
  /** A sitting has already happened with this agent: not on the first. */
  | { kind: "sitting"; after: number };

export interface TeachingEntry {
  id: string;
  kind: "try" | "setup" | "peer";
  /** A try's chip, a setup's title, a peer's line: the person's words, not a pitch. */
  label: string;
  /** A try: what the tap puts in the composer (decision 2: it fills, it does not send). */
  prompt?: string;
  /** Why this helps, in one line, for "what can you do?" and the setup card. */
  why: string;
  needs: TeachingNeed[];
  /** A setup: where it is done. A Tender route (tender-setup:…) or an https door. */
  setup?: { url: string; action: string };
  /** A peer: the colleague named. */
  agent?: string;
}

/** A tool result that was thinner for lack of a setup says which (decision 8). */
export interface Shortfall {
  shortfall: string;
}

export const isShortfall = (value: unknown): value is Shortfall =>
  !!value && typeof value === "object" && typeof (value as { shortfall?: unknown }).shortfall === "string";

/** Under an opener: at most two tries. A tap fills the composer and does not send. */
export interface TriesFrame {
  id: string;
  agent: string;
  tries: { id: string; label: string; prompt: string }[];
}

/** After a reply that was thinner for lack of it: one setup, offered once, as an outline card. */
export interface SetupFrame {
  id: string;
  agent: string;
  entry: string;
  title: string;
  why: string;
  url: string;
  action: string;
}

/** The mediator names a colleague once, with her own words as the reason. */
export interface PeerFrame {
  id: string;
  agent: string;
  entry: string;
  colleague: string;
  because: string;
}

export const TRIES_MAX = 2;
/** The early window, per agent (decision 1): five sittings or 21 days, whichever first. */
export const TEACHING_WINDOW = { sittings: 5, days: 21 } as const;

export type TaughtOutcome = "shown" | "asked" | "set_up" | "declined";

/** One row of the record (aha-platform `taught`). */
export interface TaughtRow {
  entry_id: string;
  kind: TeachingEntry["kind"];
  shown_at: string;
  outcome: TaughtOutcome;
  /** The words she saw (a chip, a setup's title, a colleague's name), for her own record in You. */
  label?: string | null;
}

/** The record an agent's turn reads and writes: what this person has been
 *  shown by this agent, and whether they asked for no more. */
export interface TaughtStore {
  shown(): Promise<TaughtRow[]>;
  muted(): Promise<boolean>;
  mark(entryId: string, kind: TeachingEntry["kind"], outcome: TaughtOutcome, label?: string): Promise<void>;
}

/** What a turn needs to teach. Required on the shared loop; `false` declares
 *  a turn no person reads (a peer query, a digest, a witness sweep). */
export interface TeachSeam {
  agent: string;
  entries: TeachingEntry[];
  met(need: TeachingNeed): boolean | Promise<boolean>;
  store: TaughtStore;
}
