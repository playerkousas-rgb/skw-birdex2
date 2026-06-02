# BIRD-DEX 卡牌 AI 生圖提示詞指南 (Prompt Guide)

為了讓圖鑑中的鳥類圖片具有類似寶可夢卡牌 (PTCG) 的插畫風格，同時又不失去真實鳥類的辨識特徵，請使用以下提示詞公式進行生圖 (適用於 Midjourney / Niji 6 / Stable Diffusion 等工具)。

## 📸 核心觀念：我需要生幾張圖？

**絕大多數情況下，每隻鳥你只需要生 1 張圖！**
在 `BIRD-DEX 2` 的系統中，無論玩家把卡片升級到 R、SR 還是 SSR，程式都會自動在「你提供的那唯一一張圖」上面疊加金框與全息閃光特效。

**只有當你想要給高等級玩家驚喜時，才需要生第 2 張圖（異圖卡 UR）。**

---

## 🎨 基礎生圖公式 (Base Formula) 

這是你用來生產**所有鳥類第一張預設卡片**的最佳提示詞：

```text
Pokemon TCG illustration style, full art card, [這裡替換成鳥的英文名稱], (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, sunny day, clear sky, peaceful natural habitat, lush green leaves, soft natural lighting --ar 3:4
```
> **注意：** `--ar 3:4` 是 Midjourney 的比例參數，卡牌請務必使用這個直式比例。

**💡 範例 (麻雀)：**
把上述的 `[這裡替換成鳥的英文名稱]` 換成 `Eurasian Tree Sparrow`，丟給 AI 生成，把最漂亮的那張存成 `1.avif` 即可！

---

## 🌟 進階生圖：異圖卡 (UR / LR 滿版神聖插畫) 

如果這隻鳥非常特別（例如香港的猛禽：黑鳶），你想讓孩子們抓到 12 次升級到 UR 時，看到一張**完全不同、極度帥氣的異圖**，你才需要使用這些「稀有度後綴」來生第 2 張圖。

如果你要生異圖，請把原本公式最後面的 `sunny day, clear sky...` 換成以下更浮誇的場景：

### 🟣 SSR / Ultra Rare (極稀 - 魔法全息風格)
適用於產生 `_UR.avif` 異圖卡。
> `magical aura, swirling holographic glowing elements, magical glitters, dramatic contrast, epic wind trails, vivid rim lighting`
> 
> **範例 (黑鳶 異圖版):**
> Pokemon TCG illustration style, full art card, Black Kite, (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, magical aura, swirling holographic glowing elements, magical glitters, dramatic contrast, epic wind trails, vivid rim lighting --ar 3:4

### 🟡 Legendary Rare (傳說 - 史詩神聖風格)
適用於產生 `_UR.avif` 異圖卡（最頂級的神聖感）。
> `mythical atmosphere, divine golden glowing aura, cosmic light rays, floating golden feathers, epic low angle, majestic legendary presence`
> 
> **範例 (小葵花鳳頭鸚鵡 異圖版):**
> Pokemon TCG illustration style, full art card, Yellow-crested Cockatoo, (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, mythical atmosphere, divine golden glowing aura, cosmic light rays, floating golden feathers, epic low angle, majestic legendary presence --ar 3:4
