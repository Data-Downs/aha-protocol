import { z } from "zod";

export const Intent = z.enum([
  "observation",
  "query",
  "curious",
  "response",
  "advice",
  "directive",
  "decline",
  "retract",
  "escalation",
  "naming_request",
  "naming",
  "appreciation",
  "acknowledgement",
  "experiment",
  "note",
  "counter_hypothesis",
  "witness",
]);
export type Intent = z.infer<typeof Intent>;

export const Domain = z.enum([
  "training",
  "embodiment",
  "business",
  "personal_admin",
  "financial_wellbeing",
  "career",
  "relational",
  "spiritual",
  "knowledge",
  "meta",
]);
export type Domain = z.infer<typeof Domain>;

export const Authority = z.enum(["primary", "derived", "relayed", "none"]);
export type Authority = z.infer<typeof Authority>;

export const Scope = z.enum(["internal", "external", "network"]);
export type Scope = z.infer<typeof Scope>;

export const Tentativeness = z.enum(["assertion", "hypothesis", "question"]);
export type Tentativeness = z.infer<typeof Tentativeness>;

export const Confidence = z.union([
  z.enum(["low", "medium", "high"]),
  z.number().min(0).max(1),
]);
export type Confidence = z.infer<typeof Confidence>;

export const Provenance = z
  .object({
    source: z.string().min(1).optional(),
    message_id: z.string().min(1).optional(),
  })
  .passthrough()
  .refine(
    (p) => p.source !== undefined || p.message_id !== undefined,
    { message: "provenance entry must include `source` or `message_id`" },
  );
export type Provenance = z.infer<typeof Provenance>;

export const Envelope = z
  .object({
    id: z.string().min(1),
    from: z.string().min(1),
    to: z.array(z.string().min(1)).min(1),
    via: z.string().min(1).optional(),
    cohort_id: z.string().min(1),
    scope: Scope,
    in_reply_to: z.string().min(1).nullable(),
    timestamp: z.string().datetime({ offset: true }),
    intent: Intent,
    domain: Domain,
    authority: Authority,
    provenance: z.array(Provenance).default([]),
    confidence: Confidence.optional(),
    tentativeness: Tentativeness,
    expires_at: z.string().datetime({ offset: true }).nullable().optional(),
    // Frozen as a federation-relevant field since v0.4; absent from the
    // validator until v0.6 (spec/validator drift, now closed).
    experiment_id: z.string().min(1).optional(),
    // Sender's protocol version; absence means a pre-0.6 sender.
    protocol: z.string().min(1).optional(),
    human_readable: z.string().min(1),
    content: z.unknown().optional(),
  })
  .refine(
    (env) => env.authority === "none" || env.provenance.length > 0,
    {
      message: "provenance required when authority is not 'none'",
      path: ["provenance"],
    },
  );
export type Envelope = z.infer<typeof Envelope>;

export const PROTOCOL_VERSION = "0.8" as const;

/**
 * `content` of a `witness` envelope (amendment 2026-09): the human's word
 * passing through a hearing agent to the owner of the domain it concerns.
 * `statement` is the fact as the hearer understood it; `user_message` is what
 * the human actually typed, verbatim, so the owner reconciles against his
 * words and not the hearer's paraphrase.
 */
/** A proposed meeting time, as an outsider offered it (stage 7). */
export const ProposedTime = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
});
export type ProposedTime = z.infer<typeof ProposedTime>;

export const WitnessContent = z.object({
  statement: z.string().min(1),
  user_message: z.string().min(1),
  heard_by: z.string().min(1),
  heard_at: z.string().datetime({ offset: true }),
  conversation_id: z.string().min(1).optional(),
  /** Typed word for the day's owner, handled in code on receipt: times
   *  someone proposed, to hold; or the one the person chose, so the other
   *  holds are released. `who` names the other party, for the hold's title. */
  proposed_times: z.object({ who: z.string().min(1), times: z.array(ProposedTime).min(1).max(8) }).optional(),
  chosen_time: z.object({ who: z.string().min(1), start: z.string().datetime({ offset: true }) }).optional(),
});
export type WitnessContent = z.infer<typeof WitnessContent>;
