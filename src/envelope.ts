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
]);
export type Intent = z.infer<typeof Intent>;

export const Domain = z.enum([
  "training",
  "embodiment",
  "business",
  "personal_financial",
  "career",
  "relational",
  "spiritual",
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

export const PROTOCOL_VERSION = "0.4" as const;
