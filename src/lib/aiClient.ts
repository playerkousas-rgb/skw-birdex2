import { RecognizeResult } from '../types';

const API_ENDPOINT = '/api/analyze';

// 開發模式下，若無後端，可啟用 Mock AI 測試 UI
const MOCK_MODE = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_AI;

const MOCK_SPECIES = [
  'Eurasian Tree Sparrow',
  'Light-vented Bulbul',
  'Red-whiskered Bulbul',
  "Swinhoe's White-eye",
  'Black-collared Starling',
  'Crested Myna',
  'Black Kite',
  'Spotted Dove',
  'Little Egret',
  'Black-crowned Night Heron',
  'Common Kingfisher',
  'Barn Swallow',
  'Red-billed Blue Magpie',
  'Japanese Tit',
  'Masked Laughingthrush',
];

function mockDelay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function analyzeImage(file: Blob | File): Promise<RecognizeResult[]> {
  if (MOCK_MODE) {
    await mockDelay(1500 + Math.random() * 1000);
    const idx = Math.floor(Math.random() * MOCK_SPECIES.length);
    const score = 0.7 + Math.random() * 0.28;
    return [{ label: MOCK_SPECIES[idx], score: Number(score.toFixed(3)) }];
  }

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'image/jpeg',
      'X-Media-Type': 'image',
    },
    body: file,
  });

  const text = await res.text();
  let payload: any = null;
  try { payload = JSON.parse(text); } catch { /* ignore */ }

  if (!res.ok) {
    throw new Error(payload?.error || payload?.details || `HTTP ${res.status}`);
  }

  const results: RecognizeResult[] = (payload?.results || []).map((r: any) => ({
    label: String(r.label || r.name || r.species || ''),
    score: Number(r.score ?? r.confidence ?? 0),
    scientific: r.scientific ? String(r.scientific) : undefined,
  }));

  return results.sort((a, b) => b.score - a.score);
}

export async function analyzeAudio(file: Blob | File): Promise<RecognizeResult[]> {
  if (MOCK_MODE) {
    await mockDelay(2000 + Math.random() * 1000);
    const idx = Math.floor(Math.random() * MOCK_SPECIES.length);
    const score = 0.6 + Math.random() * 0.35;
    return [{ label: MOCK_SPECIES[idx], score: Number(score.toFixed(3)) }];
  }

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'audio/wav',
      'X-Media-Type': 'audio',
    },
    body: file,
  });

  const text = await res.text();
  let payload: any = null;
  try { payload = JSON.parse(text); } catch { /* ignore */ }

  if (!res.ok) {
    throw new Error(payload?.error || payload?.details || `HTTP ${res.status}`);
  }

  const results: RecognizeResult[] = (payload?.results || []).map((r: any) => ({
    label: String(r.label || r.name || r.species || ''),
    score: Number(r.score ?? r.confidence ?? 0),
    scientific: r.scientific ? String(r.scientific) : undefined,
  }));

  return results.sort((a, b) => b.score - a.score);
}
