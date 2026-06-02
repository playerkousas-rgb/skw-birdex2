import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaptureResult } from '../types';
import { BirdCard } from './BirdCard';
import { RARITY_META } from '../lib/theme';
import { Star, Sparkles, ChevronRight } from 'lucide-react';

interface CaptureResultScreenProps {
  result: CaptureResult;
  onClose: () => void;
}

export function CaptureResultScreen({ result, onClose }: CaptureResultScreenProps) {
  const [showCard, setShowCard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { species, isNew, oldRarity, newRarity, xpGained, record } = result;
  const rarityMeta = RARITY_META[newRarity];

  useEffect(() => {
    const t1 = setTimeout(() => setShowCard(true), 400);
    const t2 = setTimeout(() => setShowStats(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const upgraded = !isNew && oldRarity !== newRarity;

  return (
    <div className="absolute inset-0 z-50 bg-dex-bg flex flex-col items-center justify-center overflow-y-auto p-4">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: rarityMeta.color,
            }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Header text */}
      <AnimatePresence>
        {!showCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="text-center mb-4"
          >
            <div className="text-5xl mb-3">{isNew ? '✨' : upgraded ? '🎉' : '📸'}</div>
            <h2 className="text-2xl font-black text-white tracking-wide">
              {isNew ? '首次捕捉！' : upgraded ? '稀有度提升！' : '捕捉成功！'}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card reveal */}
      <div className="w-full max-w-xs relative my-2">
        <AnimatePresence>
          {showCard && (
            <motion.div
              initial={{ scale: 0.2, rotateY: 180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            >
              <BirdCard bird={species} capture={record} />

              {/* Rarity shine overlay */}
              {['SSR','UR','LR'].includes(newRarity) && (
                <div className="absolute inset-0 rounded-2xl foil-shimmer pointer-events-none" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-xs mt-4 space-y-3"
          >
            {/* Rarity badge row */}
            <div className="flex items-center justify-center gap-2">
              {upgraded && (
                <>
                  <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: RARITY_META[oldRarity].gradient, color: RARITY_META[oldRarity].textColor }}>
                    {RARITY_META[oldRarity].label}
                  </div>
                  <ChevronRight size={16} className="text-dex-muted" />
                </>
              )}
              <div className="px-3 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-lg flex items-center gap-1"
                style={{ background: rarityMeta.gradient, color: rarityMeta.textColor }}>
                {upgraded && <Sparkles size={14} />}
                {rarityMeta.label} · {rarityMeta.labelZh}
              </div>
            </div>

            {/* XP gain */}
            <div className="bg-dex-surface border border-dex-border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-dex-gold" />
                <span className="text-sm text-dex-muted">獲得經驗值</span>
              </div>
              <span className="text-lg font-black text-dex-gold">+{xpGained} XP</span>
            </div>

            {/* Capture count */}
            <div className="text-center">
              <span className="text-xs text-dex-muted">
                這隻鳥精靈已被捕捉 <span className="text-white font-bold">{record.count}</span> 次
              </span>
            </div>

            {/* Fun fact */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-[10px] text-dex-muted mb-1">鳥精靈知識卡</div>
              <p className="text-xs text-white/80 leading-relaxed">{species.funFact}</p>
            </div>

            {/* Action button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-dex-neon text-dex-bg font-black text-sm tracking-wider hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-dex-neon/20"
            >
              收入收藏冊
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
