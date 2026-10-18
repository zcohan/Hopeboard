// Places a card's comment bubble under the link that opened it, kept inside the viewport.
// Popovers sit in the top layer, so absolute positions are page coordinates.

const GUTTER = 16;

function place(pop: HTMLElement) {
  const link = document.querySelector<HTMLElement>(`[popovertarget="${CSS.escape(pop.id)}"]`);
  if (!link) return;
  const r = link.getBoundingClientRect();
  // the compare popover holds a row of five time buttons, so it's wider
  const width = Math.min(pop.classList.contains('cmp') ? 500 : 320, window.innerWidth - 2 * GUTTER);
  const left = Math.max(GUTTER, Math.min(r.left - 18, window.innerWidth - GUTTER - width));
  pop.style.left = `${left + window.scrollX}px`;
  pop.style.top = `${r.bottom + window.scrollY + 12}px`;
  pop.style.setProperty('--arrow', `${Math.max(12, r.left - left + 8)}px`);
  pop.classList.remove('up');
}

/** Once open and measurable: above the link instead when it would run off the bottom of the screen and fits above. */
function flip(pop: HTMLElement) {
  const link = document.querySelector<HTMLElement>(`[popovertarget="${CSS.escape(pop.id)}"]`);
  if (!link) return;
  const r = link.getBoundingClientRect(), h = pop.offsetHeight;
  const up = r.bottom + 12 + h > window.innerHeight - GUTTER && r.top - 12 - h > GUTTER;
  pop.classList.toggle('up', up);
  if (up) pop.style.top = `${r.top + window.scrollY - 12 - h}px`;
}

export function installPopovers() {
  // beforetoggle doesn't bubble; listen in the capture phase.
  document.addEventListener('beforetoggle', (e) => {
    const ev = e as ToggleEvent;
    if (ev.newState === 'open' && (ev.target as HTMLElement).matches('.why[popover]')) place(ev.target as HTMLElement);
  }, true);
  document.addEventListener('toggle', (e) => {
    const ev = e as ToggleEvent;
    if (ev.newState === 'open' && (ev.target as HTMLElement).matches('.why[popover]')) flip(ev.target as HTMLElement);
  }, true);
  window.addEventListener('resize', () => document.querySelectorAll<HTMLElement>('.why[popover]:popover-open').forEach((p) => { place(p); flip(p); }));
}
