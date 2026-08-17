import { Domain, type Envelope } from "./envelope.ts";
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
 * This is cohort data, not protocol data. It lives here because it must be
 * one value that every agent shares: six copies of an ownership table is six
 * chances to disagree about who owns what. Per-cohort overrides ride on
 * `CohortRecord.registry` in aha-runtime; this constant is the fallback for
 * the single-cohort agents that have no directory.
 */

export type AgentDomains = {
  name: string;
  domains: readonly Envelope["domain"][];
};

/** Every domain in the protocol, in enum order. */
export const ALL_DOMAINS = Domain.options;

/** Build a registry from a list of agents and the domains each owns. Use
 *  this when the cohort is resolved at runtime from a directory. */
export function buildRegistry(agents: readonly AgentDomains[]): CohortRegistry {
  const primary: Record<string, Envelope["domain"][]> = {};
  for (const agent of agents) {
    primary[agent.name] = [...agent.domains];
  }
  return { primary };
}

/**
 * The `chris-cohort-a` ownership table. Mirrors `AGENTS` in
 * aha-cohort/src/cohort.ts — change both together.
 *
 * `embodiment` is deliberately owned by two agents. Matt holds the measured
 * body (HRV, sleep, load); Chrisonomous holds it as a synthesis dimension.
 * Either may speak with primacy there until the split is decided.
 *
 * The mediator is registered under both its proper name and the canonical
 * `mediator` role address, which v0.6 lets it emit under interchangeably.
 *
 * The human owns every domain: "Authority: final on all matters" (v0.6
 * §Participants). Chris's typed input is logged as an envelope from `chris`,
 * and the referee must never flag the one participant who can mint meaning.
 */
export const CHRIS_COHORT_REGISTRY: CohortRegistry = buildRegistry([
  { name: "chris", domains: ALL_DOMAINS },
  { name: "chrisonomous", domains: ["relational", "spiritual", "embodiment", "meta"] },
  { name: "mediator", domains: ["relational", "spiritual", "embodiment", "meta"] },
  { name: "hearth", domains: ["career"] },
  { name: "matt", domains: ["training", "embodiment"] },
  { name: "vincent", domains: ["business"] },
  { name: "alex", domains: ["personal_admin"] },
  { name: "ruth", domains: ["financial_wellbeing"] },
  { name: "will", domains: ["knowledge"] },
]);
