/**
 * validate-field gate -- Demo 5
 *
 * Validates form fields. Reads value and country from the
 * event -- not from the DOM. No instance state.
 *
 * Emits 'field-validated' so downstream gates can react
 * without querying DOM state directly.
 *
 * Supports: required, email format, postal format per country.
 */
import { Gate } from '../core/Gate.js';
import { Event } from '../core/Event.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const POSTAL_PATTERNS = {
  US: { re: /^\d{5}(-\d{4})?$/, msg: 'Enter a 5-digit ZIP (e.g. 12345)' },
  CA: { re: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, msg: 'Enter a postal code (e.g. A1A 1A1)' },
  GB: { re: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, msg: 'Enter a postcode (e.g. SW1A 1AA)' },
  AU: { re: /^\d{4}$/, msg: 'Enter a 4-digit postcode' },
  DE: { re: /^\d{5}$/, msg: 'Enter a 5-digit Postleitzahl' },
  JP: { re: /^\d{3}-?\d{4}$/, msg: 'Enter a postal code (e.g. 100-0001)' },
  IN: { re: /^\d{6}$/, msg: 'Enter a 6-digit PIN code (e.g. 110001)' },
};

export class ValidateFieldGate extends Gate {
  constructor() {
    super('validate-field');
  }

  transform(event, stream) {
    const {
      fieldId,
      value = '',
      trigger = 'blur',
      country = 'US',
    } = event.data;
    if (!fieldId) return;

    const trimmed = value.trim();
    const input = document.getElementById(fieldId);
    if (!input) return;

    const errorEl = document.getElementById(`${fieldId}-error`);
    let errorMsg = '';

    // Required check -- reads label class from DOM (structural, not computed state)
    const label = input.closest('.field-group')?.querySelector('.field-label');
    const isRequired = label?.classList.contains('field-label-required');
    if (isRequired && trimmed === '') {
      errorMsg = 'This field is required';
    }

    // Email format
    if (!errorMsg && fieldId.includes('email') && trimmed !== '') {
      if (!EMAIL_RE.test(trimmed)) {
        errorMsg = 'Enter a valid email address';
      }
    }

    // Postal format -- country comes from the event, not the DOM
    if (!errorMsg && fieldId.includes('postal') && trimmed !== '') {
      const pattern = POSTAL_PATTERNS[country];
      if (pattern && !pattern.re.test(trimmed)) {
        errorMsg = pattern.msg;
      }
    }

    // Apply result to DOM
    if (errorMsg) {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = errorMsg;
        input.setAttribute('aria-describedby', errorEl.id);
      }
    } else {
      input.removeAttribute('aria-invalid');
      if (errorEl) {
        errorEl.textContent = '';
        input.removeAttribute('aria-describedby');
      }
    }

    // Emit result -- downstream gates react without querying DOM
    stream.emit(new Event('field-validated', {
      fieldId,
      valid: errorMsg === '',
      error: errorMsg,
      trigger,
    }));
  }
}

export { EMAIL_RE, POSTAL_PATTERNS };
