import { useState } from 'react';
import { CollectionProvider } from './context/CollectionContext';
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


  const handleCapture = (result: CaptureResultType) => {
    setLastCapture(result);
    setView('capture-result');
  };

  const handleCloseCapture = () => {
    setView('album');
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
      setView('album');
    } else {
      setView('dex');
    }
  };

  return (
    <div className="h-screen w-screen bg-dex-bg text-dex-text overflow-hidden flex flex-col relative">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {view === 'scanner' && (
          <ScannerScreen
            onCapture={handleCapture}
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
      {view !== 'capture-result' && view !== 'detail' && (
        <Navbar current={view} onNavigate={setView} />
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
