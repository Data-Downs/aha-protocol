/**
 * Frames a door may put to the person inside a turn (aha-cohort/briefs/
 * polish.md stage 3, acting.md stage 1): choices, and an act. Each rides
 * the chat stream as its own SSE event, and a client that does not know a
 * frame drops it and lets the person type. A chosen option posts back as an
 * ordinary message. An act is shown whole, its target fixed in code, and
 * runs only on the person's tap through POST /v1/act; nothing an act does
 * is a send, a payment or a filing.
 */

export interface ChoiceOption {
  label: string;
  /** Posted back as the message when chosen. */
  value: string;
  /** A page to open first, where the choice is a hand-off (a connection). */
  url?: string;
}

export interface ConsentParty {
  agent: string;
  displayName: string;
  /** The agent's own consent door; POST { version } as the person. */
  url: string;
}

/** What an agent may do with a capability: prepare it for the person to
 *  dispatch, do it when they tap, or do it on its own within its bounds.
 *  A capability starts where its owner declares and rises only by the
 *  person's word. */
export type CapabilityLevel = "drafts" | "tap" | "own";
export const CAPABILITY_LEVELS: readonly CapabilityLevel[] = ["drafts", "tap", "own"];
export const LEVEL_LABELS: Record<CapabilityLevel, string> = {
  drafts: "Drafts",
  tap: "Does on your tap",
  own: "Does on its own",
};

/** The chip that raises a level, offered by the act door after the same act
 *  has run on the person's tap enough times; never by the model. The
 *  accepting option POSTs { capability, level } to `url` as the person
 *  before it posts as a message. */
export interface LevelOffer {
  agent: string;
  capability: string;
  to: CapabilityLevel;
  url: string;
  accept: string;
}

export interface ChoicesFrame {
  /** Stable per step, so a client can tell a repeat from a new ask. */
  id: string;
  prompt: string;
  options: ChoiceOption[];
  allow_free_text: boolean;
  /** Present when the accepting option records consent with these parties. */
  consent?: { parties: ConsentParty[]; accept: string };
  /** Present when the accepting option raises a capability's level. */
  level?: LevelOffer;
}

/** A reply drafted for the person: the recipient is fixed in code to the
 *  thread the mail came from, never the model's to choose. */
export interface DraftFrame {
  id: string;
  to: string;
  subject: string;
  body: string;
  /** The mail this answers: the provider's thread id and message id. */
  in_reply_to: { thread_id: string; message_id: string };
}

