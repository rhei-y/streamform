# File Manifest

```
web-tools/
  index.html                             -- Single-page demo (US locale, default)
  LICENSE                                -- MIT
  CHANGELOG.md
  MANIFEST.md
  README.md

  in/
    index.html                           -- India locale (IN default, Indian placeholders)

  docs/
    PRINCIPLES.md                        -- SISO specification and compliance rules
    REDDIT_POST.md                       -- r/developersIndia post draft + thread notes

  css/
    tokens.css                           -- Design tokens (palette, spacing, radii)
    reset.css                            -- Normalize + 110% base font
    a11y.css                             -- WCAG: focus, reduced-motion, forced-colors, touch targets
    layout.css                           -- Page structure, header, StreamLog panel shell
    form.css                             -- Form grid, inputs, drag, swap, conditional fields
    modal.css                            -- Modal overlay, card, animation
    streamlog.css                        -- Log entries, undo toolbar

  js/
    app.js                               -- Bootstrap: 12 gates, DOM adapter, debounce
    core/                                -- Frozen SISO core — byte-identical to CORE distribution
      README.md                          -- Note on provenance and freeze policy
      Event.js                           -- E: the datum. Immutable. Type + data.
      Gate.js                            -- The arrow in →E→E→. Pure function on events.
      Stream.js                          -- →E→E→ itself. The present.
      StreamLog.js                       -- Observer-side audit trail. Not a primitive.
      index.js                           -- Barrel export
    gates/
      format-phone.js                    -- Demo 1: cursor-preserving phone formatting
      country-cascade.js                 -- Demo 2: country -> state/postal/tax
      copy-billing.js                    -- Demo 3: same-as-billing + re-emit
      shipping-type.js                   -- Demo 4: conditional company field
      validate-field.js                  -- Demo 5: real-time validation
      field-validated.js                 -- Handles field-validated; emits show-demo-modal
      swap-addresses.js                  -- Demo 6: DOM node swap
      undo-redo.js                       -- Demo 7: SaveSnapshotGate + UndoGate + RedoGate
      focus-manager.js                   -- Demo 8: FocusManagerGate
    modal/
      modal.js                           -- Modal open/close/focus-trap/dismiss
      explanations.js                    -- All 8 demo explanations
      demo-modal.js                      -- DemoModalGate: shows each demo once per session
    log-panel/
      log-panel.js                       -- StreamLog panel renderer

  tests/
    runner.js                            -- Minimal test runner
    core.test.js                         -- 35 SISO core tests
    gates.test.js                        -- 25 Phase 2 gate tests (includes India locale)
    phase3.test.js                       -- 20 Phase 3 gate tests (includes India postal)
    phase4.test.js                       -- 20 Phase 4 gate tests
    phase5.test.js                       -- 46 WCAG + structure tests
```

## Gate registry

| Signature             | Gate               | File                       |
|-----------------------|--------------------|----------------------------|
| format-phone          | FormatPhoneGate    | gates/format-phone.js      |
| country-changed       | CountryCascadeGate | gates/country-cascade.js   |
| copy-billing          | CopyBillingGate    | gates/copy-billing.js      |
| shipping-type-changed | ShippingTypeGate   | gates/shipping-type.js     |
| validate-field        | ValidateFieldGate  | gates/validate-field.js    |
| field-validated       | FieldValidatedGate | gates/field-validated.js   |
| swap-addresses        | SwapAddressesGate  | gates/swap-addresses.js    |
| snapshot-save         | SaveSnapshotGate   | gates/undo-redo.js         |
| undo                  | UndoGate           | gates/undo-redo.js         |
| redo                  | RedoGate           | gates/undo-redo.js         |
| focus-field           | FocusManagerGate   | gates/focus-manager.js     |
| show-demo-modal       | DemoModalGate      | modal/demo-modal.js        |
