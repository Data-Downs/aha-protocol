import { Envelope, type Provenance } from "./envelope.ts";

/**
 * The verifiable subset of the envelope, enforced by a broker acting as referee.
 *
 * Three fields carry claims a broker can check and therefore reject at emission:
 *   - `authority: primary` must be owned by the sender for the message's domain.
 *   - every `provenance` entry must resolve to a real source the broker can find.
 *   - shape (delegated to the Zod `Envelope` schema).
 *
 * The advisory fields — `confidence`, `tentativeness`, and the *content* of
 * `human_readable` — are LLM self-reports. They are deliberately NOT checked
 * here. They are surfaced to the human for calibration over time; they are
 * never trusted as fact, and never rejected.
 */

/** Which agent holds primary authority in which domains. Owned by the human,
 *  stored in `cohort_config`, loaded by the broker. */
export type CohortRegistry = {
  primary: Record<string, Envelope["domain"][]>;
};

/** Does a provenance entry point at something that actually exists?
 *  The runtime supplies this against the live audit log and source systems.
 *  Returns true if the entry resolves. */
export type ProvenanceResolver = (
  entry: Provenance,
  envelope: Envelope,
) => boolean | Promise<boolean>;

export type VerificationViolation = {
  code: "shape" | "authority_not_owned" | "provenance_unresolved";
  message: string;
  detail?: unknown;
};

export type VerificationResult =
  | { ok: true; envelope: Envelope }
  | { ok: false; violations: VerificationViolation[] };

export type VerifyOptions = {
  /** When present, `authority: primary` is checked against domain ownership. */
  registry?: CohortRegistry;
  /** When present, every provenance entry must resolve. */
  resolveProvenance?: ProvenanceResolver;
};

/** Only `primary` is bound to domain ownership. `derived` is inference,
 *  `relayed` is pass-through, `none` is asking — none assert domain primacy. */
function checkAuthority(
  env: Envelope,
  registry: CohortRegistry,
): VerificationViolation | null {
  if (env.authority !== "primary") return null;
  const owned = registry.primary[env.from] ?? [];
  if (owned.includes(env.domain)) return null;
  return {
    code: "authority_not_owned",
    message: `${env.from} emitted authority 'primary' on domain '${env.domain}' it does not own`,
    detail: { from: env.from, domain: env.domain, owned },
  };
}

async function checkProvenance(
  env: Envelope,
  resolve: ProvenanceResolver,
): Promise<VerificationViolation[]> {
  const checks = await Promise.all(
    env.provenance.map(async (entry) => ({
      entry,
      resolved: await resolve(entry, env),
    })),
  );
  return checks
    .filter((c) => !c.resolved)
    .map((c) => ({
      code: "provenance_unresolved" as const,
      message: "provenance entry does not resolve to a known source",
      detail: c.entry,
    }));
}

/**
 * Verify an envelope against the enforceable invariants. Shape is always
 * checked; authority-domain binding and provenance resolution are checked
 * when a registry / resolver is supplied. Returns the parsed envelope on
 * success, or the full list of violations on failure — so the broker can
 * reject and dead-letter with a reason.
 */
export async function verifyEnvelope(
  input: unknown,
  opts: VerifyOptions = {},
): Promise<VerificationResult> {
  const parsed = Envelope.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      violations: [
        { code: "shape", message: "envelope failed schema validation", detail: parsed.error.issues },
      ],
    };
  }
  const env = parsed.data;
  const violations: VerificationViolation[] = [];

  if (opts.registry) {
    const v = checkAuthority(env, opts.registry);
    if (v) violations.push(v);
  }
  if (opts.resolveProvenance) {
    violations.push(...(await checkProvenance(env, opts.resolveProvenance)));
  }

  return violations.length === 0
    ? { ok: true, envelope: env }
    : { ok: false, violations };
}
