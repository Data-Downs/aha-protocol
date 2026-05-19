# AHA v0.3 + Cohort — external critique

*Written by Claude (Opus 4.7) at Chris's request, 2026-05-19. A point-in-time assessment of AHA v0.3 and the four-agent cohort (Hearth, Matt, Vincent, Chrisonomous) as they stand on this date. Intended as a working reference for the publishable write-up, not as a contribution to the spec.*

## Headline

The strongest thing here isn't the cohort or Chrisonomous. It's a **stance encoded in protocol primitives**. "Attentive not attention-taking" is widespread in AI ethics as a vibe; you've put it in the envelope — `naming_request` instead of notification, `decline` with reason, "I don't know" as a first-class answer, the 15-minute budget, no streaks. That's rare and worth publishing.

The weakest thing is calling it a protocol when it has one cohort. Not fatal — HTTP started in one building — but it shapes how to frame it publicly. See *Publish*.

## Technical

### Strengths

- **The envelope does real semantic work.** `provenance` + `authority` + `confidence` + `tentativeness` together force agents to be honest about epistemics in a way most multi-agent frameworks don't. *"Vincent reports calendar density; Vincent does not report stress"* is the right axiom and the envelope enforces it.
- **`decline` with reason + alternative is the most novel structural choice.** Per-domain primacy with cross-domain authority and a structured refusal path is a real architectural answer to context collapse. Most agent frameworks default to silent compliance.
- **`human_readable` on every message is the constraint that pays for itself.** A brake on opacity; an audit log usable without tools.
- **Per-agent isolation** (own project, own auth, own surfaces) instead of a shared monolith is unusual and defensible. It forces the protocol to do actual work; otherwise everyone would just share a database.

### Pushbacks

- **Chrisonomous is a single point of epistemic failure.** Only Chrisonomous can write to the pattern store, mint patterns, synthesise across domains. Specialists can `decline` directives, but no intent lets a specialist dispute Chrisonomous's *synthesis* directly to the human. If Chrisonomous mis-names a pattern as "stress" and the human confirms because the framing is plausible, the specialists watching the actual signal can't surface "we think it's something else" cleanly. **Add a `counter_hypothesis` or `objection` intent**, sendable specialist → human via the same naming-request channel.
- **The 15-minute daily human budget is a vibe, not a metric.** Nothing in the spec enforces it. Chrisonomous could emit 14 minutes of email and one `naming_request` and the protocol can't arbitrate. Either drop it from the spec (move it to Chrisonomous's policy) or give it teeth: an `attention_cost` field on every human-bound message and a daily cap enforced in the message router.
- **Federation is designed at zero data points.** The v0.3 federation section is the most theoretical part of the spec. The privacy framing is sharp but every concrete choice — scope rules per intent, sanitisation rules, trust ledgers — is a guess until a second cohort exists. **Recommendation: freeze the envelope fields (`cohort_id`, `scope`) and explicitly punt the rest to v1.0 or v2.0.** Right now it reads like specifying something that should be discovered.
- **AHA inherits Hearth's epistemics.** The pattern store mirrors Hearth's `state_deltas`. Pragmatic for v0.3 but worth naming: AHA is, structurally, "Hearth's state-delta pattern lifted to a cohort." The generalisation may or may not hold. Matt's HealthKit feed will stress it first — quantitative continuous signal vs Hearth's qualitative state.
- **Cost asymmetry isn't modelled.** A single token budget per cohort hides that Vincent's daily HMRC/Companies House trawler will dwarf everyone else's spend by 50–100×. Move budgets to per-agent + per-cohort before Vincent ships.

## Product

The cohort is **not a product**. It's a personal practice with engineering behind it. Vincent is a product. Hearth could be a product. Matt could be a product. Chrisonomous + AHA is connective tissue that only exists because there are specialists to connect.

Not a flaw — a category. The publishable artefact is the *protocol and the stance*. The specialists are independently shippable. Chrisonomous-as-a-service to other people is a thing to treat with great caution (see *Social and cultural*).

## Uniqueness — and the prior art to acknowledge

### Genuinely novel

1. **`decline` with reason + alternative as a first-class move.** Per-domain primacy with a structured refusal path, stated this cleanly, is not in any framework I've seen.
2. **`naming_request` with "I don't know" as a valid first-class answer.** Most agent systems force confidence. Forcing the agent to invite the human to *decline to name* is a small thing that's actually rare.
3. **Pattern-level federation with strict sanitisation.** "Cohorts trade in patterns, never in raw signals" is a sharper privacy frame than most. The k-anonymity-style framing is unusually clear.

### Prior art to position against

