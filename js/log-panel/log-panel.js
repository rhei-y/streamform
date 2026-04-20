/**
 * log-panel.js -- StreamLog slide-out panel
 *
 * Renders StreamLog entries in a slide-out panel.
 * Newest entries at top. Color-coded claimed/pending.
 * Expandable JSON payloads. Live updates when open.
 */

let logRef = null;
let pollInterval = null;

const el = (id) => document.getElementById(id);

export function initLogPanel(log) {
  logRef = log;

  const tab = el('streamlog-tab');
  const panel = el('streamlog-panel');
  const panelClose = el('streamlog-panel-close');

  if (!tab || !panel) return;

  tab.addEventListener('click', () => togglePanel());
  panelClose?.addEventListener('click', () => togglePanel());

  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.getAttribute('data-open') === 'true') {
      togglePanel();
    }
  });

  // Close on click outside
  document.addEventListener('mousedown', (e) => {
    if (panel.getAttribute('data-open') === 'true'
        && !panel.contains(e.target)
        && e.target !== tab) {
      togglePanel();
    }
  });

  // Start polling when panel is open
  pollInterval = setInterval(() => {
    if (panel.getAttribute('data-open') === 'true') {
      renderEntries();
    }
  }, 400);
}

function togglePanel() {
  const tab = el('streamlog-tab');
  const panel = el('streamlog-panel');
  const panelClose = el('streamlog-panel-close');
  if (!panel || !tab) return;

  const isOpen = panel.getAttribute('data-open') === 'true';
  const next = !isOpen;

  // data-open drives CSS visibility -- aria-expanded is not valid on aside/complementary
  panel.setAttribute('data-open', String(next));
  // aria-expanded correctly lives on the button that controls the panel
  tab.setAttribute('aria-expanded', String(next));

  if (next) {
    tab.style.display = 'none';
    renderEntries();
    panelClose?.focus();
  } else {
    tab.style.display = '';
    tab.focus();
  }
}

function renderEntries() {
  if (!logRef) return;

  const container = el('streamlog-entries');
  const empty = el('streamlog-empty');
  const countBadge = el('streamlog-count');
  if (!container) return;

  const sample = logRef.sample();

  // Update count badge on tab
  if (countBadge) countBadge.textContent = sample.count;

  if (sample.count === 0) {
    if (empty) empty.style.display = '';
    container.innerHTML = '';
    return;
  }

  if (empty) empty.style.display = 'none';

  const html = sample.entries
    .slice()
    .reverse()
    .map((entry) => {
      const isClaimed = entry.claimed !== null;
      const claimedHtml = isClaimed
        ? `<span class="log-claimed">${esc(entry.claimed)}</span>`
        : `<span class="log-pending">pending</span>`;

      const timeStr = new Date(entry.time).toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
      });

      let dataHtml = '';
      if (entry.data) {
        const json = JSON.stringify(entry.data, domReplacer, 2);
        if (json !== '{}') {
          dataHtml = `<details class="log-data-details">
            <summary class="log-data-toggle">payload</summary>
            <pre class="log-data-pre">${esc(json)}</pre>
          </details>`;
        }
      }

      const streamHtml = entry.streamId !== undefined
        ? `<span class="log-stream-id">s${entry.streamId}</span>`
        : '';

      return `<div class="log-entry ${isClaimed ? 'log-entry-claimed' : 'log-entry-pending'}">
        <div class="log-entry-header">
          <span class="log-seq">#${entry.seq}</span>
          <span class="log-time">${timeStr}</span>
          ${streamHtml}
        </div>
        <div class="log-entry-body">
          <strong class="log-type">${esc(entry.type)}</strong>
          ${claimedHtml}
        </div>
        ${dataHtml}
      </div>`;
    })
    .join('');

  container.innerHTML = html;
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function domReplacer(key, value) {
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
    return `<${value.tagName.toLowerCase()}#${value.id || 'anon'}>`;
  }
  return value;
}
