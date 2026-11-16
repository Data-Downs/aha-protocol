import assert from "node:assert/strict";
import { test } from "node:test";
import { isShortfall, TEACHING_WINDOW, TRIES_MAX } from "./teaching.ts";

test("a shortfall names one setup by id", () => {
  assert.equal(isShortfall({ shortfall: "school-mail", state: "no-grant" }), true);
  assert.equal(isShortfall({ state: "no-grant" }), false);
  assert.equal(isShortfall("school-mail"), false);
});

test("the window and the tries are the brief's: five sittings or 21 days, two at most", () => {
  assert.deepEqual(TEACHING_WINDOW, { sittings: 5, days: 21 });
  assert.equal(TRIES_MAX, 2);
});
