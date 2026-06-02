import { useState } from 'react';
import { BirdSpecies, CaptureRecord, Rarity } from '../types';
import { RARITY_META } from '../lib/theme';
import { MapPin, Ruler, Utensils, Eye } from 'lucide-react';

interface BirdCardProps {
  bird: BirdSpecies;
  capture?: CaptureRecord;
  compact?: boolean;
  onClick?: () => void;
}

export function BirdCard({ bird, capture, compact, onClick }: BirdCardProps) {
  const [imgError, setImgError] = useState(false);
  const rarity: Rarity = capture?.currentRarity ?? 'UC';
  const meta = RARITY_META[rarity];
  const isUncaptured = !capture;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden card-3d text-left"
        style={{
          border: isUncaptured ? '2px dashed #374151' : meta.border,
          boxShadow: isUncaptured ? 'none' : meta.glow,
        }}
      >
        <div className="absolute inset-0 bird-art-bg" style={{ backgroundColor: isUncaptured ? '#111827' : bird.baseColor + '22' }} />
        {(!imgError && bird.photoUrl && !isUncaptured) ? (
          <img
            src={bird.photoUrl}
            alt={bird.name}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
            {bird.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black tracking-wider"
          style={{ background: meta.gradient, color: meta.textColor }}>
          {isUncaptured ? '???' : meta.label}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <div className="text-xs font-bold text-white truncate leading-tight">
            {isUncaptured ? '未發現' : bird.name}
          </div>
          {!isUncaptured && (
            <div className="text-[10px] text-dex-muted truncate">{bird.nameEn}</div>
          )}
        </div>
        {['SSR','UR','LR'].includes(rarity) && !isUncaptured && (
          <div className="absolute inset-0 foil-shimmer rounded-xl" />
        )}
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl overflow-hidden card-3d cursor-pointer select-none"
      style={{
        border: isUncaptured ? '2px dashed #374151' : meta.border,
        boxShadow: isUncaptured ? 'inset 0 0 40px rgba(0,0,0,0.5)' : meta.glow,
      }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: isUncaptured
        ? 'radial-gradient(circle at 50% 50%, #1f2937 0%, #0b0f19 100%)'
        : `radial-gradient(ellipse at 30% 20%, ${bird.baseColor}33 0%, transparent 60%), linear-gradient(180deg, ${bird.baseColor}18 0%, #0b0f19 100%)`
      }} />

      {/* Photo */}
      {(!imgError && bird.photoUrl && !isUncaptured) ? (
        <img
          src={bird.photoUrl}
          alt={bird.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[120px] opacity-20">{bird.emoji}</span>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Top banner */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-dex-muted font-mono tracking-wider">{bird.scientificName}</div>
          <div className={`text-lg font-black leading-tight truncate ${isUncaptured ? 'text-dex-muted' : 'text-white'}`}>
            {isUncaptured ? '？？？' : bird.name}
          </div>
          <div className="text-[10px] text-dex-muted truncate">{isUncaptured ? '???' : bird.nameEn}</div>
        </div>
        <div className="px-2 py-1 rounded-lg text-xs font-black tracking-wider shadow-lg"
          style={{ background: isUncaptured ? '#374151' : meta.gradient, color: isUncaptured ? '#9CA3AF' : meta.textColor }}>
          {isUncaptured ? '???' : meta.labelZh}
        </div>
      </div>

      {/* Center Info (when captured) */}
      {!isUncaptured && (
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-[11px] text-dex-muted mb-1">
              <Eye size={12} />
              <span>特徵</span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed line-clamp-3">{bird.features}</p>
          </div>
        </div>
      )}

      {/* Bottom stats */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-2 mb-2">
          {bird.habitat.slice(0, 2).map(h => (
            <span key={h} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">
              {h}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-dex-muted">
            <Ruler size={10} /> {bird.size}
          </span>
        </div>

        {!isUncaptured && (
          <div className="flex items-center gap-3 text-[10px] text-dex-muted">
            <span className="flex items-center gap-1"><Utensils size={10} /> {bird.diet}</span>
            <span className="flex items-center gap-1"><MapPin size={10} /> {bird.hotspots[0]?.name ?? '全港'}</span>
          </div>
        )}

        {capture && (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[10px] text-dex-muted">
              已捕捉 <span className="text-dex-neon font-bold">{capture.count}</span> 次
            </div>
            <div className="text-[10px] text-dex-gold">
              {capture.count >= 20 ? '傳說級夥伴' : capture.count >= 5 ? '親密夥伴' : '新夥伴'}
            </div>
          </div>
        )}
      </div>

      {/* Foil overlay for high rarity */}
      {['SSR','UR','LR'].includes(rarity) && !isUncaptured && (
        <div className="absolute inset-0 foil-shimmer pointer-events-none" />
      )}

      {/* Uncaptured lock overlay */}
      {isUncaptured && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="text-center">
            <div className="text-4xl mb-1">🔒</div>
            <div className="text-xs text-dex-muted">尚未捕捉</div>
          </div>
        </div>
      )}
    </div>
  );
}
