import { useState } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { BIRD_SPECIES, getBirdById } from '../data/birdData';
import { RARITY_META } from '../lib/theme';
import { X } from 'lucide-react';

/** 夥伴鳥：選一隻已捕捉的鳥當夥伴，捕捉牠時有額外 XP 加成 */
export function CompanionSection() {
  const { captures, companionId, setCompanion } = useCollectionContext();
  const [open, setOpen] = useState(false);

  const companion = companionId !== null ? getBirdById(companionId) : null;
  const companionCapture = companion ? captures.find(c => c.speciesId === companionId) : null;

  return (
    <div className="px-4 pt-2 pb-2">
      <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">❤️</span>
          <h3 className="text-sm font-black text-white tracking-wide">我的夥伴鳥</h3>
          <button
            onClick={() => setOpen(true)}
            className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-lg bg-dex-neon/15 border border-dex-neon/40 text-dex-neon hover:bg-dex-neon/25 transition"
          >
            {companion ? '更換夥伴' : '選擇夥伴'}
          </button>
        </div>

        {companion ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-dex-neon/10 to-dex-accent/10 border border-dex-neon/30">
            {companion.photoUrl ? (
              <img src={companion.photoUrl} alt={companion.name} className="w-14 h-14 rounded-xl object-cover border border-dex-neon/40" />
            ) : (
              <span className="w-14 h-14 rounded-xl bg-dex-border flex items-center justify-center text-3xl">{companion.emoji}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white truncate">{companion.name}</div>
              <div className="text-[10px] text-dex-muted truncate">{companion.nameEn}</div>
              <div className="flex items-center gap-2 mt-1 text-[10px]">
                {companionCapture && (
                  <>
                    <span className="px-1.5 py-0.5 rounded font-black text-white" style={{ background: RARITY_META[companionCapture.currentRarity].gradient }}>
                      {RARITY_META[companionCapture.currentRarity].labelZh}
                    </span>
                    <span className="text-dex-muted">親密度 Lv.{Math.min(5, Math.floor(companionCapture.count / 3) + 1)} · 捕捉 {companionCapture.count} 次</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-dex-gold">捕捉夥伴</div>
              <div className="text-[10px] font-black text-dex-gold">+{2} XP</div>
            </div>
          </div>
        ) : (
          <p className="text-center text-[11px] text-dex-muted py-2">
            選一隻你捕捉過的鳥當夥伴，牠會在這裡陪你，
            <br />
            之後再捕捉到牠會獲得 <span className="text-dex-gold font-bold">+2 XP</span> 夥伴加成！
          </p>
        )}

        {/* 夥伴選擇視窗 */}
        {open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-dex-bg border-t border-dex-border rounded-t-3xl p-5 pb-10 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-black text-white">選擇夥伴鳥</h4>
                <button onClick={() => setOpen(false)} className="text-dex-muted hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {companionId !== null && (
                <button
                  onClick={() => { setCompanion(null); setOpen(false); }}
                  className="w-full mb-3 py-2 rounded-xl border border-dex-border text-dex-muted text-xs font-bold hover:bg-white/5 transition"
                >
                  解除夥伴
                </button>
              )}
              <div className="grid grid-cols-4 gap-2.5">
                {captures.map(c => {
                  const b = BIRD_SPECIES.find(x => x.id === c.speciesId);
                  if (!b) return null;
                  const selected = c.speciesId === companionId;
                  return (
                    <button
                      key={c.speciesId}
                      onClick={() => { setCompanion(c.speciesId); setOpen(false); }}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition ${
                        selected ? 'border-dex-neon shadow-lg shadow-dex-neon/30' : 'border-transparent opacity-80'
                      }`}
                    >
                      {b.photoUrl ? (
                        <img src={b.photoUrl} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-2xl bg-dex-border">{b.emoji}</span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-4 pb-1 px-1">
                        <span className="text-[8px] font-bold text-white truncate block">{b.name}</span>
                      </div>
                      {selected && <span className="absolute top-1 right-1 text-xs">❤️</span>}
                    </button>
                  );
                })}
              </div>
              {captures.length === 0 && (
                <p className="text-center text-xs text-dex-muted py-8">先去捕捉一隻鳥，才能選擇夥伴喔！</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
