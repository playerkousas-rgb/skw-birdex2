import { useCollectionContext } from '../context/CollectionContext';
import { getBirdById } from '../data/birdData';
import { RARITY_META } from '../lib/theme';
import { ArrowLeft, Share2, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface BirdDetailScreenProps {
  speciesId: number;
  onBack: () => void;
}

export function BirdDetailScreen({ speciesId, onBack }: BirdDetailScreenProps) {
  const bird = getBirdById(speciesId);
  const { captures, canShowAltArt, markAltArtExists, markAltArtMissing, altArt } = useCollectionContext();
  const capture = captures.find(c => c.speciesId === speciesId);
  const isCaught = !!capture;

  const rarity = capture?.currentRarity ?? 'UC';
  const wantsAltArt = bird ? canShowAltArt(bird.id, rarity) : false;
  const heroImageUrl = bird?.photoUrl
    ? (wantsAltArt ? bird.photoUrl.replace('.avif', '_UR.avif') : bird.photoUrl)
    : null;

  // 判斷異圖卡解鎖狀態（給 UI 提示用）
  const altArtUnlocked = bird ? altArt.unlocked.includes(bird.id) : false;
  const altArtExists   = bird ? altArt.existsOnR2.includes(bird.id) : false;
  const altArtMissing  = bird ? altArt.missingOnR2.includes(bird.id) : false;

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `我捕捉到了 ${bird.name}！`,
          text: `我在 BIRD-DEX 2 中捕捉到了 ${rarityMeta?.labelZh || ''} 級的 ${bird.name}（${bird.nameEn}），快來一起尋找鳥精靈吧！`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      alert('您的裝置不支援快速分享功能，請直接截圖分享給朋友吧！');
    }
  };

  const handleExternalLink = () => {
    // 這裡我們直接傳遞 ID 過去，這樣如果 AvianDex 有支援 query parameter 可以直接打開對應的鳥
    window.open(`https://skw-aviandex.vercel.app?search=${encodeURIComponent(bird.name)}`, '_blank');
  };

  return (
    <div className="min-h-full bg-dex-bg pb-8 relative flex flex-col">
      {/* Hero image 佔據較大的版面，因為這個 APP 的重點就是看卡牌 */}
      <div className="relative aspect-[3/4] w-full max-w-md mx-auto shrink-0 mt-4 px-4">
        <div className="absolute inset-0 px-4">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 border-gray-800 bg-gray-900 relative">
            {heroImageUrl && isCaught ? (
              <img
                src={heroImageUrl}
                alt={bird.name}
                className="w-full h-full object-cover"
                onLoad={() => {
                  if (wantsAltArt) markAltArtExists(bird.id);
                }}
                onError={(e) => {
                  // 異圖卡載入失敗 → 記錄到 missing 並退回普通圖
                  const img = e.currentTarget;
                  if (wantsAltArt) markAltArtMissing(bird.id);
                  if (bird.photoUrl && img.src !== bird.photoUrl) {
                    img.src = bird.photoUrl;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 relative">
                <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(180deg, ${bird.baseColor} 0%, transparent 100%)` }} />
                <span className="text-8xl opacity-10 mb-4">{bird.emoji}</span>
                <span className="text-gray-600 font-black tracking-widest">NO DATA</span>
              </div>
            )}

            {/* 異圖卡狀態徽章（右上角） */}
            {isCaught && (
              <div className="absolute top-3 right-3 z-10">
                {wantsAltArt && !altArtMissing ? (
                  <div className="px-2 py-1 rounded-md bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-[10px] font-black tracking-wider shadow-lg flex items-center gap-1 border border-white/30">
                    ✨ ALT ART
                  </div>
                ) : altArtUnlocked && altArtMissing ? (
                  <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white/70 text-[10px] font-bold tracking-wider border border-white/10">
                    異圖卡尚未繪製
                  </div>
                ) : altArtUnlocked && !altArtExists ? null : !altArtUnlocked && isCaught && rarity !== 'UR' && rarity !== 'LR' ? (
                  <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white/60 text-[10px] font-bold tracking-wider border border-white/10 flex items-center gap-1">
                    🔒 達 UR 解鎖異圖
                  </div>
                ) : null}
              </div>
            )}

            {/* 卡牌下方的黑框資訊區 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-12 pb-4 px-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-400 font-mono mb-0.5">NO.{String(bird.id).padStart(4, '0')}</div>
                  <h1 className="text-3xl font-black text-white leading-tight truncate drop-shadow-md">{bird.name}</h1>
                  <p className="text-sm text-gray-300 truncate font-bold">{bird.nameEn}</p>
                </div>
                {rarityMeta && (
                  <div className="px-3 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-lg shrink-0 border border-white/20"
                    style={{ background: rarityMeta.gradient, color: rarityMeta.textColor }}>
                    {rarityMeta.label}
                  </div>
                )}
              </div>
            </div>

            {/* 如果有全息閃卡特效 */}
            {isCaught && rarityMeta && ['SSR', 'UR', 'LR'].includes(capture.currentRarity) && (
              <div className="absolute inset-0 foil-shimmer pointer-events-none" />
            )}
          </div>
        </div>

        {/* Top Buttons */}
        <div className="absolute top-4 left-6 right-6 flex justify-between z-10">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition shadow-lg"
          >
            <ArrowLeft size={24} />
          </button>
          
          {isCaught && (
            <button
              onClick={handleShare}
              className="w-12 h-12 rounded-full bg-dex-neon/90 backdrop-blur-md border-2 border-dex-neon flex items-center justify-center text-black hover:bg-white transition shadow-[0_0_20px_rgba(0,240,255,0.6)]"
            >
              <Share2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 mt-2 space-y-4 max-w-md mx-auto w-full">
        
        {/* 簡單的統計與 AvianDex 導流 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          {/* 背景裝飾 */}
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <ImageIcon size={150} />
          </div>

          {!isCaught ? (
            <div className="flex flex-col items-center text-center gap-3 py-2 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-3xl shadow-inner">
                🔒
              </div>
              <div>
                <p className="text-lg font-black text-white mb-1">尚未捕獲</p>
                <p className="text-xs text-gray-400">這隻鳥精靈尚未登錄至你的相簿中。去戶外尋找牠的蹤跡吧！</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs text-gray-500 font-black tracking-widest mb-1">捕捉紀錄</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{capture.count}</span>
                  <span className="text-sm text-gray-400 font-bold mb-1">次</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  首次發現：{new Date(capture.firstCaptureDate).toLocaleDateString('zh-HK')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-black tracking-widest mb-1">當前階級</p>
                <p className="text-xl font-black" style={{ color: rarityMeta?.color }}>
                  {rarityMeta?.labelZh}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* External Link */}
        <button 
          onClick={handleExternalLink}
          className="w-full flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-gray-900 border border-blue-500/30 text-white font-bold shadow-lg active:scale-95 transition group"
        >
          <div className="text-left">
            <div className="text-sm font-black text-blue-400 tracking-widest mb-0.5">AvianDex 圖鑑</div>
            <div className="text-xs text-gray-300">查看完整生態特徵與觀鳥熱點</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <ExternalLink size={18} />
          </div>
        </button>

      </div>
    </div>
  );
}
