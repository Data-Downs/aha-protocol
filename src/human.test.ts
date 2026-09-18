import { test } from "node:test";
import assert from "node:assert/strict";
import { FOUNDER_HUMAN, humanise, humaniseTool, parsePronouns, type Human } from "./human.ts";

const sarah: Human = { id: "sarah", name: "Sarah", pronouns: parsePronouns("she/her") };
const sam: Human = { id: "sam", name: "Sam", pronouns: parsePronouns("they/them") };

test("the founder's text is byte-identical", () => {
  const text = "When Chris opens the thread, read what you hold against how he is. His word outranks the rows; tell him.";
  assert.equal(humanise(text, FOUNDER_HUMAN), text);
});

test("name, possessive and every pronoun form render for a second human, case kept", () => {
  const text = "When Chris opens the thread, read what you hold against how he is. Chris's word outranks the rows; tell him. He decides for himself. His call.";
  assert.equal(
    humanise(text, sarah),
    "When Sarah opens the thread, read what you hold against how she is. Sarah's word outranks the rows; tell her. She decides for herself. Her call.",
  );
  assert.equal(humanise("He said his mind was made up.", sam), "They said their mind was made up.");
});

test("word boundaries leave other words alone", () => {
  assert.equal(humanise("the this christen shim", sarah), "the this christen shim");
});

test("unknown pronoun specs fall back to the founder's", () => {
  assert.equal(parsePronouns("xe/xem").subject, "he");
  assert.equal(parsePronouns(null).subject, "he");
});

test("a tool's descriptions render for the human; names and enums stay", () => {
  const tool = {
    name: "record_naming",
    description: "The name Chris gave.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["name", "his"], description: "name = he named it" },
        said: { type: "string", description: "What Chris said, verbatim." },
      },
    },
  };
  const out = humaniseTool(tool, sarah);
  assert.equal(out.name, "record_naming");
  assert.equal(out.description, "The name Sarah gave.");
  const props = (out.input_schema as { properties: Record<string, { enum?: string[]; description: string }> }).properties;
  assert.deepEqual(props.kind!.enum, ["name", "his"]);
  assert.equal(props.kind!.description, "name = she named it");
  assert.equal(props.said!.description, "What Sarah said, verbatim.");
  assert.equal(humaniseTool(tool, FOUNDER_HUMAN), tool);
});
