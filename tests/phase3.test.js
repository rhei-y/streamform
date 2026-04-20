import { test, assert, assertEqual, report } from './runner.js';
import { Event } from '../js/core/Event.js';
import { Stream } from '../js/core/Stream.js';
import { StreamLog } from '../js/core/StreamLog.js';
import { ShippingTypeGate } from '../js/gates/shipping-type.js';
import { ValidateFieldGate, EMAIL_RE, POSTAL_PATTERNS } from '../js/gates/validate-field.js';
import { SwapAddressesGate } from '../js/gates/swap-addresses.js';

// --- Minimal DOM mocks ---

function mockInput(id, value = '') {
  return {
    id,
    tagName: 'INPUT',
    value,
    _ariaInvalid: null,
    _ariaDescribedBy: null,
    setAttribute(k, v) { if (k === 'aria-invalid') this._ariaInvalid = v; if (k === 'aria-describedby') this._ariaDescribedBy = v; },
    removeAttribute(k) { if (k === 'aria-invalid') this._ariaInvalid = null; if (k === 'aria-describedby') this._ariaDescribedBy = null; },
    getAttribute(k) { if (k === 'aria-invalid') return this._ariaInvalid; return null; },
    closest(sel) {
      if (sel === '.field-group') return this._fieldGroup || null;
      return null;
    },
    focus() { this._focused = true; },
    _fieldGroup: null,
  };
}

function mockFieldGroup(labelRequired = false) {
  const label = {
    classList: {
      _classes: new Set(labelRequired ? ['field-label', 'field-label-required'] : ['field-label']),
      contains(c) { return this._classes.has(c); },
    },
  };
  return {
    querySelector(sel) {
      if (sel === '.field-label') return label;
      return null;
    },
  };
}

function mockDiv(id) {
  return {
    id,
    textContent: '',
    style: { display: '' },
    _ariaHidden: 'true',
    setAttribute(k, v) { if (k === 'aria-hidden') this._ariaHidden = v; },
    getAttribute(k) { if (k === 'aria-hidden') return this._ariaHidden; if (k === 'data-address') return this._dataAddress; return null; },
  };
}

// ============================================================
// DEMO 4: ShippingTypeGate
// ============================================================

test('ShippingType: gate signature', () => {
  assertEqual(new ShippingTypeGate().signature, 'shipping-type-changed');
});

test('ShippingType: shows company field for business', () => {
  const group = mockDiv('company-name-group');
  const input = mockInput('shipping-company');
  group.style = { display: 'none' };

  globalThis.document = {
    getElementById(id) {
      if (id === 'company-name-group') return group;
      if (id === 'shipping-company') return input;
      return null;
    },
  };

  const gate = new ShippingTypeGate();
  gate.transform(new Event('shipping-type-changed', { shippingType: 'business' }), new Stream());

  assertEqual(group.style.display, '');
  assertEqual(group._ariaHidden, 'false');
  assert(input._focused === true, 'input focused');
});

test('ShippingType: hides company field for personal', () => {
  const group = mockDiv('company-name-group');

  globalThis.document = {
    getElementById(id) {
      if (id === 'company-name-group') return group;
      return null;
    },
  };

  const gate = new ShippingTypeGate();
  gate.transform(new Event('shipping-type-changed', { shippingType: 'personal' }), new Stream());

  assertEqual(group.style.display, 'none');
  assertEqual(group._ariaHidden, 'true');
});

test('ShippingType: value survives hide/show cycle', () => {
  const group = mockDiv('company-name-group');
  const input = mockInput('shipping-company', 'Acme Corp');
  group.style = { display: '' };

  globalThis.document = {
    getElementById(id) {
      if (id === 'company-name-group') return group;
      if (id === 'shipping-company') return input;
      return null;
    },
  };

  const gate = new ShippingTypeGate();

  // Hide
  gate.transform(new Event('shipping-type-changed', { shippingType: 'personal' }), new Stream());
  assertEqual(input.value, 'Acme Corp', 'value preserved after hide');

  // Show
  gate.transform(new Event('shipping-type-changed', { shippingType: 'business' }), new Stream());
  assertEqual(input.value, 'Acme Corp', 'value preserved after show');
});

// ============================================================
// DEMO 5: ValidateFieldGate
// ============================================================

test('ValidateField: gate signature', () => {
  assertEqual(new ValidateFieldGate().signature, 'validate-field');
});

test('ValidateField: EMAIL_RE accepts valid emails', () => {
  assert(EMAIL_RE.test('user@example.com'));
  assert(EMAIL_RE.test('a@b.co'));
  assert(EMAIL_RE.test('test+tag@domain.org'));
});

