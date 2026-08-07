import { useState } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { HOTSPOTS } from '../data/hotspots';

/** 觀鳥熱點圖章（訓練師頁）—— 走到熱點附近捕捉或偵測位置即可蓋章 */
export function HotspotStamps() {
  const { hotspotState, stampHotspotsNear } = useCollectionContext();
  const [msg, setMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const total = Object.keys(HOTSPOTS).length;
  const stamped = hotspotState.stamps.length;

  const detect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMsg('此裝置不支援定位');
      return;
    }
    setLocating(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const newly = stampHotspotsNear(pos.coords.latitude, pos.coords.longitude);
        setMsg(newly.length
          ? `📡 蓋了 ${newly.length} 個圖章：${newly.map(k => (HOTSPOTS as Record<string, { name: string }>)[k]?.name).filter(Boolean).join('、')}`
          : '附近沒有未蓋章的熱點（半徑 2 公里內）');
      },
      () => {
        setLocating(false);
        setMsg('⚠️ 定位失敗或權限被拒絕，請到瀏覽器設定允許定位');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <div className="px-4 pt-2 pb-2">
      <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🗺️</span>
          <h3 className="text-sm font-black text-white tracking-wide">觀鳥熱點探索</h3>
          <span className="text-[10px] font-mono text-dex-neon ml-auto">{stamped} / {total}</span>
        </div>
        <p className="text-[10px] text-dex-muted mb-3">
          親自走到香港的觀鳥熱點，在附近捕捉鳥或按下偵測即可蓋章收集！
        </p>

        <button
          onClick={detect}
          disabled={locating}
          className="w-full mb-3 py-2.5 rounded-xl bg-dex-neon/15 border border-dex-neon/40 text-dex-neon text-xs font-black hover:bg-dex-neon/25 active:scale-[0.98] transition disabled:opacity-50"
        >
          {locating ? '定位中…' : '📡 偵測我現在的位置並蓋章'}
        </button>
        {msg && <p className="text-[10px] text-dex-muted mb-2 text-center leading-relaxed">{msg}</p>}

        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(HOTSPOTS).map(([key, h]) => {
            const got = hotspotState.stamps.includes(key);
            return (
              <div
                key={key}
                title={h.name}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 px-0.5 border transition ${
                  got
                    ? 'bg-dex-gold/15 border-dex-gold/50'
                    : 'bg-dex-bg border-dex-border/60 opacity-55'
                }`}
              >
                <span className="text-sm">{got ? '📌' : '🔒'}</span>
                <span className={`text-[7px] font-bold text-center leading-tight truncate w-full ${got ? 'text-dex-gold' : 'text-dex-muted'}`}>
                  {h.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
