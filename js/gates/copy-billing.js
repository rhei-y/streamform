/**
 * copy-billing gate -- Demo 3
 *
 * When "Same as billing" is checked, reads every billing
 * field from the DOM, writes to shipping fields, then
 * emits country-changed so the cascade fires naturally.
 *
 * When unchecked, clears shipping fields.
 *
 * selectState is carried in the country-changed event so
 * CountryCascadeGate can apply it after repopulating the
 * dropdown -- no reliance on dispatch order.
 */
import { Gate } from '../core/Gate.js';
import { Event } from '../core/Event.js';

const FIELDS = ['name', 'address', 'city', 'state', 'postal', 'country', 'phone'];

export class CopyBillingGate extends Gate {
  constructor() {
    super('copy-billing');
  }

  transform(event, stream) {
    const checked = event.data.checked;

    if (checked) {
      // Copy each billing field to shipping
      for (const field of FIELDS) {
        const src = document.getElementById(`billing-${field}`);
        const dst = document.getElementById(`shipping-${field}`);
        if (src && dst) {
          dst.value = src.value;
        }
      }

      const country = document.getElementById('billing-country')?.value || 'US';
      const billingState = document.getElementById('billing-state')?.value ?? '';

      // selectState is carried in the event. CountryCascadeGate applies
      // it after repopulating the dropdown -- no reliance on dispatch order.
      stream.emit(new Event('country-changed', {
        prefix: 'shipping',
        country,
        selectState: billingState,
      }));
    } else {
      // Clear shipping fields
      for (const field of FIELDS) {
        const dst = document.getElementById(`shipping-${field}`);
        if (!dst) continue;
        if (dst.tagName === 'SELECT') {
          if (field === 'country') {
            dst.value = 'US';
            stream.emit(new Event('country-changed', {
              prefix: 'shipping',
              country: 'US',
            }));
          } else {
            dst.value = '';
          }
        } else {
          dst.value = '';
        }
      }
    }
  }
}

export { FIELDS };
