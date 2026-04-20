/**
 * app.js -- Bootstrap
 *
 * Creates the Stream and StreamLog, registers all gates,
 * binds DOM events.
 *
 * Undo model: each user action emits 'snapshot-save' after
 * the action event. SaveSnapshotGate handles it. app.js
 * does not hold a history reference or call save() directly.
 *
 * Demo modals: each user action emits 'show-demo-modal'.
 * DemoModalGate shows each demo explanation once per session.
 * app.js does not track which demos have been shown.
 *
 * Validation: validate-field events carry the field's current
 * value and country. The adapter layer (below) reads from the
 * DOM at the boundary and packages that data into the event.
 * Debounce for 'input' events lives here, not in the gate.
 */

import { Stream, StreamLog, Event } from './core/index.js';
import { FormatPhoneGate } from './gates/format-phone.js';
import { CountryCascadeGate } from './gates/country-cascade.js';
import { CopyBillingGate } from './gates/copy-billing.js';
import { ShippingTypeGate } from './gates/shipping-type.js';
import { ValidateFieldGate } from './gates/validate-field.js';
import { FieldValidatedGate } from './gates/field-validated.js';
import { SwapAddressesGate } from './gates/swap-addresses.js';
import { SaveSnapshotGate, UndoGate, RedoGate } from './gates/undo-redo.js';
import { FocusManagerGate } from './gates/focus-manager.js';
import { DemoModalGate } from './modal/demo-modal.js';
import { initModal } from './modal/modal.js';
import { initLogPanel } from './log-panel/log-panel.js';
import { initSidebar } from './sidebar/sidebar.js';

// --- StreamLog at DATA level for full visibility ---
const log = new StreamLog('DATA');

// --- Main stream ---
const stream = new Stream({ log });

// --- Register gates ---
stream.register(new FormatPhoneGate());
stream.register(new CountryCascadeGate());
stream.register(new CopyBillingGate());
stream.register(new ShippingTypeGate());
stream.register(new ValidateFieldGate());
stream.register(new FieldValidatedGate());
stream.register(new SwapAddressesGate());
stream.register(new SaveSnapshotGate());
stream.register(new UndoGate());
stream.register(new RedoGate());
stream.register(new FocusManagerGate());
stream.register(new DemoModalGate());

// --- Initialize modal ---
initModal();

// --- Initialize StreamLog panel ---
initLogPanel(log);

// --- Initialize sidebar ---
initSidebar();

// --- Welcome modal ---
{
  const welcomeOverlay = document.getElementById('welcome-modal');
  const welcomeClose = document.getElementById('welcome-close');
  const welcomeStart = document.getElementById('welcome-start');

  function dismissWelcome() {
    if (welcomeOverlay) welcomeOverlay.setAttribute('data-open', 'false');
  }

  welcomeClose?.addEventListener('click', dismissWelcome);
  welcomeStart?.addEventListener('click', dismissWelcome);
  welcomeOverlay?.addEventListener('click', (e) => {
    if (e.target === welcomeOverlay) dismissWelcome();
  });
  welcomeOverlay?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismissWelcome();
  });

  // Focus the start button so keyboard users can dismiss immediately
  if (welcomeOverlay?.getAttribute('data-open') === 'true') {
    welcomeStart?.focus();
  }
}

