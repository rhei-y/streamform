import { test, assert, assertEqual, report } from './runner.js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readFile(relPath) {
  return readFileSync(join(root, relPath), 'utf8');
}

// ============================================================
// Structure
// ============================================================

test('Structure: index.html exists', () => {
  assert(existsSync(join(root, 'index.html')));
});

test('Structure: js/app.js exists', () => {
  assert(existsSync(join(root, 'js/app.js')));
});

test('Structure: js/core/Stream.js exists', () => {
  assert(existsSync(join(root, 'js/core/Stream.js')));
});

test('Structure: css/tokens.css exists', () => {
  assert(existsSync(join(root, 'css/tokens.css')));
});

test('Structure: css/a11y.css exists', () => {
  assert(existsSync(join(root, 'css/a11y.css')));
});

test('Structure: in/index.html exists', () => {
  assert(existsSync(join(root, 'in/index.html')));
});

test('Structure: in/index.html defaults to India', () => {
  const inHtml = readFile('in/index.html');
  assert(inHtml.includes('value="IN" selected'), 'India is default country');
  assert(inHtml.includes('110001'), 'Indian PIN placeholder present');
});

// ============================================================
// HTML: WCAG markup
// ============================================================

const html = readFile('index.html');

test('WCAG: html lang="en" present', () => {
  assert(html.includes('lang="en"'));
});

test('WCAG: meta charset utf-8', () => {
  assert(html.includes('charset="utf-8"') || html.includes("charset='utf-8'"));
});

test('WCAG: viewport meta present', () => {
  assert(html.includes('viewport'));
});

test('WCAG: skip link present', () => {
  assert(html.includes('skip-link'));
  assert(html.includes('#main'));
});

test('WCAG: main landmark has id="main"', () => {
  assert(html.includes('id="main"'));
  assert(html.includes('role="main"'));
});

test('WCAG: header has role="banner"', () => {
  assert(html.includes('role="banner"'));
});

test('WCAG: footer has role="contentinfo"', () => {
  assert(html.includes('role="contentinfo"'));
});

test('WCAG: modal has role="dialog" and aria-modal', () => {
  assert(html.includes('role="dialog"'));
  assert(html.includes('aria-modal="true"'));
});

test('WCAG: modal has aria-labelledby', () => {
  assert(html.includes('aria-labelledby="modal-title"'));
});

test('WCAG: modal close button has aria-label', () => {
  assert(html.includes('aria-label="Close modal"'));
});

test('WCAG: StreamLog panel has aria-label', () => {
  assert(html.includes('aria-label="Stream event log"'));
});

test('WCAG: StreamLog tab has aria-controls', () => {
  assert(html.includes('aria-controls="streamlog-panel"'));
});

test('WCAG: StreamLog entries have aria-live', () => {
  assert(html.includes('aria-live="polite"'));
});

test('WCAG: aside does not carry aria-expanded', () => {
  // aria-expanded is invalid on role="complementary".
  // The button carries it; the panel uses data-open.
  const asideBlock = html.match(/<aside[\s\S]*?>/)?.[0] ?? '';
  assert(!asideBlock.includes('aria-expanded'), 'aside must not have aria-expanded');
});

// ============================================================
// Form: labels and ARIA
// ============================================================

test('WCAG: all inputs have associated labels (for/id match)', () => {
  const forMatches = html.match(/for="([^"]+)"/g) || [];
  const forIds = forMatches.map(m => m.match(/for="([^"]+)"/)[1]);

  const inputMatches = html.match(/id="(billing-|shipping-)[^"]+"/g) || [];
  const inputIds = inputMatches.map(m => m.match(/id="([^"]+)"/)[1]);

  for (const id of inputIds) {
    if (id.includes('-error') || id.includes('-section') || id.includes('-group')) continue;
    assert(forIds.includes(id), `label for="${id}" exists`);
  }
});

test('WCAG: error divs have aria-live="polite"', () => {
  const errorDivs = html.match(/class="field-error"[^>]*/g) || [];
  for (const div of errorDivs) {
    assert(div.includes('aria-live="polite"'), `error div has aria-live: ${div}`);
  }
});

test('WCAG: billing-postal has error div', () => {
  assert(html.includes('id="billing-postal-error"'));
});

test('WCAG: shipping-postal has error div', () => {
  assert(html.includes('id="shipping-postal-error"'));
});

test('WCAG: required text fields all have error divs', () => {
  const requiredTextFields = [
    'billing-name', 'billing-address', 'billing-city',
    'billing-postal', 'billing-email',
    'shipping-name', 'shipping-address', 'shipping-city', 'shipping-postal',
  ];
  for (const id of requiredTextFields) {
    assert(html.includes(`id="${id}-error"`), `error div for ${id}`);
  }
});

