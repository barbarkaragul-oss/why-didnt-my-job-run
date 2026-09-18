/**
 * Builds the two things this repository ships, both committed so that nobody has to build them:
 *   docs/          the static site (GitHub Pages): src/ui/main.ts bundled with the engine and the
 *                  example payloads, plus index.html and style.css
 *   dist/cli.js    the command line version (package.json "bin"): src/cli.ts bundled with the engine,
 *                  GitHub's @actions packages and the payloads into one file that needs only Node
 *
 * The CLI bundle is committed rather than built on install because `npx github:owner/repo` then only
 * downloads the repository: no dependency, dev or not, is installed, and nothing is compiled on the
 * user's machine. CI checks that both outputs match the source.
 *
 *   npm run bundle           one build of both
 *   npm run dev              rebuild the site on change
 */
import { build, context, type BuildOptions } from 'esbuild';
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

// Not minified: whoever runs it through npx can read what they run, and a change to the engine shows
// up as a readable diff. The shebang comes from src/cli.ts.
const cliOptions: BuildOptions = {
  entryPoints: ['src/cli.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: path.resolve('dist', 'cli.js'),
  loader: { '.json': 'json' },
  // The yaml package (used by @actions/workflow-parser) is CommonJS and calls require('process'); an ES
  // module has no require, so give the bundle one.
  banner: { js: "import { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);" },
  legalComments: 'eof',
  logLevel: 'info',
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
  // No chmod +x: npm sets the executable bit when it links the bin, and a mode set here would show up as a change
  // in CI's "built files must be committed" check on Linux, since a commit from Windows records 644.
  await build(cliOptions);
  const kb = (file: string) => (statSync(file).size / 1024).toFixed(0);
  console.log(`docs/app.js ${kb(path.join(out, 'app.js'))} KB, docs/index.html, docs/style.css; dist/cli.js ${kb(cliOptions.outfile!)} KB`);
}
