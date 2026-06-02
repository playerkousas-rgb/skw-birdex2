import { useState, useCallback, useEffect } from 'react';
import { CaptureRecord, TrainerProfile, Rarity, CaptureResult } from '../types';
import { BIRD_SPECIES } from '../data/birdData';
import { getRarityFromCount, xpForCapture, getLevelFromXp } from '../lib/theme';

const STORAGE_KEY = 'bd_collection_v2';
const PROFILE_KEY = 'bd_profile_v1';

interface StoredData {
  captures: CaptureRecord[];
  version: number;
}

function loadStored(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { captures: [], version: 2 };
}

function saveStored(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadProfile(): TrainerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    name: '見習訓練師',
    xp: 0,
    level: 1,
    title: '見習觀鳥員',
    totalCaptures: 0,
    uniqueSpecies: 0,
    joinedAt: new Date().toISOString(),
    avatar: '🥾',
  };
}

function saveProfile(profile: TrainerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function useCollection() {
  const [captures, setCaptures] = useState<CaptureRecord[]>(() => loadStored().captures);
  const [profile, setProfile] = useState<TrainerProfile>(() => loadProfile());

  useEffect(() => {
    saveStored({ captures, version: 2 });
  }, [captures]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const getCapture = useCallback((speciesId: number): CaptureRecord | undefined => {
    return captures.find(c => c.speciesId === speciesId);
  }, [captures]);

  const hasCaptured = useCallback((speciesId: number): boolean => {
    return captures.some(c => c.speciesId === speciesId);
  }, [captures]);

  const captureBird = useCallback((speciesId: number, opts?: { photoDataUrl?: string; location?: { lat: number; lng: number } | null }): CaptureResult => {
    const species = BIRD_SPECIES.find(b => b.id === speciesId);
    if (!species) throw new Error('Unknown species');

    const existing = captures.find(c => c.speciesId === speciesId);
    const isNew = !existing;
    const now = new Date().toISOString();

    let record: CaptureRecord;
    if (existing) {
      const newCount = existing.count + 1;
      const newRarity = getRarityFromCount(newCount);
      record = {
        ...existing,
        count: newCount,
        currentRarity: newRarity,
        lastCaptureDate: now,
        photoDataUrl: opts?.photoDataUrl ?? existing.photoDataUrl,
        location: opts?.location ?? existing.location,
      };
    } else {
      record = {
        speciesId,
        capturedAt: now,
        count: 1,
        currentRarity: getRarityFromCount(1),
        firstCaptureDate: now,
        lastCaptureDate: now,
        location: opts?.location ?? null,
        photoDataUrl: opts?.photoDataUrl ?? null,
      };
    }

    const newCaptures = isNew
      ? [...captures, record]
      : captures.map(c => c.speciesId === speciesId ? record : c);

    setCaptures(newCaptures);

    const oldRarity: Rarity = existing?.currentRarity ?? 'UC';
    const xpGained = xpForCapture(record.currentRarity);
    const newTotalXp = profile.xp + xpGained;
    const levelInfo = getLevelFromXp(newTotalXp);

    setProfile(prev => ({
      ...prev,
      xp: newTotalXp,
      level: levelInfo.level,
      title: levelInfo.title,
      totalCaptures: prev.totalCaptures + 1,
      uniqueSpecies: newCaptures.length,
    }));

    return {
      record,
      isNew,
      oldRarity,
      newRarity: record.currentRarity,
      xpGained,
      species,
      failed: false,
    };
  }, [captures, profile]);

  const updateProfileName = useCallback((name: string) => {
    setProfile(prev => ({ ...prev, name }));
  }, []);

  const updateProfileAvatar = useCallback((avatar: string) => {
    setProfile(prev => ({ ...prev, avatar }));
  }, []);

  const resetAll = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('確定要重置所有捕捉記錄與等級？此動作無法復原！')) {
      setCaptures([]);
      setProfile({
        name: '見習訓練師',
        xp: 0,
        level: 1,
        title: '見習觀鳥員',
        totalCaptures: 0,
        uniqueSpecies: 0,
        joinedAt: new Date().toISOString(),
        avatar: '🥾',
      });
    }
  }, []);

  // Admin Backdoor
  const unlockAll = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('【開發者模式】是否要解鎖全圖鑑並升級至傳說？')) {
      const now = new Date().toISOString();
      const allRecords: CaptureRecord[] = BIRD_SPECIES.map(b => ({
        speciesId: b.id,
        capturedAt: now,
        count: 25, // LR Rarity
        currentRarity: 'LR',
        firstCaptureDate: now,
        lastCaptureDate: now,
        photoDataUrl: null,
      }));
      setCaptures(allRecords);
      setProfile({
        name: '創造神',
        xp: 99999,
        level: 12,
        title: '飛羽傳奇',
        totalCaptures: BIRD_SPECIES.length * 25,
        uniqueSpecies: BIRD_SPECIES.length,
        joinedAt: new Date().toISOString(),
        avatar: '👑',
      });
    }
  }, []);

  const totalUnique = captures.length;
  const totalCount = captures.reduce((sum, c) => sum + c.count, 0);

  return {
    captures,
    profile,
    getCapture,
    hasCaptured,
    captureBird,
    updateProfileName,
    updateProfileAvatar,
    resetAll,
    unlockAll, // 出口 admin backdoor
    totalUnique,
    totalCount,
  };
}
