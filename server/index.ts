import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoutes } from '../src/api/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const app = express();
app.use(express.json({ limit: '1mb' }));

// API
registerRoutes(app);

// Static frontend
app.use(express.static(path.join(root, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(root, 'public', 'index.html'));
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`\n  TPA Voice Agent MVP running`);
  console.log(`  → Open http://localhost:${PORT} in your browser`);
  console.log(`  → Demo member: MBR1001  DOB 1985-03-14  ZIP 85004`);
  console.log(`  → No API keys needed — mock TPA data.\n`);
});
