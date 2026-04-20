import { test, assert, assertEqual, report } from './runner.js';
import { Event } from '../js/core/Event.js';
import { Stream } from '../js/core/Stream.js';
import { StreamLog } from '../js/core/StreamLog.js';
import { UndoGate, RedoGate, SaveSnapshotGate, FormHistory, FIELD_IDS } from '../js/gates/undo-redo.js';
import { FocusManagerGate } from '../js/gates/focus-manager.js';

// --- DOM mocks ---

function mockFormDOM(values = {}) {
  const elements = {};
  for (const id of FIELD_IDS) {
    if (id === 'same-as-billing') {
      elements[id] = {
        id, type: 'checkbox', checked: !!values[id],
        getAttribute() { return null; },
      };
    } else {
      elements[id] = {
        id, type: 'text', value: values[id] || '',
        getAttribute() { return null; },
      };
    }
  }
  elements['company-name-group'] = {
    id: 'company-name-group',
    style: { display: 'none' },
    _ariaHidden: 'true',
    getAttribute(k) { if (k === 'aria-hidden') return this._ariaHidden; return null; },
    setAttribute(k, v) { if (k === 'aria-hidden') this._ariaHidden = v; },
  };
  elements['undo-btn'] = { id: 'undo-btn', disabled: true };
  elements['redo-btn'] = { id: 'redo-btn', disabled: true };

  globalThis.document = {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: () => [],
  };
  return elements;
}

// ============================================================
// FormHistory -- save-after model
// ============================================================

test('FormHistory: initial state', () => {
  const h = new FormHistory();
  assertEqual(h.stack.length, 0);
  assertEqual(h.pointer, -1);
  assert(!h.canUndo);
  assert(!h.canRedo);
});

test('FormHistory: save captures snapshot', () => {
  mockFormDOM({ 'billing-name': 'Jane' });
  const h = new FormHistory();
  h.save();
  assertEqual(h.stack.length, 1);
  assertEqual(h.pointer, 0);
  assertEqual(h.stack[0]['billing-name'].value, 'Jane');
});

test('FormHistory: undo restores previous state', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();

  // Baseline: empty
  h.save();

  // Action 1: set to Bob, save
  els['billing-name'].value = 'Bob';
  h.save();

  // Action 2: set to Carol, save
  els['billing-name'].value = 'Carol';
  h.save();

  // Undo: should restore Bob
  const result = h.undo();
  assert(result, 'undo returned true');
  assertEqual(els['billing-name'].value, 'Bob');
});

test('FormHistory: multiple undos walk back', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();

  h.save(); // baseline: empty

  els['billing-name'].value = 'A';
  h.save();

  els['billing-name'].value = 'B';
  h.save();

  h.undo(); // back to A
  assertEqual(els['billing-name'].value, 'A');

  h.undo(); // back to empty
  assertEqual(els['billing-name'].value, '');
});

test('FormHistory: undo at beginning returns false', () => {
  mockFormDOM({});
  const h = new FormHistory();
  h.save(); // only baseline
  assert(!h.undo(), 'cannot undo past beginning');
});

test('FormHistory: redo after undo', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();

  h.save(); // baseline

  els['billing-name'].value = 'A';
  h.save();

  els['billing-name'].value = 'B';
  h.save();

  h.undo(); // A
  h.undo(); // empty

  const result = h.redo();
  assert(result, 'redo returned true');
  assertEqual(els['billing-name'].value, 'A');

  h.redo(); // B
  assertEqual(els['billing-name'].value, 'B');
});

test('FormHistory: redo at tip returns false', () => {
  mockFormDOM({});
  const h = new FormHistory();
  h.save();
  assert(!h.redo(), 'cannot redo at tip');
});

test('FormHistory: new action after undo discards future', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();

  h.save(); // baseline

  els['billing-name'].value = 'A';
  h.save();

  els['billing-name'].value = 'B';
  h.save();

  h.undo(); // A

  // New action instead of redo
  els['billing-name'].value = 'C';
  h.save();

  assert(!h.canRedo, 'future discarded');
  assertEqual(h.stack.length, 3); // baseline, A, C (B discarded)
});

test('FormHistory: respects maxSize', () => {
  mockFormDOM({});
  const h = new FormHistory(3);
  h.save();
  h.save();
  h.save();
  h.save(); // evicts oldest
  assertEqual(h.stack.length, 3);
});

