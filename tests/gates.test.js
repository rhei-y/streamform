import { test, assert, assertEqual, report, reset } from './runner.js';
import { Event } from '../js/core/Event.js';
import { Stream } from '../js/core/Stream.js';
import { StreamLog } from '../js/core/StreamLog.js';
import { FormatPhoneGate } from '../js/gates/format-phone.js';
import { CountryCascadeGate, STATES, POSTAL_CONFIG, TAX_RATES, SUBTOTAL } from '../js/gates/country-cascade.js';
import { CopyBillingGate, FIELDS } from '../js/gates/copy-billing.js';

// --- Minimal DOM mocks for Node ---

function mockInput(id, value = '', selectionStart = 0) {
  return {
    id,
    tagName: 'INPUT',
    value,
    selectionStart,
    placeholder: '',
    _selStart: selectionStart,
    _selEnd: selectionStart,
    setSelectionRange(start, end) {
      this._selStart = start;
      this._selEnd = end;
      this.selectionStart = start;
    },
    closest() { return null; },
  };
}

function mockSelect(id, value = '') {
  const options = [];
  return {
    id,
    tagName: 'SELECT',
    value,
    innerHTML: '',
    _options: options,
    appendChild(child) { options.push(child); },
    querySelector() { return null; },
    closest() { return null; },
  };
}

function mockElement(tag, id) {
  return {
    id,
    tagName: tag,
    textContent: '',
    querySelector() { return null; },
    closest() { return null; },
  };
}

// ============================================================
// DEMO 1: FormatPhoneGate
// ============================================================

test('FormatPhone: formats 10 digits correctly', () => {
  const gate = new FormatPhoneGate();
  assertEqual(gate.formatUS('5551234567'), '(555) 123-4567');
});

test('FormatPhone: partial digits format correctly', () => {
  const gate = new FormatPhoneGate();
  assertEqual(gate.formatUS('555'), '(555');
  assertEqual(gate.formatUS('55512'), '(555) 12');
  assertEqual(gate.formatUS('5551234'), '(555) 123-4');
});

test('FormatPhone: empty string returns empty', () => {
  const gate = new FormatPhoneGate();
  assertEqual(gate.formatUS(''), '');
});

test('FormatPhone: transform writes formatted value', () => {
  const gate = new FormatPhoneGate();
  const input = mockInput('phone', '5551234567', 10);
  const stream = new Stream();
  gate.transform(new Event('format-phone', { element: input }), stream);
  assertEqual(input.value, '(555) 123-4567');
});

test('FormatPhone: cursor preservation - typing at end', () => {
  const gate = new FormatPhoneGate();
  // User typed 4th digit, cursor is at position 4 in raw "5551"
  const input = mockInput('phone', '5551', 4);
  const stream = new Stream();
  gate.transform(new Event('format-phone', { element: input }), stream);
  assertEqual(input.value, '(555) 1');
  // Cursor should be after the '1', which is at position 7
  assertEqual(input._selStart, 7);
});

test('FormatPhone: cursor preservation - editing middle', () => {
  const gate = new FormatPhoneGate();
  // Current value is "(555) 23-4567" (user deleted the 1, cursor at position 6)
  // Raw digits: 5552345678 = wait, let me think...
  // "(555) 23-4567" -> digits = 555234567 (9 digits)
  // cursor at 6 means before '2', digits before cursor: "555" = 3 digits
  const input = mockInput('phone', '555234567', 3);
  const stream = new Stream();
  gate.transform(new Event('format-phone', { element: input }), stream);
  assertEqual(input.value, '(555) 234-567');
  // 3 digits before cursor -> cursor after 3rd digit in formatted = after '5' in '(555'
  assertEqual(input._selStart, 4);
});

test('FormatPhone: caps at 10 digits', () => {
  const gate = new FormatPhoneGate();
  const input = mockInput('phone', '555123456789012', 15);
  const stream = new Stream();
  gate.transform(new Event('format-phone', { element: input }), stream);
  assertEqual(input.value, '(555) 123-4567');
});

