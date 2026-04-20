/**
 * format-phone gate -- Demo 1
 *
 * Formats phone input while preserving cursor position.
 * The element is never replaced -- cursor stays where the
 * user put it.
 *
 * Country is carried in the event (read by the DOM adapter
 * from the section's country select at emit time). The gate
 * uses it to apply the correct national format.
 *
 * Supported formats:
 *   US / default — (555) 123-4567   10 digits
 *   IN (India)   — 98765 43210      10 digits
 */
import { Gate } from '../core/Gate.js';

export class FormatPhoneGate extends Gate {
  constructor() {
    super('format-phone');
  }

  transform(event, stream) {
    const { element: input, country = 'US' } = event.data;
    if (!input) return;

    const raw = input.value;
    const cursorBefore = input.selectionStart;

    // Count digits before cursor
    const digitsBefore = raw.slice(0, cursorBefore).replace(/\D/g, '').length;

    // Strip to digits only, cap at 10
    const digits = raw.replace(/\D/g, '').slice(0, 10);

    // Format by country
    const formatted = country === 'IN'
      ? this.formatIN(digits)
      : this.formatUS(digits);

    // Only update if changed
    if (formatted === raw) return;

    input.value = formatted;

    // Restore cursor: walk formatted string until we've
    // passed the same number of digits as before
    let newCursor = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) digitCount++;
      if (digitCount >= digitsBefore) {
        newCursor = i + 1;
        break;
      }
    }
    if (digitCount < digitsBefore) newCursor = formatted.length;

    input.setSelectionRange(newCursor, newCursor);
  }

  // US: (555) 123-4567
  formatUS(digits) {
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // India: 98765 43210
  formatIN(digits) {
    if (digits.length === 0) return '';
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
}
