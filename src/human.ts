/**
 * The human participant, as the agents address them.
 *
 * Every prompt in the cohort was written for its founder by name and by
 * pronoun; the first second human was told she had found the wrong door.
 * A Human is the name and pronouns the cohort's directory holds for the
 * person a turn is serving. `humanise` renders text written for the founder
 * for that person instead, and is the identity for the founder, so his own
 * prompts are byte-identical to before.
 */

export interface Pronouns {
  subject: string;
  object: string;
  possessive: string;
  reflexive: string;
}

export interface Human {
  /** AHA participant id, e.g. "chris", "sarah". */
  id: string;
  /** How the agents address and refer to them, e.g. "Chris". */
  name: string;
  pronouns: Pronouns;
}

const HE: Pronouns = { subject: "he", object: "him", possessive: "his", reflexive: "himself" };
const SHE: Pronouns = { subject: "she", object: "her", possessive: "her", reflexive: "herself" };
const THEY: Pronouns = { subject: "they", object: "them", possessive: "their", reflexive: "themself" };

const PRONOUN_SETS: Record<string, Pronouns> = { "he/him": HE, "she/her": SHE, "they/them": THEY };

/** The founder, as the prompts were written. */
export const FOUNDER_HUMAN: Human = { id: "chris", name: "Chris", pronouns: HE };

/** "she/her" → the set; unknown or absent → the founder's, so a prompt never
 *  renders a blank. */
export function parsePronouns(spec: string | null | undefined): Pronouns {
  return PRONOUN_SETS[(spec ?? "").trim().toLowerCase()] ?? HE;
}

function isFounder(human: Human): boolean {
  return human.name === FOUNDER_HUMAN.name && human.pronouns.subject === HE.subject;
}

function matchCase(source: string, replacement: string): string {
  return source[0] === source[0]?.toUpperCase() ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;
}

/** Render text written for the founder for this human: the name, the
 *  possessive, and the four pronoun forms, case kept. A word-boundary pass,
 *  so "the" and "this" are untouched. The founder gets the text unchanged. */
export function humanise(text: string, human: Human): string {
  if (isFounder(human)) return text;
  const p = human.pronouns;
  return text
    .replace(/\bChris's\b/g, `${human.name}'s`)
    .replace(/\bChris\b/g, human.name)
    .replace(/\b(himself|Himself)\b/g, (m) => matchCase(m, p.reflexive))
    .replace(/\b(his|His)\b/g, (m) => matchCase(m, p.possessive))
    .replace(/\b(him|Him)\b/g, (m) => matchCase(m, p.object))
    .replace(/\b(he|He)\b/g, (m) => matchCase(m, p.subject));
}

/** A tool definition's prose — its description and every property
 *  description — rendered for the human. Names, enums and schema stay. */
export function humaniseTool<T extends { description?: string; input_schema?: unknown }>(tool: T, human: Human): T {
  if (isFounder(human)) return tool;
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        out[key] = key === "description" && typeof value === "string" ? humanise(value, human) : walk(value);
      }
      return out;
    }
    return node;
  };
  return {
    ...tool,
    ...(tool.description !== undefined ? { description: humanise(tool.description, human) } : {}),
    ...(tool.input_schema !== undefined ? { input_schema: walk(tool.input_schema) } : {}),
  };
}
