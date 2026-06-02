import { RecognizeResult } from '../types';
import { analyzeImageLocal } from './visionLocal';

export async function analyzeImage(file: Blob | File): Promise<RecognizeResult[]> {
  // 啟動純前端的本地辨識引擎 (免 Token、免後端、即拍即算)
  // 這會保證「同一張圖」永遠得出「同一個結果」，並帶有真實的信心度 %。
  return analyzeImageLocal(file);
}

export async function analyzeAudio(_file: Blob | File): Promise<RecognizeResult[]> {
  throw new Error('聲音辨識功能目前已停用。');
}
