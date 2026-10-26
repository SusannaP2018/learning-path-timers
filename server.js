import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let catalogCache = null;

async function getFullCatalog() {
  if (catalogCache) return catalogCache;
  console.log('Fetching Microsoft Learn Catalog API...');
  const res = await fetch('https://learn.microsoft.com/api/catalog/');
  if (!res.ok) throw new Error(`MS Learn API returned ${res.status}`);
  catalogCache = await res.json();
  return catalogCache;
}

// 1. Lightweight endpoint returning all available learning paths for the dropdown
app.get('/api/paths', async (req, res) => {
  try {
    const catalog = await getFullCatalog();
    // Return only what's needed for the selector to keep it tiny (<200KB)
    const simplifiedPaths = (catalog.learningPaths || []).map(p => ({
      uid: p.uid,
      title: p.title
    })).sort((a, b) => a.title.localeCompare(b.title));

    res.json(simplifiedPaths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function extractSlug(str) {
  if (!str) return '';
  const cleaned = str.trim().toLowerCase().split('?')[0].replace(/\/+$/, '');
  const segments = cleaned.split('/');
  return segments[segments.length - 1];
}

// 2. Load path by either direct UID or URL
app.post('/api/fetch-path', async (req, res) => {
  try {
    let { identifier, bufferPercent = 30 } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Path identifier or URL required' });

    const catalog = await getFullCatalog();
    const { learningPaths, modules: allModules } = catalog;

    // Check if identifier is exact UID first, or match by URL slug
    const targetSlug = extractSlug(identifier);
    const pathRecord = learningPaths.find(p => p.uid === identifier) ||
      learningPaths.find(p => {
        const pSlug = extractSlug(p.url);
        const uidLastPart = (p.uid || '').toLowerCase().split('.').pop();
        return pSlug === targetSlug || uidLastPart === targetSlug;
      });

    if (!pathRecord) {
      return res.status(404).json({ error: `Path not found for: "${identifier}"` });
    }

    const moduleMap = new Map(allModules.map(m => [m.uid, m]));
    const bufferMultiplier = 1 + (Number(bufferPercent) / 100);
    const parsedModules = [];

    (pathRecord.modules || []).forEach((modUid, i) => {
      const modData = moduleMap.get(modUid);
      if (!modData) return;

      const baseMinutes = Number(modData.duration_in_minutes) || 10;
      const bufferedMinutes = Math.round(baseMinutes * bufferMultiplier);

      parsedModules.push({
        id: `mod-${i}-${Date.now()}`,
        title: modData.title,
        baseMinutes,
        targetMinutes: bufferedMinutes,
        totalSeconds: bufferedMinutes * 60,
        remainingSeconds: bufferedMinutes * 60,
        status: 'idle',
        targetTimestamp: null,
        url: modData.url
      });
    });

    res.json({
      title: pathRecord.title,
      summary: pathRecord.summary,
      modules: parsedModules
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Timer running: http://localhost:${PORT}`));