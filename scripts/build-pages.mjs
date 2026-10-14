/**
 * Build the GitHub Pages static demo.
 * GitHub Pages branch deployment only allows / (root) or /docs — NOT /pages.
 * So the Pages site lives in docs/ (index.html + app.js + styles.css + bundle.js).
 * We also copy to pages/ for local reference.
 * Run: npm run build:pages
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const pagesDir = path.join(root, 'pages');

fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(pagesDir, { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/browser/entry.ts')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'TPAAgent',
  outfile: path.join(docsDir, 'bundle.js'),
  minify: false,
  sourcemap: false,
  target: ['es2022'],
});

// Copy bundle to pages/ too for local reference
fs.copyFileSync(path.join(docsDir, 'bundle.js'), path.join(pagesDir, 'bundle.js'));

// Ensure .nojekyll in both
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
fs.writeFileSync(path.join(pagesDir, '.nojekyll'), '');

console.log('Built docs/bundle.js for GitHub Pages (Pages source must be /docs)');
console.log('Pages site is in docs/ — index.html + app.js + styles.css + bundle.js');
