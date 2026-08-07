// ============================================================
// 遊戲化核心定義：每日任務、成就徽章、熱點距離
// （純邏輯，不含 UI）
// ============================================================
import { CaptureRecord, TrainerProfile } from '../types';
import { HOTSPOTS } from '../data/hotspots';

// ── 每日任務 ──

export interface QuestDef {
  id: string;
  title: string;
  target: number;
  xp: number;
  icon: string;
}

/** 任務池：每天輪流抽 3 個（按日期輪替，不是亂數，每天固定） */
export const QUEST_POOL: QuestDef[] = [
  { id: 'capture1',  title: '捕捉 1 隻鳥',        target: 1, xp: 15, icon: '📸' },
  { id: 'capture3',  title: '捕捉 3 隻鳥',        target: 3, xp: 30, icon: '🎯' },
  { id: 'species3',  title: '捕捉 3 種不同的鳥',   target: 3, xp: 30, icon: '🐦' },
  { id: 'zoom1',     title: '用變焦捕捉 1 隻鳥',   target: 1, xp: 20, icon: '🔭' },
  { id: 'hotspot1',  title: '在觀鳥熱點捕捉 1 隻', target: 1, xp: 20, icon: '🗺️' },
  { id: 'view3',     title: '查看 3 隻鳥的詳細資料', target: 3, xp: 15, icon: '📖' },
  { id: 'attempt5',  title: '進行 5 次捕捉嘗試',   target: 5, xp: 20, icon: '⚡' },
];

export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

/** 今天的 3 個任務（按日期固定輪替） */
export function questsForToday(d: Date = new Date()): QuestDef[] {
  const seed = dayOfYear(d);
  return [0, 1, 2].map(i => QUEST_POOL[(seed + i) % QUEST_POOL.length]);
}

// ── 成就徽章 ──

export interface AchContext {
  captures: CaptureRecord[];
  profile: TrainerProfile;
  streakStreak: number;
  streakTotalLogins: number;
  totalQuests: number;
  hotspotCount: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (ctx: AchContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-capture', title: '初次捕捉', desc: '捕捉你的第一隻鳥精靈', icon: '🎯', check: c => c.captures.length >= 1 },
  { id: 'species-10', title: '小小收藏家', desc: '收集 10 種鳥', icon: '🐦', check: c => c.captures.length >= 10 },
  { id: 'species-25', title: '觀鳥新星', desc: '收集 25 種鳥', icon: '🪶', check: c => c.captures.length >= 25 },
  { id: 'species-50', title: '羽翼收藏家', desc: '收集 50 種鳥', icon: '🦅', check: c => c.captures.length >= 50 },
  { id: 'species-100', title: '百鳥朝凰', desc: '收集 100 種鳥', icon: '🐉', check: c => c.captures.length >= 100 },
  { id: 'captures-50', title: '捕捉高手', desc: '累計捕捉 50 次', icon: '📸', check: c => c.profile.totalCaptures >= 50 },
  { id: 'level-5', title: '資深訓練師', desc: '訓練師達到 Lv.5', icon: '⭐', check: c => c.profile.level >= 5 },
  { id: 'level-10', title: '傳說訓練師', desc: '訓練師達到 Lv.10', icon: '👑', check: c => c.profile.level >= 10 },
  { id: 'first-lr', title: '傳說降臨', desc: '擁有一隻 LR 傳說鳥', icon: '💎', check: c => c.captures.some(r => r.currentRarity === 'LR') },
  { id: 'shiny-1', title: '幸運兒', desc: '捕捉第一隻色違鳥', icon: '🌈', check: c => c.captures.filter(r => r.shiny).length >= 1 },
  { id: 'shiny-5', title: '色違收藏家', desc: '擁有 5 隻色違鳥', icon: '🌟', check: c => c.captures.filter(r => r.shiny).length >= 5 },
  { id: 'streak-7', title: '風雨無阻', desc: '連續登入 7 天', icon: '🔥', check: c => c.streakStreak >= 7 },
  { id: 'login-30', title: '忠實鳥友', desc: '累計登入 30 天', icon: '📅', check: c => c.streakTotalLogins >= 30 },
  { id: 'quests-10', title: '任務新手', desc: '完成 10 個每日任務', icon: '✅', check: c => c.totalQuests >= 10 },
  { id: 'quests-50', title: '任務達人', desc: '完成 50 個每日任務', icon: '🏅', check: c => c.totalQuests >= 50 },
  { id: 'hotspots-5', title: '探索者', desc: '蓋下 5 個觀鳥熱點圖章', icon: '🗺️', check: c => c.hotspotCount >= 5 },
  { id: 'hotspots-all', title: '香港走透透', desc: '集齊全部 27 個觀鳥熱點', icon: '🏆', check: c => c.hotspotCount >= Object.keys(HOTSPOTS).length },
  { id: 'photos-10', title: '回憶相簿', desc: '拍下 10 張捕捉照片', icon: '🖼️', check: c => c.captures.filter(r => r.photoDataUrl).length >= 10 },
];

// ── 熱點距離 ──

/** 回傳 (lat,lng) 半徑 radiusM 內的所有熱點 key */
export function hotspotsNear(lat: number, lng: number, radiusM = 2000): string[] {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const out: string[] = [];
  for (const [key, h] of Object.entries(HOTSPOTS)) {
    const dLat = toRad(h.lat - lat);
    const dLng = toRad(h.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(h.lat)) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * R * Math.asin(Math.sqrt(a));
    if (dist <= radiusM) out.push(key);
  }
  return out;
}
