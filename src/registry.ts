import type { Envelope } from "./envelope.ts";
import type { CohortRegistry } from "./verify.ts";

/**
 * Domain ownership — who may claim `authority: primary` where.
 *
 * The spec binds primacy to domain: a specialist is primary within its own
 * domain and "cannot claim authority for observations outside their domain"
 * (v0.6 §Participants). `derived`, `relayed` and `none` assert no primacy and
 * are therefore unbound — an agent may always speak about another's domain,
 * it just may not speak *for* it.
 *
 * This is cohort data, not protocol data: the table is built at runtime from
 * the cohort's directory row (`CohortRecord.registry` in aha-runtime), whose
 * kinds come from the platform's agent_types table. The protocol holds the
 * shape and the builder, and no cohort's table (aha-cohort/briefs/directory.md).
 */

export type AgentDomains = {
  name: string;
  domains: readonly Envelope["domain"][];
};

/** Build a registry from a list of agents and the domains each owns. Use
 *  this when the cohort is resolved at runtime from a directory. */
export function buildRegistry(agents: readonly AgentDomains[]): CohortRegistry {
  const primary: Record<string, Envelope["domain"][]> = {};
  for (const agent of agents) {
    primary[agent.name] = [...agent.domains];
  }
  return { primary };
}

/** The human owns every domain the cohort's agents carry: "final on all
 *  matters" is the union of the table, since the protocol no longer holds a
 *  list of domains of its own. */
export const humanDomains = (agents: readonly AgentDomains[]): Envelope["domain"][] => [...new Set(agents.flatMap((a) => a.domains))];

/** The name a person knows an agent by. The mediator's wire name stays
 *  chrisonomous; it is Tender to the person. Every other agent is its wire
 *  name, capitalised. */
export function agentDisplayName(wire: string): string {
  if (wire === "chrisonomous" || wire === "mediator") return "Tender";
  return wire.charAt(0).toUpperCase() + wire.slice(1);
}
