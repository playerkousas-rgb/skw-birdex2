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
  const [phase, setPhase] = useState<'throw' | 'wiggle' | 'caught' | 'card' | 'stats'>('throw');
  const { species, isNew, oldRarity, newRarity, xpGained, record } = result;
  const rarityMeta = RARITY_META[newRarity];

  useEffect(() => {
    // 丟球 -> 搖晃 -> 捕捉成功 -> 顯示卡片 -> 顯示數值
    const t1 = setTimeout(() => setPhase('wiggle'), 600); // 丟球掉落
    const t2 = setTimeout(() => setPhase('caught'), 2600); // 搖晃3次後成功
    const t3 = setTimeout(() => setPhase('card'), 4000); // 卡片展開
    const t4 = setTimeout(() => setPhase('stats'), 4800); // 數值顯示
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const upgraded = !isNew && oldRarity !== newRarity;

  return (
    <div className="absolute inset-0 z-50 bg-dex-bg/95 backdrop-blur-md flex flex-col items-center justify-center overflow-y-auto p-4">
      {/* Background particles for card phase */}
      {(phase === 'card' || phase === 'stats') && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
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
              animate={{ y: [0, -40, 0], opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
              transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
      )}

      {/* Animation Phase: Throwing & Wiggling */}
      <AnimatePresence>
        {(phase === 'throw' || phase === 'wiggle' || phase === 'caught') && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0, scale: 2 }}
          >
            {/* 這裡我們用一個膠囊/相機球來模擬精靈球 */}
            <motion.div
              initial={phase === 'throw' ? { y: 300, scale: 2, rotate: -45 } : false}
              animate={
                phase === 'throw' ? { y: 0, scale: 1, rotate: 0 } :
                phase === 'wiggle' ? {
                  rotate: [0, -20, 0, 20, 0, -20, 0, 20, 0],
                  transition: { duration: 2, times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 0.8, 0.9, 1] }
                } :
                { scale: 0, opacity: 0 } // caught phase shrinks
              }
              transition={{ 
                type: phase === 'throw' ? 'spring' : 'tween', 
                bounce: 0.4,
                duration: phase === 'throw' ? 0.6 : 2
              }}
              className="relative w-24 h-24"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-dex-accent to-white rounded-full border-4 border-dex-border shadow-[0_0_30px_rgba(255,51,102,0.5)] flex items-center justify-center overflow-hidden">
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-dex-border -translate-y-1/2" />
                <div className="relative w-8 h-8 bg-dex-border rounded-full flex items-center justify-center z-10">
                  <motion.div 
                    className="w-4 h-4 bg-white rounded-full"
                    animate={
                      phase === 'caught' ? { scale: [1, 2, 0], opacity: [1, 0, 0] } :
                      phase === 'wiggle' ? { backgroundColor: ['#ffffff', '#FF3366', '#ffffff'] } : {}
                    }
                    transition={phase === 'wiggle' ? { repeat: Infinity, duration: 0.6 } : {}}
                  />
                </div>
              </div>
            </motion.div>

            {/* 捕捉成功的星星爆炸 */}
            {phase === 'caught' && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.5, 2], opacity: [1, 1, 0] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-32 h-32 rounded-full border-[10px] border-dex-neon shadow-[0_0_50px_#00F0FF]" />
                <div className="absolute w-full text-center mt-32">
                  <h2 className="text-3xl font-black text-white text-shadow-glow tracking-widest">GOTCHA!</h2>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header text (Card Phase) */}
      <AnimatePresence>
        {phase === 'card' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="text-center mb-4 mt-8"
          >
            <div className="text-4xl mb-2">{isNew ? '✨' : upgraded ? '🎉' : '📸'}</div>
            <h2 className="text-2xl font-black text-white tracking-wide">
              {isNew ? '圖鑑新登錄！' : upgraded ? '稀有度突破！' : '資料更新成功！'}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card reveal */}
      <div className="w-full max-w-[280px] relative my-2 z-10">
        <AnimatePresence>
          {(phase === 'card' || phase === 'stats') && (
            <motion.div
              initial={{ scale: 0, rotateY: 180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 12 }}
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
        {phase === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-xs mt-4 space-y-3 z-10 pb-8"
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
            <div className="bg-dex-surface/80 backdrop-blur border border-dex-border rounded-xl p-3 flex items-center justify-between">
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

            {/* Action button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 mt-2 rounded-xl bg-dex-neon text-dex-bg font-black text-sm tracking-wider hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-dex-neon/20"
            >
              收入收藏冊
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
