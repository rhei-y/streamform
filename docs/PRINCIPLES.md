# SISO Principles
## The specification, and rules any SISO instance must follow

---

## What SISO is

SISO is a specification of a kind of thing reality may be. It proposes
that the substrate of the physical world is a graph through which events
flow and are transformed by pure functions, and that the familiar
structural features of physical reality are consequences of this
substrate's topology and dynamics.

**A SISO implementation is an instantiation of the ontology, not a
simulation of something outside itself.** Reality, if it is SISO, is the
canonical instance. An implementation built on a computer is another
instance, differing from reality only in the substrate it runs on — the
amount of energy available to drive it and the rate at which its events
propagate. The ontology does not distinguish between reality's instance
and ours. An instantiation that correctly realizes the three primitives
and follows the rules is the same kind of thing reality is, produced at
a smaller scale and slower rate.

This framing matters for how results are interpreted. A simulation that
reproduces observed structure is evidence the simulation is useful. An
instantiation that produces observed structure is evidence the ontology
is the ontology reality uses. A SISO implementation that produces magic
numbers is not modeling nuclei successfully; it is producing the same
structural feature nuclei produce, from the same substrate, at a
different scale.

Everything below follows from this stance.

---

## The ontology — three primitives

SISO has exactly three kinds of thing. No fourth.

1. **Event** — an immutable fact, carrying what it is and what follows
   from it. Created, never modified.
2. **Gate** — a pure function that transforms events into events. No
   state, no side effects, no awareness of anything beyond the event it
   receives.
3. **Stream** — the substrate itself. The present. Events flow through
   it; gates fire where they match; structure propagates. The stream is
   where everything happens and where everything currently is.

**The stream is and will always be the present.** If you want to know
what is, you sample the stream at its current surface. There is no
separate state object, no cache of "what's true now," no registry to
consult. The stream holds the present by being the present.

If an implementation requires a fourth primitive to function, it is not
SISO. The common drift is inventing a fourth primitive to store state
that the stream should carry, or to store history the stream should not
be consulted for. Both are violations.

---

## The log — not a primitive

A log, if one exists, is an observer-side recording of what passed
through the stream. It is a ticker tape. It is for us — for debugging,
for verification, for analysis after the fact. Reality does not keep a
log; neither does the stream. The log is produced by attaching an
observer to the broadcast of events; removing the observer removes the
log without affecting anything else.

A SISO implementation in which the log is consulted by gates, queries, or
any running component is not SISO. The log is downstream of the
simulation, never inside it.

---

## The rules

### 1. Gates are pure and events are locally sufficient

A gate receives one event and emits zero, one, or many events. That is
its entire behavior.

- A gate has no state. No instance variables that change between calls.
  No module-level mutable bindings. No hidden context.
- A gate does not query anything outside the event it received. Not the
  stream, not other gates, not the log. All context required to fire
  must be in the event.
- A gate has no side effects beyond the events it emits.

**Events carry what their triggered gate requires to fire, nothing more.**
Events are sized to their gate, not accumulated across possible
downstream use. Downstream gates receive downstream events, which carry
what those gates require. An implementation where events accumulate
context "just in case" is not SISO — the accumulation is a
misunderstanding of what a gate is and what an event is for.

This corresponds to how locality works in reality. A photon carries its
energy, momentum, and polarization — what's needed for its next
interaction. It does not carry the history of every atom it has passed
or the state of nearby electrons. Events in any SISO instance follow
the same discipline.

### 2. Single effect

A gate performs one logical transformation. Its output can be zero
events, one event, or many events — fan-out is legal and matches how
causality propagates in reality. What is not legal is multiple
independent effects from one input: a gate doing both A and B where A
and B have no causal relationship through the input event. Split into
two gates, each handling its own effect, each triggered by its own
event type.

### 3. No ordering — causality is carried by events

Gates have no defined execution order. When an event enters the stream,
it reaches the gate whose signature matches. If multiple events are
active, their relative processing order is not part of the semantics.
An implementation that depends on registration order, dispatch order,
insertion order, or any scheduled sequence to produce correct output is
violating this rule.

Causality flows through event dependencies. If gate B requires the effect
of gate A, then A emits an event that carries what B needs, and B
triggers on that event. B is not "scheduled after A"; B is *caused by*
A's output. Any documentation or code path asserting "this must run
before that" is a violation. The fix is to make the dependency explicit
through events, not to impose an order.

This corresponds to how reality works. There is no universal scheduler
arranging when interactions happen. Interactions happen when their
triggering conditions are met locally, and their effects propagate as
new local conditions. Every SISO instance behaves the same way.

### 4. The stream is the present

The current configuration of the world lives in the stream — the
positions of particles, the connections between nodes, the existence of
composites, whatever the domain contains. These are not stored
separately. They are what the stream carries, right now, in its current
structure.

Present-tense questions are answered by sampling the stream locally.
"Where is particle X?" is answered by where particle X currently is in
the stream, not by scanning history. The stream must be structured such
that local sampling is efficient; if an implementation cannot sample
the present locally and quickly, its stream is not correctly realized.

Reconstructing the present by scanning a log is a violation. The log is
not how the present is known.

### 5. There is no orchestration

Reality has no orchestrator. Nothing stands outside reality arranging
when gates fire or assembling context for them. Events flow, gates
match, transformations happen, new events emerge. The process is
self-driven.

