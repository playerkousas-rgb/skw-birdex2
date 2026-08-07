import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaptureResult } from '../types';
import { BirdCard } from './BirdCard';
import { RARITY_META } from '../lib/theme';
import { BIRD_SPECIES } from '../data/birdData';
import { Star, Sparkles, ChevronRight, XCircle } from 'lucide-react';
import { playThrow, playGotcha, playSuccess, playShiny, playFail, playLevelUp, vibrate } from '../lib/sfx';

interface CaptureResultScreenProps {
  result: CaptureResult;
  onClose: () => void;
}

export function CaptureResultScreen({ result, onClose }: CaptureResultScreenProps) {
  const [phase, setPhase] = useState<'throw' | 'wiggle' | 'caught' | 'card' | 'stats' | 'escaped'>('throw');
  
  const { species, isNew, oldRarity, newRarity, xpGained, record, failed, failReason, failKind, isShiny, leveledUp, newLevel, atHotspot, companionBonus } = result;
  const rarityMeta = RARITY_META[newRarity];

  // ────────────────────────────────────────────────
  // 動態背景圖
  //   成功      → 該鳥的卡圖
  //   逃走/模糊 → 隨機抽一張卡（呼應「他飛走了」）
  //   不是鳥    → 沒有背景，保留深色（純黑底配星塵）
  // useMemo 確保整個動畫期間背景不會閃變
  // ────────────────────────────────────────────────
  const backgroundUrl = useMemo<string | null>(() => {
    if (!failed && species?.photoUrl) {
      return species.photoUrl;
    }
    if (failed && failKind === 'escaped') {
      const pool = BIRD_SPECIES.filter((b) => b.photoUrl);
      if (pool.length === 0) return null;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return pick.photoUrl ?? null;
    }
    // not-bird / not-in-dex / 其他 → 不放鳥背景，避免誤導
    return null;
  }, [failed, failKind, species]);

  const ambientColor = isShiny ? '#FFD700' : (rarityMeta?.color || '#00F0FF');

  useEffect(() => {
    // 丟球 -> 搖晃
    const t1 = setTimeout(() => setPhase('wiggle'), 600); 
    
    let t2: any, t3: any, t4: any;

    if (failed) {
      // 如果失敗，搖兩下後逃走
      t2 = setTimeout(() => setPhase('escaped'), 2000); 
    } else {
      // 如果成功，搖三下後捕獲 -> 顯示卡片 -> 顯示數值
      t2 = setTimeout(() => setPhase('caught'), 2600); 
      t3 = setTimeout(() => setPhase('card'), 4000); 
      t4 = setTimeout(() => setPhase('stats'), 4800); 
    }
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [failed]);

  // 各階段的音效與震動回饋
  useEffect(() => {
    if (phase === 'throw') {
      playThrow();
    } else if (phase === 'caught') {
      playGotcha();
      vibrate([30, 60, 90]);
    } else if (phase === 'card') {
      if (isShiny) playShiny();
      else playSuccess();
    } else if (phase === 'stats') {
      if (leveledUp) {
        playLevelUp();
        vibrate([40, 80, 160]);
      }
    } else if (phase === 'escaped') {
      playFail();
      vibrate([90]);
    }
  }, [phase, isShiny, leveledUp]);

  const upgraded = !isNew && oldRarity !== newRarity;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto p-4 isolate">
      {/* ── Dynamic Background Layer ─────────────────────────── */}
      {backgroundUrl ? (
        <>
          {/* 1. 鳥圖：模糊放大 + 緩慢縮放 */}
          <motion.div
            key={backgroundUrl}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1.05 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{
              backgroundImage: `url("${backgroundUrl}")`,
              filter: failed ? 'blur(28px) brightness(0.35) saturate(0.7)' : 'blur(22px) brightness(0.55)',
            }}
          />
          {/* 2. 漸層暈染（隨稀有度上色） */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: failed
                ? 'radial-gradient(ellipse at center, rgba(15,17,21,0.55) 0%, rgba(8,9,12,0.92) 80%)'
                : `radial-gradient(ellipse at center, ${ambientColor}25 0%, rgba(8,9,12,0.85) 70%)`,
            }}
          />
          {/* 3. 底層保險深色，確保字夠清楚 */}
          <div className="absolute inset-0 -z-10 bg-dex-bg/55 backdrop-blur-sm" />
        </>
      ) : (
        // 沒鳥背景：保留原本的深色 + 細微星塵
        <>
          <div className="absolute inset-0 -z-10 bg-dex-bg/95 backdrop-blur-md" />
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/40"
                style={{
                  width: 1 + Math.random() * 2,
                  height: 1 + Math.random() * 2,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Background particles for card phase */}
      {!failed && (phase === 'card' || phase === 'stats') && (
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
                background: rarityMeta?.color || '#fff',
              }}
              animate={{ y: [0, -40, 0], opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
              transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
      )}

      {/* Animation Phase: Throwing & Wiggling */}
      <AnimatePresence>
        {(phase === 'throw' || phase === 'wiggle' || phase === 'caught' || phase === 'escaped') && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0, scale: 2 }}
          >
            {/* 相機球 */}
            {phase !== 'escaped' && phase !== 'caught' && (
              <motion.div
                initial={phase === 'throw' ? { y: 300, scale: 2, rotate: -45 } : false}
                animate={
                  phase === 'throw' ? { y: 0, scale: 1, rotate: 0 } :
                  phase === 'wiggle' ? {
                    rotate: [0, -20, 0, 20, 0, -20, 0, 20, 0],
                    transition: { duration: failed ? 1.4 : 2, times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 0.8, 0.9, 1] }
                  } : { scale: 0, opacity: 0 }
                }
                transition={{ 
                  type: phase === 'throw' ? 'spring' : 'tween', 
                  bounce: 0.4,
                  duration: phase === 'throw' ? 0.6 : (failed ? 1.4 : 2)
                }}
                className="relative w-24 h-24"
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${failed && phase === 'wiggle' ? 'from-gray-500' : 'from-dex-accent'} to-white rounded-full border-4 border-dex-border shadow-[0_0_30px_rgba(255,51,102,0.5)] flex items-center justify-center overflow-hidden`}>
                  <div className="absolute top-1/2 left-0 right-0 h-2 bg-dex-border -translate-y-1/2" />
                  <div className="relative w-8 h-8 bg-dex-border rounded-full flex items-center justify-center z-10">
                    <motion.div 
                      className="w-4 h-4 bg-white rounded-full"
                      animate={{ backgroundColor: ['#ffffff', '#FF3366', '#ffffff'] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

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

            {/* 捕捉失敗的煙霧逃走 */}
            {phase === 'escaped' && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.2, 1.5], opacity: [1, 1, 0] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-7xl">💨</div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 失敗 UI 顯示 */}
      {phase === 'escaped' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10 pointer-events-auto"
        >
          <XCircle size={64} className="text-dex-muted mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">鳥兒逃走了！</h2>
          <p className="text-sm text-dex-muted mb-8 max-w-[280px]">
            {failReason || '可能是因為畫面太模糊、光線太暗，或距離太遠。再試著靠近一點拍攝吧！'}
          </p>
          <button
            onClick={onClose}
            className="w-full max-w-[200px] py-3.5 rounded-xl bg-dex-surface border border-dex-border text-white font-black text-sm hover:bg-white/10 transition"
          >
            返回繼續尋找
          </button>
        </motion.div>
      )}

      {/* Header text (Card Phase - Success Only) */}
      {!failed && phase === 'card' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2 }}
          className="text-center mb-4 mt-8"
        >
          <div className="text-4xl mb-2">{isShiny ? '🌈' : isNew ? '✨' : upgraded ? '🎉' : '📸'}</div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            {isShiny ? '✨ 色違鳥現身！' : isNew ? '圖鑑新登錄！' : upgraded ? '稀有度突破！' : '資料更新成功！'}
          </h2>
          {isShiny && (
            <p className="text-xs text-dex-gold font-bold mt-1 tracking-wider">萬中選一的色違個體，運氣爆棚！</p>
          )}
        </motion.div>
      )}

      {/* Card reveal (Success Only) */}
      {!failed && species && record && (phase === 'card' || phase === 'stats') && (
        <div className="w-full max-w-[280px] relative my-2 z-10">
          <motion.div
            initial={{ scale: 0, rotateY: 180, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          >
            <BirdCard bird={species} capture={record} />
          </motion.div>
        </div>
      )}

      {/* Stats (Success Only) */}
      {!failed && phase === 'stats' && species && record && rarityMeta && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-xs mt-4 space-y-3 z-10 pb-8 pointer-events-auto"
        >
          {/* Rarity badge row */}
          <div className="flex items-center justify-center gap-2">
            {upgraded && oldRarity && (
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

          {/* 升級提示 */}
          {leveledUp && newLevel && (
            <div className="bg-dex-surface/80 backdrop-blur border border-dex-gold/50 rounded-xl p-3 flex items-center justify-between shadow-lg shadow-dex-gold/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">⬆️</span>
                <span className="text-sm font-bold text-white">訓練師升級！</span>
              </div>
              <span className="text-xl font-black text-dex-gold">Lv.{newLevel}</span>
            </div>
          )}

          {/* XP gain */}
          <div className="bg-dex-surface/80 backdrop-blur border border-dex-border rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-dex-gold" />
              <span className="text-sm text-dex-muted">獲得經驗值</span>
            </div>
            <span className="text-lg font-black text-dex-gold">+{xpGained} XP</span>
          </div>

          {/* 夥伴加成 / 熱點提示 */}
          {(companionBonus || atHotspot) && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-dex-muted">
              {companionBonus && <span className="px-2 py-0.5 rounded-full bg-dex-neon/10 border border-dex-neon/30 text-dex-neon font-bold">❤️ 夥伴加成 +2 XP</span>}
              {atHotspot && <span className="px-2 py-0.5 rounded-full bg-dex-gold/10 border border-dex-gold/30 text-dex-gold font-bold">🗺️ 熱點發現！</span>}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 mt-2 rounded-xl bg-dex-neon text-dex-bg font-black text-sm tracking-wider hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-dex-neon/20"
          >
            收入收藏冊
          </button>
        </motion.div>
      )}
    </div>
  );
}
