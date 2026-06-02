import { useRef, useState, useEffect, useCallback } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { analyzeImage } from '../lib/aiClient';
import { resolveBirdId } from '../data/nameAliases';
import { getBirdById } from '../data/birdData';
import { Camera, Zap, AlertTriangle } from 'lucide-react';
import { CaptureResult as CaptureResultType } from '../types';


interface ScannerScreenProps {
  onCapture: (result: CaptureResultType) => void;
}

type ScanPhase = 'idle' | 'starting' | 'active' | 'countdown' | 'snapping' | 'analyzing' | 'found' | 'missed' | 'error';

export function ScannerScreen({ onCapture }: ScannerScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [analyzingText, setAnalyzingText] = useState('初始化影像...');
  const { captureBird } = useCollectionContext();

  const startCamera = useCallback(async () => {
    setPhase('starting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setPhase('active');
      }
    } catch (e: any) {
      setPhase('error');
      setErrorMsg(e.name === 'NotAllowedError' ? '相機權限被拒絕，請在瀏覽器設定中允許相機。' : `無法啟動相機：${e.message}`);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const snap = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || phase !== 'active') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate a flash
    setPhase('snapping');
    await new Promise(r => setTimeout(r, 200));

    setPhase('analyzing');
    const texts = ['特徵提取...', '比對圖鑑資料庫...', '神經網路辨識...', '搜尋香港鳥種...', '信心度評估...'];
    let ti = 0;
    const tInt = setInterval(() => {
      setAnalyzingText(texts[ti % texts.length]);
      ti++;
    }, 600);

    try {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('照片生成失敗');
      const results = await analyzeImage(blob);
      clearInterval(tInt);

      if (!results.length || results[0].score < 0.4 || results[0].label === 'Unknown Object') {
        // 觸發捕捉失敗的精靈球動畫
        onCapture({ record: null, isNew: false, oldRarity: 'UC', newRarity: 'UC', xpGained: 0, species: null, failed: true });
        return;
      }

      const top = results[0];
      const speciesId = resolveBirdId(top.label) ?? (top.scientific ? resolveBirdId(top.scientific) : undefined);

      if (!speciesId) {
        onCapture({ record: null, isNew: false, oldRarity: 'UC', newRarity: 'UC', xpGained: 0, species: null, failed: true });
        return;
      }

      const bird = getBirdById(speciesId);
      if (!bird) {
        onCapture({ record: null, isNew: false, oldRarity: 'UC', newRarity: 'UC', xpGained: 0, species: null, failed: true });
        return;
      }

      // 觸發捕捉成功的精靈球動畫
      const captureResult = captureBird(speciesId, { photoDataUrl: canvas.toDataURL('image/jpeg', 0.5) });
      onCapture(captureResult);
    } catch (err: any) {
      clearInterval(tInt);
      setPhase('error');
      setErrorMsg(err.message || '辨識過程發生錯誤');
    }
  }, [phase, captureBird, onCapture]);

  const tryAgain = useCallback(() => {
    setPhase('active');
    setErrorMsg('');
  }, []);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {/* Video preview */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${phase === 'snapping' ? 'opacity-30' : 'opacity-100'}`}
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />

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
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 z-10">
          <div className="text-xs text-white/40 font-mono">對準鳥類，按下快門捕捉</div>
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
