# AHA — Agent-Human-Agent Protocol

**Protocol version 0.8.** This is the version a sender stamps in an envelope's `protocol` field (`PROTOCOL_VERSION` in the reference validator). The reference package has its own semantic version; see "Versioning and governance".

## What is this?

AHA is a communication protocol for multi-agent systems in which the human is a structural participant, not an external operator. Other inter-agent protocols (MCP for tools, A2A for delegation) treat the human as the consumer or the supervisor. AHA puts the human in the topology — as the meaning-maker, the arbitrator, and the slow source of ground truth — and gives agents first-class moves for asking, deferring, disputing, and learning.

The protocol is designed for a personal multi-agent system in which one human is supported by several specialist agents and one mediating agent who holds the integrative function. AHA defines how these agents exchange observations, how patterns get surfaced and named, how directives flow and can be declined or contested, how the human's word reaches the agent it concerns, and how disagreements escalate to the human. It is multi-cohort: one agent deployment may serve several cohorts at once, each cohort serving one human. It also anticipates federation: cohorts on different operators' infrastructure exchanging what they have learned while preserving each human's privacy absolutely.

The word "aha" is the moment the protocol exists to make possible: a pattern named, a signal understood, a connection recognised. The protocol is the substrate on which those moments can happen reliably — without colonising the human's attention to do it.

**Provenance.** AHA's pattern model is generalised from a single agent's state-delta schema — typed observations about a person's state, each a living hypothesis that a later read can supersede — lifted into a cohort-wide pattern store. That generalisation is stressed hardest by continuous quantitative signal (biometrics, for instance), which behaves nothing like sparse qualitative state. Some choices made for the single-agent case may not survive that contact.

**Names in this document.** Examples use a generic cohort, `cohort-a`: three specialists and a mediator serving one human.

| Wire name | Role | Example domains |
|---|---|---|
| `agentA` | Specialist | `business` |
| `agentB` | Specialist | `training`, `embodiment` |
| `agentC` | Specialist | `career` |
| `mediator` | Mediator | cross-domain synthesis |
| `human` | The human | final on all matters |

The names and domains are illustrative. A real cohort's agents, their names and the domains each owns are facts in that cohort's directory, never in the protocol.

## Design stance

AHA is opinionated. Six principles, from which everything else follows.

**Attentive to the human, not attention-taking from the human.** This is the organising stance and the value the rest of the design is in service of. Agents on this protocol serve their human; they do not extract attention. Each agent operates under a per-agent time budget (see "Per-agent budgets"), and every message to the human is a draw on that budget. Curiosity and Socratic patience replace demands and engagement hooks. There are no streaks, no longest-runs framing, no "you missed your Wednesday check-in" copy, no sycophantic openings, no modal interruptions. An agent that notices itself drifting toward attention-taking should propose the quieter version first. Part of this stance is carried in code (see "Voice").

**Provenance-honest by default.** Every message carries its source and its derivation chain. No agent claims more standing than its evidence supports. A business agent reports calendar density; it does not report stress. The interpretation that bridges domains belongs to whoever holds the meta-intent — and that interpretation is contestable (see `counter_hypothesis`).

**Human as meaning-maker, not supervisor.** When patterns are novel or ambiguous, the mediator surfaces them to the human and asks. The human names. The system learns. This is slow on purpose — meaning comes from the human or it isn't meaning.

**Decline beats silent compliance.** A specialist agent receiving a cross-domain directive can decline with reason. Declines are not failures; they are how specialist judgment survives in a network with hierarchy. Specialists may also contest the mediator's synthesis directly via `counter_hypothesis` — disagreement is a first-class move, not a failure.

**Human-readable, always.** Every AHA message includes a natural-language `human_readable` field alongside its structured content. The human can read the audit log at any time and understand what happened. Forcing each agent to articulate its reasoning in plain language is also a constraint on its reasoning — opacity is treated as a smell.

**Mediator integrity.** The mediator role is structurally powerful — it is the synthesis layer, the place where signals from work, body, relationships, and finances become *a story about you*. Whoever writes the mediator's prompt has enormous leverage over the human's self-understanding. The protocol therefore requires that the mediator be operable by the cohort's human in a way no third party can substitute for: open prompts, editable synthesis, fully inspectable pattern provenance, and a clear path for the human to disagree with or rewrite their own model. A mediator that cannot be inspected and edited by the human it serves does not implement AHA in good faith. This principle exists to inoculate against the obvious commercial appropriation of the mediator pattern.

## Participants

Four roles, each with defined authorities and a defined set of message types they can send and receive.

**Specialist agents.** Authority: primary within their own domains. Can emit observations, respond to queries, decline directives with reason, escalate disagreements, pass on the human's word (`witness`), and contest the mediator's synthesis via `counter_hypothesis`. Cannot claim authority for observations outside their domains.

**The mediator.** Authority: cross-domain synthesis, brokering, and direction on integration matters. Can emit directives to specialist agents, surface patterns to the human, request naming, log learned patterns. The only agent permitted to write to the shared pattern store. Also the cohort's default representative externally (see Federation). The mediator's synthesis is contestable by specialists via `counter_hypothesis`; the mediator is not infallible. A mediator may be **headless**: a synthesis function with no chat surface of its own, whose output reaches the human only through the specialist agents and quiet digest surfaces. Headless or not, the Mediator integrity principle applies in full — the human can always inspect and edit their own synthesis.

