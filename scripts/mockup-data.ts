// Loads the mockup's ERA, CO and HIST objects (and its pure card functions) by
// evaluating its script in a sandbox. Used by the seed and reconcile scripts.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function loadMockup(path = new URL('../mockup/hopeboard.html', import.meta.url)) {
  const html = readFileSync(path, 'utf8');
  const script = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>'));
  const body = script.slice(0, script.indexOf("document.querySelectorAll('.toggle button[data-era]')"));
  const ctx: any = {};
  vm.runInNewContext(body.replace(/^var (ERA|CO|HIST) =/gm, 'this.$1 =').replace(/^function (\w+)/gm, 'this.$1 = function $1'), ctx);
  return ctx as { ERA: any; CO: any[]; HIST: any[]; cardNow: Function; cardPast: Function; tf: Function };
}
