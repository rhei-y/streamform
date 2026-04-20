/**
 * focus-manager gate -- Demo 8
 *
 * Moves focus to a named field. Triggered by any gate that
 * determines focus should move -- it emits 'focus-field'
 * with the target id.
 *
 * Focus works because the DOM elements are never unmounted.
 * The same element that was there before is still there after.
 * .focus() just works.
 *
 * In React, the element may have been unmounted and remounted
 * during re-render -- it's a new DOM node, focus is lost.
 */
import { Gate } from '../core/Gate.js';

export class FocusManagerGate extends Gate {
  constructor() {
    super('focus-field');
  }

  transform(event, stream) {
    const { fieldId, select } = event.data;
    if (!fieldId) return;

    const el = document.getElementById(fieldId);
    if (!el) return;

    // requestAnimationFrame defers focus to the next paint cycle,
    // preventing focus-before-render flicker in the browser's own
    // rendering pipeline. This is a paint-timing concern only --
    // not a mechanism for sequencing this gate after other gates.
    // Gate ordering is expressed through event causality, not timers.
    requestAnimationFrame(() => {
      el.focus();
      if (select && el.select) {
        el.select();
      }
    });
  }
}
