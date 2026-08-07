// ============================================================
// 遊戲音效與震動（WebAudio 合成，不需要任何音檔資源）
// 所有音效都是即時用 oscillator 合成，離線可用、零下載成本
// ============================================================

let ctx: AudioContext | null = null;
let sfxEnabled = true;

export function setSfxEnabled(v: boolean) {
  sfxEnabled = v;
}

/** 建立／喚醒 AudioContext（必須在使用者手勢後呼叫才能發聲） */
export function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* ignore */ });
    }
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  freq: number;
  endFreq?: number;
  start: number;   // 秒（相對目前時間）
  dur: number;     // 秒
  type?: OscillatorType;
  vol?: number;
}

function tone(c: AudioContext, opts: ToneOpts) {
  const { freq, endFreq, start, dur, type = 'sine', vol = 0.16 } = opts;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), t0);
  if (endFreq && endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + dur);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function notes(c: AudioContext, freqs: number[], opts: { gap?: number; dur?: number; type?: OscillatorType; vol?: number } = {}) {
  const { gap = 0.12, dur = 0.3, type = 'triangle', vol = 0.16 } = opts;
  freqs.forEach((f, i) => tone(c, { freq: f, start: i * gap, dur, type, vol }));
}

// ── 各種遊戲音效 ──

/** 丟球（快門） */
export function playThrow() {
  if (!sfxEnabled) return;
  const c = ensureAudio();
  if (!c) return;
  tone(c, { freq: 240, endFreq: 900, start: 0, dur: 0.18, type: 'triangle', vol: 0.12 });
}

/** 捕獲瞬間 GOTCHA！ */
export function playGotcha() {
  if (!sfxEnabled) return;
  const c = ensureAudio();
  if (!c) return;
  notes(c, [523.25, 659.25, 783.99, 1046.5], { gap: 0.07, dur: 0.22, type: 'square', vol: 0.09 });
}

/** 捕捉成功（卡片翻開） */
export function playSuccess() {
  if (!sfxEnabled) return;
  const c = ensureAudio();
  if (!c) return;
  notes(c, [523.25, 659.25, 783.99, 1046.5], { gap: 0.12, dur: 0.35, type: 'triangle', vol: 0.16 });
}

/** 色違出現！ */
export function playShiny() {
  if (!sfxEnabled) return;
  const c = ensureAudio();
  if (!c) return;
  notes(c, [659.25, 783.99, 987.77, 1318.51, 1567.98, 2093.0], { gap: 0.09, dur: 0.3, type: 'triangle', vol: 0.15 });
}

/** 捕捉失敗（逃走） */
export function playFail() {
  if (!sfxEnabled) return;
  const c = ensureAudio();
  if (!c) return;
  tone(c, { freq: 300, endFreq: 110, start: 0, dur: 0.45, type: 'sawtooth', vol: 0.1 });
  tone(c, { freq: 200, endFreq: 70, start: 0.05, dur: 0.5, type: 'square', vol: 0.07 });
}

/** 升級號角 */
export function playLevelUp() {
  if (!sfxEnabled) return;
  const c = ensureAudio();
  if (!c) return;
  notes(c, [392, 523.25, 659.25, 783.99, 1046.5], { gap: 0.11, dur: 0.4, type: 'square', vol: 0.11 });
}

/** 手機震動（Android 支援；iOS 需使用者允許 Haptics） */
export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch { /* ignore */ }
}
