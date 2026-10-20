// Pages written as markdown (data/pages/*.md): "# Title", then "## Heading" sections of paragraphs separated by blank
// lines, or a list of "- " lines. HTML comments are notes for whoever edits the file and never shown.

export interface Page { title: string; lead?: string; sections: { h: string; p: string[] }[] }

export function parsePage(md: string): Page {
  const text = md.replace(/<!--[\s\S]*?-->/g, '');
  const title = /^# (.+)$/m.exec(text)?.[1].trim() ?? '';
  const sections: Page['sections'] = [];
  const blocks = text.split(/^## /m);
  // paragraphs before the first heading open the page, with no heading of their own
  const intro = blocks[0].replace(/^# .+$/m, '');
  for (const block of [`\n${intro}`, ...blocks.slice(1)]) {
    const [h, ...rest] = block.split('\n');
    // a block of "- " lines is a list and keeps its lines; any other block is one paragraph
    const p = rest.join('\n').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
      .map((x) => (/^- /.test(x) ? x.split('\n').map((l) => l.trim()).join('\n') : x.replace(/\s*\n\s*/g, ' ')));
    if (h.trim() || p.length) sections.push({ h: h.trim(), p });
  }
  return { title, sections };
}