// --- Hamburger menu ---
{
  const hBtn = document.getElementById('hamburger-btn');
  const hMenu = document.getElementById('hamburger-menu');

  if (hBtn && hMenu) {
    hBtn.addEventListener('click', () => {
      const open = hMenu.getAttribute('data-open') === 'true';
      hMenu.setAttribute('data-open', String(!open));
      hBtn.setAttribute('aria-expanded', String(!open));
    });

    document.addEventListener('mousedown', (e) => {
      if (hMenu.getAttribute('data-open') === 'true'
          && !hMenu.contains(e.target)
          && e.target !== hBtn
          && !hBtn.contains(e.target)) {
        hMenu.setAttribute('data-open', 'false');
        hBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// ============================================================
// ADAPTER HELPERS
// ============================================================

/**
 * Returns the country value for a given field element.
 * Reads from the DOM at the event boundary -- the one
 * acceptable place for DOM reads that feed into events.
 */
function countryForField(input) {
  const prefix = input.id.startsWith('billing') ? 'billing' : 'shipping';
  return document.getElementById(`${prefix}-country`)?.value ?? 'US';
}

// Debounce timers for 'input' validation events.
// Debounce is a boundary/timing concern, not gate logic.
const _debounceTimers = {};

function emitValidate(input, trigger) {
  stream.emit(new Event('validate-field', {
    fieldId: input.id,
    value: input.value,
    trigger,
    country: countryForField(input),
  }));
}

// ============================================================
// DOM EVENT BINDINGS
// ============================================================

// --- Demo 1: Phone formatting ---
document.querySelectorAll('[data-format="phone"]').forEach((input) => {
  input.addEventListener('input', () => {
    stream.emit(new Event('format-phone', {
      element: input,
      country: countryForField(input),
    }));
    stream.emit(new Event('snapshot-save', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 1, triggerEl: input }));
  });
});

// --- Demo 2: Country cascade ---
['billing-country', 'shipping-country'].forEach((id) => {
  const select = document.getElementById(id);
  if (!select) return;
  const prefix = id.replace('-country', '');

  select.addEventListener('change', () => {
    stream.emit(new Event('country-changed', {
      prefix: prefix,
      country: select.value,
    }));
    stream.emit(new Event('snapshot-save', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 2, triggerEl: select }));
  });
});

// --- Demo 3: Same as billing ---
const sameAsBilling = document.getElementById('same-as-billing');
if (sameAsBilling) {
  sameAsBilling.addEventListener('change', () => {
    stream.emit(new Event('copy-billing', {
      checked: sameAsBilling.checked,
    }));
    stream.emit(new Event('snapshot-save', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 3, triggerEl: sameAsBilling }));
  });
}

// --- Demo 4: Shipping type ---
const shippingType = document.getElementById('shipping-type');
if (shippingType) {
  shippingType.addEventListener('change', () => {
    stream.emit(new Event('shipping-type-changed', {
      shippingType: shippingType.value,
    }));
    stream.emit(new Event('snapshot-save', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 4, triggerEl: shippingType }));
  });
}

// --- Demo 5 + 8: Real-time validation ---
// Debounce is handled here (boundary concern). The gate validates immediately.
// 'field-validated' events emitted by ValidateFieldGate trigger DemoModal
// for demos 5 and 8 via FieldValidatedGate -- no DOM query in app.js.
document.querySelectorAll('.field-input[type="email"], .field-input[type="text"], .field-input[type="tel"]').forEach((input) => {
  if (!input.id) return;

  input.addEventListener('input', () => {
    clearTimeout(_debounceTimers[input.id]);
    _debounceTimers[input.id] = setTimeout(() => {
      emitValidate(input, 'input');
    }, 300);
  });

  input.addEventListener('blur', () => {
    clearTimeout(_debounceTimers[input.id]);
    emitValidate(input, 'blur');
  });
});

// Save snapshot on blur for text fields (captures the completed edit)
document.querySelectorAll('.field-input').forEach((input) => {
  if (input.getAttribute('data-format') === 'phone') return;
  let dirty = false;
  input.addEventListener('input', () => { dirty = true; });
  input.addEventListener('blur', () => {
    if (dirty) {
      stream.emit(new Event('snapshot-save', {}));
      dirty = false;
    }
  });
});

// --- Demo 6: Drag-and-drop address swap ---
const swapBtn = document.getElementById('swap-addresses');
if (swapBtn) {
  swapBtn.addEventListener('click', () => {
    stream.emit(new Event('swap-addresses', {}));
    stream.emit(new Event('snapshot-save', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 6, triggerEl: swapBtn }));
  });
}

let dragSource = null;

document.querySelectorAll('.form-section[draggable="true"]').forEach((section) => {
  section.addEventListener('dragstart', (e) => {
    dragSource = section;
    section.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  section.addEventListener('dragend', () => {
    section.classList.remove('dragging');
    document.querySelectorAll('.form-section').forEach((s) => s.classList.remove('drag-over'));
    dragSource = null;
  });

  section.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (section !== dragSource) section.classList.add('drag-over');
  });

  section.addEventListener('dragleave', () => {
    section.classList.remove('drag-over');
  });

  section.addEventListener('drop', (e) => {
    e.preventDefault();
    section.classList.remove('drag-over');
    if (dragSource && dragSource !== section) {
      stream.emit(new Event('swap-addresses', {}));
      stream.emit(new Event('snapshot-save', {}));
      stream.emit(new Event('show-demo-modal', { demoNumber: 6, triggerEl: section }));
    }
  });
});

// --- Demo 7: Undo/redo buttons ---
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

if (undoBtn) {
  undoBtn.addEventListener('click', () => {
    stream.emit(new Event('undo', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 7, triggerEl: undoBtn }));
  });
}

if (redoBtn) {
  redoBtn.addEventListener('click', () => {
    stream.emit(new Event('redo', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 7, triggerEl: redoBtn }));
  });
}

// Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('demo-modal');
  if (modal && modal.getAttribute('aria-hidden') === 'false') return;

  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    stream.emit(new Event('undo', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 7, triggerEl: undoBtn }));
  }
  if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
    e.preventDefault();
    stream.emit(new Event('redo', {}));
    stream.emit(new Event('show-demo-modal', { demoNumber: 7, triggerEl: redoBtn }));
  }
});

// --- Initialize: populate state dropdowns for default country ---
['billing', 'shipping'].forEach((prefix) => {
  const country = document.getElementById(`${prefix}-country`)?.value || 'US';
  stream.emit(new Event('country-changed', {
    prefix: prefix,
    country: country,
  }));
});

// Baseline snapshot -- seeds the undo stack before any user action
stream.emit(new Event('snapshot-save', {}));

// --- Export ---
export { stream, log };