- **FIPA-ACL** (Foundation for Intelligent Physical Agents Agent Communication Language, late 90s). Performatives like `inform`, `request`, `agree`, `refuse`. **AHA is FIPA-ACL revived for the LLM era with a personal-mediator pattern and a human-in-the-topology stance.** FIPA-ACL is closer to your work than anything more recent. Cite it. Differentiate. You'll look stronger, not weaker — and anyone in multi-agent systems research will see the resemblance immediately if you don't.
- **MCP** (tools for agents) and **A2A** (Google's Agent2Agent). Different layers. A sentence each.
- **CrewAI / AutoGen / LangGraph.** Orchestration frameworks, not protocols with epistemics. Different category.

### Less novel than it might feel

- Cohort / specialist split — 20-year-old pattern in agent literature.
- The mediator role — BDI agent architectures dressed up.
- "The human names" — HCI 101.

The novel bit is the *combination*: epistemic typing in the envelope + attention stance + human-as-meaning-maker.

## Frontier

### Where this pushes

- **AI for personhood, not productivity.** The mediator pattern, "human as slow source of ground truth", the 15-minute budget — a different category from assistants/chatbots/copilots. Closest analogues are spiritual/therapeutic (confessor, anam cara, chief of staff for the soul). Most AI work doesn't engage with the *kind of relationship* it's proposing. This does.
- **Stance-in-protocol.** "Attentive not attention-taking" lives in message types and budget primitives, not just a values document. Encoding ethics as primitives rather than policy is a move more AI infrastructure should make.

### Where it doesn't push

- **Still text and email.** The "human in the topology" claim is strong, but the human's structural presence is mediated entirely through reading and replying to messages. A protocol where the human is structurally present should probably have more of the human's life — embodiment, voice, ambient state — structurally represented. Matt's HealthKit will get you partway, but only as a feed, not as a paradigm.
- **Symbolic patterns only.** The pattern store is JSON with names and provenance. The interesting thing about LLM agents is that meaning can live in embeddings, not just symbols. AHA stays fully symbolic. Defensible for auditability — but it caps how subtle the synthesis can get. Worth knowing you've made the choice.
- **One human per cohort is conservative.** Where the social value really lives — family cohorts, team cohorts, partner-as-peer — is mute in v0.3 (open question #5).

## Social and cultural

The most important section of this critique.

The mediator pattern, generalised, has a **strong authoritarian failure mode** that the protocol doesn't fully reckon with. Whoever writes Chrisonomous's prompt has enormous leverage over the user's self-understanding — the synthesis layer is *the place* where signals from work, body, relationships, and finances become *a story about you*. Chris writes his own prompt, so the leverage is auto-aligned. If a company ran Chrisonomous-as-a-service, it would be one of the most invasive consumer products ever shipped. The privacy stance addresses *data egress*; it doesn't address *meaning capture* by whoever owns the synthesis layer.

**AHA should name this risk explicitly in the spec — not as a disclaimer, but as a design constraint.** Suggested principle: *the mediator must be operable by the cohort's human in a way that nobody else can substitute for.* Open-source the prompts. Make the synthesis editable. Make pattern provenance fully inspectable. You're doing some of this already; stating it as a principle would inoculate against the obvious commercial appropriation.

Culturally, "attentive not attention-taking" is downstream of a real shift — Center for Humane Technology, calm technology, the post-2020 backlash against the attention economy. AHA is the most concrete instantiation of that shift I've seen in agent design. The fact that the author is a designer, not an engineer, shows: the protocol is opinionated about *how it feels to be near it*. Most agent protocols aren't.

## Publish: yes — with care

### Publish

- The AHA spec as an open-source design pattern and position paper. **Frame: "What does an agent protocol look like if the human is a structural participant rather than the boss?"** That's the publishable thesis and almost no one else is asking it.
- The cohort as a *worked example*, not a generalisation. "Here is one person's cohort. Here is how the protocol shaped it." Concrete is more useful than abstract.
- The "attentive not attention-taking" principle as the lead, not the footnote.

### Caveats to bake into the write-up

- Acknowledge FIPA-ACL. Differentiate on epistemic typing + attention stance + human-as-meaning-maker.
- Acknowledge n=1. The protocol generalises in theory; it's been validated for one person.
- Name the authoritarian failure mode of the mediator role, and the design choices that mitigate it.

### Don't publish

- The cohort as a productisable artefact. It's not.
- Federation as a feature. It's a future direction at n=1.
- "15 minutes" or "19:00 BST daily email" as universal — those are settings, not the protocol.

## One-line summary

Framed as *"here's the future of multi-agent AI"* this gets dismissed in a sentence by anyone in the field. Framed as *"here's how I think about agents that pay attention to humans rather than take attention from them, and here's the protocol I built to make that real"* — with FIPA-ACL acknowledged, the mediator-as-failure-mode named, and federation marked as future — it's a strong, defensible piece worth shipping.

## Action items to consider before publishing

1. Add a `counter_hypothesis` (or `objection`) intent so specialists can dispute synthesis, not only refuse directives.
2. Decide what the 15-minute budget means in the spec: drop, or give it teeth via `attention_cost` + a router-enforced cap.
3. Move budgets to per-agent + per-cohort. Vincent will need it before he ships.
4. Add a "mediator integrity" principle to the design stance: synthesis is operable by the cohort's human and nobody else can substitute.
5. Mark the federation section as forward-looking. Freeze the envelope fields; defer the semantics to v1.0+ or to when a second cohort exists.
6. Acknowledge FIPA-ACL and differentiate.

---

*Critique stops here. Everything above is a reading of the work as it stood on 2026-05-19; the protocol and cohort will move, and a re-read will likely surface different things.*
