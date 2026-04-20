# SISO Core

These four files are the SISO core. They are byte-identical to the
standalone CORE distribution modulo comment style (the distribution
uses em-dashes; earlier browser-adapted copies used ASCII hyphens —
those have been restored to match CORE exactly).

| File          | What it is                                      |
|---------------|-------------------------------------------------|
| Event.js      | E — the datum. Immutable. Type + data.          |
| Gate.js       | The arrow in →E→E→. Pure function on events.    |
| Stream.js     | →E→E→ itself. The present.                      |
| StreamLog.js  | Observer-side audit trail. Not a primitive.     |
| index.js      | Barrel export.                                  |

The core is frozen. No changes to these files are permitted in this
repository. If a change seems necessary, it belongs in the CORE
distribution first, then propagates here verbatim.

See `docs/PRINCIPLES.md` for the specification these files instantiate.
