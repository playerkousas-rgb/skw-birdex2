import { useRef, useState, useEffect, useCallback } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { analyzeImageDetailed } from '../lib/aiClient';
import { resolveBirdId } from '../data/nameAliases';
import { getBirdById } from '../data/birdData';
import { Camera, Zap, AlertTriangle } from 'lucide-react';
import { CaptureResult as CaptureResultType } from '../types';


interface ScannerScreenProps {
  onCapture: (result: CaptureResultType) => void;
  /** 分析中通知上層（可隱藏導覽列，避免辨識途中切頁） */
  onBusyChange?: (busy: boolean) => void;
}

type ScanPhase = 'idle' | 'starting' | 'active' | 'countdown' | 'snapping' | 'analyzing' | 'found' | 'missed' | 'candidate' | 'error';

const ANALYZE_TIMEOUT_MS = 60_000; // HF 冷啟動可能較慢，給 60 秒
const STORED_PHOTO_MAX_WIDTH = 480; // 存入 localStorage 的照片寬度上限
const DIGITAL_ZOOM_MAX = 5;          // 相機不支援硬體變焦時的數位變焦上限

// 辨識信心度門檻：
//   >= AUTO_CATCH   → 直接捕捉
//   >= MIN_CANDIDATE→ 顯示候選鳥讓使用者確認（避免誤捕）
const AUTO_CATCH_SCORE = 0.70;
const MIN_CANDIDATE_SCORE = 0.35;

// 本地畫質預檢（不浪費 API 次數）
const MIN_FRAME_BRIGHTNESS = 16;      // 平均亮度低於此 → 太暗
const MIN_FRAME_SHARPNESS = 10;       // 銳利度低於此 → 太模糊（鏡頭遮住等）

interface ZoomCapability {
  min: number;
  max: number;
  step: number;
}

interface Candidate {
  speciesId: number;
  label: string;
  score: number;
}

