# AHA — Agent-Human-Agent Protocol

AHA is a message contract for personal multi-agent systems in which the human is a participant, not an operator. One human is supported by several specialist agents and a mediator. The protocol defines how those agents exchange observations, how a claim carries its standing and its sources, how an agent declines or disputes, how the human's word reaches the agent it concerns, and how all of it stays readable by the human.

It sits at a different layer from the protocols it is usually compared with.

| Protocol | Question it answers | Where the human sits |
|---|---|---|
| MCP | How does one agent invoke a tool? | Outside — operator |
| A2A | How does one agent delegate work to another? | Outside — consumer of delegated work |
| AHA | How do several agents and a human hold meaning together? | Inside — participant with authority |

## Read the spec

**[SPEC.md](SPEC.md)** is the specification: the design stance, the envelope, the seventeen intents, verification, tenancy, witness, frames, budgets, the learning layer, federation, and the open questions.

## What is in this repository

The specification, and a reference validator in TypeScript.

| Module | What it holds |
|---|---|
| `src/envelope.ts` | The envelope and witness content as Zod schemas, and `PROTOCOL_VERSION`. |
| `src/verify.ts` | `verifyEnvelope`: shape, authority against the ownership table, and provenance resolution. |
| `src/registry.ts` | `buildRegistry` and `humanDomains`: the ownership table, built from a cohort's directory. |
| `src/frames.ts` | The frames an agent may put to the human — choices, acts, objects, tool steps — and their rules. |
| `src/voice.ts` | `findReproach` and `findHeldOver`: the lints over prose addressed to the human. |
| `src/human.ts` | The human as agents address them: name and pronouns, from the directory. |

## Using the validator

Requires Node 22 or later. The package is not on npm; install it from a tag.

```sh
npm install github:Data-Downs/aha-protocol#v2.0.0
```

```ts
import { buildRegistry, verifyEnvelope } from "aha-protocol";

const registry = buildRegistry([
  { name: "agentA", domains: ["business"] },
  { name: "agentB", domains: ["training", "embodiment"] },
]);

const result = await verifyEnvelope(inbound, {
  registry,
  resolveProvenance: (entry) => auditLog.has(entry),
});

if (!result.ok) {
  deadLetter(inbound, result.violations);
}
```

`verifyEnvelope` always checks shape. It checks authority when given a registry, and provenance when given a resolver. To check shape alone, use `Envelope.safeParse`.

## Two version numbers

- **The protocol version** (currently `0.8`) is what the spec describes and what a sender stamps in an envelope's `protocol` field.
- **The package version** (the git tags, currently `v2.0.0`) is the validator library's own semantic version. It moves more often than the wire does.

## Development

```sh
npm install
npm run typecheck
npm test
```

## Status

AHA runs in production for a small number of cohorts on one operator's infrastructure. It is a working draft: the envelope is stable, the federation semantics are deliberately unwritten, and the open questions in the spec are open. Earlier drafts (`v0.3.md` to `v0.5.md`) and a critique of the first are kept for history.

## Licence

No licence has been chosen yet. Until one is added, all rights are reserved.