test('ValidateField: EMAIL_RE rejects invalid emails', () => {
  assert(!EMAIL_RE.test(''));
  assert(!EMAIL_RE.test('notanemail'));
  assert(!EMAIL_RE.test('@domain.com'));
  assert(!EMAIL_RE.test('user@'));
  assert(!EMAIL_RE.test('user @domain.com'));
});

test('ValidateField: POSTAL_PATTERNS covers all countries', () => {
  const countries = ['US', 'CA', 'GB', 'AU', 'DE', 'JP'];
  for (const c of countries) {
    assert(POSTAL_PATTERNS[c], `pattern exists for ${c}`);
    assert(POSTAL_PATTERNS[c].re instanceof RegExp, `regex for ${c}`);
    assert(POSTAL_PATTERNS[c].msg.length > 0, `message for ${c}`);
  }
});

test('ValidateField: US ZIP patterns', () => {
  assert(POSTAL_PATTERNS.US.re.test('12345'));
  assert(POSTAL_PATTERNS.US.re.test('12345-6789'));
  assert(!POSTAL_PATTERNS.US.re.test('1234'));
  assert(!POSTAL_PATTERNS.US.re.test('ABCDE'));
});

test('ValidateField: CA postal patterns', () => {
  assert(POSTAL_PATTERNS.CA.re.test('A1A1A1'));
  assert(POSTAL_PATTERNS.CA.re.test('A1A 1A1'));
  assert(!POSTAL_PATTERNS.CA.re.test('12345'));
});

test('ValidateField: validates required field on blur', () => {
  const input = mockInput('billing-name', '');
  const errorEl = { id: 'billing-name-error', textContent: '' };
  const fg = mockFieldGroup(true);
  input._fieldGroup = fg;

  globalThis.document = {
    getElementById(id) {
      if (id === 'billing-name') return input;
      if (id === 'billing-name-error') return errorEl;
      return null;
    },
  };

  const gate = new ValidateFieldGate();
  gate.transform(new Event('validate-field', { fieldId: 'billing-name', value: '', trigger: 'blur' }), new Stream());

  assertEqual(input._ariaInvalid, 'true');
  assertEqual(errorEl.textContent, 'This field is required');
});

test('ValidateField: clears error when valid', () => {
  const input = mockInput('billing-name', 'Jane');
  const errorEl = { id: 'billing-name-error', textContent: 'old error' };
  const fg = mockFieldGroup(true);
  input._fieldGroup = fg;

  globalThis.document = {
    getElementById(id) {
      if (id === 'billing-name') return input;
      if (id === 'billing-name-error') return errorEl;
      return null;
    },
  };

  const gate = new ValidateFieldGate();
  gate.transform(new Event('validate-field', { fieldId: 'billing-name', value: 'Jane', trigger: 'blur' }), new Stream());

  assertEqual(input._ariaInvalid, null);
  assertEqual(errorEl.textContent, '');
});

test('ValidateField: validates email format', () => {
  const input = mockInput('billing-email', 'notvalid');
  const errorEl = { id: 'billing-email-error', textContent: '' };
  const fg = mockFieldGroup(true);
  input._fieldGroup = fg;

  globalThis.document = {
    getElementById(id) {
      if (id === 'billing-email') return input;
      if (id === 'billing-email-error') return errorEl;
      return null;
    },
  };

  const gate = new ValidateFieldGate();
  gate.transform(new Event('validate-field', { fieldId: 'billing-email', value: 'notvalid', trigger: 'blur' }), new Stream());

  assertEqual(input._ariaInvalid, 'true');
  assert(errorEl.textContent.includes('valid email'));
});

test('ValidateField: validates postal against country', () => {
  const input = mockInput('billing-postal', 'WRONG');
  const errorEl = { id: 'billing-postal-error', textContent: '' };
  const fg = mockFieldGroup(true);
  input._fieldGroup = fg;

  globalThis.document = {
    getElementById(id) {
      if (id === 'billing-postal') return input;
      if (id === 'billing-postal-error') return errorEl;
      return null;
    },
  };

  const gate = new ValidateFieldGate();
  // country carried in the event -- no DOM read required
  gate.transform(new Event('validate-field', { fieldId: 'billing-postal', value: 'WRONG', trigger: 'blur', country: 'US' }), new Stream());

  assertEqual(input._ariaInvalid, 'true');
  assert(errorEl.textContent.includes('ZIP'));
});

// ============================================================
// DEMO 6: SwapAddressesGate
// ============================================================

test('SwapAddresses: gate signature', () => {
  assertEqual(new SwapAddressesGate().signature, 'swap-addresses');
});

