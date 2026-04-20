/**
 * explanations.js -- Modal content for each demo
 *
 * Each entry has: number, title, siso (what happened), react (what you'd need).
 * HTML is allowed in siso/react for inline code tags.
 */

export const explanations = {
  1: {
    number: 1,
    title: 'Cursor-Preserving Input Formatting',
    siso: `One gate claimed <code>format-phone</code>. It read
      <code>selectionStart</code> from the input, counted the digits
      before the cursor, formatted the value in place, then walked
      the formatted string to restore the cursor to the same logical
      position. The input element was never replaced. Total: one gate,
      three DOM property reads, two writes.`,
    react: `<code>setState</code> on the input value triggers a re-render.
      React replaces the input's value, which resets
      <code>selectionStart</code> to the end. You'd need a
      <code>useRef</code> to capture cursor position before render,
      then a <code>useEffect</code> to restore it after render. The cursor
      still flickers on fast typing because the restore happens one
      frame late. Stack Overflow has thousands of posts on this exact problem.`,
  },
  2: {
    number: 2,
    title: 'Cross-Field Cascade',
    siso: `One gate claimed <code>country-changed</code>. Inside that
      single <code>transform</code>, it repopulated the state dropdown,
      updated the postal code placeholder, and recalculated tax. Three
      targeted DOM writes, one gate, zero intermediate visual states.
      The user saw one atomic update.`,
    react: `Country is state. The state dropdown depends on country
      (<code>useEffect</code> #1). Postal mask depends on country
      (<code>useEffect</code> #2). Tax depends on country + state
      (<code>useEffect</code> #3). Three effects fire in the same render
      cycle with overlapping dependencies. The user sees 2&ndash;3
      intermediate renders: empty dropdown, old postal mask,
      &ldquo;calculating&hellip;&rdquo; on tax. Developers add loading
      states, which adds more re-renders.`,
  },
  3: {
    number: 3,
    title: 'Same as Billing',
    siso: `One gate claimed <code>copy-billing</code>. It read each billing
      field directly from the DOM and wrote to the corresponding shipping
      field. Then it emitted <code>country-changed</code> with the billing
      country &mdash; the existing cascade gate fired automatically. No new
      wiring. The causal chain was: checkbox &rarr; copy gate &rarr;
      cascade gate. Two gates, one natural re-emit.`,
    react: `Controlled inputs mean each field is tied to state. &ldquo;Copy
      all&rdquo; means calling <code>setState</code> on 6+ variables at once.
      React batches in event handlers but not always in async contexts. The
      cascade effects for country/state/postal may or may not fire depending
      on render timing. Developers often resort to <code>useReducer</code>
      with a complex action, or multiple sequential <code>setState</code>
      calls with <code>flushSync</code>.`,
  },
  4: {
    number: 4,
    title: 'Conditional Field Visibility',
    siso: `One gate claimed <code>shipping-type-changed</code>. It toggled
      <code>display</code> and <code>aria-hidden</code> on the company name
      field group. The input element was never removed from the DOM. When you
      switched back to &ldquo;Business,&rdquo; the value you typed was still
      there &mdash; because the element that held it never left.`,
    react: `Conditional rendering (<code>{isBusiness && &lt;input /&gt;}</code>)
      unmounts the input when hidden. The value is destroyed. To preserve it
      you must lift state into a <code>useState</code> above the conditional,
      add an <code>onChange</code> handler, and feed it back as a controlled
      value &mdash; or keep the element mounted but visually hidden, fighting
      React&rsquo;s declarative model. Each approach has tradeoffs and edge cases.`,
  },
  5: {
    number: 5,
    title: 'Real-Time Validation',
    siso: `One gate claimed <code>validate-field</code>. It read the field
      value from the DOM at transform time &mdash; always current, no closures
      over old state. It checked required, email format, and postal format
      against the current country. Then it set or cleared
      <code>aria-invalid</code> and wrote the error message directly. A
      simple <code>setTimeout</code> on the gate handles debouncing.`,
    react: `Validation in <code>useEffect</code> creates stale closure bugs:
      the validator captures old state values. Dependency arrays must include
      every field the validator reads, and missing one causes silent stale
      validation. Debouncing requires a <code>useRef</code> for the timer ID
      plus <code>useCallback</code> with correct dependencies. A common bug:
      the debounced validator fires with the value from several keystrokes ago.`,
  },
  6: {
    number: 6,
    title: 'Drag-and-Drop Address Swap',
    siso: `One gate claimed <code>swap-addresses</code>. It called
      <code>insertBefore</code> to move the DOM nodes. The browser preserved
      every input&rsquo;s value, cursor position, selection state, and undo
      history because the elements were moved, not destroyed and recreated.
      Two lines of DOM manipulation.`,
    react: `Swapping two controlled form sections means swapping all their
      state variables. If you use component keys to force re-render, React
      unmounts both sections and remounts them &mdash; destroying all internal
      input state (cursor, selection, undo history). If you manually swap each
      piece of state, you need a <code>useState</code> for every field in both
      sections, and the swap logic grows linearly with the number of fields.`,
  },
  7: {
    number: 7,
    title: 'Undo / Redo',
    siso: `The StreamLog already recorded every event. Before each user action,
      a snapshot of the form state was captured. Undo restored the previous
      snapshot. The log provided the causal record (what happened and why),
      the snapshot provided the values to restore. No new infrastructure
      was needed &mdash; the audit trail <em>is</em> the history stack.`,
    react: `React has no built-in undo. You must implement a state history
      stack manually: snapshot the entire form state before each change, store
      in an array, manage a pointer. With <code>useReducer</code> this is
      verbose but possible. With <code>useState</code> across multiple fields
      it becomes a coordination nightmare. Libraries like Immer help but add
      weight. None of this is free &mdash; and none of it comes from React
      itself.`,
  },
  8: {
    number: 8,
    title: 'Focus Management',
    siso: `The gate that closed the modal called <code>.focus()</code> on the
      trigger element &mdash; which is the same element, still in the DOM,
      never unmounted. The gate that found a validation error called
      <code>.focus()</code> on the first invalid input &mdash; same element,
      still there. Tab order is stable because DOM order only changes when
      a gate explicitly moves something.`,
    react: `After a re-render, the previously focused element may have been
      unmounted and remounted &mdash; it&rsquo;s a new DOM node, so focus is
      lost. You must track the previously focused element in a
      <code>useRef</code>, then restore focus in <code>useEffect</code> after
      the re-render. Tab order issues arise when conditionally rendered elements
      change the DOM order mid-focus-sequence. React&rsquo;s reconciler does
      not consider focus as part of its diffing.`,
  },
};
