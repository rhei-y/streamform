/**
 * field-validated gate
 *
 * Consumes 'field-validated' events emitted by ValidateFieldGate
 * and emits 'show-demo-modal' for demos 5 and 8.
 *
 * This gate replaces the findFirstInvalid() DOM query that
 * app.js previously used to decide when to surface these demos.
 * Validation outcomes now flow through events, not DOM reads.
 *
 * Demo 5 (real-time validation): shown on first blur of any
 *   email or postal field, regardless of outcome.
 * Demo 8 (focus management): shown on first validation failure
 *   of any email or postal field.
 */
import { Gate } from '../core/Gate.js';
import { Event } from '../core/Event.js';

export class FieldValidatedGate extends Gate {
  constructor() {
    super('field-validated');
  }

  transform(event, stream) {
    const { fieldId, valid, trigger } = event.data;
    if (trigger !== 'blur') return;

    const isEmailOrPostal = fieldId.includes('email') || fieldId.includes('postal');
    if (!isEmailOrPostal) return;

    stream.emit(new Event('show-demo-modal', { demoNumber: 5 }));

    if (!valid) {
      stream.emit(new Event('show-demo-modal', { demoNumber: 8 }));
    }
  }
}
