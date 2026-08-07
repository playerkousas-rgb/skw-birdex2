import { useCollectionContext } from '../context/CollectionContext';
import { ACHIEVEMENTS } from '../lib/gamification';

/** 成就徽章牆（訓練師頁） */
export function AchievementWall() {
  const { achState } = useCollectionContext();
  const unlockedCount = Object.keys(achState.unlockedAt).length;

  return (
    <div className="px-4 pt-2 pb-2">
      <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🏆</span>
          <h3 className="text-sm font-black text-white tracking-wide">成就徽章</h3>
          <span className="text-[10px] font-mono text-dex-neon ml-auto">
            {unlockedCount} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <p className="text-[10px] text-dex-muted mb-3">達成條件自動解鎖，捕捉路上處處有驚喜</p>

        <div className="grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map(a => {
            const unlocked = !!achState.unlockedAt[a.id];
            return (
              <div
                key={a.id}
                title={a.title}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition ${
                  unlocked
                    ? 'bg-gradient-to-b from-dex-neon/15 to-dex-accent/10 border-dex-neon/40'
                    : 'bg-dex-bg border-dex-border/60 opacity-60'
                }`}
              >
                <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                <span className={`text-[8px] font-bold text-center leading-tight px-0.5 ${unlocked ? 'text-white/90' : 'text-dex-muted'}`}>
                  {a.title}
                </span>
                {!unlocked && (
                  <span className="absolute top-1 right-1 text-[9px]">🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
