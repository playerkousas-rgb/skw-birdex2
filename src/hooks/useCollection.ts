import { useState, useCallback, useEffect } from 'react';
import { CaptureRecord, TrainerProfile, Rarity, CaptureResult } from '../types';
import { BIRD_SPECIES } from '../data/birdData';
import { getRarityFromCount, xpForCapture, getLevelFromXp } from '../lib/theme';

const STORAGE_KEY = 'bd_collection_v2';
const PROFILE_KEY = 'bd_profile_v1';
const SETTINGS_KEY = 'bd_settings_v1';
const ALTART_KEY  = 'bd_altart_v1';

interface StoredData {
  captures: CaptureRecord[];
  version: number;
}

/** 異圖卡（精靈化版本）使用模式 */
export type AltArtMode = 'off' | 'high-rarity' | 'all';

export interface AppSettings {
  altArtMode: AltArtMode;
}

/**
 * 異圖卡狀態資料
 *   unlocked : 用戶已「擁有」的異圖卡 id（達到 UR / 創世神解鎖）
 *   existsOnR2 : R2 上實際存在的異圖卡 id（前端首次嘗試載入時自動偵測）
 *   missingOnR2 : 已確認 R2 上不存在的 id（不再重複偵測）
 */
export interface AltArtState {
  unlocked: number[];
  existsOnR2: number[];
  missingOnR2: number[];
}

const DEFAULT_SETTINGS: AppSettings = {
  altArtMode: 'high-rarity', // 預設：只有 UR/LR 用異圖卡
};

const DEFAULT_ALTART: AltArtState = {
  unlocked: [],
  existsOnR2: [],
  missingOnR2: [],
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadAltArt(): AltArtState {
  try {
    const raw = localStorage.getItem(ALTART_KEY);
    if (raw) return { ...DEFAULT_ALTART, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_ALTART;
}

function saveAltArt(s: AltArtState) {
  localStorage.setItem(ALTART_KEY, JSON.stringify(s));
}

function loadStored(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { captures: [], version: 2 };
}

function saveStored(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage 配額不足（照片太多張時常見）
    // 降級：先丟棄照片（photoDataUrl），只保留捕捉記錄
    try {
      const slim: StoredData = {
        ...data,
        captures: data.captures.map(c => ({ ...c, photoDataUrl: null })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      console.warn('[collection] localStorage 配額不足，已降級為不儲存照片。');
    } catch {
      // 連記錄都存不進去（極端情況）→ 放棄本次儲存，避免 App 崩潰
      console.error('[collection] localStorage 儲存失敗：', e);
    }
  }
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
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [altArt, setAltArt] = useState<AltArtState>(() => loadAltArt());

  useEffect(() => { saveStored({ captures, version: 2 }); }, [captures]);
  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveAltArt(altArt); }, [altArt]);

  const setAltArtMode = useCallback((mode: AltArtMode) => {
    setSettings(prev => ({ ...prev, altArtMode: mode }));
  }, []);

  /** 把鳥的異圖卡標記為「已解鎖」(達 UR 自動 / 創世神後門) */
  const unlockAltArt = useCallback((speciesId: number) => {
    setAltArt(prev => prev.unlocked.includes(speciesId)
      ? prev
      : { ...prev, unlocked: [...prev.unlocked, speciesId] });
  }, []);

  /** 前端首次載入時呼叫：標記 R2 上「確實存在」此異圖卡 */
  const markAltArtExists = useCallback((speciesId: number) => {
    setAltArt(prev => {
      if (prev.existsOnR2.includes(speciesId)) return prev;
      return {
        ...prev,
        existsOnR2: [...prev.existsOnR2, speciesId],
        missingOnR2: prev.missingOnR2.filter(id => id !== speciesId),
      };
    });
  }, []);

  /** 標記 R2 上「不存在」此異圖卡（載入 404 時呼叫，避免日後再請求） */
  const markAltArtMissing = useCallback((speciesId: number) => {
    setAltArt(prev => {
      if (prev.missingOnR2.includes(speciesId)) return prev;
      return {
        ...prev,
        missingOnR2: [...prev.missingOnR2, speciesId],
        existsOnR2: prev.existsOnR2.filter(id => id !== speciesId),
      };
    });
  }, []);

  /**
   * 真正能不能顯示異圖卡：
   *   ① 模式允許 && ② 用戶已解鎖 && ③ R2 上確實存在（或還沒偵測過）
   */
  const canShowAltArt = useCallback((speciesId: number, rarity: Rarity): boolean => {
    // 模式檢查
    const isHigh = rarity === 'UR' || rarity === 'LR';
    const allowedByMode =
      settings.altArtMode === 'all' ||
      (settings.altArtMode === 'high-rarity' && isHigh);
    if (!allowedByMode) return false;

    // 用戶要先「擁有」才能用
    if (!altArt.unlocked.includes(speciesId)) return false;

    // R2 上已確認不存在 → 不嘗試
    if (altArt.missingOnR2.includes(speciesId)) return false;

    return true;
  }, [settings.altArtMode, altArt]);

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

    // 達 UR 自動解鎖該鳥的異圖卡（王者權利 #1）
    if (record.currentRarity === 'UR' || record.currentRarity === 'LR') {
      setAltArt(prev => prev.unlocked.includes(speciesId)
        ? prev
        : { ...prev, unlocked: [...prev.unlocked, speciesId] });
    }

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
      // 重置時清空已解鎖的異圖卡，但保留 R2 偵測快取（避免重新測一輪 404）
      setAltArt(prev => ({ ...prev, unlocked: [] }));
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
      // 王者權利 #2：創世神後門 → 解鎖全部異圖卡權限
      // R2 上不存在的還是會被自動偵測機制濾掉
      setAltArt(prev => ({
        ...prev,
        unlocked: BIRD_SPECIES.map(b => b.id),
      }));
    }
  }, []);

  const totalUnique = captures.length;
  const totalCount = captures.reduce((sum, c) => sum + c.count, 0);

  return {
    captures,
    profile,
    settings,
    altArt,
    setAltArtMode,
    unlockAltArt,
    markAltArtExists,
    markAltArtMissing,
    canShowAltArt,
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
