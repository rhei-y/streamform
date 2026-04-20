# streamform

<img width="1526" height="726" alt="streemform" src="https://github.com/user-attachments/assets/08d3baca-7a80-4f44-9df3-81317fdf1d92" />


Eight interactions React finds difficult, implemented without React in ~1,500 lines. Runs in any modern browser. No build step, no npm install, no framework.

- **Core:** 201 lines across 4 files (Event, Gate, Stream, StreamLog)
- **Whole implementation:** ~1,500 lines (core + 8 demo gates + bootstrap + modal + log panel)
- **Tests:** ~1,700 lines, 139 assertions, zero dependencies
- **Ships to browser:** ~22 KB gzipped (16 KB JS + 5.5 KB CSS)

[GIF will go here â€” form being filled out with StreamLog panel visible]

---

## Size in context

Gzipped production sizes for typical React equivalents:

| Dependency | Size (gzipped) |
|---|---|
| react + react-dom | ~45 KB |
| react-hook-form (form state) | ~9 KB |
| zod (validation) | ~13 KB |
| @dnd-kit/core (drag and drop) | ~10 KB |
| **Typical React form stack** | **~77 KB** |
| **This entire project** | **~16 KB JS** |

The whole project, including all eight demos, ships less JavaScript than any single typical React form dependency. The size claim is verifiable:

```bash
find js -name '*.js' -type f -exec cat {} + | gzip -c | wc -c
```

---

## The eight demos

Each one is a single file in `js/gates/`, typically 50â€“150 lines. Read any one in a sitting.

1. **Phone formatting that preserves cursor position.** The classic React controlled-input cursor-jump bug, avoided by not replacing the element.
2. **Country â†’ state / postal / tax cascade.** Four dependent fields updated in one gate, no derived state, no effects.
3. **"Same as billing" copy.** Toggle copies values and re-emits events so downstream gates fire naturally.
4. **Conditional field rendering.** Shows/hides a field based on another field's value without mount/unmount gymnastics.
5. **Real-time validation with debounce.** 300ms debounce, per-country postal patterns, live error messages.
6. **Drag-and-drop to swap form sections.** DOM-level swap via `insertBefore`, no virtual DOM reconciliation to fight.
7. **Undo/redo without Redux.** Snapshot stack. Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
8. **Focus management across validation.** Focus jumps to first invalid field on submit, no lost-focus-after-render issues.

All eight are visible in the StreamLog panel on the right side of the demo page â€” every event shows its type, which gate claimed it, and (optionally) its data.

---

## Try it

Live demo: streamform.rhei.world

Locally:

```bash
git clone <this-repo>
cd streamform
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Or serve with any static file server:

```bash
npx serve .
python3 -m http.server
```

No npm install. No build. ES modules load from relative paths.

---

## What's in the repo

```
index.html         Single-page demo (US locale, default)
in/
  index.html       India locale â€” IN default, Indian placeholders, 36 states/UTs
docs/
  PRINCIPLES.md    The specification this implements
  REDDIT_POST.md   r/developersIndia post draft
css/               All stylesheets
js/
  app.js           Bootstrap: creates Stream, registers gates, binds DOM
  core/            4 files, 201 lines â€” the frozen primitive set
  gates/           10 gates (8 demos + field-validated + snapshot-save)
  modal/           Modal system + demo explanations
  log-panel/       StreamLog slide-out panel
tests/             5 test files, 146 assertions
```

---

## The core

`js/core/` contains the four primitive files (Event, Gate, Stream, StreamLog) from the standalone SISO CORE distribution. They are byte-identical to that distribution modulo comment style, and are frozen â€” no changes to these files belong in this repository. See `js/core/README.md` for details.

The three primitives are:

- **Event** â€” an immutable fact, `{ type, data }`.
- **Gate** â€” a pure function that transforms events into events. No state, no side effects, no awareness of anything beyond the event it receives.
- **Stream** â€” the substrate. Events flow through it; gates fire where they match; structure propagates.

StreamLog is an optional observer â€” it records events for debugging and the visible log panel, and can be removed without affecting behavior.

See `docs/PRINCIPLES.md` for the full specification and the rules any SISO implementation must follow.

---

## Tests

139 assertions, zero dependencies. Run each suite with plain Node.js:

```bash
node tests/core.test.js        # 35 â€” core primitives
node tests/gates.test.js       # 25 â€” demos 1â€“3 + India locale
node tests/phase3.test.js      # 20 â€” demos 4â€“6 + India postal
node tests/phase4.test.js      # 20 â€” demos 7â€“8, undo/redo
node tests/phase5.test.js      # 46 â€” accessibility (WCAG AA)
```

Expected output: 146/146 passed across the five suites.

---

## Accessibility

WCAG 2.1 AA throughout:

- Contrast ratios verified (all text â‰¥ 4.5:1, large text â‰¥ 3:1)
- Keyboard navigation: Tab, focus trap in modal, Escape to close, undo/redo via Ctrl+Z
- Screen reader: `aria-live` error regions, `aria-invalid` on validation, `aria-describedby` linking
- Touch targets: all interactive elements â‰¥ 44Ã—44 px
- Motion: respects `prefers-reduced-motion`
- High contrast: respects `forced-colors: active`

---

## License

MIT. See LICENSE file.

Contributions welcome. PRs that preserve SISO compliance (see `docs/PRINCIPLES.md`) will be considered.
