/**
 * modal.js -- Modal open/close with focus trap
 *
 * Not a gate. Infrastructure. The modal is triggered
 * by gates after their transform completes.
 */

let triggerElement = null;
let previouslyFocused = null;

const overlay = () => document.getElementById('demo-modal');
const closeBtn = () => document.getElementById('modal-close');
const closeBtnBottom = () => document.getElementById('modal-close-btn');
const titleEl = () => document.getElementById('modal-title');
const numberEl = () => document.getElementById('modal-demo-number');
const sisoText = () => document.getElementById('modal-siso-text');
const reactText = () => document.getElementById('modal-react-text');
const dismissCheck = () => document.getElementById('modal-dismiss-check');

/**
 * Show the modal with content for a specific demo.
 * @param {object} content - { number, title, siso, react }
 * @param {HTMLElement} trigger - element that caused this modal
 */
export function showModal(content, trigger) {
  // Check if user dismissed this demo
  const key = `siso-dismiss-demo-${content.number}`;
  if (sessionStorage.getItem(key) === 'true') return;

  const modal = overlay();
  if (!modal) return;

  // Store trigger for focus restoration
  triggerElement = trigger || document.activeElement;
  previouslyFocused = document.activeElement;

  // Populate
  numberEl().textContent = `Demo ${content.number}`;
  titleEl().textContent = content.title;
  sisoText().innerHTML = content.siso;
  reactText().innerHTML = content.react;
  dismissCheck().checked = false;

  // Show
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus the close button after transition
  requestAnimationFrame(() => {
    closeBtn()?.focus();
  });
}

export function hideModal() {
  const modal = overlay();
  if (!modal) return;

  // Save dismiss preference
  const num = numberEl()?.textContent?.replace('Demo ', '');
  if (num && dismissCheck()?.checked) {
    sessionStorage.setItem(`siso-dismiss-demo-${num}`, 'true');
  }

  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Restore focus (Demo 8 foreshadowed)
  if (triggerElement && triggerElement.focus) {
    triggerElement.focus();
  } else if (previouslyFocused && previouslyFocused.focus) {
    previouslyFocused.focus();
  }

  triggerElement = null;
  previouslyFocused = null;
}

/**
 * Initialize modal event listeners.
 */
export function initModal() {
  // Close button (X)
  closeBtn()?.addEventListener('click', hideModal);

  // Close button (bottom)
  closeBtnBottom()?.addEventListener('click', hideModal);

  // Backdrop click
  overlay()?.addEventListener('click', (e) => {
    if (e.target === overlay()) {
      hideModal();
    }
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay()?.getAttribute('aria-hidden') === 'false') {
      hideModal();
    }
  });

  // Focus trap
  overlay()?.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const modal = overlay();
    if (modal.getAttribute('aria-hidden') !== 'false') return;

    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
