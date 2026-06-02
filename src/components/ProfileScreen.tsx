import { useState } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { BIRD_SPECIES } from '../data/birdData';
import { getLevelFromXp, RARITY_ORDER, RARITY_META } from '../lib/theme';
import { User, Edit3, Award, Feather, Target, Trash2, Check } from 'lucide-react';

export function ProfileScreen() {
  const { profile, captures, totalCount, resetAll, updateProfileName } = useCollectionContext();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const levelInfo = getLevelFromXp(profile.xp);

  const saveName = () => {
    if (nameDraft.trim()) updateProfileName(nameDraft.trim());
    setEditing(false);
  };

  const completion = Math.round((captures.length / BIRD_SPECIES.length) * 100);

  return (
    <div className="min-h-full bg-dex-bg pb-24">
      {/* Header banner */}
      <div className="relative bg-gradient-to-b from-dex-surface to-dex-bg border-b border-dex-border px-4 pt-6 pb-8">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Award size={120} />
        </div>

        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-dex-border border-2 border-dex-neon/30 flex items-center justify-center text-3xl shadow-lg shadow-dex-neon/10">
            {profile.level >= 10 ? '👑' : profile.level >= 7 ? '🦅' : profile.level >= 4 ? '🔭' : '🥾'}
          </div>
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
                </div>
              )}
            </div>
            <div className="text-xs text-dex-neon font-bold tracking-wider mt-0.5">
              Lv.{profile.level} · {profile.title}
            </div>
            <div className="text-[10px] text-dex-muted mt-1">
              加入於 {new Date(profile.joinedAt).toLocaleDateString('zh-HK')}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] text-dex-muted mb-1">
            <span>XP {profile.xp}</span>
            <span>{levelInfo.nextXp ? `下一級 ${levelInfo.nextXp} XP` : '已達最高等級'}</span>
          </div>
          <div className="h-2.5 rounded-full bg-dex-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-dex-neon to-dex-accent transition-all duration-700"
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
    </div>
  );
}