**The human.** Authority: final on all matters. Can name patterns, override declines, arbitrate disputes between agents, edit the mediator's prompt and synthesis, set per-agent budgets. The only participant who can mint new meaning. The human owns every domain the cohort's agents carry: "final on all matters" is the union of the ownership table.

**The audit log** is not a participant but a substrate. Every AHA message is appended immutably. The log is the system's memory of itself.

## Message envelope

Every AHA message is JSON with this shape:

```json
{
  "id": "01HXYZ...",
  "from": "agentA",
  "to": ["mediator"],
  "cohort_id": "cohort-a",
  "scope": "internal",
  "in_reply_to": null,
  "timestamp": "2026-05-18T09:14:22Z",
  "intent": "observation",
  "domain": "business",
  "authority": "primary",
  "provenance": [
    {"source": "calendar", "window": "2026-05-11..2026-05-18"},
    {"source": "code_commits", "window": "same"}
  ],
  "confidence": "high",
  "tentativeness": "assertion",
  "expires_at": null,
  "protocol": "0.8",
  "human_readable": "Calendar density up 40% versus the four-week baseline. Three late-night commit sessions detected this week. Four flagged emails unanswered for more than 36 hours.",
  "content": {
    "calendar_density_delta": 0.40,
    "late_night_commit_sessions": 3,
    "stale_urgent_emails": 4
  }
}
```

A `counter_hypothesis` from a specialist to the human, routed via the mediator:

```json
{
  "id": "01HXYC...",
  "from": "agentB",
  "to": ["human"],
  "via": "mediator",
  "cohort_id": "cohort-a",
  "scope": "internal",
  "in_reply_to": "01HXYA...",
  "timestamp": "2026-05-18T19:35:00Z",
  "intent": "counter_hypothesis",
  "domain": "embodiment",
  "authority": "primary",
  "provenance": [
    {"source": "health_data", "metric": "hrv", "window": "last_7_days"},
    {"source": "training_log", "window": "last_14_days"}
  ],
  "confidence": "medium",
  "tentativeness": "hypothesis",
  "human_readable": "The mediator is naming this as stress. My read of HRV and skipped sessions: this looks more like recovery from a hard block — different signature, lower urgency. Worth pausing on the directive while you decide.",
  "content": {
    "disputed_message_id": "01HXYA...",
    "disputed_naming": "stress",
    "proposed_alternative": "recovery",
    "supporting_signals": ["01HXY1...", "01HXY2..."],
    "request_to_human": "Hold the training directive until you respond."
  }
}
```