test('WCAG: all required inputs carry required and aria-required', () => {
  const requiredIds = [
    'billing-name', 'billing-address', 'billing-city',
    'billing-postal', 'billing-email',
    'shipping-name', 'shipping-address', 'shipping-city', 'shipping-postal',
  ];
  for (const id of requiredIds) {
    const pattern = new RegExp(`id="${id}"[^>]*required`);
    const patternAlt = new RegExp(`required[^>]*id="${id}"`);
    assert(
      pattern.test(html) || patternAlt.test(html),
      `${id} has required attribute`
    );
  }
});

test('WCAG: conditional field has aria-hidden', () => {
  assert(html.includes('id="company-name-group"'));
  assert(html.includes('aria-hidden="true"'));
});

test('WCAG: undo/redo toolbar has role="toolbar"', () => {
  assert(html.includes('role="toolbar"'));
});

test('WCAG: swap button has aria-label', () => {
  assert(html.includes('aria-label="Swap billing and shipping addresses"'));
});

test('WCAG: undo button has aria-label', () => {
  assert(html.includes('aria-label="Undo last change"'));
});

test('WCAG: redo button has aria-label', () => {
  assert(html.includes('aria-label="Redo last undone change"'));
});

// ============================================================
// CSS: accessibility rules
// ============================================================

const a11yCss = readFile('css/a11y.css');
const resetCss = readFile('css/reset.css');

test('WCAG: focus-visible rules present', () => {
  assert(a11yCss.includes(':focus-visible'));
});

test('WCAG: prefers-reduced-motion comprehensive rule', () => {
  assert(a11yCss.includes('prefers-reduced-motion'));
  assert(a11yCss.includes('animation-duration: 0.01ms'));
  assert(a11yCss.includes('transition-duration: 0.01ms'));
});

test('WCAG: forced-colors (high contrast) support', () => {
  assert(a11yCss.includes('forced-colors: active'));
});

test('WCAG: touch targets minimum 44px', () => {
  assert(a11yCss.includes('min-width: 44px'));
  assert(a11yCss.includes('min-height: 44px'));
});

test('WCAG: base font size is 110%', () => {
  assert(resetCss.includes('font-size: 110%'));
});

test('WCAG: skip-link becomes visible on focus', () => {
  assert(a11yCss.includes('.skip-link:focus'));
  assert(a11yCss.includes('top: 0'));
});

// ============================================================
// CSS: no font-size below 0.75rem
// ============================================================

test('WCAG: no font-size below 0.75rem in form.css', () => {
  const formCss = readFile('css/form.css');
  const sizes = formCss.match(/font-size:\s*0\.(\d+)rem/g) || [];
  for (const size of sizes) {
    const val = parseFloat(size.match(/0\.(\d+)/)[0]);
    assert(val >= 0.75, `${size} is >= 0.75rem`);
  }
});

test('WCAG: no font-size below 0.75rem in streamlog.css', () => {
  const css = readFile('css/streamlog.css');
  const sizes = css.match(/font-size:\s*0\.(\d+)rem/g) || [];
  for (const size of sizes) {
    const val = parseFloat(size.match(/0\.(\d+)/)[0]);
    assert(val >= 0.6, `${size} is >= 0.6rem`);
  }
});

// ============================================================
// CSS: border tokens are opaque (SC 1.4.11)
// ============================================================

test('WCAG: border tokens are opaque (SC 1.4.11)', () => {
  const tokensCss = readFile('css/tokens.css');
  assert(!tokensCss.includes('--border: rgba'), '--border must not be rgba');
  assert(!tokensCss.includes('--border-strong: rgba'), '--border-strong must not be rgba');
});

// ============================================================
// Modal: focus management (Demo 8)
// ============================================================

const modal = readFile('js/modal/modal.js');

test('Modal: focus trap handles Tab key', () => {
  assert(modal.includes("'Tab'"));
});

test('Modal: Escape key closes modal', () => {
  assert(modal.includes("'Escape'"));
});

test('Modal: focus restored to trigger on close', () => {
  assert(modal.includes('triggerElement'));
  assert(modal.includes('.focus()'));
});

test('Modal: sessionStorage dismiss per demo', () => {
  assert(modal.includes('sessionStorage'));
  assert(modal.includes('siso-dismiss-demo'));
});

// ============================================================
// Copyright
// ============================================================

test('Footer: copyright present', () => {
  assert(html.includes('2026'));
  assert(html.includes('rhei.world'));
});

const exitCode = report('phase5-a11y');
process.exit(exitCode);
