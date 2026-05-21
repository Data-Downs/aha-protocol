import { test } from "node:test";
import assert from "node:assert/strict";
import { Envelope, Intent, Domain, PROTOCOL_VERSION } from "./envelope.ts";

const baseEnvelope = {
  id: "01HXYZ0000000000000000000A",
  from: "vincent",
  to: ["chrisonomous"],
  cohort_id: "chris-cohort-a",
  scope: "internal" as const,
  in_reply_to: null,
  timestamp: "2026-05-18T09:14:22Z",
  intent: "observation" as const,
  domain: "business" as const,
  authority: "primary" as const,
  provenance: [{ source: "google_calendar", window: "2026-05-11..2026-05-18" }],
  tentativeness: "assertion" as const,
  human_readable: "Calendar density up 40% versus baseline.",
  content: { calendar_density_delta: 0.4 },
};

test("PROTOCOL_VERSION pins v0.4", () => {
  assert.equal(PROTOCOL_VERSION, "0.4");
});

test("valid observation parses", () => {
  const parsed = Envelope.parse(baseEnvelope);
  assert.equal(parsed.intent, "observation");
  assert.equal(parsed.from, "vincent");
});

test("provenance required when authority is not 'none'", () => {
  const bad = { ...baseEnvelope, provenance: [] };
  const result = Envelope.safeParse(bad);
  assert.equal(result.success, false);
});

test("authority 'none' permits empty provenance", () => {
  const fine = {
    ...baseEnvelope,
    authority: "none" as const,
    provenance: [],
    intent: "curious" as const,
  };
  assert.equal(Envelope.safeParse(fine).success, true);
});

test("unknown intent rejected", () => {
  const result = Intent.safeParse("musing");
  assert.equal(result.success, false);
});

test("unknown domain rejected", () => {
  const result = Domain.safeParse("physical");
  assert.equal(result.success, false);
});

test("v0.4 domain split: training, embodiment, personal_financial accepted", () => {
  assert.equal(Domain.safeParse("training").success, true);
  assert.equal(Domain.safeParse("embodiment").success, true);
  assert.equal(Domain.safeParse("personal_financial").success, true);
});

test("counter_hypothesis intent accepted", () => {
  assert.equal(Intent.safeParse("counter_hypothesis").success, true);
});

test("via field accepted on envelope", () => {
  const routed = {
    ...baseEnvelope,
    id: "01HXYZ0000000000000000000B",
    from: "matt",
    to: ["chris"],
    via: "chrisonomous",
    intent: "counter_hypothesis" as const,
    domain: "training" as const,
    in_reply_to: "01HXYZ0000000000000000000A",
    human_readable: "Disagree: training load was within bounds for this week.",
  };
  const parsed = Envelope.parse(routed);
  assert.equal(parsed.via, "chrisonomous");
  assert.equal(parsed.intent, "counter_hypothesis");
});

test("numeric confidence in 0..1 accepted", () => {
  const ok = { ...baseEnvelope, confidence: 0.72 };
  assert.equal(Envelope.safeParse(ok).success, true);
});

test("numeric confidence outside 0..1 rejected", () => {
  const bad = { ...baseEnvelope, confidence: 1.4 };
  assert.equal(Envelope.safeParse(bad).success, false);
});

test("provenance entry without source or message_id rejected", () => {
  const bad = { ...baseEnvelope, provenance: [{ window: "anything" }] };
  assert.equal(Envelope.safeParse(bad).success, false);
});

test("naming_request example from spec parses", () => {
  const namingRequest = {
    id: "01HXYA0000000000000000000A",
    from: "chrisonomous",
    to: ["chris"],
    cohort_id: "chris-cohort-a",
    scope: "internal" as const,
    in_reply_to: null,
    timestamp: "2026-05-18T19:30:00Z",
    intent: "naming_request" as const,
    domain: "meta" as const,
    authority: "derived" as const,
    provenance: [
      { message_id: "01HXYZ0000000000000000000A", from: "vincent" },
      { message_id: "01HXYW0000000000000000000A", from: "matt" },
      { message_id: "01HXYV0000000000000000000A", from: "hearth" },
    ],
    confidence: "medium" as const,
    tentativeness: "question" as const,
    human_readable: "Three signals landed this week. What is this?",
    content: {
      candidate_hypotheses: ["stress", "tough_sprint", "holiday", "other"],
      constituent_signals: [
        "01HXYZ0000000000000000000A",
        "01HXYW0000000000000000000A",
        "01HXYV0000000000000000000A",
      ],
      decline_acceptable: true,
    },
  };
  const parsed = Envelope.parse(namingRequest);
  assert.equal(parsed.intent, "naming_request");
  assert.equal(parsed.provenance.length, 3);
});
