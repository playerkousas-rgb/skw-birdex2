import { RecognizeResult } from '../types';
import { checkImageQuality } from './visionLocal';

// ============================================================
// BIRD-DEX 2 辨識客戶端
// 流程：
//   1) 先做「畫面品質檢查」（全黑 / 全白 / 純色 / 過曝 → 直接判定失敗）
//      —— 因為 AI 模型只會「在已知鳥種裡挑最像的」，不會說「這裡沒鳥」，
//         所以必須在送 AI 前先擋掉明顯不是鳥的畫面。
//   2) 通過檢查才送去真正的 AI 後端 /api/analyze（Hugging Face 鳥類辨識）
//   3) 回傳候選清單（含真實信心度），由前端判斷最高是否 ≥ 0.7
// ============================================================

export async function analyzeImage(file: Blob | File): Promise<RecognizeResult[]> {
  // --- 步驟 1：本機畫面品質檢查（全黑 / 過曝 / 純色 = 沒有有效目標）---
  const quality = await checkImageQuality(file);
  if (!quality.ok) {
    // 回傳一個「無效目標」結果，讓上層判定為捕捉失敗（鳥兒逃走）
    return [{ label: 'Unknown Object', score: 0 }];
  }

  // --- 步驟 2：送真 AI 後端辨識 ---
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': (file as any).type || 'image/jpeg',
      'X-Media-Type': 'image',
    },
    body: file,
  });

  const text = await response.text();
  let payload: any = null;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`伺服器回傳非預期內容：${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(payload?.details || payload?.error || `辨識服務錯誤 (HTTP ${response.status})`);
  }

  const results: RecognizeResult[] = Array.isArray(payload?.results)
    ? payload.results.map((r: any) => ({
        label: String(r.label || '').trim(),
        score: Number(r.score ?? 0),
        scientific: r.scientific || r.scientificName || undefined,
      }))
    : [];

  return results;
}

export async function analyzeAudio(_file: Blob | File): Promise<RecognizeResult[]> {
  throw new Error('聲音辨識功能目前已停用。');
}