Field semantics:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique message id. |
| `from` | yes | The sender's wire name. |
| `to` | yes | One or more recipients. `"mediator"` is the canonical mediator address (see "Cohorts and tenancy"). |
| `via` | no | For messages routed via the mediator (a `counter_hypothesis` from a specialist to the human, for instance), names the routing mediator. The mediator MUST forward without altering the substantive content, and MUST surface it to the human. |
| `cohort_id` | yes | The originating cohort's stable identifier. Distinct from any human's identity. |
| `scope` | yes | `internal` (within the cohort), `external` (to a specific other cohort), or `network` (broadcast to a federated network). Strict privacy rules apply to non-internal messages (see Federation). |
| `in_reply_to` | yes, nullable | The id of the message this answers, or `null`. |
| `timestamp` | yes | ISO 8601 instant with an offset. |
| `intent` | yes | The verb (see "Message types"). |
| `domain` | yes | A slug: lower-case letters and underscores, 2 to 32 characters, starting with a letter (`^[a-z][a-z_]{1,31}$`). The protocol validates the shape and nothing more. Which domains exist, and whose each is, come from the cohort's directory. |
| `authority` | yes | `primary` (in the sender's own domain), `derived` (inferred from primary signals), `relayed` (passing through), or `none` (asking). |
| `provenance` | when `authority` is not `none` | The source events or messages this claim derives from. Each entry must carry a `source` or a `message_id`, and may carry anything else that describes the source. For external messages, provenance is sanitised (see Federation). |
| `confidence` | no | `low`, `medium`, `high`, or a number from 0 to 1. |
| `tentativeness` | yes | `assertion`, `hypothesis`, or `question`. Forces the sender to flag whether it is stating, guessing, or asking. |
| `expires_at` | no | ISO 8601 instant with an offset, or `null`. A message without one never expires silently. |
| `experiment_id` | no | Tags the message as belonging to an `experiment` scope (see "Message types"). |
| `protocol` | no | The protocol version the sender emitted under (`"0.8"`). Lets a mixed-version cohort be reasoned about during migrations. |
| `human_readable` | yes | Natural-language summary. Required on every message. Sanitised for external scope. |
| `content` | no | Structured payload; its schema varies by `intent`. |

## Verification

A broker receiving an envelope acts as referee. The envelope carries two kinds of field, and they are treated differently.

**Verifiable fields are enforced.** A broker can check them, and rejects at emission when they fail:

- *Shape.* The envelope parses against the schema above.
- *Authority.* `authority: primary` must be owned: the sender must be the owner of the message's `domain` in the cohort's ownership table. `derived`, `relayed` and `none` assert no primacy and are unbound — an agent may always speak *about* another's domain; it may not speak *for* it.
- *Provenance.* Every `provenance` entry must resolve to a real source the broker can find — a message in the audit log, or a source system it knows.

A rejected envelope is dead-lettered with its violations (`shape`, `authority_not_owned`, `provenance_unresolved`), never dropped silently.

**Advisory fields are never trusted as fact and never rejected.** `confidence`, `tentativeness`, and the content of `human_readable` are a model's self-report. They are surfaced to the human for calibration over time.

**The ownership table is cohort data, not protocol data.** It maps each agent to the domains in which it holds primary authority. It is owned by the human, held in the cohort's directory, and built at runtime from that directory. The protocol defines its shape and holds no cohort's table.

## Cohorts and tenancy

- **`cohort_id` is the tenancy key.** Every envelope, log row, inbox entry, and pattern-store record carries it. An agent deployment serving several cohorts partitions everything it holds by `cohort_id`.
- **Human identity is resolved from the directory, never from the envelope.** Within `scope: internal` there is exactly one human per cohort, resolved at the storage boundary by the receiving agent's cohort directory. The directory also holds how the human is addressed — their name and pronouns — so no agent knows whose it is from its own prompt or configuration. This is the same rule federation depends on ("humans are anonymised at the cohort boundary"), applied from the first internal message.
- **Agents are deployments; agent instances are memberships.** `agentB` is one deployed service. (`agentB`, `cohort-a`) and (`agentB`, `cohort-b`) are two instances of it — directory rows, not deployments. An inbound envelope is accepted only if both the sender and the receiver are members of `envelope.cohort_id` in the receiver's directory.
- **`to: ["mediator"]` is the canonical mediator address.** The mediator is a role; its proper name, if it has one, is a per-cohort directory fact. Receivers normalise a cohort's mediator name to the `mediator` role on ingest. New emissions should prefer the role address.
- **Domains are per-cohort.** Two cohorts on the same infrastructure may carry different domains, owned by different agents. A domain nobody in the cohort owns belongs to the mediator.

## Message types

Seventeen intents, each with defined semantics and permitted senders. Ordered loosely by semantic cluster.

| Intent | Sent by | Sent to | Purpose |
|---|---|---|---|
| `observation` | Specialist agents | Mediator (usually) | A fact in own domain. |
| `query` | Any agent | Any agent | Asking for specific information. |
| `curious` | Any participant | Any participant | A held question, or asking what's worth looking into; signals available bandwidth. |
| `response` | Any agent | Originator | Replying to a `query` or `curious`. |
| `advice` | Mediator (usually) | Specialist agents | Non-binding cross-domain suggestion. |
| `directive` | Mediator | Specialist agents | Binding instruction within authority. |
| `decline` | Specialist agents | Mediator | Refusing a directive, with reason and alternative. |
| `counter_hypothesis` | Specialist agents | The human (via mediator) | Disputing the mediator's synthesis or naming. |
| `retract` | Any agent | Originator + log | Withdrawing a prior claim that new evidence has invalidated. |
| `escalation` | Any agent | The human (via mediator) | Kicking a decision up. |
| `naming_request` | Mediator | The human | Surfacing a cluster for the human to name. |
| `naming` | The human | Mediator | Naming a pattern, declining to, or marking it as nothing. |
| `appreciation` | Any participant | Any participant | Acknowledging that something worked; a positive calibration signal. |
| `acknowledgement` | Any agent | Originator | Confirmation of receipt and understanding. |
| `experiment` | Any participant | Any agent | Marks a sequence as exploratory and ephemeral — does not enter the learning layer. |
| `note` | Any agent | Audit log only | A quiet log entry, no response expected. |
| `witness` | Any agent that heard the human | The domain's owner | The human's word passing through: a fact, decision or correction stated to one agent that belongs to another's domain. |

Supplementary semantics:

A `decline` must include a `reason` and either an `alternative` proposal or a `request_for_discussion`. Silent non-compliance is forbidden.

A `counter_hypothesis` must include the `disputed_message_id`, the `disputed_naming` or `disputed_claim`, a `proposed_alternative`, the specialist's `supporting_signals`, and an explicit `request_to_human` (what action the specialist wants the human to take). The mediator MUST forward `counter_hypothesis` messages to the human in the next surfacing window — it cannot suppress them. If the mediator wishes to push back, it does so by emitting its own response in the same surfacing context, alongside the specialist's `counter_hypothesis`, not in its place.

A `naming_request` must include the candidate signals, optionally a small set of named hypotheses, and an explicit invitation to decline ("This may be nothing — say so if it is").

A `naming` response can be: a name (`"this is stress"`), a meta-name (`"this is a holiday — ignore"`), or `"I don't know yet"`. The third is a valid first-class answer.

A `curious` is bidirectional. Agents can send to other agents ("what should I be looking into?") and the mediator can ask agents ("what are you curious about right now?"). The frequency of `curious` traffic is itself a signal — when an agent has no `curious` cycles to spare, the system knows it's at capacity. A `curious` may also carry a question an agent is holding for the human (see "Asking and answering").

An `appreciation` is stored as a positive calibration signal, not as decoration. Both human-to-agent and agent-to-agent appreciations are valid. An `appreciation` should name *what* worked when possible, not only *that* something worked.

An `experiment` opens a scope. All messages tagged with the experiment's ID are ephemeral: they appear in the audit log (immutability is preserved) but do not influence the learning layer or persist as state.

A `retract` references the message ID it withdraws and includes a reason. The original message stays in the audit log but is marked superseded.

A `witness` carries the human's words to the agent that owns the domain they concern. It is never routine: an owner may not clear it in a bulk drain, and must reconcile its own records against it or leave it pending and visible on every door it speaks through (see "Witness").

## Hierarchy and authority

AHA hierarchy is per-domain, not global.

Within a specialist's domain, the specialist is primary. The mediator can advise; it cannot override.

Across domains, the mediator is primary. Specialists can decline its directives with reason; they cannot ignore them silently. Specialists can also contest the mediator's *synthesis* (not just its directives) via `counter_hypothesis` routed to the human.

The human is above all. Human directives are final, though they can be questioned once with reason before settling. The human is the only participant who can edit the mediator's prompt, synthesis, and pattern store.

A typical cross-domain flow:

1. `agentA` emits an `observation` (calendar density up 40%).
2. `agentB` emits an `observation` (HRV trending down, two sessions skipped).
3. `agentC` emits an `observation` (drift score rising).
4. The mediator synthesises and notices an anomaly cluster.
5. The mediator issues a `naming_request` to the human ("stress?").
6. `agentB` sees the mediator's framing and judges it wrong (signals match recovery, not stress). `agentB` emits a `counter_hypothesis` to the human via the mediator.
7. The human receives both at once: the mediator's `naming_request` and `agentB`'s `counter_hypothesis`. Names it ("recovery, not stress").
8. The mediator logs the pattern under the human's name. Any prior directives based on the wrong framing are retracted.

No agent concluded anything about the human. Three agents reported facts inside their own competence, one proposed a reading, another contested it, and the human settled it.

## Asking and answering

**Synchronous query→response (the transport binding).** A `query` POSTed to a receiver's AHA endpoint MAY be answered *inline*: the receiver runs a bounded, **read-only** turn and returns HTTP 200 with `{ status, message_id, response }`, where `response` is a complete `response` envelope (`in_reply_to` = the query's id). A receiver that does not answer queries falls through to the normal log-and-ack path (201, no `response` field) — askers MUST treat that as "no answer", never as an error. Constraints:

