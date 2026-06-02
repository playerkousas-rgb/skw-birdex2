// ============================================================
// AI 辨識名稱對映表
// 把 Hugging Face / BirdNET / Nyckel 回傳的各種名稱
// 對映到 BIRD-DEX 的 speciesId
// ============================================================

export interface AliasEntry {
  speciesId: number;
  aliases: string[]; // 全部轉成小寫比對
}

const ALIASES: AliasEntry[] = [
  {
    speciesId: 1,
    aliases: [
      'eurasian tree sparrow',
      'tree sparrow',
      'passer montanus',
      'sparrow',
      'eurasian treesparrow',
      'passer_montanus',
      '麻雀',
      '麻雀仔',
    ],
  },
  {
    speciesId: 2,
    aliases: [
      'light-vented bulbul',
      'light vented bulbul',
      'chinese bulbul',
      'pycnonotus sinensis',
      'pycnonotus_sinensis',
      '白头鹎',
      '白頭鵯',
      '白頭翁',
    ],
  },
  {
    speciesId: 3,
    aliases: [
      'red-whiskered bulbul',
      'red whiskered bulbul',
      'red-whiskered',
      'pycnonotus jocosus',
      'pycnonotus_jocosus',
      'crested bulbul',
      '红耳鹎',
      '紅耳鵯',
      '紅耳仔',
    ],
  },
  {
    speciesId: 4,
    aliases: [
      'swinhoe\'s white-eye',
      'swinhoes white-eye',
      'swinhoe white-eye',
      'japanese white-eye',
      'oriental white-eye',
      'zosterops simplex',
      'zosterops japonicus',
      'zosterops japonica',
      'zosterops_simplex',
      'zosterops_japonicus',
      'white-eye',
      'whiteeye',
      '暗绿绣眼鸟',
      '暗綠繡眼鳥',
      '相思仔',
    ],
  },
  {
    speciesId: 5,
    aliases: [
      'black-collared starling',
      'black collared starling',
      'black-necked starling',
      'gracupica nigricollis',
      'gracupica_nigricollis',
      'sturnus nigricollis',
      '黑领椋鸟',
      '黑領椋鳥',
    ],
  },
  {
    speciesId: 6,
    aliases: [
      'crested myna',
      'chinese starling',
      'acridotheres cristatellus',
      'acridotheres_cristatellus',
      'myna',
      '八哥',
      'crested mynah',
    ],
  },
  {
    speciesId: 7,
    aliases: [
      'black kite',
      'milvus migrans',
      'milvus_migrans',
      'kite',
      'pariah kite',
      '麻鹰',
      '麻鷹',
      '黑鸢',
      '黑鳶',
    ],
  },
  {
    speciesId: 8,
    aliases: [
      'spotted dove',
      'spilopelia chinensis',
      'spilopelia_chinensis',
      'streptopelia chinensis',
      'streptopelia_chinensis',
      'pearl-necked dove',
      'lace-necked dove',
      '珠颈斑鸠',
      '珠頸斑鳩',
      '斑鸠',
      '斑鳩',
    ],
  },
  {
    speciesId: 9,
    aliases: [
      'little egret',
      'egretta garzetta',
      'egretta_garzetta',
      'little white heron',
      'egret',
      'white egret',
      '小白鹭',
      '小白鷺',
      '白鷺仔',
      '白鹭',
    ],
  },
  {
    speciesId: 10,
    aliases: [
      'black-crowned night heron',
      'black crowned night heron',
      'night heron',
      'nycticorax nycticorax',
      'nycticorax_nycticorax',
      'quawk',
      'quark',
      '夜鹭',
      '夜鷺',
      '夜鷺仔',
    ],
  },
  {
    speciesId: 11,
    aliases: [
      'common kingfisher',
      'alcedo atthis',
      'alcedo_atthis',
      'eurasian kingfisher',
      'river kingfisher',
      'kingfisher',
      '翠鸟',
      '翠鳥',
      '普通翠鸟',
      '普通翠鳥',
    ],
  },
  {
    speciesId: 12,
    aliases: [
      'barn swallow',
      'hirundo rustica',
      'hirundo_rustica',
      'european swallow',
      'swallow',
      '家燕',
      '燕仔',
      '燕子',
    ],
  },
  {
    speciesId: 13,
    aliases: [
      'red-billed blue magpie',
      'red billed blue magpie',
      'blue magpie',
      'urocissa erythroryncha',
      'urocissa_erythroryncha',
      '红嘴蓝鹊',
      '紅嘴藍鵲',
      '藍鵲',
    ],
  },
  {
    speciesId: 14,
    aliases: [
      'japanese tit',
      'parus minor',
      'parus_minor',
      'oriental tit',
      'great tit',
      'parus cinereus',
      'parus_cinereus',
      'tit',
      'chickadee',
      '大山雀',
      '山雀',
    ],
  },
  {
    speciesId: 15,
    aliases: [
      'masked laughingthrush',
      'black-faced laughingthrush',
      'garrulax perspicillatus',
      'garrulax_perspicillatus',
      'laughingthrush',
      '黑脸噪鹛',
      '黑臉噪鶥',
      '噪鹛',
    ],
  },
];

const aliasMap = new Map<string, number>();
for (const entry of ALIASES) {
  for (const alias of entry.aliases) {
    aliasMap.set(alias.toLowerCase().trim(), entry.speciesId);
    // 也存無標點版本
    aliasMap.set(alias.toLowerCase().replace(/[-_']/g, '').trim(), entry.speciesId);
  }
}

/** 從 AI 回傳名稱解析出 BIRD-DEX speciesId */
export function resolveBirdId(label: string): number | undefined {
  if (!label) return undefined;
  const key = label.toLowerCase().trim();
  // 直接命中
  if (aliasMap.has(key)) return aliasMap.get(key);
  // 去掉標點
  const noPunct = key.replace(/[-_'.]/g, '');
  if (aliasMap.has(noPunct)) return aliasMap.get(noPunct);
  // 只取前兩個單詞嘗試 (e.g. "Passer montanus (Tree Sparrow)")
  const words = key.split(/\s+/).slice(0, 3).join(' ');
  if (aliasMap.has(words)) return aliasMap.get(words);
  return undefined;
}

/** 取得所有 aliases（用於 Debug） */
export function getAllAliases(): AliasEntry[] {
  return ALIASES;
}
