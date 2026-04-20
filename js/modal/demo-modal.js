/**
 * DemoModalGate -- 'show-demo-modal'
 *
 * Highlights the relevant demo in the sidebar accordion.
 * Opens the sidebar, expands the accordion item, and flashes
 * it yellow -- once per session per demo.
 */
import { Gate } from '../core/Gate.js';
import { highlightDemo } from '../sidebar/sidebar.js';

export class DemoModalGate extends Gate {
  constructor() {
    super('show-demo-modal');
    this._shown = new Set();
  }

  transform(event, stream) {
    const { demoNumber } = event.data;
    if (!demoNumber || this._shown.has(demoNumber)) return;
    this._shown.add(demoNumber);
    highlightDemo(demoNumber);
  }
}
