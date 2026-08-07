import { useCollectionContext } from '../context/CollectionContext';
import { QuestDef } from '../lib/gamification';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 每日任務區塊（訓練師頁） */
export function DailyQuests() {
  const { todayQuests, questState, claimQuest } = useCollectionContext();
  // 跨日但還沒觸發任何事件時，progress 仍是舊的 → 視為新一天（全 0）
  const isToday = questState.date === todayStr();
  const progOf = (qid: string) => (isToday ? (questState.progress[qid] ?? 0) : 0);
  const completed = isToday ? questState.completed : [];

  return (
    <div className="px-4 pt-2 pb-2">
      <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📋</span>
          <h3 className="text-sm font-black text-white tracking-wide">今日任務</h3>
          <span className="text-[10px] text-dex-muted ml-auto">完成任務拿 XP，認識更多鳥！</span>
        </div>

        <div className="space-y-2">
          {todayQuests.map((q: QuestDef) => {
            const prog = progOf(q.id);
            const done = completed.includes(q.id);
            const canClaim = !done && prog >= q.target;
            const pct = Math.min(100, (prog / q.target) * 100);
            return (
              <div
                key={q.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                  done ? 'bg-dex-neon/10 border-dex-neon/40' : 'bg-dex-bg border-dex-border'
                }`}
              >
                <span className="text-xl shrink-0">{q.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{q.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-dex-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-dex-neon to-dex-accent transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-dex-muted shrink-0">
                      {Math.min(prog, q.target)}/{q.target}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {done ? (
                    <span className="text-[10px] font-black text-dex-neon px-2 py-1 rounded-lg bg-dex-neon/10 border border-dex-neon/30">
                      ✓ 已領取
                    </span>
                  ) : canClaim ? (
                    <button
                      onClick={() => claimQuest(q)}
                      className="text-[10px] font-black text-dex-bg px-3 py-1.5 rounded-lg bg-dex-gold hover:brightness-110 active:scale-95 transition shadow"
                    >
                      +{q.xp} 領取
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-dex-muted px-2 py-1 rounded-lg bg-black/20">
                      +{q.xp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-dex-muted mt-3 text-center leading-relaxed">
          任務每天自動更新（依日期輪換）· 完成後記得按「領取」才會拿到 XP
        </p>
      </div>
    </div>
  );
}
