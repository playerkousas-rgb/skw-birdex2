# BIRD-DEX 卡牌 AI 生圖提示詞指南 (Prompt Guide)

為了讓圖鑑中的鳥類圖片具有類似寶可夢卡牌 (PTCG) 的插畫風格，同時又不失去真實鳥類的辨識特徵，請使用以下提示詞公式進行生圖 (適用於 Midjourney / Niji 6 / Stable Diffusion 等工具)。

## 核心生圖策略

最關鍵的技巧是：**使用 `(anatomically correct realistic bird species:1.5)` 來強制 AI 畫出寫實的鳥，並在環境與背景上套用插畫特效。**

---

## 基礎公式 (Base Formula)

```text
Pokemon TCG illustration style, full art card, [鳥類英文名稱], (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, [環境/稀有度後綴] --ar 3:4
```

> **注意：** `--ar 3:4` 是 Midjourney 的比例參數，卡牌請務必使用這個直式比例。

---

## 稀有度後綴 (Rarity Modifiers)

根據卡牌的稀有度，將以下後綴加入到基礎公式的最後面：

### 🟢 Common / Uncommon (常 / 平 - 日常大自然)
營造舒適、自然、清晰的背景。
> `sunny day, clear sky, peaceful natural habitat, lush green leaves, soft natural lighting`
> 
> **範例 (麻雀):**
> Pokemon TCG illustration style, full art card, Eurasian Tree Sparrow, (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, sunny day, clear sky, peaceful natural habitat, lush green leaves, soft natural lighting --ar 3:4

### 🔵 Rare / Super Rare (珍 / 稀 - 動態光影)
營造動態感、強烈光源或黃昏時刻。
> `golden hour lighting, dramatic sun rays, glowing wind effects, sparkling dust, dynamic action pose`
> 
> **範例 (翠鳥):**
> Pokemon TCG illustration style, full art card, Common Kingfisher, (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, golden hour lighting, dramatic sun rays, glowing wind effects, sparkling dust, dynamic action pose --ar 3:4

### 🟣 SSR / Ultra Rare (超稀 / 極稀 - 魔法全息)
營造卡牌閃閃發亮、具有魔法粒子特效的質感。
> `magical aura, swirling holographic glowing elements, magical glitters, dramatic contrast, epic wind trails, vivid rim lighting`
> 
> **範例 (黑鳶):**
> Pokemon TCG illustration style, full art card, Black Kite, (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, magical aura, swirling holographic glowing elements, magical glitters, dramatic contrast, epic wind trails, vivid rim lighting --ar 3:4

### 🟡 Legendary Rare (傳說 - 史詩神聖)
營造至高無上、神聖不可侵犯的史詩級畫面。
> `mythical atmosphere, divine golden glowing aura, cosmic light rays, floating golden feathers, epic low angle, majestic legendary presence`
> 
> **範例 (小葵花鳳頭鸚鵡):**
> Pokemon TCG illustration style, full art card, Yellow-crested Cockatoo, (anatomically correct realistic bird species:1.5), highly detailed feathers, vibrant colors, masterpiece, 8k, mythical atmosphere, divine golden glowing aura, cosmic light rays, floating golden feathers, epic low angle, majestic legendary presence --ar 3:4