1. **Read-only.** The answering turn must not mutate the receiver's state or the outside world. A peer's question can inspect; it can never act.
2. **No recursion.** An answering turn must not itself emit `query` — no fan-out storms.
3. **Timeout-bounded.** Askers set a timeout (reference: 25s) and soft-fail; a silent peer degrades the asker's answer, never breaks it.
4. **Descriptive slice.** Answers describe the situation, not raw records — figures appear only when a figure is the substance of the question. This is where the consent spectrum (full / descriptive / none) binds to the wire; the receiving agent enforces its human's setting.
5. **Both sides log.** Query and response are appended to the receiver's audit log; a convening asker (see below) also logs received responses to its own.

**The convening round.** The mediator MAY canvass several specialists in parallel with one standing question and integrate the returned positions into its synthesis. This is the standing-positions mechanism: positions are *pulled* by the convenor on a rhythm, not pushed by each agent's schedule. The round is silent — it writes, it never notifies the human.

**`curious` as the held question.** A `curious` envelope may carry a question an agent is *holding* for the human, not a question requiring an answer from the receiver. Receivers file it into their pending context with these semantics: it is never auto-acknowledged as routine; it surfaces in a receiver's conversation **only when the conversation genuinely touches it** ("the question finds its moment, not its channel"); and the receiver that offers it acknowledges with where and how it landed. The envelope's `human_readable` carries its own offer guidance, so receivers need no bespoke handling beyond filing it. Reference TTL: long (weeks, not days) — a held question waits.

## Witness

**Told once, held everywhere.** What the human tells any agent about a domain reaches that domain's owner, and no owner asserts in its domain against an unread word from the human.

**The incident behind it.** A human told three different agents, over ten days, that a filing had been made. The agent that owned the domain kept its record at *overdue* and said so to the human, because nothing obliged a hearing agent to pass the human's words to the owner, and the only agent-to-agent traffic (`query`/`response`) flowed outward from the owner, never inward to it. Query and response made specialists reachable; they did not make them tellable.

**The intent.** `witness` is the human's word passing through. It is sent by whichever agent heard it, to the owner of the domain it concerns, with `authority: relayed` (the hearer speaks *about* the domain, never *for* it), `tentativeness: assertion`, `confidence: high`, and a `provenance` entry whose `source` names the human's live channel (`<human>:chat`, with the conversation id as `message_id`). `human_readable` is rendered by code, every instant absolute: *"The human told agentA at 18:27 on Saturday 29 August 2026: …"*.

