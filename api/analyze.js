// api/analyze.js
// ============================================================
// AvianDex v1.4 統一辨識代理 (Vercel Serverless Function)
// ============================================================
// 引擎優先順序：
//   1) 圖片：Hugging Face → Nyckel（備援）
//   2) 聲音：Hugging Face BirdSet → BirdNET Space（備援）
//
// 環境變數（請在 Vercel → Settings → Environment Variables 設定）：
//   HF_TOKEN              （免費，至 https://huggingface.co/settings/tokens 取得）
//   NYCKEL_CLIENT_ID      （備援，可空）
//   NYCKEL_CLIENT_SECRET  （備援，可空）
//   BIRDNET_SPACE_URL     （可選，自架 BirdNET Gradio Space）
//
// ⚠️ Vercel 上的環境變數：
//   - 名稱完全相同（區分大小寫）
//   - 不要加 VITE_ 前綴
//   - Production / Preview / Development 三個環境都勾選
//   - 設定後務必 redeploy
// ============================================================

import FormData from 'form-data';
import fetch from 'node-fetch';

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
  try { json = JSON.parse(text); }
  catch { throw new Error(`HF 回傳非 JSON：${text.slice(0, 200)}`); }
  return normalizeResults(json);
}

async function identifyImageWithHF(buffer, contentType) {
  return hfClassify(buffer, contentType || 'image/jpeg', 'dennisjooo/Birds-Classifier-EfficientNetB2');
}

async function identifyAudioWithHF(buffer, contentType) {
  return hfClassify(buffer, contentType || 'audio/wav', 'DBD-research-group/ConvNeXT-Base-BirdSet-XCL');
}

async function identifyImageWithNyckel(buffer, contentType) {
  const clientId = process.env.NYCKEL_CLIENT_ID;
  const clientSecret = process.env.NYCKEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Nyckel 金鑰未設定 (NYCKEL_CLIENT_ID / NYCKEL_CLIENT_SECRET)');
  }
  const tokenRes = await fetch('https://www.nyckel.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    throw new Error(`Nyckel token 取得失敗 (${tokenRes.status})：${t.slice(0, 200)}`);
  }
  const { access_token } = await tokenRes.json();
  const form = new FormData();
  form.append('data', buffer, {
    filename: 'bird.jpg',
    contentType: contentType || 'image/jpeg',
  });
  const invokeRes = await fetch(
    'https://www.nyckel.com/v1/functions/bird-identifier/invoke',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, ...form.getHeaders() },
      body: form,
    },
  );
  const text = await invokeRes.text();
  if (!invokeRes.ok) throw new Error(`Nyckel 辨識失敗 (${invokeRes.status})：${text.slice(0, 200)}`);
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!json) throw new Error('Nyckel 回傳非 JSON');
  if (json.labelName) {
    return normalizeResults([{ label: json.labelName, score: json.confidence ?? 0.9 }]);
  }
  if (Array.isArray(json.labels)) {
    return normalizeResults(json.labels.map((l) => ({ label: l.name || l.labelName, score: l.confidence })));
  }
  return [];
}

async function identifyAudioWithBirdNetSpace(buffer, contentType) {
  const spaceBase = process.env.BIRDNET_SPACE_URL;
  if (!spaceBase) throw new Error('BIRDNET_SPACE_URL 未設定（備援聲音引擎）');
  const form = new FormData();
  const ext = contentType?.includes('mp3') ? 'mp3'
            : contentType?.includes('webm') ? 'webm'
            : contentType?.includes('ogg') ? 'ogg'
            : 'wav';
  form.append('audio', buffer, {
    filename: `clip.${ext}`,
    contentType: contentType || 'audio/wav',
  });
  const res = await fetch(`${spaceBase}/api/predict`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`BirdNET Space ${res.status}：${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  const raw = json?.data?.[0];
  let arr = [];
  if (typeof raw === 'string') {
    arr = raw.split(/[,\n]/).map((s) => {
      const [label, score] = s.split(/[;:\t]/);
      return { label: (label || '').trim(), score: parseFloat(score) || 0 };
    });
  } else if (raw?.confidences) {
    arr = raw.confidences.map((c) => ({ label: c.label, score: c.confidence }));
  }
  return normalizeResults(arr);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Media-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 健康檢查：GET /api/analyze
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      version: 'v1.4.0',
      service: 'AvianDex AI Recognition',
      engines: {
        huggingface: !!process.env.HF_TOKEN,
        nyckel: !!(process.env.NYCKEL_CLIENT_ID && process.env.NYCKEL_CLIENT_SECRET),
        birdnetSpace: !!process.env.BIRDNET_SPACE_URL,
        ebird: !!process.env.EBIRD_API_KEY,
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '請使用 POST 請求' });
  }

  try {
    const buffer = await getRawBody(req);
    if (buffer.length === 0) return res.status(400).json({ error: '接收到的檔案為空' });

    const contentType = req.headers['content-type'] || '';
    const explicit = (req.headers['x-media-type'] || '').toLowerCase();
    const mediaType = explicit || detectMediaType(buffer, contentType);

    console.log(`[analyze] ${(buffer.length / 1024).toFixed(1)}KB · type=${mediaType} · ct=${contentType}`);

    let results = [];
    const errors = [];
    let usedEngine = '';

    if (mediaType === 'image') {
      try {
        results = await identifyImageWithHF(buffer, contentType);
        if (results.length > 0) usedEngine = 'huggingface';
      } catch (e) {
        errors.push(`HF: ${e.message}`);
      }
      if (results.length === 0) {
        try {
          results = await identifyImageWithNyckel(buffer, contentType);
          if (results.length > 0) usedEngine = 'nyckel';
        } catch (e) {
          errors.push(`Nyckel: ${e.message}`);
        }
      }
    } else if (mediaType === 'audio') {
      try {
        results = await identifyAudioWithHF(buffer, contentType);
        if (results.length > 0) usedEngine = 'huggingface';
      } catch (e) {
        errors.push(`HF: ${e.message}`);
      }
      if (results.length === 0 && process.env.BIRDNET_SPACE_URL) {
        try {
          results = await identifyAudioWithBirdNetSpace(buffer, contentType);
          if (results.length > 0) usedEngine = 'birdnetSpace';
        } catch (e) {
          errors.push(`BirdNET Space: ${e.message}`);
        }
      }
    } else {
      return res.status(415).json({ error: '無法判斷檔案類型，請上傳音訊或圖片。' });
    }

    if (results.length === 0) {
      return res.status(502).json({
        error: '所有辨識引擎都失敗',
        details: errors.join(' | ') || '無詳細錯誤',
        hint: '請至 /api/analyze (GET) 檢查環境變數設定狀態',
      });
    }

    return res.status(200).json({
      mediaType,
      engine: usedEngine,
      results,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[analyze] 錯誤:', error);
    return res.status(500).json({
      error: '辨識失敗',
      details: error.message,
    });
  }
}
