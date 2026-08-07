#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
由 birds.json 重建兩個 AI 辨識對照表:
  1) AvianDex/src/data/nameAliases.ts   (NAME_TO_ID 物件 + resolveBirdId 函式)
  2) skw-birdex2/src/data/nameAliases.json  ([{speciesId, aliases:[]}])

每隻鳥的別名 = 英文名(小寫) + 學名(小寫) + 中文名(繁) + 中文名(簡)
全域去重: 同一個名若已被前面編號用掉(重複物種), 後者跳過,
          否則 AvianDex 的 TypeScript 會報 TS1117「重複 key」。

用法:
  cd skw-birdex2/scripts
  python3 rebuild_aliases.py

注意: 需要 AvianDex 與 skw-birdex2 放在同一層父資料夾。
"""
import json, re, os

HERE = os.path.dirname(os.path.abspath(__file__))
BIRDEX2 = os.path.dirname(HERE)
PARENT = os.path.dirname(BIRDEX2)
BIRDS = os.path.join(BIRDEX2, "src", "data", "birds.json")
ALIASES_TS = os.path.join(PARENT, "AvianDex", "src", "data", "nameAliases.ts")
ALIASES_JSON = os.path.join(BIRDEX2, "src", "data", "nameAliases.json")

def has_cn(s): return bool(re.search(r"[\u4e00-\u9fff]", str(s)))

# 繁 → 簡(只為多生一個別名鍵，方便 AI 回傳簡體也能對上)
_T2S = {
    "雞": "鸡",
    "鴉": "鸦",
    "鳶": "鸢",
    "東": "东",
    "擬": "拟",
    "針": "针",
    "綠": "绿",
    "樹": "树",
    "頭": "头",
    "腳": "脚",
    "長": "长",
    "領": "领",
    "繡": "绣",
    "藍": "蓝",
    "鸚": "鹦",
    "鵡": "鹉",
    "鶹": "鹠",
    "鶥": "鹛",
    "鶲": "鹟",
    "䴉": "鹮",
    "鳧": "凫",
    "鵜": "鹈",
    "鸕": "鸬",
    "鷀": "鹚",
    "鶺": "鹡",
    "鴒": "鸰",
    "鵪": "鹌",
    "鶉": "鹑",
    "鶚": "鹗",
    "鶩": "鹜",
    "鷦": "鹪",
    "鴝": "鸲",
    "鴴": "鸻",
    "鵂": "鸺",
    "鵐": "鹀",
    "鷚": "鹨",
    "鶯": "莺",
    "鶇": "鸫",
    "鷗": "鸥",
    "鷸": "鹬",
    "鴨": "鸭",
    "鵲": "鹊",
    "鵯": "鹎",
    "鷹": "鹰",
    "鷺": "鹭",
    "鶴": "鹤",
    "鳩": "鸠",
    "鸌": "鹱",
    "鷲": "鹫",
    "鷥": "鸶",
    "鵰": "雕",
    "鳥": "鸟",
    "鸝": "鹂",
    "鴞": "鸮",
    "鷴": "鹇",
    "鶬": "鸧",
    "鶿": "鹚",
    "鷭": "鹁",
    "鸏": "鹲",
    "鸊": "䴙",
    "鷉": "䴙",
    "鳾": "䴓",
    "鴷": "䴕",
    "亞": "亚",
    "凍": "冻",
    "劍": "剑",
    "勝": "胜",
    "勞": "劳",
    "嘯": "啸",
    "嘰": "叽",
    "壽": "寿",
    "寶": "宝",
    "島": "岛",
    "帶": "带",
    "強": "强",
    "彎": "弯",
    "惡": "恶",
    "懷": "怀",
    "極": "极",
    "樓": "楼",
    "歐": "欧",
    "歷": "历",
    "漁": "渔",
    "潛": "潜",
    "澤": "泽",
    "濱": "滨",
    "烏": "乌",
    "煙": "烟",
    "環": "环",
    "畫": "画",
    "磯": "矶",
    "禿": "秃",
    "籬": "篱",
    "紅": "红",
    "紋": "纹",
    "純": "纯",
    "細": "细",
    "絨": "绒",
    "絲": "丝",
    "縫": "缝",
    "織": "织",
    "羅": "罗",
    "翹": "翘",
    "聲": "声",
    "脇": "胁",
    "臉": "脸",
    "興": "兴",
    "艦": "舰",
    "華": "华",
    "葉": "叶",
    "葦": "苇",
    "蒼": "苍",
    "蘆": "芦",
    "蘇": "苏",
    "蟻": "蚁",
    "蠟": "蜡",
    "蠣": "蛎",
    "賊": "贼",
    "賽": "赛",
    "軍": "军",
    "遊": "游",
    "達": "达",
    "遠": "远",
    "遺": "遗",
    "鈍": "钝",
    "鈎": "钩",
    "銀": "银",
    "銅": "铜",
    "錐": "锥",
    "錫": "锡",
    "鏽": "锈",
    "鐵": "铁",
    "闊": "阔",
    "陽": "阳",
    "雜": "杂",
    "雲": "云",
    "靈": "灵",
    "頂": "顶",
    "須": "须",
    "頰": "颊",
    "頸": "颈",
    "額": "额",
    "飯": "饭",
    "髮": "发",
    "魚": "鱼",
    "鰹": "鲣",
    "鱗": "鳞",
    "鳳": "凤",
    "鴛": "鸳",
    "鴣": "鸪",
    "鴦": "鸯",
    "鴿": "鸽",
    "鵑": "鹃",
    "鵝": "鹅",
    "鶘": "鹕",
    "鷂": "鹞",
    "鷓": "鹧",
    "鸛": "鹳",
    "麥": "麦",
    "黃": "黄",
    "點": "点",
    "䴙": "䴘"
}


def to_simp(s): return "".join(_T2S.get(c, c) for c in s)

PE = {"unknown species", "unknown", "???", ""}
PS = {"scientific name", "", "???", "unknown"}

bd = json.load(open(BIRDS, encoding="utf-8"))

def keys_for(b):
    cn = str(b.get("name", "")).strip()
    en = str(b.get("nameEn", "")).strip()
    sci = str(b.get("scientificName", "")).strip()
    ks = []
    if en and en.lower() not in PE:
        ks.append(en.lower())
    if sci and sci.lower() not in PS:
        ks.append(sci.lower())
    if has_cn(cn):
        ks.append(cn)
        simp = to_simp(cn)
        if simp != cn:
            ks.append(simp)
    seen, uniq = set(), []
    for k in ks:
        if k not in seen:
            seen.add(k); uniq.append(k)
    return uniq

# ── 1. AvianDex nameAliases.ts ────────────────────────────────
lines = [
    "// ============================================================",
    "// 英文/學名/中文 → 圖鑑 ID 對照表",
    "// 由 birds.json 自動重建(scripts/rebuild_aliases.py)",
    "// ⚠️ 請勿手動修改本檔。要更新請改 birds.json 後重跑腳本。",
    "// 詳見: 資料維護指南.md",
    "// ============================================================",
    "",
    "export const NAME_TO_ID: Record<string, string> = {",
]
count = 0
global_seen = {}
for b in bd:
    ids = f"{b['id']:04d}"
    for k in keys_for(b):
        if k in global_seen:      # 全域去重(重複物種)
            continue
        global_seen[k] = ids
        kk = k.replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'  "{kk}": "{ids}",')
        count += 1
lines.append("};")
lines.append("")
lines.append("/** 把 AI 辨識回傳的鳥名(英文俗名 / 學名 / 中文)轉成圖鑑 ID。 */")
lines.append("export function resolveBirdId(label: string): string | null {")
lines.append("  if (!label) return null;")
lines.append("  const key = label.trim().toLowerCase();")
lines.append("  if (NAME_TO_ID[key]) return NAME_TO_ID[key];")
lines.append("  if (key.includes('_')) {")
lines.append("    const [common, sci] = key.split('_').map((s) => s.trim());")
lines.append("    if (NAME_TO_ID[common]) return NAME_TO_ID[common];")
lines.append("    if (NAME_TO_ID[sci]) return NAME_TO_ID[sci];")
lines.append("  }")
lines.append("  for (const [aliasKey, id] of Object.entries(NAME_TO_ID)) {")
lines.append("    if (key.includes(aliasKey) || aliasKey.includes(key)) return id;")
lines.append("  }")
lines.append("  return null;")
lines.append("}")
if os.path.exists(os.path.dirname(ALIASES_TS)):
    open(ALIASES_TS, "w").write("\n".join(lines) + "\n")
    print(f"OK nameAliases.ts 重建完成,共 {count} 個別名鍵")
else:
    print(f"⚠️ 找不到 {ALIASES_TS}，略過")

# ── 2. BIRD-DEX nameAliases.json ─────────────────────────────
out = [{"speciesId": b["id"], "aliases": keys_for(b)} for b in bd]
json.dump(out, open(ALIASES_JSON, "w"), ensure_ascii=False, indent=2)
print(f"OK BIRD-DEX nameAliases.json 同步 ({len(out)} 種)")