test('FormatPhone: no-op if already formatted', () => {
  const gate = new FormatPhoneGate();
  const input = mockInput('phone', '(555) 123-4567', 14);
  const stream = new Stream();
  gate.transform(new Event('format-phone', { element: input }), stream);
  // Value should not change, setSelectionRange should not be called beyond initial
  assertEqual(input.value, '(555) 123-4567');
});

// ============================================================
// DEMO 2: CountryCascadeGate
// ============================================================

test('CountryCascade: STATES data has entries for all countries', () => {
  const countries = ['US', 'CA', 'GB', 'AU', 'DE', 'JP'];
  for (const c of countries) {
    assert(STATES[c] && STATES[c].length > 0, `STATES has entries for ${c}`);
  }
});

test('CountryCascade: POSTAL_CONFIG has entries for all countries', () => {
  const countries = ['US', 'CA', 'GB', 'AU', 'DE', 'JP'];
  for (const c of countries) {
    assert(POSTAL_CONFIG[c], `POSTAL_CONFIG has entry for ${c}`);
    assert(POSTAL_CONFIG[c].placeholder, `POSTAL_CONFIG ${c} has placeholder`);
  }
});

test('CountryCascade: TAX_RATES has entries for all countries', () => {
  const countries = ['US', 'CA', 'GB', 'AU', 'DE', 'JP'];
  for (const c of countries) {
    assert(typeof TAX_RATES[c] === 'number', `TAX_RATES has number for ${c}`);
    assert(TAX_RATES[c] > 0 && TAX_RATES[c] < 1, `TAX_RATES ${c} is between 0 and 1`);
  }
});

test('CountryCascade: gate signature is country-changed', () => {
  const gate = new CountryCascadeGate();
  assertEqual(gate.signature, 'country-changed');
});

test('CountryCascade: US tax calculation correct', () => {
  const rate = TAX_RATES['US'];
  const tax = SUBTOTAL * rate;
  assertEqual(tax, 8.00);
});

test('CountryCascade: CA tax calculation correct', () => {
  const rate = TAX_RATES['CA'];
  const tax = SUBTOTAL * rate;
  assertEqual(tax, 13.00);
});

// ============================================================
// DEMO 3: CopyBillingGate
// ============================================================

test('CopyBilling: gate signature is copy-billing', () => {
  const gate = new CopyBillingGate();
  assertEqual(gate.signature, 'copy-billing');
});

test('CopyBilling: FIELDS list is complete', () => {
  const expected = ['name', 'address', 'city', 'state', 'postal', 'country', 'phone'];
  assertEqual(FIELDS.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    assertEqual(FIELDS[i], expected[i]);
  }
});

test('CopyBilling: emits country-changed when checked', () => {
  const log = new StreamLog('DATA');
  const stream = new Stream({ log });
  const gate = new CopyBillingGate();
  // We need a country-changed gate to claim the re-emit
  // (or it goes to pending, which is fine for this test)
  stream.register(gate);

  // Mock getElementById
  const origGetById = globalThis.document?.getElementById;
  const mockElements = {
    'billing-name': mockInput('billing-name', 'Jane'),
    'billing-address': mockInput('billing-address', '123 Main'),
    'billing-city': mockInput('billing-city', 'Portland'),
    'billing-state': mockSelect('billing-state', 'OR'),
    'billing-postal': mockInput('billing-postal', '97201'),
    'billing-country': mockSelect('billing-country', 'US'),
    'billing-phone': mockInput('billing-phone', '(555) 123-4567'),
    'shipping-name': mockInput('shipping-name'),
    'shipping-address': mockInput('shipping-address'),
    'shipping-city': mockInput('shipping-city'),
    'shipping-state': mockSelect('shipping-state'),
    'shipping-postal': mockInput('shipping-postal'),
    'shipping-country': mockSelect('shipping-country'),
    'shipping-phone': mockInput('shipping-phone'),
  };

  // Minimal document mock
  globalThis.document = {
    getElementById: (id) => mockElements[id] || null,
  };

  stream.emit(new Event('copy-billing', { checked: true }));

  // Verify shipping fields got billing values
  assertEqual(mockElements['shipping-name'].value, 'Jane');
  assertEqual(mockElements['shipping-address'].value, '123 Main');
  assertEqual(mockElements['shipping-city'].value, 'Portland');

  // Verify country-changed was emitted (should be in log)
  const entries = log.sample().entries;
  const cascadeEntry = entries.find(
    (e) => e.type === 'country-changed' && e.data?.prefix === 'shipping'
  );
  assert(cascadeEntry !== undefined, 'country-changed emitted for shipping');
  assertEqual(cascadeEntry.data.country, 'US');

  // Restore
  if (origGetById) {
    globalThis.document.getElementById = origGetById;
  }
});

