/**
 * swap-addresses gate -- Demo 6
 *
 * Swaps the billing and shipping form sections in the DOM.
 * Uses DOM node movement -- not cloning, not re-rendering.
 * All internal input state (values, cursor, selection,
 * undo history) is preserved because the elements are
 * moved, not destroyed and recreated.
 */
import { Gate } from '../core/Gate.js';

export class SwapAddressesGate extends Gate {
  constructor() {
    super('swap-addresses');
  }

  transform(event, stream) {
    const grid = document.getElementById('form-grid');
    const billing = document.getElementById('billing-section');
    const shipping = document.getElementById('shipping-section');
    if (!grid || !billing || !shipping) return;

    // Swap the badge labels
    const billingBadge = billing.querySelector('.form-section-badge');
    const shippingBadge = shipping.querySelector('.form-section-badge');
    const billingTitle = billing.querySelector('.form-section-title');
    const shippingTitle = shipping.querySelector('.form-section-title');

    if (billingBadge && shippingBadge) {
      const tmpBadge = billingBadge.textContent;
      billingBadge.textContent = shippingBadge.textContent;
      shippingBadge.textContent = tmpBadge;
    }

    if (billingTitle && shippingTitle) {
      const tmpTitle = billingTitle.textContent;
      billingTitle.textContent = shippingTitle.textContent;
      shippingTitle.textContent = tmpTitle;
    }

    // Swap data-address attributes
    const tmpAddr = billing.getAttribute('data-address');
    billing.setAttribute('data-address', shipping.getAttribute('data-address'));
    shipping.setAttribute('data-address', tmpAddr);

    // Swap DOM positions
    // Insert billing before shipping's next sibling (i.e. after shipping)
    // Then insert shipping into billing's old position (now first)
    const parent = grid;
    const billingNext = billing.nextElementSibling;

    if (billingNext === shipping) {
      // billing is before shipping -- move billing after shipping
      parent.insertBefore(shipping, billing);
    } else {
      // shipping is before billing -- move shipping after billing
      parent.insertBefore(billing, shipping);
    }
  }
}