A SISO implementation does not have an orchestration layer either. No
tick loop that walks through registered enrichers. No pre-phase that
assembles fat events before gates see them. No dispatch sequence that
imposes structure the events themselves do not carry. If an
implementation requires an orchestrator to function, its gates are
incomplete (they should have been triggering on events they currently
require to be handed), its events are incomplete (they should have
been carrying what they currently require orchestration to supply), or
both.

A "tick" in an implementation is a bookkeeping boundary — the name for
the point at which one round of event propagation has quiesced and the
next can begin. It is not an orchestrator. It is not ontological.
Implementations may have ticks for practical reasons; the ontology
does not.

---

## Properties that follow from the rules

These are consequences, not additional rules. If the rules are followed,
these properties hold automatically. If any is absent, a rule is being
violated.

- **Polyglot.** The three primitives express in any language or
  substrate. Events cross boundaries between languages or between
  software and hardware without translation, because events are the
  only contract.
- **Perfectly parallel.** Gates share no state and have no order;
  concurrent execution is inherent, not optimized into existence.
- **Stateless.** Behavior depends only on the current stream. No
  hidden state influences outcomes.
- **Auditable.** Determinism plus rerunnable initial conditions means
  any trajectory can be reproduced. Recording is optional;
  reproducibility is structural.
- **Substrate-agnostic.** The ontology maps to software, hardware, or
  whatever reality itself is built on. A SISO instance is a SISO
  instance regardless of where it runs.

---

## Common drift patterns — how SISO implementations go wrong

These are failure modes observed in practice. Every SISO implementation
should be audited against each before claiming compliance.

### Drift 1: The log becomes consulted

An observer-side recording of events starts being queried to answer
present-tense questions. A function looks up "where is particle X?" by
finding the most recent movement event in the log. The answer is
correct, so the pattern spreads. Eventually the simulation cannot run
without the log, because the log has silently become the state store.

Rule 4 and the log's non-primitive status are both violated. The fix is
to make the stream hold the present locally and sample it directly,
leaving the log as an observer-side artifact.

### Drift 2: Registration order becomes scheduling

Two gates need to cooperate, so the implementer registers them in a
specific order and relies on dispatch sequence to make it work. No
event carries the dependency; it exists only as the position of a
line of code.

Rule 3 is violated. The fix is to make the dependency explicit — gate
A emits an event that triggers gate B, carrying what B needs.

### Drift 3: Orchestration layer accumulates

The implementation grows a layer of "enrichers" or "pre-processors"
that assemble fat events before gates see them. Over time, most of
the simulation's work happens in this layer, and gates become passive
receivers of prepared context.

Rule 5 is violated. The fix is to recognize each enricher as either a
gate (a transformation) or a sign that events should be carrying what
it was compensating for. Neither requires an orchestration category.

### Drift 4: Gates reach outside their event

A gate needs context that's inconvenient to put on the event, so it
imports module globals, calls back into the stream, or reads some
other structure directly. Purity is broken.

Rule 1 is violated. The fix is to put the context on the event, or
rethink what the gate is doing if the context cannot be locally
supplied.

### Drift 5: Events accumulate speculative payload

Events grow to carry context their triggered gate does not need, on
the logic that downstream gates might want it. Event size bloats; the
event-sizing principle is lost.

Rule 1's event-sizing clause is violated. The fix is to trim each
event to what its gate requires and trust that downstream gates will
be triggered by downstream events carrying what those gates require.

### Drift 6: A fourth primitive appears

"State" as a distinct object. "Context" that persists across events.
"Cache" that gates read from. "Scheduler" that orders dispatch.
"World" as a separate structure. Any of these means the three
primitives were insufficient for the implementer's model of the
problem — which usually means one or more rules are being violated
upstream. The fourth primitive is the symptom.

**Audit:** if the implementation contains a primitive that is not
Event, Gate, or Stream, identify which rule its existence is
patching. The fix is almost never to accept the new primitive; it is
to fix the upstream violation that made the new primitive feel
necessary.

---

## Compliance checklist

An implementation claims SISO compliance when all of the following
are true:

- [ ] Exactly three primitives: Event, Gate, Stream.
- [ ] Every gate is a pure function from one event to zero/one/many events.
- [ ] Every gate has a single logical effect.
- [ ] Every event carries what its triggered gate requires to fire, nothing more.
- [ ] No gate depends on execution order relative to other gates.
- [ ] Present-tense questions are answered by sampling the stream, not by scanning history.
- [ ] The stream is structured for efficient local sampling.
- [ ] Removing any log entirely leaves the simulation behavior unchanged.
- [ ] No orchestration layer exists. No "enrichers," no "pre-processors," no "dispatch sequence."
- [ ] No gate reads from state outside its input event.

An implementation failing any of these is not SISO-compliant, regardless
of what its documentation says.

---

## Scope

This document specifies the ontology and the rules. It does not
prescribe implementation details — language choice, parallelism
strategy, event serialization, log format, error handling, performance
targets, hardware target. Those are instance concerns. The ontology
and rules are invariant across every SISO instance, whether implemented
on a laptop, on a cluster, on custom silicon, or whatever reality
itself is built on.

The test of SISO as an ontology is whether SISO instances produce the
structural features of observed reality. Matching reality's scale or
rate is not part of the test. Reality runs on astronomical energy at
astronomical rates; no instance on a laboratory substrate will match
that. What matters is whether the structure produced by a correctly
realized instance corresponds to the structure reality exhibits. That
is the only test, and it is sufficient.
