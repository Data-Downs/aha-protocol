import { test } from "node:test";
import assert from "node:assert";
import { ACT_MAX_ACTIONS, actShape, CAPABILITY_LEVELS, stepShape, type ActFrame, type ToolStepEnd, type ToolStepStart } from "./frames.ts";

const base: ActFrame = {
  id: "a1",
  agent: "chrisonomous",
  capability: "gmail.compose",
  level: "drafts",
  subject: "Re: Catch-up times",
  body: { type: "draft", to: "jen@example.com", subject: "Re: Catch-up times", body: "Wednesday at 4 suits.", in_reply_to: { thread_id: "t", message_id: "m" } },
  provenance: "Answering Jen's mail of Tuesday",
  actions: [
    { label: "Discard", value: "discard", kind: "discard" },
    { label: "Save to Drafts", value: "save", kind: "do" },
  ],
};

test("an act carries one to three actions", () => {
  assert.equal(actShape(base), null);
  assert.match(actShape({ ...base, actions: [] }) ?? "", /one to 3/);
  const four = Array.from({ length: ACT_MAX_ACTIONS + 1 }, (_, i) => ({ label: `a${i}`, value: `a${i}`, kind: "do" as const }));
  assert.match(actShape({ ...base, actions: four }) ?? "", /one to 3/);
});

test("actions run from the most reversible: discard, open, do", () => {
  assert.match(actShape({ ...base, actions: [base.actions[1]!, base.actions[0]!] }) ?? "", /most reversible/);
  assert.equal(actShape({ ...base, actions: [base.actions[0]!, { label: "Read it", value: "open", kind: "open", url: "https://x" }, base.actions[1]!] }), null);
});

test("an open action names its page and no act sends", () => {
  assert.match(actShape({ ...base, actions: [{ label: "Read it", value: "open", kind: "open" }] }) ?? "", /names no page/);
  assert.match(actShape({ ...base, actions: [{ label: "Send", value: "send", kind: "do" }] }) ?? "", /no act sends/);
});

test("the level is one of three", () => {
  assert.deepEqual([...CAPABILITY_LEVELS], ["drafts", "tap", "own"]);
  assert.match(actShape({ ...base, level: "always" as never }) ?? "", /level/);
});

test("a step on the wire: a filled label, and a whole ms of at least 0", () => {
  const start: ToolStepStart = { id: "toolu_1", name: "query_peer", label: "Asking Vincent" };
  const end: ToolStepEnd = { id: "toolu_1", label: "Asked Vincent", ms: 1840, ok: true };
  assert.equal(stepShape(start), null);
  assert.equal(stepShape(end), null);
  assert.equal(stepShape({ ...end, ms: 0, ok: false, label: "Couldn't reach Vincent" }), null);
  assert.match(stepShape({ ...start, label: "Asking {peer}" }) ?? "", /no braces/);
  assert.match(stepShape({ ...start, label: " " }) ?? "", /label/);
  assert.match(stepShape({ ...start, id: "" }) ?? "", /id/);
  assert.match(stepShape({ ...end, ms: 12.5 }) ?? "", /whole number/);
  assert.match(stepShape({ ...end, ms: -1 }) ?? "", /whole number/);
});
