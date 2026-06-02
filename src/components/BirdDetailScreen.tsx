
import { useCollectionContext } from '../context/CollectionContext';
import { getBirdById } from '../data/birdData';
import { RARITY_META } from '../lib/theme';
import { ArrowLeft, MapPin, Ruler, Utensils, Eye, Calendar, Hash, Mic } from 'lucide-react';

interface BirdDetailScreenProps {
  speciesId: number;
  onBack: () => void;
}

export function BirdDetailScreen({ speciesId, onBack }: BirdDetailScreenProps) {
  const bird = getBirdById(speciesId);
  const { captures } = useCollectionContext();
  const capture = captures.find(c => c.speciesId === speciesId);
  const isCaught = !!capture;

  if (!bird) {
    return (
      <div className="min-h-full bg-dex-bg flex flex-col items-center justify-center p-6">
        <div className="text-4xl mb-3">🙈</div>
        <p className="text-dex-muted">找不到這隻鳥的資料</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-lg bg-dex-surface text-white text-sm">返回</button>
      </div>
    );
  }

  const rarityMeta = capture ? RARITY_META[capture.currentRarity] : null;

  return (
    <div className="min-h-full bg-dex-bg pb-8">
      {/* Hero image */}
      <div className="relative h-72 shrink-0">
        {bird.photoUrl ? (
          <img src={bird.photoUrl} alt={bird.name} className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(180deg, ${bird.baseColor}33 0%, #0b0f19 100%)` }}>
            <span className="text-8xl opacity-20">{bird.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dex-bg via-dex-bg/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] text-dex-muted font-mono mb-0.5">{bird.scientificName}</div>
              <h1 className="text-2xl font-black text-white leading-tight truncate">{bird.name}</h1>
              <p className="text-sm text-dex-muted truncate">{bird.nameEn}</p>
            </div>
            {rarityMeta && (
              <div className="px-3 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-lg shrink-0"
                style={{ background: rarityMeta.gradient, color: rarityMeta.textColor }}>
                {rarityMeta.label}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Quick stats */}
        <div className="flex gap-2 overflow-x-auto">
          <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-dex-surface border border-dex-border flex items-center gap-2">
            <Ruler size={14} className="text-dex-neon" />
            <span className="text-xs text-white font-bold">{bird.size}</span>
          </div>
          <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-dex-surface border border-dex-border flex items-center gap-2">
            <Utensils size={14} className="text-dex-accent" />
            <span className="text-xs text-white">{bird.diet}</span>
          </div>
          <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-dex-surface border border-dex-border flex items-center gap-2">
            <Eye size={14} className="text-dex-gold" />
            <span className="text-xs text-white">{bird.features.slice(0, 12)}...</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
          <h3 className="text-xs font-bold text-dex-muted tracking-wider mb-2">鳥精靈檔案</h3>
          <p className="text-sm text-white/90 leading-relaxed">{bird.description}</p>
        </div>

        {/* Fun fact */}
        <div className="bg-gradient-to-br from-dex-neon/10 to-dex-accent/10 border border-dex-neon/20 rounded-xl p-4">
          <h3 className="text-xs font-bold text-dex-neon tracking-wider mb-1">🌟 趣味冷知識</h3>
          <p className="text-sm text-white/90 leading-relaxed">{bird.funFact}</p>
        </div>

        {/* Habitat & Range */}
        <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
          <h3 className="text-xs font-bold text-dex-muted tracking-wider mb-3">出沒環境</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {bird.habitat.map(h => (
              <span key={h} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/80">{h}</span>
            ))}
          </div>
          <div className="text-xs text-dex-muted mb-1">分布：{bird.region} · {bird.season}</div>
          <div className="text-xs text-dex-muted">全球：{bird.globalRange.join('、')}</div>
        </div>

        {/* Hotspots */}
        <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
          <h3 className="text-xs font-bold text-dex-muted tracking-wider mb-3 flex items-center gap-1.5">
            <MapPin size={12} /> 香港觀鳥熱點
          </h3>
          <div className="space-y-2">
            {bird.hotspots.slice(0, 5).map((spot, i) => (
              <a
                key={i}
                href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <div>
                  <div className="text-xs text-white font-bold">{spot.name}</div>
                  <div className="text-[10px] text-dex-muted">{spot.subregion} · 出沒頻率: {spot.frequency === 'high' ? '高' : spot.frequency === 'medium' ? '中' : '低'}</div>
                </div>
                <MapPin size={14} className="text-dex-muted" />
              </a>
            ))}
          </div>
        </div>

        {/* Call */}
        <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
          <h3 className="text-xs font-bold text-dex-muted tracking-wider mb-2 flex items-center gap-1.5">
            <Mic size={12} /> 叫聲描述
          </h3>
          <p className="text-sm text-white/80">{bird.call}</p>
        </div>

        {/* Capture history */}
        {capture && (
          <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-dex-muted tracking-wider mb-3">捕捉紀錄</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-white/5">
                <div className="flex items-center gap-1.5 text-dex-muted text-[10px] mb-1">
                  <Hash size={10} /> 捕捉次數
                </div>
                <div className="text-lg font-black text-white">{capture.count} 次</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5">
                <div className="flex items-center gap-1.5 text-dex-muted text-[10px] mb-1">
                  <Calendar size={10} /> 首次相遇
                </div>
                <div className="text-xs text-white">{new Date(capture.firstCaptureDate).toLocaleDateString('zh-HK')}</div>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-dex-muted">
              最近捕捉: {new Date(capture.lastCaptureDate).toLocaleDateString('zh-HK')}
            </div>
          </div>
        )}

        {!isCaught && (
          <div className="p-4 rounded-xl border-2 border-dashed border-dex-border flex flex-col items-center text-center gap-2">
            <div className="text-2xl">🔒</div>
            <p className="text-sm text-dex-muted">你還沒捕捉到這隻鳥精靈。</p>
            <p className="text-xs text-dex-muted">去戶外尋找牠，完成你的第一次捕捉吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