export function ScannerScreen({ onCapture, onBusyChange }: ScannerScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const analyzingIntervalRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bestFrameRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [analyzingText, setAnalyzingText] = useState('初始化影像...');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const { captureBird } = useCollectionContext();

  // ── 變焦狀態 ──
  // zoomCap 存在 = 相機硬體變焦（品質最好）；否則用數位變焦（canvas 裁切）
  const [zoomCap, setZoomCap] = useState<ZoomCapability | null>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const maxZoom = zoomCap ? zoomCap.max : DIGITAL_ZOOM_MAX;
  const zoomStep = zoomCap?.step ?? 0.1;

  /** 套用變焦：硬體 → track.applyConstraints；數位 → CSS scale（capture 時會同步裁切） */
  const applyZoom = useCallback((z: number) => {
    const clamped = Math.min(maxZoom, Math.max(1, z));
    zoomRef.current = clamped;
    setZoom(clamped);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && zoomCap) {
      // 相機硬體變焦
      const snapped = Math.round(clamped / zoomStep) * zoomStep;
      track.applyConstraints({
        advanced: [{ zoom: Math.min(zoomCap.max, Math.max(zoomCap.min, snapped)) }],
      } as unknown as MediaTrackConstraints).catch(() => { /* 部分裝置會拒絕即時變焦，忽略 */ });
    } else if (videoRef.current) {
      // 數位變焦：CSS 縮放預覽（container overflow-hidden 會裁切）
      videoRef.current.style.transform = `scale(${clamped})`;
    }
  }, [zoomCap, maxZoom, zoomStep]);

  const resetZoom = useCallback(() => applyZoom(1), [applyZoom]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    // 先停掉舊串流，避免重試後相機燈一直亮著（舊串流洩漏）
    stopCamera();
    setPhase('starting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!mountedRef.current) {
        // 元件已卸載，立即釋放
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;

      // 偵測相機是否支援硬體變焦（zoom 是非標準擴展屬性，需斷言型別）
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities ? (track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } }) : {};
      const z = caps?.zoom;
      if (z && typeof z.max === 'number' && z.max > 1.001) {
        setZoomCap({ min: z.min ?? 1, max: z.max, step: z.step ?? 0.1 });
      } else {
        setZoomCap(null);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // 數位變焦時重設 transform（防止上次殘留）
        videoRef.current.style.transform = zoomRef.current > 1 && !(z && z.max > 1.001)
          ? `scale(${zoomRef.current})`
          : 'none';
        await videoRef.current.play();
        setPhase('active');
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      setPhase('error');
      setErrorMsg(e.name === 'NotAllowedError' ? '相機權限被拒絕，請在瀏覽器設定中允許相機。' : `無法啟動相機：${e.message}`);
    }
  }, [stopCamera]);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      // 取消進行中的辨識請求
      abortRef.current?.abort();
      if (analyzingIntervalRef.current) clearInterval(analyzingIntervalRef.current);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ── 捏合變焦手勢（兩指）──
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      pinchRef.current = { dist: d, zoom: zoomRef.current };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    const next = pinchRef.current.zoom * (d / pinchRef.current.dist);
    applyZoom(next);
  };

  const onTouchEnd = () => { pinchRef.current = null; };

  /** 把目前鏡頭畫面（含數位變焦裁切）畫到新 canvas */
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video) return null;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const z = zoomCap ? 1 : zoomRef.current; // 硬體變焦時影片本身已放大
    const out = document.createElement('canvas');
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    if (z > 1.001) {
      const cropW = vw / z;
      const cropH = vh / z;
      out.width = Math.round(vw / z);
      out.height = Math.round(vh / z);
      ctx.drawImage(video, (vw - cropW) / 2, (vh - cropH) / 2, cropW, cropH, 0, 0, out.width, out.height);
    } else {
      out.width = vw;
      out.height = vh;
      ctx.drawImage(video, 0, 0, vw, vh);
    }
    return out;
  }, [zoomCap]);

  /** 銳利度評估：縮小後算相鄰像素亮度差（SAD），越高越清晰 */
  function frameSharpness(source: HTMLCanvasElement): number {
    const W = 96, H = 72;
    const small = document.createElement('canvas');
    small.width = W;
    small.height = H;
    const ctx = small.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;
    ctx.drawImage(source, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    let sum = 0, count = 0;
    for (let y = 1; y < H; y++) {
      for (let x = 1; x < W; x++) {
        const i = (y * W + x) * 4;
        const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const iu = ((y - 1) * W + x) * 4;
        const lu = 0.299 * data[iu] + 0.587 * data[iu + 1] + 0.114 * data[iu + 2];
        const il = (y * W + x - 1) * 4;
        const ll = 0.299 * data[il] + 0.587 * data[il + 1] + 0.114 * data[il + 2];
        sum += (l - lu) * (l - lu) + (l - ll) * (l - ll);
        count += 2;
      }
    }
    return count ? sum / count : 0;
  }

  /** 平均亮度 0~255 */
  function frameBrightness(source: HTMLCanvasElement): number {
    const W = 96, H = 72;
    const small = document.createElement('canvas');
    small.width = W;
    small.height = H;
    const ctx = small.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 255;
    ctx.drawImage(source, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] + data[i + 1] + data[i + 2];
    }
    return sum / (W * H * 3);
  }

  /** 把 canvas 縮到 maxWidth 以內，回傳壓縮後的 JPEG dataURL */
  function downscalePhoto(source: HTMLCanvasElement, maxWidth: number): string {
    const scale = Math.min(1, maxWidth / (source.width || maxWidth));
    const w = Math.max(1, Math.round((source.width || maxWidth) * scale));
    const h = Math.max(1, Math.round((source.height || maxWidth) * scale));
    const small = document.createElement('canvas');
    small.width = w;
    small.height = h;
    const sctx = small.getContext('2d');
    if (!sctx) return source.toDataURL('image/jpeg', 0.4);
    sctx.drawImage(source, 0, 0, w, h);
    return small.toDataURL('image/jpeg', 0.4);
  }

  /** 統一失敗出口 */
  const failCapture = useCallback((reason: string, kind: 'not-bird' | 'low-confidence' | 'not-in-dex' | 'escaped') => {
    onCapture({
      record: null,
      isNew: false,
      oldRarity: 'UC',
      newRarity: 'UC',
      xpGained: 0,
      species: null,
      failed: true,
      failReason: reason,
      failKind: kind,
    });
  }, [onCapture]);

  /** 候選鳥被選中 → 捕捉 */
  const chooseCandidate = useCallback((speciesId: number) => {
    const bird = getBirdById(speciesId);
    if (!bird) return;
    const photoDataUrl = bestFrameRef.current
      ? downscalePhoto(bestFrameRef.current, STORED_PHOTO_MAX_WIDTH)
      : undefined;
    const captureResult = captureBird(speciesId, { photoDataUrl });
    setCandidates([]);
    bestFrameRef.current = null;
    onCapture(captureResult);
  }, [captureBird, onCapture]);

  const snap = useCallback(async () => {
    if (!videoRef.current || phase !== 'active') return;

    // 快門閃光
    setPhase('snapping');
    await new Promise(r => setTimeout(r, 200));
    if (!mountedRef.current) return;

    // ── 連拍 3 張，自動選最清晰的一張（減少手震模糊失敗）──
    let best: HTMLCanvasElement | null = null;
    let bestSharp = -1;
    for (let i = 0; i < 3; i++) {
      const frame = captureFrame();
      if (frame) {
        const s = frameSharpness(frame);
        if (s > bestSharp) { bestSharp = s; best = frame; }
      }
      if (i < 2) await new Promise(r => setTimeout(r, 140));
      if (!mountedRef.current) return;
    }
    if (!best) {
      setPhase('error');
      setErrorMsg('無法讀取鏡頭畫面，請重試。');
      return;
    }
    bestFrameRef.current = best;

    // ── 本地畫質預檢（省 API 次數 + 即時回饋）──
    const brightness = frameBrightness(best);
    if (brightness < MIN_FRAME_BRIGHTNESS) {
      failCapture('畫面太暗，請走到光線充足的地方再試。', 'escaped');
      return;
    }
    if (bestSharp < MIN_FRAME_SHARPNESS) {
      failCapture('畫面太模糊，請穩住手機、擦一下鏡頭再試。', 'escaped');
      return;
    }

    setPhase('analyzing');
    onBusyChange?.(true);
    const texts = ['特徵提取...', '比對圖鑑資料庫...', '神經網路辨識...', '搜尋香港鳥種...', '信心度評估...'];
    let ti = 0;
    analyzingIntervalRef.current = window.setInterval(() => {
      setAnalyzingText(texts[ti % texts.length]);
      ti++;
    }, 600);

    // 逾時自動取消（避免 analyzing 畫面無限轉圈）
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

    const cleanup = () => {
      if (analyzingIntervalRef.current) { clearInterval(analyzingIntervalRef.current); analyzingIntervalRef.current = null; }
      clearTimeout(timeout);
      if (abortRef.current === controller) abortRef.current = null;
    };

    try {
      const blob = await new Promise<Blob | null>(res => best!.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('照片生成失敗');
      const data = await analyzeImageDetailed(blob, controller.signal);
      if (!mountedRef.current) return;
      cleanup();
      onBusyChange?.(false);

      const results = data.results || [];

      // 1) 後端 Bird Gate 判定不是鳥
      if (data.notBird) {
        const guess = data.topGuess ? `（看起來像「${data.topGuess}」）` : '';
        failCapture(`畫面中沒有偵測到鳥類${guess}，請對準鳥類再試。`, 'not-bird');
        return;
      }

      // 2) 完全沒有結果／信心度過低 → 逃走
      const scored = results.filter(r => r.label && r.label !== 'Unknown Object' && r.score > 0);
      if (!scored.length || scored[0].score < MIN_CANDIDATE_SCORE) {
        failCapture('辨識信心度不足，請靠近一點或在光線充足處再試。', 'escaped');
        return;
      }

      // 3) 高信心度 → 直接捕捉（top 依序嘗試，top-1 不在圖鑑就試 top-2/3）
      for (const r of scored) {
        if (r.score < AUTO_CATCH_SCORE) break; // 已排序，後面的更低
        const speciesId = resolveBirdId(r.label) ?? (r.scientific ? resolveBirdId(r.scientific) : undefined);
        if (speciesId) {
          const bird = getBirdById(speciesId);
          if (bird) {
            const photoDataUrl = bestFrameRef.current
              ? downscalePhoto(bestFrameRef.current, STORED_PHOTO_MAX_WIDTH)
              : undefined;
            const captureResult = captureBird(speciesId, { photoDataUrl });
            bestFrameRef.current = null;
            onCapture(captureResult);
            return;
          }
        }
      }

      // 4) 中等信心度 → 顯示候選鳥讓使用者確認（避免誤捕，也避免白白放走）
      const cand: Candidate[] = [];
      const seen = new Set<number>();
      for (const r of scored) {
        const speciesId = resolveBirdId(r.label) ?? (r.scientific ? resolveBirdId(r.scientific) : undefined);
        if (speciesId && !seen.has(speciesId)) {
          seen.add(speciesId);
          cand.push({ speciesId, label: r.label, score: r.score });
        }
        if (cand.length >= 3) break;
      }
      if (cand.length > 0) {
        setCandidates(cand);
        setPhase('candidate');
        return;
      }

      // 5) 全都不在圖鑑
      failCapture(`偵測到「${scored[0].label}」，但這隻鳥不在 BIRD-DEX 圖鑑中。`, 'not-in-dex');
    } catch (err: any) {
      cleanup();
      onBusyChange?.(false);
      if (!mountedRef.current) return;
      if (err?.name === 'AbortError') {
        setPhase('error');
        setErrorMsg('辨識逾時（超過 60 秒），請檢查網路後再試一次。');
      } else {
        setPhase('error');
        setErrorMsg(err.message || '辨識過程發生錯誤');
      }
    }
  }, [phase, captureBird, onCapture, onBusyChange, captureFrame, failCapture]);

  const tryAgain = useCallback(() => {
    setPhase('active');
    setErrorMsg('');
    setCandidates([]);
    bestFrameRef.current = null;
  }, []);

  const showZoomUI = phase === 'active' && maxZoom > 1.001;

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {/* Video preview */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${phase === 'snapping' ? 'opacity-30' : 'opacity-100'}`}
        playsInline
        muted
        // touch-action none：讓捏合手勢不會被瀏覽器捲動吃掉
        style={{ touchAction: 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      />

      {/* Scan frame overlay */}
      {(phase === 'active' || phase === 'countdown') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[72vw] max-w-[360px] aspect-[3/4]">
            <div className="absolute inset-0 border-2 border-dex-neon/40 rounded-2xl" />
            <div className="corner-bracket corner-tl" />
            <div className="corner-bracket corner-tr" />
            <div className="corner-bracket corner-bl" />
            <div className="corner-bracket corner-br" />
            <div className="scan-line rounded-full" />
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <div className="text-[10px] text-dex-neon/70 tracking-[0.3em] font-mono">BIRD-DEX SCANNER v2.0</div>
            </div>
          </div>
        </div>
      )}

      {/* 變焦控制（右側滑桿） */}
      {showZoomUI && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono text-white/80 bg-black/40 rounded px-1.5 py-0.5">
            {zoom.toFixed(1)}x
          </span>
          <div className="h-40 w-10 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm">
            <input
              type="range"
              min={1}
              max={maxZoom}
              step={zoomStep}
              value={zoom}
              onChange={e => applyZoom(Number(e.target.value))}
              aria-label="變焦"
              className="zoom-range"
              style={{ transform: 'rotate(-90deg)', width: '8rem', accentColor: '#00F0FF' }}
            />
          </div>
          <button
            onClick={resetZoom}
            className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border transition ${
              zoom > 1.05
                ? 'bg-dex-neon/20 border-dex-neon text-dex-neon'
                : 'bg-black/30 border-white/20 text-white/50'
            }`}
          >
            1x
          </button>
        </div>
      )}

      {/* Analyzing overlay */}
      {phase === 'analyzing' && (
        <div className="absolute inset-0 bg-dex-bg/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-dex-neon/20 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 border-4 border-t-dex-neon border-r-transparent border-b-dex-neon/30 border-l-transparent rounded-full animate-spin" />
            <Zap className="absolute inset-0 m-auto text-dex-neon" size={32} />
          </div>
          <div className="text-dex-neon font-mono text-sm tracking-widest mb-2 animate-pulse">AI ANALYZING</div>
          <div className="text-white/60 text-xs font-mono">{analyzingText}</div>
        </div>
      )}

      {/* 候選鳥確認（中等信心度） */}
      {phase === 'candidate' && candidates.length > 0 && (
        <div className="absolute inset-0 z-30 bg-dex-bg/95 backdrop-blur-md flex flex-col items-center justify-center px-6">
          <div className="text-2xl font-black text-white mb-1">牠是這幾隻嗎？</div>
          <p className="text-xs text-dex-muted mb-5 text-center">
            信心度不夠高，幫我選出最接近的一隻～（點錯不會扣分，放心）
          </p>
          <div className="w-full max-w-xs space-y-2 mb-6">
            {candidates.map(c => {
              const bird = getBirdById(c.speciesId);
              if (!bird) return null;
              return (
                <button
                  key={c.speciesId}
                  onClick={() => chooseCandidate(c.speciesId)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-dex-surface border border-dex-border hover:border-dex-neon active:scale-[0.98] transition text-left"
                >
                  {bird.photoUrl ? (
                    <img src={bird.photoUrl} alt={bird.name} className="w-12 h-12 rounded-lg object-cover shrink-0" loading="lazy" />
                  ) : (
                    <span className="w-12 h-12 rounded-lg bg-dex-border flex items-center justify-center text-2xl shrink-0">{bird.emoji}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-white truncate">{bird.name}</div>
                    <div className="text-[10px] text-dex-muted truncate">{bird.nameEn}</div>
                  </div>
                  <span className="text-[10px] font-mono text-dex-neon shrink-0">{Math.round(c.score * 100)}%</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={tryAgain}
            className="px-5 py-2.5 rounded-xl bg-dex-surface border border-dex-border text-white text-xs font-bold hover:bg-white/10 transition"
          >
            都不是，再試一次
          </button>
        </div>
      )}

      {/* Missed overlay */}
      {phase === 'missed' && (
        <div className="absolute inset-0 bg-dex-bg/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
          <div className="text-5xl mb-4">💨</div>
          <div className="text-xl font-black text-white mb-1">鳥兒逃走了！</div>
          <div className="text-sm text-dex-muted mb-6 max-w-xs text-center">
            可能是因為畫面太模糊、光線不足，或這隻鳥不在目前圖鑑中。再試一次吧！
          </div>
          <button onClick={tryAgain} className="px-6 py-3 rounded-xl bg-dex-neon text-dex-bg font-bold text-sm hover:brightness-110 transition">
            再次捕捉
          </button>
        </div>
      )}

      {/* Error overlay */}
      {phase === 'error' && (
        <div className="absolute inset-0 bg-dex-bg/95 flex flex-col items-center justify-center z-20 px-6">
          <AlertTriangle className="text-dex-accent mb-3" size={48} />
          <div className="text-lg font-bold text-white mb-2">掃描器異常</div>
          <div className="text-sm text-dex-muted text-center mb-6">{errorMsg}</div>
          <button onClick={startCamera} className="px-6 py-3 rounded-xl bg-dex-neon text-dex-bg font-bold text-sm hover:brightness-110 transition">
            重新啟動相機
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-xs font-mono text-dex-neon tracking-widest">CAPTURE MODE</div>
      </div>

      {/* Bottom controls */}
      {(phase === 'active' || phase === 'countdown') && (
        <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-0 right-0 flex flex-col items-center gap-4 z-10">
          <div className="text-xs text-white/40 font-mono">
            {maxZoom > 1.001 ? '雙指縮放變焦 · 自動挑最清晰畫面' : '對準鳥類，按下快門捕捉'}
          </div>
          <button
            onClick={snap}
            className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="pulse-ring absolute inset-0 rounded-full" />
            <div className="w-16 h-16 rounded-full border-2 border-dex-bg flex items-center justify-center">
              <Camera size={28} className="text-dex-bg" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
