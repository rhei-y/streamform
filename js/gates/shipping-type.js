/**
 * shipping-type gate -- Demo 4
 *
 * Toggles company name field visibility based on
 * shipping type. The field is always in the DOM --
 * we toggle display and aria-hidden. Value survives
 * hide/show because the element is never removed.
 */
import { Gate } from '../core/Gate.js';

export class ShippingTypeGate extends Gate {
  constructor() {
    super('shipping-type-changed');
  }

  transform(event, stream) {
    const { shippingType } = event.data;
    const group = document.getElementById('company-name-group');
    if (!group) return;

    const isBusiness = shippingType === 'business';

    if (isBusiness) {
      group.style.display = '';
      group.setAttribute('aria-hidden', 'false');
      // Focus the input so user can type immediately
      const input = document.getElementById('shipping-company');
      if (input) input.focus();
    } else {
      group.style.display = 'none';
      group.setAttribute('aria-hidden', 'true');
      // Value is NOT cleared -- it persists for when
      // the user switches back to Business
    }
  }
}
