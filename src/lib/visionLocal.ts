// ============================================================
// 本機畫面品質檢查（不做辨識，只判斷「畫面是否有有效拍攝目標」）
// 目的：在送 AI 之前先擋掉 —— 全黑（沒對準/蓋住鏡頭）、過曝全白、
//       以及整張幾乎同一個顏色（對著牆/天空/桌面）的無效畫面。
// 因為 AI 鳥類模型只會「挑最像的鳥」，不會說「沒有鳥」，
// 所以必須靠這一層讓「影不到鳥」真正變成捕捉失敗（鳥兒逃走）。
// ============================================================

export interface QualityResult {
  ok: boolean;
  reason?: string;
  brightness: number;
  variance: number;
}

export async function checkImageQuality(file: Blob | File): Promise<QualityResult> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const SIZE = 64;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // 無法檢查時，保守放行（交給 AI）
      return { ok: true, brightness: 128, variance: 9999 };
    }

    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

    // 計算每個像素的灰階值，求平均亮度與變異數（標準差²）
    const grays: number[] = [];
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const g = (data[i] + data[i + 1] + data[i + 2]) / 3;
      grays.push(g);
      sum += g;
    }
    const mean = sum / grays.length;
    let varSum = 0;
    for (const g of grays) varSum += (g - mean) * (g - mean);
    const variance = varSum / grays.length;
    const stdDev = Math.sqrt(variance);

    // --- 判定規則 ---
    // 1) 太暗（全黑 / 蓋住鏡頭 / 沒對準）—— 放寬到 16，避免夜拍/逆光的真鳥被誤殺
    if (mean < 16) {
      return { ok: false, reason: '畫面太暗', brightness: mean, variance };
    }
    // 2) 太亮（過曝 / 直接對住光源）
    if (mean > 246) {
      return { ok: false, reason: '畫面過曝', brightness: mean, variance };
    }
    // 3) 畫面太單調（整張幾乎同一個顏色：純色牆 / 天空 / 桌面 / 純色卡）
    //    標準差越小代表越「平」，沒有可辨識主體。放寬到 8，避免淺色背景的小鳥被誤殺。
    if (stdDev < 8) {
      return { ok: false, reason: '畫面太單調，沒有清晰目標', brightness: mean, variance };
    }

    return { ok: true, brightness: mean, variance };
  } finally {
    URL.revokeObjectURL(url);
  }
}