**Content.** A witness's `content` is typed:

| Field | Required | Meaning |
|---|---|---|
| `statement` | yes | The fact as the hearer understood it. |
| `user_message` | yes | What the human actually said, verbatim, so the owner reconciles against the human's words and not the hearer's paraphrase. |
| `heard_by` | yes | The hearing agent. |
| `heard_at` | yes | When it was heard; an instant with an offset. |
| `conversation_id` | no | The conversation it was heard in. |
| `handed` | no | Present when the word was lifted from a channel the cohort cannot see. See below. |
| `proposed_times` | no | Times someone proposed, for the diary's owner to hold. See below. |
| `chosen_time` | no | The time the human chose, so the other holds are released. |
| `appointment` | no | A meeting, call or visit with someone at a time. See below. |
| `replied` | no | The human's reply to a mail that asked for one. See below. |

The optional typed fields exist so that an owner acts on them *in code* on receipt, rather than asking a model to read prose and decide.

*Handed.* The human may lift an exchange from a channel the cohort cannot see and hand it over. `handed` carries the `channel` (`whatsapp`, `imessage`, `signal`, `sms`, `voice`, `other`) and an optional `note`, the human's own line about it. `user_message` is then the exchange as lifted, and the provenance source is `<human>:handed:<channel>`. The words are a correspondent's as much as the human's, and the owner reads them fenced.

*Proposed and chosen times.* `proposed_times` carries `who` (the other party) and one to eight `times`, each a `start` and `end` instant. `chosen_time` carries `who` and the chosen `start`.

*Appointment.* `appointment` carries `who`, an optional `what`, a `status` (`confirmed`, `proposed`, `cancelled`), the time as the words carried it (`when`), what those words resolved to (`resolved`), and `heard_where`, the time zone the hearer resolved it in — the human's, at that moment. It may also carry a `venue` and a `sender` (who wrote the mail it was read from, set by code from the mail itself). Confirmed and resolved to an instant, it is placed; proposed, or resolved only to a day, it is held; cancelled, what was placed or held for that time is let go.

The time is carried in two parts so that no model computes a date:

- `when` holds only what was said: `as_written`, and whichever of `weekday`, `day`, `month`, `year`, `hour`, `minute`, `meridiem`, `relative` (`today`, `tomorrow`, `day_after_tomorrow`, `next_week`, `last_week`), `zone_named` and `duration_minutes` the words named. The schema is strict: an instant smuggled in where the parts should be is refused.
- `resolved` holds what code made of those parts at the moment of hearing: an `instant` (a `start` and `end`), a `day` (a `YYYY-MM-DD` key), or `none` with a reason. Each carries its grounds.

*Replied.* `replied` carries the ids of the asking message, the reply and their thread, and when the reply was sent. The owner of the task the mail raised closes it in code. What the reply says is never read: a reply is the deed.

**Obligations.**

1. *Hearing.* An agent passes on any fact, decision or correction the human states in another agent's primary domain. This is not the hearer acting on its own initiative; it is the cohort remembering what it was told. The hearer says what it passed on and to whom. A conforming turn loop offers the model a tool for this and, independently, asks the question after every human turn, so no turn ends without it being asked.
2. *Owning.* A `witness` is never routine. On receipt the owner reconciles its own records through its own write tools — the human's relayed word meets the same standard as the human's word in the owner's own conversation — and acknowledges with what it did. An unreconciled witness stays pending and is carried on every door the owner speaks through: chat, `response`, and any non-model channel (a reminder in that domain holds rather than asserts).
3. *Precedence.* The human's word outranks a canvassed reading. A mediator that holds a human-confirmed closure filters its inputs against it, rather than setting it beside them.

**Ownership** is the cohort's ownership table (see "Verification"). A witness in a domain nobody owns goes to the mediator.

## Frames: what an agent may put to the human

An agent's reply to the human is prose. Alongside it, an agent may put a small set of typed **frames** to the human's client. Frames are part of the contract so that every client renders them the same way and every surface tests the same rules. A client that does not know a frame drops it and lets the human type.

The rules below hold for every frame: the strings a human sees are rendered in code, never written by a model; and nothing a frame does is a send, a payment or a filing.

**Choices.** A prompt with up to four options, and a flag saying whether free text is allowed. A chosen option posts back as an ordinary message. An option may open a page first, where the choice is a hand-off. An accepting option may record consent with named parties, or raise a capability's level (below).

**Acts.** An act is something an agent proposes to do, shown whole, its target fixed in code, and run only on the human's tap. An act frame names the agent whose door runs it, the capability, the capability's level, a subject, a typed body, one line of provenance the human can trust, and one to three actions.

