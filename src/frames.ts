/**
 * Frames a door may put to the person inside a turn (aha-cohort/briefs/
 * polish.md stages 3 and 7): choices, and a draft. Each rides the chat
 * stream as its own SSE event, and a client that does not know a frame
 * drops it and lets the person type. A chosen option posts back as an
 * ordinary message; a draft is saved to the person's own Drafts on their
 * tap, or discarded, and is never sent by any path.
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

export interface ChoicesFrame {
  /** Stable per step, so a client can tell a repeat from a new ask. */
  id: string;
  prompt: string;
  options: ChoiceOption[];
  allow_free_text: boolean;
  /** Present when the accepting option records consent with these parties. */
  consent?: { parties: ConsentParty[]; accept: string };
}

export interface DraftFrame {
  id: string;
  /** Fixed in code to the thread the mail came from; never the model's to choose. */
  to: string;
  subject: string;
  body: string;
  /** The mail this answers: the provider's thread id and message id. */
  in_reply_to: { thread_id: string; message_id: string };
}

export type TurnFrame = { kind: "choices"; frame: ChoicesFrame } | { kind: "draft"; frame: DraftFrame };

/** The rules a shared choices tool holds in code (stage 7). */
export const CHOICES_MAX_OPTIONS = 4;
