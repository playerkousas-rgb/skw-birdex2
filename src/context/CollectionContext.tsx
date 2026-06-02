import React, { createContext, useContext } from 'react';
import { useCollection } from '../hooks/useCollection';

interface CollectionContextValue {
  captures: ReturnType<typeof useCollection>['captures'];
  profile: ReturnType<typeof useCollection>['profile'];
  getCapture: ReturnType<typeof useCollection>['getCapture'];
  hasCaptured: ReturnType<typeof useCollection>['hasCaptured'];
  captureBird: ReturnType<typeof useCollection>['captureBird'];
  updateProfileName: ReturnType<typeof useCollection>['updateProfileName'];
  updateProfileAvatar: ReturnType<typeof useCollection>['updateProfileAvatar'];
  resetAll: ReturnType<typeof useCollection>['resetAll'];
  totalUnique: number;
  totalCount: number;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const collection = useCollection();
  return (
    <CollectionContext.Provider value={collection}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollectionContext() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollectionContext must be used within CollectionProvider');
  return ctx;
}