// ============================================================
// Integration: Stream wiring
// ============================================================

test('Integration: all three gates register without collision', () => {
  const stream = new Stream();
  stream.register(new FormatPhoneGate());
  stream.register(new CountryCascadeGate());
  stream.register(new CopyBillingGate());
  assertEqual(stream.sampleHere().gateCount, 3);
});

test('Integration: log records all event types', () => {
  const log = new StreamLog('DATA');
  const stream = new Stream({ log });
  stream.register(new FormatPhoneGate());
  stream.register(new CountryCascadeGate());
  stream.register(new CopyBillingGate());

  // Emit format-phone (needs element)
  const input = mockInput('test', '555', 3);
  stream.emit(new Event('format-phone', { element: input }));

  // Check log
  const entries = log.sample().entries;
  assertEqual(entries.length, 1);
  assertEqual(entries[0].type, 'format-phone');
  assertEqual(entries[0].claimed, 'format-phone');
});

// ============================================================
// Modal explanations
// ============================================================

test('Explanations: demos 1-3 have all required fields', async () => {
  const { explanations } = await import('../js/modal/explanations.js');
  for (const num of [1, 2, 3]) {
    const ex = explanations[num];
    assert(ex, `explanation ${num} exists`);
    assertEqual(ex.number, num, `number matches for demo ${num}`);
    assert(ex.title.length > 0, `title for demo ${num}`);
    assert(ex.siso.length > 0, `siso text for demo ${num}`);
    assert(ex.react.length > 0, `react text for demo ${num}`);
  }
});



// ============================================================
// India locale
// ============================================================

test('CountryCascade: IN has 36 states and union territories', () => {
  assertEqual(STATES['IN'].length, 36);
});

test('CountryCascade: IN GST rate is 18%', () => {
  assertEqual(TAX_RATES['IN'], 0.18);
});

test('CountryCascade: IN tax calculation correct', () => {
  const tax = SUBTOTAL * TAX_RATES['IN'];
  assertEqual(tax, 18.00);
});

test('FormatPhone: formats Indian number XXXXX XXXXX', () => {
  const gate = new FormatPhoneGate();
  const input = mockInput('billing-phone', '9876543210', 10);

  globalThis.document = { getElementById: () => null };
  gate.transform(new Event('format-phone', { element: input, country: 'IN' }), { emit() {} });
  assertEqual(input.value, '98765 43210');
});

test('FormatPhone: Indian partial number (under 5 digits) unformatted', () => {
  const gate = new FormatPhoneGate();
  const input = mockInput('billing-phone', '987', 3);

  globalThis.document = { getElementById: () => null };
  gate.transform(new Event('format-phone', { element: input, country: 'IN' }), { emit() {} });
  assertEqual(input.value, '987');
});

const exitCode = report('phase2-gates');
process.exit(exitCode);