test('SwapAddresses: swaps DOM node order', () => {
  // Simulate a grid with two children
  const children = [];
  const billing = {
    id: 'billing-section',
    _dataAddress: 'billing',
    getAttribute(k) { return this['_' + k.replace(/-/g, '')] || null; },
    setAttribute(k, v) { this['_' + k.replace(/-/g, '')] = v; },
    querySelector(sel) {
      if (sel === '.form-section-badge') return this._badge;
      if (sel === '.form-section-title') return this._title;
      return null;
    },
    _badge: { textContent: 'Billing' },
    _title: { textContent: 'Billing Address' },
    nextElementSibling: null,
  };
  const shipping = {
    id: 'shipping-section',
    _dataAddress: 'shipping',
    getAttribute(k) { return this['_' + k.replace(/-/g, '')] || null; },
    setAttribute(k, v) { this['_' + k.replace(/-/g, '')] = v; },
    querySelector(sel) {
      if (sel === '.form-section-badge') return this._badge;
      if (sel === '.form-section-title') return this._title;
      return null;
    },
    _badge: { textContent: 'Shipping' },
    _title: { textContent: 'Shipping Address' },
    nextElementSibling: null,
  };

  billing.nextElementSibling = shipping;
  children.push(billing, shipping);

  const grid = {
    id: 'form-grid',
    _children: children,
    insertBefore(node, ref) {
      // Simple mock: just track that swap happened
      const ni = this._children.indexOf(node);
      if (ni >= 0) this._children.splice(ni, 1);
      const ri = ref ? this._children.indexOf(ref) : this._children.length;
      this._children.splice(ri, 0, node);
    },
  };

  globalThis.document = {
    getElementById(id) {
      if (id === 'form-grid') return grid;
      if (id === 'billing-section') return billing;
      if (id === 'shipping-section') return shipping;
      return null;
    },
  };

  const gate = new SwapAddressesGate();
  gate.transform(new Event('swap-addresses', {}), new Stream());

  // After swap, shipping should be first
  assertEqual(grid._children[0].id, 'shipping-section');
  assertEqual(grid._children[1].id, 'billing-section');

  // Badge labels should have swapped
  assertEqual(billing._badge.textContent, 'Shipping');
  assertEqual(shipping._badge.textContent, 'Billing');
});

// ============================================================
// Integration: all 6 gates register
// ============================================================

test('Integration: all 6 gates register without collision', async () => {
  const { FormatPhoneGate } = await import('../js/gates/format-phone.js');
  const { CountryCascadeGate } = await import('../js/gates/country-cascade.js');
  const { CopyBillingGate } = await import('../js/gates/copy-billing.js');

  const stream = new Stream();
  stream.register(new FormatPhoneGate());
  stream.register(new CountryCascadeGate());
  stream.register(new CopyBillingGate());
  stream.register(new ShippingTypeGate());
  stream.register(new ValidateFieldGate());
  stream.register(new SwapAddressesGate());
  assertEqual(stream.sampleHere().gateCount, 6);
});

// ============================================================
// Explanations 4-6
// ============================================================

test('Explanations: demos 4-6 have all required fields', async () => {
  const { explanations } = await import('../js/modal/explanations.js');
  for (const num of [4, 5, 6]) {
    const ex = explanations[num];
    assert(ex, `explanation ${num} exists`);
    assertEqual(ex.number, num);
    assert(ex.title.length > 0, `title for demo ${num}`);
    assert(ex.siso.length > 0, `siso text for demo ${num}`);
    assert(ex.react.length > 0, `react text for demo ${num}`);
  }
});



test('ValidateField: validates Indian PIN code', () => {
  const input = mockInput('billing-postal', 'WRONG');
  const errorEl = { id: 'billing-postal-error', textContent: '' };
  const fg = mockFieldGroup(true);
  input._fieldGroup = fg;

  globalThis.document = {
    getElementById(id) {
      if (id === 'billing-postal') return input;
      if (id === 'billing-postal-error') return errorEl;
      return null;
    },
  };

  const gate = new ValidateFieldGate();
  gate.transform(new Event('validate-field', { fieldId: 'billing-postal', value: 'WRONG', trigger: 'blur', country: 'IN' }), new Stream());

  assertEqual(input._ariaInvalid, 'true');
  assert(errorEl.textContent.includes('PIN'));
});

test('ValidateField: accepts valid Indian PIN code', () => {
  const input = mockInput('billing-postal', '110001');
  const errorEl = { id: 'billing-postal-error', textContent: 'old error' };
  const fg = mockFieldGroup(true);
  input._fieldGroup = fg;

  globalThis.document = {
    getElementById(id) {
      if (id === 'billing-postal') return input;
      if (id === 'billing-postal-error') return errorEl;
      return null;
    },
  };

  const gate = new ValidateFieldGate();
  gate.transform(new Event('validate-field', { fieldId: 'billing-postal', value: '110001', trigger: 'blur', country: 'IN' }), new Stream());

  assertEqual(input._ariaInvalid, null);
  assertEqual(errorEl.textContent, '');
});

const exitCode = report('phase3-gates');
process.exit(exitCode);
