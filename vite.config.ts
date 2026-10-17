import { defineConfig, type Plugin } from 'vite';
import type { CardsFile } from './src/types';

/** Production builds drop the writers' notes from data/cards.json. */
function stripNotes(): Plugin {
  let build = false;
  return {
    name: 'hopeboard-strip-notes',
    enforce: 'pre',
    configResolved(c) { build = c.command === 'build'; },
    transform(code, id) {
      if (!build || !id.endsWith('/data/cards.json')) return;
      const file: CardsFile = JSON.parse(code);
      return { code: JSON.stringify({ entries: file.entries.map(({ notes: _notes, ...e }) => e) }), map: null };
    },
  };
}

export default defineConfig({
  plugins: [stripNotes()],
  test: { include: ['test/**/*.test.ts'] },
} as any);
