// Places a card's comment bubble under the link that opened it, kept inside the viewport.
// Popovers sit in the top layer, so absolute positions are page coordinates.

const GUTTER = 16;

function place(pop: HTMLElement) {
  const link = document.querySelector<HTMLElement>(`[popovertarget="${CSS.escape(pop.id)}"]`);
  if (!link) return;
  const r = link.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 2 * GUTTER);
  const left = Math.max(GUTTER, Math.min(r.left - 18, window.innerWidth - GUTTER - width));
  pop.style.left = `${left + window.scrollX}px`;
  pop.style.top = `${r.bottom + window.scrollY + 12}px`;
  pop.style.setProperty('--arrow', `${Math.max(12, r.left - left + 8)}px`);
}

export function installPopovers() {
  // beforetoggle doesn't bubble; listen in the capture phase.
  document.addEventListener('beforetoggle', (e) => {
    const ev = e as ToggleEvent;
    if (ev.newState === 'open' && (ev.target as HTMLElement).matches('.why[popover]')) place(ev.target as HTMLElement);
  }, true);
  window.addEventListener('resize', () => document.querySelectorAll<HTMLElement>('.why[popover]:popover-open').forEach(place));
}