/** What an act shows, typed by kind so one card renders every act. */
export type ActBody =
  | ({ type: "draft" } & Omit<DraftFrame, "id">)
  | { type: "text"; paragraphs: string[] }
  | { type: "clip"; title: string; domain: string; sentence: string; url: string; date?: string }
  | { type: "item"; name: string; price: string; merchant: string; reason: string; url: string }
  /** Proposed times. `slots` are the same times written out by the server
   *  (the day, and the hours in both clocks while the person is away), so a
   *  client never formats an instant itself; a client without them falls
   *  back to the instants. */
  | { type: "times"; who: string; times: { start: string; end: string }[]; slots?: { day: string; when: string }[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  /** A bill, a renewal or a move between the person's own pots: the amount
   *  rendered, the day named (acting.md stage 4). */
  | { type: "bill"; payee: string; amount: string; due: string; cadence?: string; last_paid?: string; note?: string }
  /** An invoice as the books will hold it: amounts already rendered, never
   *  for a model to add up (acting.md stage 3). */
  | {
      type: "invoice";
      contact: string;
      lines: { description: string; quantity: number; unit_amount: string; amount: string }[];
      subtotal: string;
      /** What the books add on top: "VAT as your Xero defaults apply", or none. */
      tax_note: string;
      currency: string;
      due: string;
      reference?: string;
    }
  /** An errand its owner proposes (aha-cohort/briefs/errands.md): where it
   *  will go and what it will fill in, written in code from the directive.
   *  Start opens the errand sheet in the app, and the person's turns happen
   *  there; the step messages themselves are aha-errand's. */
  | {
      type: "errand";
      errand_id: string;
      /** form fills in and stops before sending; find only reads and searches. */
      kind: "form" | "find";
      purpose: string;
      start: string;
      /** The start's host, shown on the card. */
      host: string;
      /** Further registrable domains the errand may reach, written at the start. */
      hosts: string[];
      /** What it will fill in, as the form's own labels; empty for a find. */
      fills: string[];
    };

export interface ActAction {
  label: string;
  /** Posted to /v1/act as the action taken. */
  value: string;
  /** do: the agent acts through its hook; open: a page the person opens
   *  themselves; discard: the card goes and nothing runs. */
  kind: "do" | "open" | "discard";
  url?: string;
}

export interface ActFrame {
  id: string;
  /** The agent whose door runs the act; the client posts there and nowhere else. */
  agent: string;
  capability: string;
  level: CapabilityLevel;
  subject: string;
  body: ActBody;
  /** One line the person can trust about where this came from. */
  provenance: string;
  /** One to three, the most reversible first. */
  actions: ActAction[];
}

export const ACT_MAX_ACTIONS = 3;

/** What POST /v1/act answers. */
export interface ActResult {
  id: string;
  ok: boolean;
  note: string;
  /** The act's own result, for the card to show (a draft id, a count). */
  result?: Record<string, unknown>;
  /** A level chip the door offers after the act, or nothing. */
  offer?: ChoicesFrame;
}

/** The rules of an act frame, pure so every surface tests them at source:
 *  one to three actions, the most reversible first, and never a send. */
export function actShape(frame: ActFrame): string | null {
  if (!CAPABILITY_LEVELS.includes(frame.level)) return "the level is not one of drafts, tap, own";
  if (frame.actions.length < 1 || frame.actions.length > ACT_MAX_ACTIONS) return `an act carries one to ${ACT_MAX_ACTIONS} actions`;
  const rank = { discard: 0, open: 1, do: 2 };
  for (let i = 1; i < frame.actions.length; i++) {
    if (rank[frame.actions[i]!.kind] < rank[frame.actions[i - 1]!.kind]) return "actions run from the most reversible";
  }
  for (const action of frame.actions) {
    if (action.kind === "open" && !action.url) return `open action "${action.label}" names no page`;
    if (/\bsend\b/i.test(action.value) || /\bsend\b/i.test(action.label)) return "no act sends";
  }
  return null;
}

export const ERRAND_MAX_FILLS = 12;

/** The rules of an errand card: an https start whose host the card names, a
 *  find that fills nothing, and a Start that is the only thing it does. */
export function errandShape(frame: ActFrame): string | null {
  if (frame.body.type !== "errand") return null;
  const body = frame.body;
  let start: URL;
  try {
    start = new URL(body.start);
  } catch {
    return "the errand's start is not an address";
  }
  if (start.protocol !== "https:") return "an errand starts on https";
  if (start.hostname !== body.host) return "the card names a host the errand does not start on";
  if (body.kind === "find" && body.fills.length > 0) return "a find fills nothing";
  if (body.fills.length > ERRAND_MAX_FILLS) return `an errand names at most ${ERRAND_MAX_FILLS} fields`;
  const does = frame.actions.filter((a) => a.kind === "do");
  if (does.length !== 1 || does[0]!.value !== "start") return "an errand's one act is Start";
  return null;
}

/** A card beside a reply (aha-cohort/briefs/objects.md): something the
 *  reply named, drawn from a row the turn read. Every string is rendered in
 *  code; the model never writes a frame. `day` is the day key a tap opens. */
export type ReplyObject =
  | { kind: "event"; ref?: { calendar_id: string; event_id: string }; title: string; when: string; day: string; all_day: boolean }
  | {
      kind: "travel";
      ref?: { calendar_id: string; event_id: string };
      title: string;
      day: string;
      mode: "flight" | "train";
      number?: string;
      from?: string;
      to?: string;
      /** "16:35 Sun 11 Oct", in the clock of that end, which `departs_clock` names. */
      departs: string;
      departs_clock: string;
      arrives: string;
      arrives_clock: string;
    }
  | {
      /** A task the turn added or changed, from the owner's register. */
      kind: "task";
      ref?: { table: string; id: string };
      title: string;
      status: "open" | "done" | "dropped";
      /** "Due Tue 13 Oct", "Done", rendered in code; absent when there is no date and nothing settled. */
      when?: string;
      /** The day a tap opens, when the task has one. */
      day?: string;
      /** Whose it is, when it is not the person's own: "Charlotte", "Household". */
      whose?: string;
    }
  | {
      /** What this turn passed to another agent (told once). */
      kind: "handoff";
      /** "Passed to Hearth", "Held for Hearth", "Not passed to Hearth" — rendered in code. */
      title: string;
      /** The recipient's wire name, and the name the person knows it by. */
      to: string;
      to_name: string;
      /** The fact as it was passed. */
      statement: string;
      /** "00:24", in the person's clock. */
      at: string;
      /** passed, held until the person says yes, or not delivered. */
      state: "passed" | "held" | "failed";
    }
  | {
      /** A mail the turn read and the reply names. */
      kind: "mail";
      ref?: { table: string; id: string };
      /** The subject, as it arrived. */
      title: string;
      /** The sender, by name where the mail gives one. */
      from: string;
      /** When it arrived, rendered in code: "08:12", or "Thu 8 Oct". */
      at: string;
      /** The mediator's one line on it, never the mail's body. */
      gist: string;
      link: string;
      /** The inbox it came to, named only when there is more than one. */
      account?: string;
    }
  | {
      /** Tentative times held in the diary for one person, one card. */
      kind: "hold";
      /** "Hold: Jen", as the entry is titled. */
      title: string;
      /** The first held day, for the tap. */
      day: string;
      /** Each held time: its day, and its hours rendered in code. */
      slots: { day: string; when: string }[];
    }
  | {
      /** A ticket the person holds, as the mediator's tickets route has it. */
      kind: "ticket";
      ref: { table: string; id: string };
      /** The event, as the ticket names it. */
      title: string;
      venue?: string;
      /** The entry, rendered in code on the person's clock; absent when it did not resolve. */
      when?: string;
      /** The entry's day, for the tap. */
      day?: string;
      order_ref?: string;
      /** Whether the ticket's file is held, and whether a Wallet pass can be signed for it. */
      file: boolean;
      wallet: boolean;
      /** The mail it came in, for a ticket with no file. */
      link: string;
    };

/** The objects one reply carries: cards after the paragraph that names them,
 *  and the days its words name, for the chip. Sent once, after the final
 *  text; never sent empty. */
export interface ObjectsFrame {
  id: string;
  /** `starts` is the paragraph's opening words, which a client anchors by:
   *  a streamed reply may hold earlier rounds' text, so the index is a hint. */
  paragraphs: { index: number; starts: string; objects: ReplyObject[] }[];
  days: { span: string; key: string; label: string }[];
  /** The act cards the turn put, kept with the reply so a draft outlives the
   *  next message and a closed app (briefs/objects.md wave two). */
  acts?: ActFrame[];
}

/** What the person changed on a draft before it is saved: its subject and
 *  its body, nothing else. The recipient and the mail it answers are fixed in
 *  code, and the act door refuses any other field. */
export interface ActEdits {
  subject?: string;
  body?: string;
}

export const OBJECTS_MAX_CARDS = 3;

export type TurnFrame =
  | { kind: "choices"; frame: ChoicesFrame }
  | { kind: "act"; frame: ActFrame }
  | { kind: "objects"; frame: ObjectsFrame };

/** The rules a shared choices tool holds in code (stage 7). */
export const CHOICES_MAX_OPTIONS = 4;

/** A tool a turn runs, as the person sees it (aha-cohort/briefs/trail.md).
 *  It rides the chat stream as the `tool` event when the tool starts: `name`
 *  stays for an older client, `label` is the phrase its owner declared, with
 *  a colleague's name or a web host as the only words filled in. Never
 *  written by a model, never stored. */
export interface ToolStepStart {
  id: string;
  name: string;
  label: string;
}

/** The same step as the `tool_end` event, once its result is back: the done
 *  or failed phrase, how long the work took in whole milliseconds, and
 *  whether it worked. */
export interface ToolStepEnd {
  id: string;
  label: string;
  ms: number;
  ok: boolean;
}

/** The rules a step holds on the wire, pure so every surface tests them at
 *  source: an id, a filled label (no slot left in braces), and a duration
 *  that is a whole number of at least 0. */
export function stepShape(step: ToolStepStart | ToolStepEnd): string | null {
  if (!step.id) return "a step carries an id";
  if (!step.label.trim()) return "a step carries a label";
  if (/[{}]/.test(step.label)) return "a label is filled: no braces";
  if ("ms" in step && (!Number.isInteger(step.ms) || step.ms < 0)) return "ms is a whole number of at least 0";
  return null;
}