test('FormHistory: snapshots checkbox state', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();

  els['same-as-billing'].checked = false;
  h.save(); // baseline: unchecked

  els['same-as-billing'].checked = true;
  h.save(); // checked

  h.undo(); // should restore unchecked
  assertEqual(els['same-as-billing'].checked, false);
});

test('FormHistory: updates undo/redo button disabled state', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();

  h.save(); // baseline
  assertEqual(els['undo-btn'].disabled, true, 'undo disabled at baseline');

  els['billing-name'].value = 'X';
  h.save();
  assertEqual(els['undo-btn'].disabled, false, 'undo enabled after save');
  assertEqual(els['redo-btn'].disabled, true, 'redo disabled at tip');

  h.undo();
  assertEqual(els['redo-btn'].disabled, false, 'redo enabled after undo');
});

// ============================================================
// UndoGate / RedoGate
// ============================================================

test('UndoGate: signature is undo', () => {
  assertEqual(new UndoGate(new FormHistory()).signature, 'undo');
});

test('RedoGate: signature is redo', () => {
  assertEqual(new RedoGate(new FormHistory()).signature, 'redo');
});

test('UndoGate: calls history.undo via stream', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();
  const s = new Stream();
  s.register(new UndoGate(h));

  h.save(); // baseline
  els['billing-name'].value = 'X';
  h.save();

  s.emit(new Event('undo', {}));
  assertEqual(els['billing-name'].value, '');
});

test('RedoGate: calls history.redo via stream', () => {
  const els = mockFormDOM({});
  const h = new FormHistory();
  const s = new Stream();
  s.register(new UndoGate(h));
  s.register(new RedoGate(h));

  h.save(); // baseline
  els['billing-name'].value = 'X';
  h.save();

  s.emit(new Event('undo', {})); // back to empty
  s.emit(new Event('redo', {})); // forward to X
  assertEqual(els['billing-name'].value, 'X');
});

// ============================================================
// FocusManagerGate
// ============================================================

test('FocusManagerGate: signature is focus-field', () => {
  assertEqual(new FocusManagerGate().signature, 'focus-field');
});

// ============================================================
// FIELD_IDS
// ============================================================

test('FIELD_IDS: includes all expected fields', () => {
  assert(FIELD_IDS.includes('billing-name'));
  assert(FIELD_IDS.includes('billing-email'));
  assert(FIELD_IDS.includes('shipping-company'));
  assert(FIELD_IDS.includes('same-as-billing'));
  assert(FIELD_IDS.includes('shipping-type'));
  assert(FIELD_IDS.length >= 18);
});

// ============================================================
// Integration: all 9 gates
// ============================================================

test('Integration: all gates register without collision', async () => {
  const { FormatPhoneGate } = await import('../js/gates/format-phone.js');
  const { CountryCascadeGate } = await import('../js/gates/country-cascade.js');
  const { CopyBillingGate } = await import('../js/gates/copy-billing.js');
  const { ShippingTypeGate } = await import('../js/gates/shipping-type.js');
  const { ValidateFieldGate } = await import('../js/gates/validate-field.js');
  const { SwapAddressesGate } = await import('../js/gates/swap-addresses.js');

  const h = new FormHistory();
  const s = new Stream();
  s.register(new FormatPhoneGate());
  s.register(new CountryCascadeGate());
  s.register(new CopyBillingGate());
  s.register(new ShippingTypeGate());
  s.register(new ValidateFieldGate());
  s.register(new SwapAddressesGate());
  s.register(new UndoGate(h));
  s.register(new RedoGate(h));
  s.register(new FocusManagerGate());
  assertEqual(s.sampleHere().gateCount, 9);
});

// ============================================================
// Explanations 7-8
// ============================================================

test('Explanations: demos 7-8 have all required fields', async () => {
  const { explanations } = await import('../js/modal/explanations.js');
  for (const num of [7, 8]) {
    const ex = explanations[num];
    assert(ex, `explanation ${num} exists`);
    assertEqual(ex.number, num);
    assert(ex.title.length > 0);
    assert(ex.siso.length > 0);
    assert(ex.react.length > 0);
  }
});

test('Explanations: all 8 demos present', async () => {
  const { explanations } = await import('../js/modal/explanations.js');
  for (let i = 1; i <= 8; i++) {
    assert(explanations[i], `demo ${i} exists`);
  }
});

const exitCode = report('phase4');
process.exit(exitCode);
