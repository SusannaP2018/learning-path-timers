import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache catalog in memory so subsequent searches are instant
let catalogCache = null;

async function getFullCatalog() {
  if (catalogCache) return catalogCache;
  console.log('Fetching Microsoft Learn Catalog API (this may take a couple of seconds)...');
  
  // The catalog endpoint provides all official learning paths and modules
  const res = await fetch('https://learn.microsoft.com/api/catalog/');
  if (!res.ok) throw new Error(`MS Learn API returned ${res.status}`);
  
  catalogCache = await res.json();
  return catalogCache;
}

// Helper to extract the trailing slug from an MS Learn URL or UID
function extractSlug(str) {
  if (!str) return '';
  const cleaned = str.trim().toLowerCase().split('?')[0].replace(/\/+$/, '');
  const segments = cleaned.split('/');
  return segments[segments.length - 1]; // Grabs just the final segment
}

app.post('/api/fetch-path', async (req, res) => {
  try {
    let { url, bufferPercent = 30 } = req.body;
    if (!url) return res.status(400).json({ error: 'URL or slug is required' });

    const targetSlug = extractSlug(url);

    const catalog = await getFullCatalog();
    const { learningPaths, modules: allModules } = catalog;

    // 1. Tiered exact matching:
    // Priority 1: Exact match on the final slug in the URL
    // Priority 2: Exact match on the last segment of the UID (e.g. "learn.wwl.github-advanced-security")
    // Priority 3: Fallback exact UID
    const pathRecord = learningPaths.find(p => {
      const pSlug = extractSlug(p.url);
      const uidLastPart = (p.uid || '').toLowerCase().split('.').pop();
      return pSlug === targetSlug || uidLastPart === targetSlug;
    }) || learningPaths.find(p => (p.uid || '').toLowerCase() === targetSlug);

    if (!pathRecord) {
      return res.status(404).json({ 
        error: `Could not find an exact learning path match for slug: "${targetSlug}"` 
      });
    }

    // Build a quick lookup map for modules by UID
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
        baseMinutes: baseMinutes,
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
app.listen(PORT, () => {
  console.log(`Timer app running at http://localhost:${PORT}`);
});