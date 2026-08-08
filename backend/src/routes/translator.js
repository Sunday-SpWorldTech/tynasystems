import express from 'express';

const router = express.Router();
const AZURE_DEFAULT_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';
const MAX_ITEMS = 100;
const MAX_TEXT_LENGTH = 5000;
const cache = new Map();

function config() {
  return {
    key: String(process.env.AZURE_TRANSLATOR_KEY || '').trim(),
    region: String(process.env.AZURE_TRANSLATOR_REGION || '').trim(),
    endpoint: String(process.env.AZURE_TRANSLATOR_ENDPOINT || AZURE_DEFAULT_ENDPOINT).trim().replace(/\/$/, '')
  };
}

function headers() {
  const { key, region } = config();
  const value = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Ocp-Apim-Subscription-Key': key
  };
  if (region) value['Ocp-Apim-Subscription-Region'] = region;
  return value;
}

router.get('/languages', async (_req, res) => {
  try {
    const { endpoint } = config();
    const response = await fetch(`${endpoint}/languages?api-version=3.0&scope=translation`);
    if (!response.ok) throw new Error(`Azure languages request failed (${response.status})`);
    const payload = await response.json();
    res.json({ ok: true, translation: payload.translation || {} });
  } catch (error) {
    res.status(502).json({ ok: false, message: error.message });
  }
});

router.post('/translate', async (req, res) => {
  try {
    const { key, endpoint } = config();
    if (!key) return res.status(503).json({ ok: false, message: 'Azure Translator is not configured.' });

    const to = String(req.body?.to || '').trim();
    const from = String(req.body?.from || '').trim();
    const rawTexts = Array.isArray(req.body?.texts) ? req.body.texts : [];
    const texts = rawTexts.slice(0, MAX_ITEMS).map(value => String(value || '').slice(0, MAX_TEXT_LENGTH));
    if (!to || !texts.length) return res.status(400).json({ ok: false, message: 'Target language and text are required.' });

    const results = new Array(texts.length);
    const missing = [];
    const missingIndexes = [];
    texts.forEach((text, index) => {
      const cacheKey = `${from || 'auto'}|${to}|${text}`;
      if (cache.has(cacheKey)) results[index] = cache.get(cacheKey);
      else { missing.push(text); missingIndexes.push(index); }
    });

    if (missing.length) {
      const params = new URLSearchParams({ 'api-version': '3.0', to });
      if (from) params.set('from', from);
      const response = await fetch(`${endpoint}/translate?${params.toString()}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(missing.map(Text => ({ Text })))
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error?.message || `Azure translation failed (${response.status})`;
        return res.status(response.status).json({ ok: false, message });
      }
      payload.forEach((item, position) => {
        const translated = item?.translations?.[0]?.text ?? missing[position];
        const index = missingIndexes[position];
        results[index] = translated;
        cache.set(`${from || 'auto'}|${to}|${missing[position]}`, translated);
      });
      if (cache.size > 5000) cache.clear();
    }

    res.json({ ok: true, to, translations: results });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || 'Translation failed.' });
  }
});

export default router;
