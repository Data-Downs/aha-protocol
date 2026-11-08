import { test } from "node:test";
import assert from "node:assert/strict";
import { Domain } from "./envelope.ts";
import { buildRegistry, CHRIS_COHORT_REGISTRY, humanDomains } from "./registry.ts";
import { verifyEnvelope } from "./verify.ts";

const envelope = (from: string, domain: string, authority = "primary") => ({
  id: "01HXYZ0000000000000000000A",
  from,
  to: ["chrisonomous"],
  cohort_id: "chris-cohort-a",
  scope: "internal" as const,
  in_reply_to: null,
  timestamp: "2026-07-21T09:14:22Z",
  intent: "observation" as const,
  domain,
  authority,
  provenance: [{ message_id: "01HXYW0000000000000000000A" }],
  tentativeness: "assertion" as const,
  human_readable: "A claim.",
});

test("buildRegistry maps agents to owned domains", () => {
  const registry = buildRegistry([
    { name: "vincent", domains: ["business"] },
    { name: "ruth", domains: ["financial_wellbeing"] },
  ]);
  assert.deepEqual(registry.primary.vincent, ["business"]);
  assert.deepEqual(registry.primary.ruth, ["financial_wellbeing"]);
});

test("the human's domains are the union of the agents' — the protocol holds no list of its own", () => {
  const agents = Object.entries(CHRIS_COHORT_REGISTRY.primary).filter(([n]) => n !== "chris").map(([name, domains]) => ({ name, domains }));
  assert.deepEqual([...CHRIS_COHORT_REGISTRY.primary.chris!].sort(), humanDomains(agents).sort());
  for (const domain of CHRIS_COHORT_REGISTRY.primary.chris!) assert.ok(Domain.safeParse(domain).success, `'${domain}' is not a slug`);
});

test("every domain in the table has at least one owner besides the human", () => {
  const owned = new Set(Object.entries(CHRIS_COHORT_REGISTRY.primary).filter(([n]) => n !== "chris").flatMap(([, d]) => d));
  for (const domain of CHRIS_COHORT_REGISTRY.primary.chris!) {
    assert.ok(owned.has(domain), `no agent owns '${domain}'`);
  }
});

test("each agent may claim primary in its own domain", async () => {
  for (const [agent, domains] of Object.entries(CHRIS_COHORT_REGISTRY.primary)) {
    for (const domain of domains) {
      const verdict = await verifyEnvelope(envelope(agent, domain), {
        registry: CHRIS_COHORT_REGISTRY,
      });
      assert.ok(verdict.ok, `${agent} rejected on its own domain '${domain}'`);
    }
  }
});

test("an agent claiming primary outside its domain is flagged", async () => {
  const verdict = await verifyEnvelope(envelope("ruth", "business"), {
    registry: CHRIS_COHORT_REGISTRY,
  });
  assert.equal(verdict.ok, false);
  assert.ok(!verdict.ok && verdict.violations[0]?.code === "authority_not_owned");
});

test("non-primary authority is unbound by domain ownership", async () => {
  for (const authority of ["derived", "relayed", "none"]) {
    const verdict = await verifyEnvelope(
      envelope("ruth", "business", authority),
      { registry: CHRIS_COHORT_REGISTRY },
    );
    assert.ok(verdict.ok, `'${authority}' should not be domain-bound`);
  }
});

test("the human holds primacy everywhere", async () => {
  for (const domain of CHRIS_COHORT_REGISTRY.primary.chris!) {
    const verdict = await verifyEnvelope(envelope("chris", domain), {
      registry: CHRIS_COHORT_REGISTRY,
    });
    assert.ok(verdict.ok, `chris rejected on '${domain}'`);
  }
});

test("the mediator's role address carries the same ownership as its name", () => {
  assert.deepEqual(
    CHRIS_COHORT_REGISTRY.primary.mediator,
    CHRIS_COHORT_REGISTRY.primary.chrisonomous,
  );
});

test("embodiment is deliberately co-owned", () => {
  assert.ok(CHRIS_COHORT_REGISTRY.primary.matt?.includes("embodiment"));
  assert.ok(CHRIS_COHORT_REGISTRY.primary.chrisonomous?.includes("embodiment"));
});

test("will owns knowledge, and only knowledge", () => {
  assert.deepEqual(CHRIS_COHORT_REGISTRY.primary.will, ["knowledge"]);
});

test("an agent's name for the person: Tender for the mediator, the rest capitalised", async () => {
  const { agentDisplayName } = await import("./registry.ts");
  assert.equal(agentDisplayName("chrisonomous"), "Tender");
  assert.equal(agentDisplayName("hearth"), "Hearth");
});
