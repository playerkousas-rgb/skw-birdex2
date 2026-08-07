import { useState } from 'react';
import { CollectionProvider, useCollectionContext } from './context/CollectionContext';
import { View, CaptureResult as CaptureResultType } from './types';
import { Navbar } from './components/Navbar';
import { ScannerScreen } from './components/ScannerScreen';
import { DexScreen } from './components/DexScreen';
import { AlbumScreen } from './components/AlbumScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { CaptureResultScreen } from './components/CaptureResultScreen';
import { BirdDetailScreen } from './components/BirdDetailScreen';

function AppRouter() {
  const [view, setView] = useState<View>('dex');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null);
  const [lastCapture, setLastCapture] = useState<CaptureResultType | null>(null);
  const [scannerBusy, setScannerBusy] = useState(false);
  const { unlockToast } = useCollectionContext();


  const handleCapture = (result: CaptureResultType) => {
    setLastCapture(result);
    setView('capture-result');
  };

  const handleCloseCapture = () => {
    // 捕捉失敗 → 回掃描器重試；捕捉成功 → 回收藏冊看新卡
    setView(lastCapture?.failed ? 'scanner' : 'album');
    setLastCapture(null);
  };

  const handleSelectSpecies = (id: number) => {
    setSelectedSpeciesId(id);
    setView('detail');
  };

  const handleBack = () => {
    if (view === 'detail') {
      setSelectedSpeciesId(null);
      setView('dex');
    } else if (view === 'capture-result') {
      setLastCapture(null);
      setView(lastCapture?.failed ? 'scanner' : 'album');
    } else {
      setView('dex');
    }
  };

  return (
    <div className="app-shell w-screen bg-dex-bg text-dex-text overflow-hidden flex flex-col relative">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {view === 'scanner' && (
          <ScannerScreen
            onCapture={handleCapture}
            onBusyChange={setScannerBusy}
          />
        )}

        {view === 'dex' && (
          <DexScreen
            onSelectSpecies={handleSelectSpecies}
          />
        )}
        {view === 'album' && (
          <AlbumScreen
            onSelectSpecies={handleSelectSpecies}
          />
        )}
        {view === 'profile' && (
          <ProfileScreen />
        )}
        {view === 'detail' && selectedSpeciesId !== null && (
          <BirdDetailScreen
            speciesId={selectedSpeciesId}
            onBack={handleBack}
          />
        )}
        {view === 'capture-result' && lastCapture && (
          <CaptureResultScreen
            result={lastCapture}
            onClose={handleCloseCapture}
          />
        )}
      </div>

      {/* Bottom Nav */}
      {view !== 'capture-result' && view !== 'detail' && !scannerBusy && (
        <Navbar current={view} onNavigate={setView} />
      )}

      {/* 成就解鎖通知 */}
      {unlockToast && (
        <div
          key={unlockToast.id}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-bounce"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-dex-gold/95 to-dex-accent/95 text-white shadow-[0_0_30px_rgba(255,215,0,0.5)] border border-white/30 backdrop-blur">
            <span className="text-lg">🏆</span>
            <div>
              <div className="text-[9px] font-black tracking-widest text-white/80">成就解鎖</div>
              <div className="text-xs font-black">{unlockToast.title}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CollectionProvider>
      <AppRouter />
    </CollectionProvider>
  );
}
