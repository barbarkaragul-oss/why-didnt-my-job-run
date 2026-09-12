/**
 * Builds the static site into docs/ (GitHub Pages): bundles src/ui/main.ts with the engine and the
 * example payloads, copies index.html and style.css.
 *
 *   npm run build            one build
 *   npm run dev              rebuild on change
 */
import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';

const watch = process.argv.includes('--watch');
const out = path.resolve('docs');
mkdirSync(out, { recursive: true });

const options = {
  entryPoints: ['src/ui/main.ts'],
  bundle: true,
  format: 'esm' as const,
  platform: 'browser' as const,
  target: 'es2022',
  minify: !watch,
  sourcemap: watch ? ('inline' as const) : false,
  outfile: path.join(out, 'app.js'),
  loader: { '.json': 'json' as const },
  logLevel: 'info' as const,
};

function copyStatic() {
  copyFileSync('src/ui/index.html', path.join(out, 'index.html'));
  copyFileSync('src/ui/style.css', path.join(out, 'style.css'));
  writeFileSync(path.join(out, '.nojekyll'), '');
}

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  copyStatic();
  console.log('watching src/ui and src/engine; docs/ is the output');
} else {
  await build(options);
  copyStatic();
  const kb = (statSync(path.join(out, 'app.js')).size / 1024).toFixed(0);
  console.log(`docs/app.js ${kb} KB, docs/index.html, docs/style.css`);
}
