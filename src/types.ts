export type Rarity = 'UC' | 'C' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export interface Hotspot {
  name: string;
  nameEn?: string;
  lat: number;
  lng: number;
  region: 'hk' | 'world';
  subregion?: string;
  frequency: 'high' | 'medium' | 'low';
  season?: string;
}

export interface BirdSpecies {
  id: number;
  name: string;           // 中文
  nameEn: string;         // English common name
  nameYue?: string;       // 粵語俗名
  scientificName: string;
  family: string;
  familyEn?: string;
  order?: string;

  size: string;
  habitat: string[];
  diet: string;
  features: string;
  funFact: string;
  funFactEn?: string;
  description: string;

  region: string;
  season: string;
  hotspots: Hotspot[];
  globalRange: string[];

  baseColor: string;
  emoji: string;
  call: string;
  tags: string[];

  aiRecognizable: boolean;
  aiConfidence?: number;
  merlinCode?: string;
  ebirdCode?: string;

  photoUrl?: string | null;
  illustrationUrl?: string | null;
  audioUrl?: string | null;

  notionId?: string;
  lastUpdated?: number;
  pack: number;
}

export interface CaptureRecord {
  speciesId: number;
  capturedAt: string;     // ISO date
  count: number;        // total captures
  currentRarity: Rarity;
  firstCaptureDate: string;
  lastCaptureDate: string;
  location?: { lat: number; lng: number } | null;
  photoDataUrl?: string | null; // 使用者拍的照片
  shiny?: boolean;          // 色違個體
}

export interface TrainerProfile {
  name: string;
  xp: number;
  level: number;
  title: string;
  totalCaptures: number;
  uniqueSpecies: number;
  joinedAt: string;
  avatar?: string;
}

export interface RecognizeResult {
  label: string;
  score: number;
  scientific?: string;
}

export interface CaptureResult {
  record: CaptureRecord | null; // 如果是 null 代表捕捉失敗
  isNew: boolean;
  oldRarity: Rarity;
  newRarity: Rarity;
  xpGained: number;
  species: BirdSpecies | null;
  failed?: boolean; // 失敗標記
  failReason?: string; // 失敗原因文字
  failKind?: 'not-bird' | 'low-confidence' | 'not-in-dex' | 'escaped'; // 失敗種類，控制背景
  isShiny?: boolean;  // 這次捕捉「新發現」色違
  leveledUp?: boolean; // 這次捕捉觸發訓練師升級
  newLevel?: number;   // 升級後等級
}

export type View = 'scanner' | 'dex' | 'album' | 'profile' | 'detail' | 'capture-result' | 'audio';
