import { useState, useRef } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { BIRD_SPECIES } from '../data/birdData';
import { getLevelFromXp, RARITY_ORDER, RARITY_META } from '../lib/theme';
import { User, Edit3, Award, Feather, Target, Trash2, Check, X } from 'lucide-react';

const AVATARS = [
  { emoji: '🥾', unlockLevel: 1, desc: '見習裝備' },
  { emoji: '🎒', unlockLevel: 2, desc: '旅行背包' },
  { emoji: '🔭', unlockLevel: 4, desc: '望遠鏡' },
  { emoji: '📷', unlockLevel: 5, desc: '專業相機' },
  { emoji: '🏕️', unlockLevel: 6, desc: '野外帳篷' },
  { emoji: '🦅', unlockLevel: 7, desc: '神鷹之力' },
  { emoji: '👑', unlockLevel: 10, desc: '傳說王冠' },
];

export function ProfileScreen() {
  const { profile, captures, totalCount, resetAll, unlockAll, updateProfileName, updateProfileAvatar } = useCollectionContext();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const levelInfo = getLevelFromXp(profile.xp);

  // Admin backdoor counter
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  const handleAvatarTap = () => {
    const now = Date.now();
    // 把連點間隔放寬到 2 秒，比較容易點出來
    if (now - lastTap.current > 2000) tapCount.current = 0;
    lastTap.current = now;
    tapCount.current += 1;

    if (tapCount.current === 7) {
      unlockAll();
      tapCount.current = 0;
    } 
    // 不管點幾下，如果是第 1 下，且沒有觸發外掛時，讓它繼續可以換頭像
    // 但為了解決「點一下就跳出視窗擋住」的問題，我們把換頭像功能移到編輯名稱旁邊
  };

  const saveName = () => {
    if (nameDraft.trim()) updateProfileName(nameDraft.trim());
    setEditing(false);
  };

  const completion = Math.round((captures.length / BIRD_SPECIES.length) * 100);

  return (
    <div className="min-h-full bg-dex-bg pb-24 relative">
      {/* Header banner */}
      <div className="relative bg-gradient-to-b from-dex-surface to-dex-bg border-b border-dex-border px-4 pt-6 pb-8">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Award size={120} />
        </div>

        <div className="relative flex items-center gap-4">
          <button 
            onClick={handleAvatarTap}
            className="w-20 h-20 rounded-2xl bg-dex-border border-2 border-dex-neon/30 flex items-center justify-center text-4xl shadow-lg shadow-dex-neon/10 hover:border-dex-neon transition-colors"
          >
            {profile.avatar || (profile.level >= 10 ? '👑' : profile.level >= 7 ? '🦅' : profile.level >= 4 ? '🔭' : '🥾')}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {editing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    className="bg-dex-bg border border-dex-border rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-dex-neon w-full"
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    autoFocus
                  />
                  <button onClick={saveName} className="p-1.5 rounded-lg bg-dex-neon text-dex-bg hover:brightness-110">
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white truncate">{profile.name}</h2>
                  <button onClick={() => { setNameDraft(profile.name); setEditing(true); }} className="text-dex-muted hover:text-white transition">
                    <Edit3 size={14} />
                  </button>
                  {/* 新增換頭像按鈕 */}
                  <button onClick={() => setShowAvatarSelect(true)} className="text-dex-muted hover:text-white transition ml-2 bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
                    換頭像
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-dex-neon font-bold tracking-wider mt-0.5 flex items-center gap-2">
              <span>Lv.{profile.level}</span>
              <span className="px-1.5 py-0.5 rounded bg-dex-neon/10 border border-dex-neon/30">{profile.title}</span>
            </div>
            <div className="text-[10px] text-dex-muted mt-1">
              加入於 {new Date(profile.joinedAt).toLocaleDateString('zh-HK')}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] text-dex-muted mb-1 font-mono">
            <span>XP {profile.xp}</span>
            <span>{levelInfo.nextXp ? `下一級 ${levelInfo.nextXp} XP` : '已達最高等級 MAX'}</span>
          </div>
          <div className="h-2.5 rounded-full bg-dex-border overflow-hidden relative">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-dex-neon to-dex-accent transition-all duration-700"
              style={{
                width: levelInfo.nextXp
                  ? `${Math.min(100, ((profile.xp - (getLevelFromXp(profile.xp - 1)?.nextXp || 0)) / ((levelInfo.nextXp || profile.xp) - (getLevelFromXp(profile.xp - 1)?.nextXp || 0))) * 100)}%`
                  : '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="bg-dex-surface border border-dex-border rounded-xl p-3">
          <div className="flex items-center gap-2 text-dex-muted mb-2">
            <Feather size={14} />
            <span className="text-[10px] font-bold tracking-wider">獨特種類</span>
          </div>
          <div className="text-2xl font-black text-white">{captures.length}</div>
          <div className="text-[10px] text-dex-muted">/ {BIRD_SPECIES.length} 種已收錄</div>
        </div>
        <div className="bg-dex-surface border border-dex-border rounded-xl p-3">
          <div className="flex items-center gap-2 text-dex-muted mb-2">
            <Target size={14} />
            <span className="text-[10px] font-bold tracking-wider">總捕捉次數</span>
          </div>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <div className="text-[10px] text-dex-muted">平均每種 {captures.length ? (totalCount / captures.length).toFixed(1) : '0'} 次</div>
        </div>
        <div className="bg-dex-surface border border-dex-border rounded-xl p-3">
          <div className="flex items-center gap-2 text-dex-muted mb-2">
            <Award size={14} />
            <span className="text-[10px] font-bold tracking-wider">圖鑑完成度</span>
          </div>
          <div className="text-2xl font-black text-dex-gold">{completion}%</div>
          <div className="text-[10px] text-dex-muted">{completion >= 100 ? '🎉 全圖鑑達成！' : '繼續探索！'}</div>
        </div>
        <div className="bg-dex-surface border border-dex-border rounded-xl p-3">
          <div className="flex items-center gap-2 text-dex-muted mb-2">
            <User size={14} />
            <span className="text-[10px] font-bold tracking-wider">稀有度分佈</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {RARITY_ORDER.map(r => {
              const c = captures.filter(x => x.currentRarity === r).length;
              if (!c) return null;
              return (
                <span key={r} className="px-1.5 py-0.5 rounded text-[10px] font-black"
                  style={{ background: RARITY_META[r].color + '22', color: RARITY_META[r].color, border: `1px solid ${RARITY_META[r].color}44` }}>
                  {RARITY_META[r].label} {c}
                </span>
              );
            })}
            {captures.length === 0 && <span className="text-[10px] text-dex-muted">尚無收藏</span>}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="px-4 py-4">
        <button
          onClick={resetAll}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dex-accent/30 text-dex-accent text-xs font-bold hover:bg-dex-accent/10 transition"
        >
          <Trash2 size={14} /> 重置所有捕捉記錄（謹慎操作）
        </button>
      </div>

      <div className="text-center text-[10px] text-white/30 font-mono pb-8">
        © 2026 SKWSCOUT
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarSelect && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-dex-bg border-t border-dex-border rounded-t-3xl p-6 pb-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">更換角色形象</h3>
              <button onClick={() => setShowAvatarSelect(false)} className="text-dex-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {AVATARS.map((av) => {
                const isUnlocked = profile.level >= av.unlockLevel;
                const isSelected = profile.avatar === av.emoji || (!profile.avatar && av.emoji === '🥾');
                return (
                  <button
                    key={av.emoji}
                    onClick={() => {
                      if (isUnlocked) {
                        updateProfileAvatar(av.emoji);
                        setShowAvatarSelect(false);
                      }
                    }}
                    disabled={!isUnlocked}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                      isSelected 
                        ? 'bg-dex-neon/20 border-2 border-dex-neon' 
                        : isUnlocked 
                          ? 'bg-dex-surface border-2 border-dex-border hover:border-dex-muted' 
                          : 'bg-dex-surface/50 border-2 border-dex-border/50 opacity-50'
                    }`}
                  >
                    <span className="text-4xl">{av.emoji}</span>
                    <span className="text-[10px] font-bold text-dex-muted">{av.desc}</span>
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white bg-black/80 px-2 py-1 rounded">Lv.{av.unlockLevel} 解鎖</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
