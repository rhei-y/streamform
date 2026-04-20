# r/developersIndia post draft

**Scheduled:** Tuesday 10:00–11:00 AM IST
**Subreddit:** r/developersIndia
**Format:** Text post

---

## Title

Built a shipping form without React to prove a point. 200 lines of "core." Roast me.

---

## Body

Live demo: in.example.org

I got tired of explaining to people why a form needs a 45 KB framework. So I built one without it.

Eight demos, all the things React forms are actually hard at: cursor-preserving phone formatting, cascading country/state/postal/tax fields, same-as-billing copy, conditional fields, real-time validation with debounce, drag-to-swap sections, undo/redo without Redux, focus management after validation.

The whole thing — all eight demos — ships less JavaScript than react-hook-form alone.

The "core" is four files, 201 lines: Event, Gate, Stream, StreamLog. Events flow through a stream. Gates transform them. No state, no effects, no reconciler. The DOM is the state.

Numbers:

- Core: 201 lines
- Full implementation: ~1,500 lines
- Tests: 146 assertions, zero dependencies, plain Node
- Ships: ~16 KB JS gzipped

Verify the size yourself:
```
find js -name '*.js' -type f -exec cat {} + | gzip -c | wc -c
```

What I'm curious about: where does this break? At what point does the approach fall apart? Genuine question, not rhetorical.

GitHub: [link]

---

## Thread presence notes (first 4 hours)

**On core size questions** — link directly to `js/core/` in the repo. The 201-line claim is verifiable in one `wc -l` command. Don't argue; point.

**On principles / architecture questions** — link to `docs/PRINCIPLES.md`. Keep that discussion in sub-threads so the OP stays about the demos.

**On "why not just use React"** — answer with the size table from the README and a link to one specific gate file (e.g., `js/gates/country-cascade.js`). One gate, one file, one sitting to read. No defense, no argument.

**On "this won't scale"** — ask what they mean by scale. Form complexity? User load? Both are answerable with code. If form complexity: point to the 8 existing gates and ask which interaction they think requires a framework primitive. If load: it's static HTML, there's nothing to scale.

**On any technical challenge** — respond with the gate source or the test, not with argument. Example: cursor bug claim → link to `js/gates/format-phone.js` lines 40–60 and the corresponding test.

**Tone throughout:** curious, not defensive. The question "where does this break?" in the OP is genuine — treat challenges as answers to that question.