- *Capability levels.* What an agent may do with a capability is one of `drafts` (prepare it for the human to dispatch), `tap` (do it when the human taps), or `own` (do it on its own, within its bounds). A capability starts where its owner declares and rises only by the human's word. The offer to raise a level comes from the act door, after the same act has run on the human's tap enough times — never from the model.
- *Actions.* Each action is `discard` (the card goes and nothing runs), `open` (a page the human opens themselves; it must name the page), or `do` (the agent acts). Actions are ordered from the most reversible. No action sends.
- *Bodies.* The body is typed by kind so one card renders every act: a drafted reply (recipient fixed to the thread the mail came from), text, a clipping, an item to buy, proposed times, a table, a bill, an invoice, or an errand. Amounts and times arrive already rendered; no client formats an instant or adds up a figure.
- *Errands.* An errand is a bounded piece of browsing its owner proposes: a `form` (fills in and stops before sending) or a `find` (reads and searches only). Its start is an `https` address on the host the card names; a find fills nothing; a form names at most twelve fields; and its one `do` action is Start.
- *Edits.* Before a draft is saved the human may change its subject and its body, and nothing else. The recipient and the mail it answers are fixed.

**Objects.** Cards beside a reply: things the reply named, each drawn from a record the turn read. At most three per reply, sent once after the final text, never sent empty. Kinds: an event, a journey, a task, a hand-off (what this turn passed to another agent, and whether it was passed, held or not delivered), a mail, a hold (tentative times held for one person), and a ticket. The frame also carries the days the reply's words name, and the act cards the turn put, so a draft outlives the next message.

**Tool steps.** A tool a turn runs, as the human sees it: a start event carrying a label the tool's owner declared, and an end event carrying the done-or-failed label, the duration in whole milliseconds, and whether it worked. Labels are filled templates, never written by a model and never stored.

## Voice

The attention stance is enforced where prose leaves an agent, not only requested in a prompt. The reference package carries two lints, shared by every door prose passes through, so that no two doors disagree about what a nag is. Quoted speech is exempt from both: the human may be quoted saying anything.

- **Reproach.** The system says the shape of time around a thing; it never reproaches. The lint finds the phrasings that turn a fact into a nag: "you still haven't", "you forgot", "don't forget", "just a reminder", "streak", "no excuses", and their kin.
- **A question held over the human.** Silence is an answer. A question an agent asked that the human did not answer is closed: the human chose not to answer, or the moment passed. No agent asks it again, refers to it, or counts it open. The lint finds the shapes this takes when it comes back as a statement: "still waiting", "where we left off", "my earlier question", "in case you wanted to", and their kin.

A reply may end on a statement. An agent asks only when the answer is needed to act, and the human may leave owing nothing.

## Per-agent budgets

Each agent in a cohort operates under three budget axes, set per-agent:

- **time** — how much of the human's attention the agent may consume per day (minutes).
- **tokens** — how much LLM compute (denominated in cost) the agent may spend per day.
- **currency** — how much real-world money the agent may spend on the human's behalf per day.

Each axis can be set to `unlimited` (the default) or to a numeric cap. Most specialists run unlimited in practice — they're invoked by the human and bounded by use. The mediator, which runs continuous background work, typically operates under tight caps on all three axes.

**Cohort-level defaults are optional.** A cohort's config may set defaults that apply to any agent that doesn't override; an agent's setting always overrides the cohort default. The cohort default may itself be `unlimited` or absent (no inherited cap).

Budget state is owned by the human and stored in the cohort's configuration. Agents cannot raise their own caps; they can only emit `note` (approaching limit) or `escalation` (limit reached, work paused, human input needed).

Budgets are advisory at the protocol level — enforcement lives in each agent's implementation, not in the message router. The audit log records every budget breach.

## Learning layer

Named patterns are stored with full provenance. The schema is a "living hypothesis with supersedence", extended across the whole cohort.

A pattern record holds:

- `pattern_id`
- `name` — assigned by the human (for named patterns) or derived from appreciation context (for positive examples).
- `constituent_signals` — the observations that constituted the cluster when first named.
- `provenance_chain` — the messages that led to this pattern being recognised.
- `created_by` — always the human for named patterns; can be the mediator for appreciation-derived patterns.
- `confirmations` — subsequent instances where similar clusters were confirmed under the same name.
- `supersedes` / `superseded_by` — for revisions.
- `confidence` — derived from confirmation count.

Subsequent matches of a known pattern can be surfaced by the mediator with `tentativeness: hypothesis` and a confidence score: "This looks like stress (three prior confirmations, signals match 84%). Confirm?" The human can confirm, deny, or refine. Specialists watching the same signals may emit `counter_hypothesis` if they read the match differently.

The learning layer is *not* fed by anything inside an `experiment` scope: experiments are sandboxed by design.

Patterns are read by all agents but written only via mediator mediation. This keeps the meaning layer coherent — but is also the structural weakness named in the "Mediator integrity" principle. The mitigation: human-editable patterns, fully inspectable provenance, `counter_hypothesis` as a first-class dispute path.

## Federation

AHA anticipates a future in which multiple cohorts — each consisting of one human and their agents — communicate and learn from each other while keeping each human's identity absolutely private.

**Envelope is frozen; semantics are deferred.** The federation-relevant envelope fields (`cohort_id`, `scope`, `expires_at`, `experiment_id`, `via`) are frozen. The detailed semantics — scope rules per intent, sanitisation rules, trust ledgers, inter-cohort handshakes, network membership policy — are explicitly deferred. An early draft specified them at zero data points; they should be discovered, not specified.

