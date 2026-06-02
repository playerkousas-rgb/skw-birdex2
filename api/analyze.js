// ============================================================
// BIRD-DEX AI Recognition API (Vercel Serverless Function)
// 移植自 AvianDex v1.4，精簡為 Hugging Face 主引擎
// ============================================================
// 環境變數：HF_TOKEN （於 Vercel Dashboard → Environment Variables 設定）
// ============================================================

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function detectMediaType(buffer, contentTypeHeader = '') {
  const ct = (contentTypeHeader || '').toLowerCase();
  if (ct.startsWith('audio/')) return 'audio';
  if (ct.startsWith('image/')) return 'image';
  if (buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image';
    if (buffer.slice(0, 3).toString() === 'GIF') return 'image';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WAVE') return 'audio';
    if (buffer.slice(0, 3).toString() === 'ID3') return 'audio';
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'audio';
    if (buffer.slice(0, 4).toString() === 'OggS') return 'audio';
    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return 'audio';
  }
  return 'unknown';
}

function normalizeResults(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((c) => ({
      label: String(c.label || c.name || c.species || '').trim(),
      score: Number(c.score ?? c.confidence ?? 0),
      scientific: c.scientific ? String(c.scientific) : undefined,
    }))
    .filter((c) => c.label)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function hfClassify(buffer, contentType, modelId) {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error('HF_TOKEN 未設定');

  const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  });

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error(`Hugging Face 模型正在載入中（${modelId}），請 20 秒後重試一次。`);
    }
    throw new Error(`HF API ${res.status}：${text.slice(0, 200)}`);
  }

  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`HF 回傳非 JSON：${text.slice(0, 200)}`); }
  return normalizeResults(json);
}

async function identifyImageWithHF(buffer, contentType) {
  return hfClassify(buffer, contentType || 'image/jpeg', 'dennisjooo/Birds-Classifier-EfficientNetB2');
}

async function identifyAudioWithHF(buffer, contentType) {
  return hfClassify(buffer, contentType || 'audio/wav', 'DBD-research-group/ConvNeXT-Base-BirdSet-XCL');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Media-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      version: 'bd-2.0.0',
      service: 'BIRD-DEX AI Recognition',
      engines: {
        huggingface: !!process.env.HF_TOKEN,
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buffer = await getRawBody(req);
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: '請提供圖片或聲音檔案' });
    }

    const ct = req.headers['content-type'] || '';
    const mediaTypeOverride = req.headers['x-media-type'] || '';
    const detected = detectMediaType(buffer, ct);
    const mode = mediaTypeOverride || detected;

    if (mode !== 'image' && mode !== 'audio') {
      return res.status(400).json({ error: '無法辨識媒體格式，請上傳圖片（JPEG/PNG）或聲音（WAV/MP3）' });
    }

    let results = [];
    if (mode === 'image') {
      results = await identifyImageWithHF(buffer, ct);
    } else {
      results = await identifyAudioWithHF(buffer, ct);
    }

    return res.status(200).json({
      ok: true,
      mode,
      results,
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({
      error: err.message || '伺服器內部錯誤',
      details: err.stack ? err.stack.split('\n').slice(0, 3) : undefined,
    });
  }
}
