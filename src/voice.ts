/**
 * The cohort's voice lints — shared by every door prose leaves through
 * (aha-runtime's prose gate) and the reply door in the turn loop (aha-agent),
 * so the two can never disagree about what a nag is.
 *
 * The moral floor's lint — stage H4 of aha-cohort/briefs/time.md. The
 * system says the shape of time around a thing; it never reproaches. These
 * are the phrasings that turn a fact into a nag. Quoted speech is exempt:
 * the human may be quoted saying anything.
 */
const REPROACH: RegExp[] = [
  /\byou (still )?haven'?t\b/i,
  /\byou forgot\b/i,
  /\byou never\b/i,
  /\byou keep\b/i,
  /\byou should have\b/i,
  /\byou failed to\b/i,
  /\byou (missed|ignored|neglected|left)\b/i,
  /\bdon'?t forget\b/i,
  /\bfriendly reminder\b/i,
  /\bjust a reminder\b/i,
  /\bstreak\b/i,
  /\bno excuses?\b/i,
];
const QUOTED = /"[^"\n]{1,400}"|“[^”\n]{1,400}”/g;

export function findReproach(text: string): string[] {
  const unquoted = text.replace(QUOTED, " ");
  const seen = new Set<string>();
  for (const re of REPROACH) {
    const m = unquoted.match(re);
    if (m) seen.add(m[0].toLowerCase().replace(/\s+/g, " "));
  }
  return [...seen];
}

/**
 * A question held over the human — silence is an answer (settled 13 Sep
 * 2026). These are the shapes the rule's first week left on the tape: the
 * closure note closed the agent's last question, and the nag came back as a
 * statement ("Still holding \"amazing\"", Tender, 19 Sep 2026). Quoted speech
 * is exempt, as above.
 */
const HELD_OVER: RegExp[] = [
  /\bstill (holding|waiting|wondering|curious)\b/i,
  /\bwhere we left (it|off|things)\b/i,
  /\bor let it (sit|go|lie|rest)\b/i,
  /\byou (still )?(haven'?t|never|didn'?t) (told|said|answered|finished|filled)\b/i,
  /\b(never|didn'?t|haven'?t) (got|get|gotten) (an answer|back to)\b/i,
  /\bmy (earlier|last|previous) question\b/i,
  /\bin case you wanted to\b/i,
];

export function findHeldOver(text: string): string[] {
  const unquoted = text.replace(QUOTED, " ");
  const seen = new Set<string>();
  for (const re of HELD_OVER) {
    const m = unquoted.match(re);
    if (m) seen.add(m[0].toLowerCase().replace(/\s+/g, " "));
  }
  return [...seen];
}