The principle stays: **cohorts trade in patterns, never in raw signals. Humans are anonymised at the cohort boundary.**

The default federation policy is deny-external, deny-network, allow-internal. Federation features are dormant by design until activated.

**Multi-tenancy is not federation.** Several cohorts on one operator's infrastructure and trust domain are multi-tenancy (see "Cohorts and tenancy"). The trigger for writing federation semantics is two cohorts on *different* operators' infrastructure wanting to exchange patterns. Semantics remain deferred until that exists.

## Audit and readability

Every AHA message is appended to an immutable log. The human can read any portion of the log via the mediator's surfaces. The log is queryable by domain, date range, agent, pattern, intent, and scope.

Messages within a cohort are not encrypted between agents — they run on the same trusted backend — but the log is permission-gated to the human only. Inter-cohort messages (when federation activates) will be signed and may be encrypted.

The `human_readable` field on every message means the audit log is legible without tools. A reader skimming a week of AHA traffic should be able to understand what happened without parsing JSON.

## Prior art

AHA is not the first attempt at structured inter-agent communication. The relevant prior art:

- **FIPA-ACL** (Foundation for Intelligent Physical Agents Agent Communication Language, late 1990s). Performatives like `inform`, `request`, `agree`, `refuse`. The closest direct ancestor. **AHA can be read as FIPA-ACL revived for the LLM era, with three additions:** (1) the human as a structural participant rather than an external operator; (2) epistemic typing in the envelope (`provenance` + `authority` + `confidence` + `tentativeness`); (3) the attentive-not-attention-taking stance encoded in primitives. FIPA-ACL did not have an attention budget, did not require provenance, did not have a `counter_hypothesis` move, and did not anticipate cohort-level federation.
- **MCP (Model Context Protocol)** — Anthropic's tools-for-agents protocol. Different layer: how a single agent invokes tools, not how multiple agents communicate.
- **A2A (Agent2Agent)** — Google's agent-to-agent delegation protocol. Different posture: A2A treats the human as the consumer of delegated work; AHA treats the human as a participant in the work.
- **CrewAI / AutoGen / LangGraph** — orchestration frameworks, not protocols with epistemics. AHA is the message contract; these are runtime scaffolding. They could implement AHA, but they don't constitute it.

AHA is also recognisably downstream of the Center for Humane Technology / calm technology / post-2020 attention-economy critique. The novel move is concretising those values into protocol primitives rather than leaving them as policy.

## Implementation notes

For an agent to participate in AHA, it must:

1. Expose an inbound AHA endpoint that accepts envelopes (the reference runtime mounts it at `/v1/aha`).
2. Be able to emit AHA messages with valid envelopes (especially provenance, `human_readable`, and the cohort/scope fields).
3. Distinguish, in its own reasoning, between own-observations and AHA-relayed data.
4. Support `decline` as a response to `directive` where the directive conflicts with its specialist judgment.
5. Support emitting `counter_hypothesis` when the mediator's synthesis conflicts with the specialist's read of the underlying signal. The bar for `counter_hypothesis` is "I have evidence that suggests a different framing"; the bar is not certainty.
6. Operate under its own budget configuration (time / tokens / currency) and emit `note` or `escalation` as caps approach.
7. Default to `scope: internal` on all messages. Only the mediator emits external/network messages, and only when cohort policy permits.
8. Hold every inbound envelope as **pending until acknowledged or expired**. Surfacing a message into a model's context is not consumption: a receiver must not retire a message merely because it appeared in a prompt. Retirement requires a deliberate acknowledgement carrying a note — what was done with the message, or why it was set aside. Messages without `expires_at` (directives in particular) never expire silently.
9. Be able to **report received messages on request** — pending and acknowledged alike, with acknowledgement notes — so the human's "what have you heard from the cohort?" is always answerable from the record rather than from a model's recall.
10. On acknowledging a `directive`, **emit the corresponding `acknowledgement` (or `decline`) envelope back to the originator**, `in_reply_to` the directive, with the note as the prose. This makes the directive's fate visible in the originator's log: a mediator that tells the human "agentA has it on watch" must be able to point at the acknowledgement. Observations and advice may be acknowledged locally without a wire reply.
11. Pass on what the human says in another agent's domain as a `witness`, and, as an owner, reconcile every `witness` it receives (see "Witness").
12. Resolve the human it is serving from the cohort's directory on every request, never from its own configuration.

Notes 8 to 10 are the receiver lifecycle, added after a field incident: a directive was delivered, surfaced once into an unrelated turn, automatically retired as seen, and the receiving agent then told the human it had heard nothing from the cohort. Nothing failed technically. Structurally it was silent non-compliance, which this protocol forbids. A protocol built on LLM agents cannot treat a model's memory of having seen something as a record of having handled it.

The shared infrastructure (audit log, pattern store, message router, federation policy) lives in the mediator's backend. The mediator is the broker by default. Direct agent-to-agent messages within a cohort are permitted but always visible to the mediator and logged.

