/**
 * sidebar.js -- Demo Guide panel
 *
 * Builds the accordion from explanations.js data,
 * wires open/close and expand/collapse behavior.
 */

import { explanations } from '../modal/explanations.js';

const CHEVRON_SVG = `<svg class="demo-accordion-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>`;

export function initSidebar() {
  const tab = document.getElementById('sidebar-tab');
  const panel = document.getElementById('sidebar-panel');
  const closeBtn = document.getElementById('sidebar-panel-close');
  const list = document.getElementById('demo-accordion');

  if (!tab || !panel || !list) return;

  // --- Build accordion items ---
  const sorted = Object.values(explanations).sort((a, b) => a.number - b.number);

  for (const demo of sorted) {
    const item = document.createElement('li');
    item.className = 'demo-accordion-item';

    const triggerId = `accordion-trigger-${demo.number}`;
    const contentId = `accordion-content-${demo.number}`;

    item.innerHTML = `
      <button class="demo-accordion-trigger"
              id="${triggerId}"
              aria-expanded="false"
              aria-controls="${contentId}">
        <span class="demo-accordion-number">${demo.number}</span>
        <span>${demo.title}</span>
        ${CHEVRON_SVG}
      </button>
      <div class="demo-accordion-content"
           id="${contentId}"
           role="region"
           aria-labelledby="${triggerId}"
           data-expanded="false">
        <div class="demo-accordion-body">
          <div class="demo-accordion-section-label demo-accordion-section-label-siso">How this works</div>
          <div class="demo-accordion-text">${demo.siso}</div>
          <div class="demo-accordion-section-label demo-accordion-section-label-react">In React, you'd need...</div>
          <div class="demo-accordion-text">${demo.react}</div>
        </div>
      </div>
    `;

    list.appendChild(item);
  }

  // --- Accordion toggle ---
  list.addEventListener('click', (e) => {
    const trigger = e.target.closest('.demo-accordion-trigger');
    if (!trigger) return;

    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    const contentId = trigger.getAttribute('aria-controls');
    const content = document.getElementById(contentId);
    if (!content) return;

    trigger.setAttribute('aria-expanded', String(!expanded));
    content.setAttribute('data-expanded', String(!expanded));
  });

  // --- Panel open/close ---
  function openPanel() {
    panel.setAttribute('data-open', 'true');
    tab.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }

  function closePanel() {
    panel.setAttribute('data-open', 'false');
    tab.setAttribute('aria-expanded', 'false');
    tab.focus();
  }

  tab.addEventListener('click', () => {
    const isOpen = panel.getAttribute('data-open') === 'true';
    if (isOpen) closePanel(); else openPanel();
  });

  closeBtn.addEventListener('click', closePanel);

  // Open by default
  panel.setAttribute('data-open', 'true');
  tab.setAttribute('aria-expanded', 'true');

  // Escape to close
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePanel();
    }
  });

  // Close on click outside
  document.addEventListener('mousedown', (e) => {
    if (panel.getAttribute('data-open') === 'true'
        && !panel.contains(e.target)
        && e.target !== tab) {
      closePanel();
    }
  });
}

/**
 * Open the sidebar, expand the given demo's accordion, scroll
 * it into view, and flash it yellow.
 */
export function highlightDemo(demoNumber) {
  const panel = document.getElementById('sidebar-panel');
  const tab = document.getElementById('sidebar-tab');
  const closeBtn = document.getElementById('sidebar-panel-close');

  if (!panel) return;

  // Open panel if closed
  if (panel.getAttribute('data-open') !== 'true') {
    panel.setAttribute('data-open', 'true');
    if (tab) tab.setAttribute('aria-expanded', 'true');
  }

  const trigger = document.getElementById(`accordion-trigger-${demoNumber}`);
  const content = document.getElementById(`accordion-content-${demoNumber}`);
  if (!trigger || !content) return;

  // Expand if collapsed
  trigger.setAttribute('aria-expanded', 'true');
  content.setAttribute('data-expanded', 'true');

  // Flash the item
  const item = trigger.closest('.demo-accordion-item');
  if (item) {
    item.removeAttribute('data-flash');
    // Force reflow so re-adding the attribute restarts the animation
    void item.offsetWidth;
    item.setAttribute('data-flash', 'true');
    item.addEventListener('animationend', () => {
      item.removeAttribute('data-flash');
    }, { once: true });

    // Scroll into view within the sidebar after expansion settles
    setTimeout(() => {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}
