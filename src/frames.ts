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
  | { type: "times"; who: string; times: { start: string; end: string }[] }
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

export type TurnFrame = { kind: "choices"; frame: ChoicesFrame } | { kind: "act"; frame: ActFrame };

/** The rules a shared choices tool holds in code (stage 7). */
export const CHOICES_MAX_OPTIONS = 4;
