import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyEnvelope, type CohortRegistry } from "./verify.ts";

const registry: CohortRegistry = {
  primary: {
    vincent: ["business"],
    matt: ["training", "embodiment"],
    ruth: ["financial_wellbeing"],
    alex: ["personal_admin"],
    hearth: ["career"],
  },
};

const vincentObservation = {
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
  provenance: [{ message_id: "01HXYW0000000000000000000A" }],
  tentativeness: "assertion" as const,
  human_readable: "Calendar density up 40% versus baseline.",
  content: { calendar_density_delta: 0.4 },
};

const resolveAll = () => true;
const resolveNone = () => false;

test("valid primary observation in owned domain passes", async () => {
  const result = await verifyEnvelope(vincentObservation, {
    registry,
    resolveProvenance: resolveAll,
  });
  assert.equal(result.ok, true);
});

test("shape failure is reported before any other check", async () => {
  const result = await verifyEnvelope({ ...vincentObservation, intent: "musing" }, { registry });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.violations[0]?.code, "shape");
});

test("authority 'primary' on an unowned domain is rejected", async () => {
  const overreach = { ...vincentObservation, domain: "embodiment" as const };
  const result = await verifyEnvelope(overreach, { registry });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.violations.some((v) => v.code === "authority_not_owned"), true);
  }
});

test("matt may claim primary on embodiment (owned)", async () => {
  const ok = { ...vincentObservation, from: "matt", domain: "embodiment" as const };
  const result = await verifyEnvelope(ok, { registry });
  assert.equal(result.ok, true);
});

test("authority 'derived' is not bound to domain ownership", async () => {
  const synthesis = {
    ...vincentObservation,
    from: "chrisonomous",
    domain: "embodiment" as const,
    authority: "derived" as const,
  };
  const result = await verifyEnvelope(synthesis, { registry });
  assert.equal(result.ok, true);
});

test("unresolvable provenance is rejected", async () => {
  const result = await verifyEnvelope(vincentObservation, {
    registry,
    resolveProvenance: resolveNone,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.violations.some((v) => v.code === "provenance_unresolved"), true);
  }
});

test("only the unresolved entries are reported", async () => {
  const twoSources = {
    ...vincentObservation,
    provenance: [{ message_id: "real-id" }, { message_id: "fake-id" }],
  };
  const result = await verifyEnvelope(twoSources, {
    registry,
    resolveProvenance: (entry) => entry.message_id === "real-id",
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.violations.length, 1);
    assert.deepEqual(result.violations[0]?.detail, { message_id: "fake-id" });
  }
});

test("advisory fields are never grounds for rejection", async () => {
  const lowConfidenceGuess = {
    ...vincentObservation,
    confidence: 0.05,
    tentativeness: "hypothesis" as const,
    human_readable: "Honestly not sure, could be nothing.",
  };
  const result = await verifyEnvelope(lowConfidenceGuess, {
    registry,
    resolveProvenance: resolveAll,
  });
  assert.equal(result.ok, true);
});

test("without registry or resolver, only shape is enforced", async () => {
  const overreach = { ...vincentObservation, domain: "embodiment" as const };
  const result = await verifyEnvelope(overreach);
  assert.equal(result.ok, true);
});

test("multiple violations are collected together", async () => {
  const overreach = { ...vincentObservation, domain: "embodiment" as const };
  const result = await verifyEnvelope(overreach, {
    registry,
    resolveProvenance: resolveNone,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    const codes = result.violations.map((v) => v.code).sort();
    assert.deepEqual(codes, ["authority_not_owned", "provenance_unresolved"]);
  }
});