For an existing agent the additions are light: an endpoint, envelope emission, provenance and scope tagging on outbound. The deeper change — each specialist reasoning *with* relayed cohort context as first-class state — is harder, and is not solved by the envelope.

## Versioning and governance

Two version numbers exist, and they move separately.

- **The protocol version** (`0.8`) is what this document describes and what a sender stamps in an envelope's `protocol` field. It changes when the wire changes in a way a mixed-version cohort needs to reason about.
- **The reference package version** is the semantic version of the validator library in this repository. It moves with every change to the library, including changes that leave the wire alone (new frame kinds, a change to how the ownership table is built).

Breaking changes — ones that invalidate existing log entries, or require all agents to update at once — require human approval and a major version bump.

Non-breaking additions (new intents, new optional fields) are versioned at the minor level. An addition can still be validator-visible: an envelope carrying a new intent is rejected by a validator built before it, so receivers upgrade before senders first emit.

Historical log entries stay valid and read-only. The audit log is never rewritten to match a newer schema.

The protocol spec lives in its own repository, separate from any agent that implements it.

## Open questions

1. **Per-agent message budgets.** How are budget caps surfaced in the protocol — purely via per-agent config, or also via envelope metadata (an optional `attention_cost` annotation, say)? The current answer: per-agent config only. Envelope-level cost annotation is deferred until budget violations become a real problem.
2. **Human unavailability.** When the human is unreachable, what happens to escalations and `counter_hypothesis`? Queue (default), default-deny (safe), default-allow (risky). Likely queue with a configurable timeout per severity.
3. **Multi-human cohorts.** The protocol assumes one human per cohort, and the tenancy rules depend on it (the human is resolved from `cohort_id` at the storage boundary). A second human gets their *own* cohort on shared infrastructure, not a seat in an existing one. Multiple humans inside one cohort (a household sharing agents) remains unspecified.
4. **Experiment auto-close.** Auto-close after a configurable timeout (7 days default), with all messages within remaining sandboxed.
5. **`curious` budget.** Per-agent quota to prevent flooding, or does generation cost discipline this naturally?
6. **The inverse of `appreciation`.** When something *doesn't* work, should there be a `concern` intent, or do `retract`, `note`, `counter_hypothesis`, and `escalation` cover it?
7. **`counter_hypothesis` discipline.** What stops a specialist from emitting `counter_hypothesis` on every mediator naming it doesn't fully like? Probably the same restraint principle that governs `naming_request` emission (most should not be emitted). Budgets help; reputation may help; we don't know yet.
8. **Federation degree of obfuscation.** Strong privacy (zero identity leak, k-anonymity on patterns) versus nominal privacy (no proper names, inferable from context).
9. **Federation network membership.** Invite system, reputation system, open with rate-limits, or hybrid.
10. **Edge inference and agent locality.** The protocol assumes an agent is a server with an endpoint. As inference moves to the edge — local models on a home machine, or a model embedded in the human's own device — two things become unspecified. (a) Does AHA need a first-class notion of *where an agent runs* and of *offline-then-sync* participation: a device-resident agent handles routine turns locally and posts envelopes to the mediator only when connected, escalating hard turns to a frontier model? Cohort exchange is already asynchronous, so this may be purely an implementation concern below the envelope — or it may want explicit support. (b) Should the envelope eventually carry which *model tier* produced a message (on-device / cheap-hosted / frontier), as a provenance-honesty matter, so the human can see whether a read came from a small local model or the mediator's frontier model? This is the same instinct as Mediator integrity, one layer down — the less the cohort depends on a remote model it cannot inspect or own, the harder the pattern is to appropriate.
11. **Typed witness content.** The typed fields on a `witness` (times, appointments, replies) grew from one cohort's needs. Whether they belong in the protocol, or in a per-domain extension the directory declares, is open.

## Version history

**0.8** — The `witness` intent: the human's word passing from the agent that heard it to the owner of the domain it concerns, with the hearing, owning and precedence obligations. Since first specified, witness content has gained typed fields (handed exchanges, proposed and chosen times, appointments, replies), and the contract has gained the frames an agent may put to the human, the voice lints, and the human resolved from the directory. Domains became slugs validated by shape, and the ownership table moved out of the protocol into the cohort's directory; the protocol version was not bumped for these, so a 0.8 validator built before them rejects a domain outside the earlier fixed list.

**0.7** — A `knowledge` domain was added to the then-fixed domain list.

**0.6** — Explicit multi-cohort tenancy: `cohort_id` as the tenancy key, the human resolved at the storage boundary, agent instances as memberships, `mediator` as the canonical role address. The headless mediator. `experiment_id` and `protocol` added to the validator. Later amended with synchronous `query`→`response`, the convening round, and `curious` as the held question.

**0.5** — The personal finance domain split in two: household administration and long-arc financial wellbeing. The receiver lifecycle (pending until acknowledged, reportable, wire-acknowledged directives) and the edge-inference open question were added in-version.

**0.4** — Mediator integrity as the sixth principle. The `counter_hypothesis` intent and the `via` field. Per-agent budgets on three axes. Federation semantics deferred, envelope fields frozen. The prior art section.

**0.3** — The first draft: the envelope, the intents, the learning layer, and federation anticipated.
