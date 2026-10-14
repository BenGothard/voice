/**
 * Build the GitHub Pages static demo.
 * Bundles src/browser/entry.ts (engine + mock data) into pages/bundle.js
 * and copies the Pages UI (pages/index.html, app.js, styles.css) into place.
 * Run: npm run build:pages
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const pagesDir = path.join(root, 'pages');

fs.mkdirSync(pagesDir, { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/browser/entry.ts')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'TPAAgent',
  outfile: path.join(pagesDir, 'bundle.js'),
  minify: false,
  sourcemap: false,
  target: ['es2022'],
});

// Ensure .nojekyll so GitHub Pages serves files starting with _ correctly
fs.writeFileSync(path.join(pagesDir, '.nojekyll'), '');

console.log('Built pages/bundle.js for GitHub Pages');
console.log('Pages site is in pages/ — index.html + app.js + styles.css + bundle.js');
