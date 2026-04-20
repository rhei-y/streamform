/**
 * undo-redo gates -- Demo 7
 *
 * Three gates share one snapshot stack:
 *   SaveSnapshotGate  -- 'snapshot-save'  -- captures current DOM state
 *   UndoGate          -- 'undo'           -- walks stack backward
 *   RedoGate          -- 'redo'           -- walks stack forward
 *
 * The stack is module-private (_stack). app.js does not hold a
 * reference to it and cannot call save() directly. History is
 * driven by events, not by external orchestration.
 *
 * FormHistory is still exported so tests can construct isolated
 * instances for unit testing without touching _stack.
 */
import { Gate } from '../core/Gate.js';

// IDs of all form fields we snapshot
const FIELD_IDS = [
  'billing-name', 'billing-address', 'billing-city', 'billing-state',
  'billing-postal', 'billing-country', 'billing-phone', 'billing-email',
  'shipping-name', 'shipping-address', 'shipping-city', 'shipping-state',
  'shipping-postal', 'shipping-country', 'shipping-phone',
  'shipping-type', 'shipping-company',
  'same-as-billing',
];

function captureSnapshot() {
  const snap = {};
  for (const id of FIELD_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') {
      snap[id] = { value: el.checked, type: 'checkbox' };
    } else {
      snap[id] = { value: el.value, type: 'field' };
    }
  }
  // Capture conditional field visibility
  const companyGroup = document.getElementById('company-name-group');
  if (companyGroup) {
    snap['_company-visible'] = companyGroup.getAttribute('aria-hidden') !== 'true';
  }
  return snap;
}

function applySnapshot(snap) {
  for (const id of FIELD_IDS) {
    const el = document.getElementById(id);
    if (!el || !snap[id]) continue;
    if (snap[id].type === 'checkbox') {
      el.checked = snap[id].value;
    } else {
      el.value = snap[id].value;
    }
  }
  // Restore conditional field visibility
  const companyGroup = document.getElementById('company-name-group');
  if (companyGroup && snap['_company-visible'] !== undefined) {
    if (snap['_company-visible']) {
      companyGroup.style.display = '';
      companyGroup.setAttribute('aria-hidden', 'false');
    } else {
      companyGroup.style.display = 'none';
      companyGroup.setAttribute('aria-hidden', 'true');
    }
  }
}

/**
 * FormHistory -- the snapshot stack.
 *
 * Exported so unit tests can construct isolated instances.
 * Production code uses the module-private _stack instance
 * and never calls save() directly -- it emits 'snapshot-save'.
 */
export class FormHistory {
  constructor(maxSize = 50) {
    this.stack = [];
    this.pointer = -1;
    this.maxSize = maxSize;
  }

  save() {
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }
    this.stack.push(captureSnapshot());
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    }
    this.pointer = this.stack.length - 1;
    this._updateButtons();
  }

  undo() {
    if (this.pointer <= 0) return false;
    this.pointer--;
    applySnapshot(this.stack[this.pointer]);
    this._updateButtons();
    return true;
  }

  redo() {
    if (this.pointer >= this.stack.length - 1) return false;
    this.pointer++;
    applySnapshot(this.stack[this.pointer]);
    this._updateButtons();
    return true;
  }

  _updateButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = this.pointer <= 0;
    if (redoBtn) redoBtn.disabled = this.pointer >= this.stack.length - 1;
  }

  get canUndo() { return this.pointer > 0; }
  get canRedo() { return this.pointer < this.stack.length - 1; }
}

// Module-private instance used by production gates.
// Not exported. app.js has no reference to it.
const _stack = new FormHistory();

/**
 * SaveSnapshotGate -- 'snapshot-save'
 *
 * Replaces the history.save() calls that were scattered
 * through app.js. app.js emits 'snapshot-save' after each
 * user action; this gate captures the DOM state.
 */
export class SaveSnapshotGate extends Gate {
  constructor(history = _stack) {
    super('snapshot-save');
    this._history = history;
  }

  transform(event, stream) {
    this._history.save();
  }
}

export class UndoGate extends Gate {
  constructor(history = _stack) {
    super('undo');
    this._history = history;
  }

  transform(event, stream) {
    this._history.undo();
  }
}

export class RedoGate extends Gate {
  constructor(history = _stack) {
    super('redo');
    this._history = history;
  }

  transform(event, stream) {
    this._history.redo();
  }
}

export { FIELD_IDS, captureSnapshot, applySnapshot };
