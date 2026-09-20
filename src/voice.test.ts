import { test } from "node:test";
import assert from "node:assert/strict";
import { findHeldOver, findReproach } from "./voice.ts";

test("reproach is found outside quoted speech", () => {
  assert.deepEqual(findReproach("You still haven't told me why."), ["you still haven't"]);
  assert.deepEqual(findReproach('He said "you forgot" and laughed.'), []);
});

test("a question held over the human is found however it is phrased", () => {
  assert.deepEqual(findHeldOver('Still holding "amazing".'), ["still holding"]);
  assert.deepEqual(findHeldOver('"Amazing" was where we left it — you going to fill that in, or let it sit?'), [
    "where we left it",
    "or let it sit",
  ]);
  assert.deepEqual(findHeldOver("Just picking it up in case you wanted to."), ["in case you wanted to"]);
  assert.deepEqual(findHeldOver("The AGM is on Tuesday 22 September 2026."), []);
});
