# BIRD-DEX 2（鳥精靈圖鑑）程式碼審查報告

**日期：** 2026-08-07
**檢查方式：** `npm run build`（tsc strict + vite build）✅ 通過；靜態程式碼追蹤；資料檔（birds.json / nameAliases.json）完整性檢查；XP 公式實測模擬。
**結論：** 整體架構清晰、動畫與卡牌系統做得好，但發現 **6 個功能性 BUG、1 個會令 App 崩潰的隱患、多項手機友善問題**。建議優先修復 🔴 項目。

---

## ✅ 修復狀態（2026-08-07 更新）

| 項目 | 狀態 | 修改內容 |
|------|------|----------|
| BUG-1 XP 進度條 | ✅ 已修 | `ProfileScreen.tsx` 改用目前等級門檻，實測 0~100% 正常 |
| BUG-2 相機串流洩漏 | ✅ 已修 | `ScannerScreen.tsx` startCamera 前先 stopCamera + unmount 保護 |
| BUG-3 分析中切頁 | ✅ 已修 | 分析中隱藏 Navbar + AbortController 取消請求 + mountedRef 防 setState |
| BUG-4 localStorage 爆掉 | ✅ 已修 | 照片縮圖至 480px/q0.4 + saveStored 配額失敗自動降級（丟照片保記錄），不再白屏 |
| BUG-5 異圖卡標記 | ✅ 已修 | `BirdDetailScreen.tsx` onLoad 確認 src 為異圖卡網址才標記存在 |
| BUG-6 4 隻鳥捉不到 | ✅ 已修 | 補上 9/12/16/21 的英文名/學名 + aliases；移除 228/236/264/1 的錯置別名（已驗證 20 組解析全部正確） |
| BUG-7 音訊雙重觸發 | ✅ 已修 | 改用 pointer events + recordingRef 防重入（此功能尚未接入 App 路由） |
| PWA 無法安裝 | ✅ 已修 | 新增 icon-192/512.png（AI 生成）、manifest 補 PNG 圖示、修 apple-touch-icon 404 |
| 捕捉失敗跳錯頁 | ✅ 已修 | 失敗→回掃描器、成功→回收藏冊 |
| 未捕捉卡不能點 | ✅ 已修 | 圖鑑所有卡都可點入看資料 |
| 無 ErrorBoundary | ✅ 已修 | 新增 `ErrorBoundary.tsx`，錯誤顯示友善畫面而非白屏 |
| API 無 timeout | ✅ 已修 | 60 秒 AbortController + 明確錯誤訊息 |
| `h-screen` iOS 陷阱 | ✅ 已修 | 新增 `.app-shell`（100dvh），Navbar 加 safe-area padding |
| input 14px 自動放大 | ✅ 已修 | 搜尋框改 16px |
| user-scalable=no | ✅ 已修 | 移除（違反無障礙） |
| BirdCard 破圖無 fallback | ✅ 已修 | 普通圖也壞掉時顯示 emoji |
| Bundle 624KB | ✅ 已修 | vendor chunk 拆分，主 chunk 357KB，無警告 |
| lint 壞掉 | ✅ 已修 | 新增 `.eslintrc.cjs`，`npm run lint` 通過 |
| 未使用依賴 | ✅ 已修 | 移除 @tensorflow/tfjs、clsx、tailwind-merge |
| 新增 .gitignore | ✅ 已修 | 避免 node_modules/dist 被提交 |

---

## 🔴 必須修的 BUG（已全部修復，以下為修復前紀錄）

### BUG-1｜XP 進度條永遠壞掉（顯示全滿／升級瞬間全空）
**位置：** `src/components/ProfileScreen.tsx:125-127`
**問題：** 進度公式用錯了門檻值：
```ts
((profile.xp - (getLevelFromXp(profile.xp - 1)?.nextXp || 0)) / ((levelInfo.nextXp || profile.xp) - (getLevelFromXp(profile.xp - 1)?.nextXp || 0)))
```
`getLevelFromXp(xp-1).nextXp` 回傳的是「**下一級**的門檻」，不是「**目前等級**的門檻」，結果分母永遠是 0。實測：xp = 0/50/150/299/500 全部算出 `-Infinity%`，只有 xp 剛好等於門檻（100/300）時是 `0%`。CSS 收到 `width: -Infinity%` 屬無效值 → 進度條會**撐滿整條**，升級瞬間閃一下全空。
**修法：** 用目前等級門檻：
```ts
const curThreshold = LEVEL_TITLES[levelInfo.level - 1].xp;
const pct = levelInfo.nextXp
  ? ((profile.xp - curThreshold) / (levelInfo.nextXp - curThreshold)) * 100
  : 100;
// width: `${Math.min(100, Math.max(0, pct))}%`
```

### BUG-2｜相機串流洩漏（重試後相機燈長亮、耗電）
**位置：** `src/components/ScannerScreen.tsx:25-47, 207`
**問題：** 辨識失敗進入 `error` 時，舊的 `MediaStream` 沒有停止。按「重新啟動相機」會再 `getUserMedia` 一次，`streamRef.current` 被覆蓋，**舊串流永遠不會被 stop**（`stopCamera` 只在 unmount 時停最新的那條）。戶外使用會持續亮相機燈、吃電。
**修法：** `startCamera()` 第一行先 `stopCamera()`。

### BUG-3｜辨識途中可以切頁，結果回來時「強行跳轉畫面」
**位置：** `src/components/ScannerScreen.tsx:86-146` + `src/App.tsx`
**問題：** 分析中底部 Navbar 仍然可點。使用者按快門後切去「圖鑑」，AI 回傳時 `onCapture()` 仍會執行 → 畫面被強制跳去捕捉結果，而且是在元件已卸載後 `setState`。戶外網路慢（HF 冷啟動可達 20 秒以上）時很容易發生。
**修法：** 用 `AbortController` 取消 in-flight 請求 + `mountedRef` 檢查；分析中隱藏/鎖定 Navbar（或加「取消」按鈕）。

### BUG-4｜localStorage 5MB 配額會爆 → App 崩潰 ⚠️ 最嚴重
**位置：** `src/hooks/useCollection.ts:60-63`（`saveStored`）+ `src/components/ScannerScreen.tsx:132`
**問題：** 每次捕捉把整張 **1280×720 JPEG（base64 約 100–300KB）** 存入 `localStorage`。而且 `photoDataUrl` **從來沒有在任何 UI 顯示過**（grep 確認只有存入、沒有讀取）——純粹是死資料。捕捉約 20–40 種鳥後 `setItem` 拋出 `QuotaExceededError`，而 `saveStored` 沒有 try/catch → React 18 中 effect 內未捕捉例外會**令整個 App 白屏崩潰**，且最後一次捕捉在重新載入後消失。
**修法（任選）：**
1. 快：儲存前把照片縮小（如寬度 480px、quality 0.4，約 30-60KB）；
2. 保險：`saveStored` 包 try/catch，配額爆時降級為不存照片只存記錄；
3. 長遠：照片改用 IndexedDB 存放；
4. 最簡單：**目前根本沒顯示使用者照片，先不要存**，等做了「我的捕捉」照片牆功能再存。

### BUG-5｜異圖卡「R2 存在」標記邏輯錯誤
**位置：** `src/components/BirdDetailScreen.tsx:76`
**問題：** `onLoad` 時只要 `wantsAltArt` 就 `markAltArtExists(bird.id)`。但異圖卡 404 後 fallback 載入普通圖成功，**也會觸發 onLoad** → 把「R2 上不存在」的鳥誤標記成存在 → 下次又去請求 404，徽章繼續顯示「✨ ALT ART」。
**修法：** 跟 `BirdCard.tsx:43` 一樣，確認 `e.currentTarget.src === altArtUrl` 才標記。

### BUG-6｜4 隻鳥永遠捉不到，且顯示「Unknown Species」
**位置：** `src/data/birds.json`（id 9, 12, 16, 21）
**問題：** `黑臉噪眉 / 黑領椋鳥 / 大山雀 / 亞歷山大鸚鵡` 的 `nameEn` 是佔位符 `"Unknown Species"`、`scientificName` 是 `"Scientific Name"`：
- 卡片、分享訊息會顯示「Unknown Species」；
- `resolveBirdId()` 在 alias 表找不到這幾個名字 → AI 辨識到牠們時會永遠被判「不在圖鑑中」，**這 4 種鳥無法捕捉**。
**修法：** 補上真名 + `nameAliases.json` 條目（如 Great Tit、Alexandrine Parakeet、Black-collared Starling、Black-faced Laughingthrush）。

### BUG-7｜音訊掃描器雙重觸發（休眠中的地雷）
**位置：** `src/components/AudioScannerScreen.tsx:123-126`
**問題：** 錄音鈕同時綁 `onMouseDown` + `onTouchStart`。手機上 touch 事件後瀏覽器會再派發合成 mouse 事件 → `startRecording` 會被呼叫兩次 → 兩條錄音串流、兩次 `processAudio`，可能重複捕捉。目前此畫面沒有被 App 路由（`App.tsx` 沒 render 它），接回去時就會爆。
**修法：** 改用 pointer events，或加 `recordingRef` 防重入。

---

## 🟠 其他問題與隱患

| # | 問題 | 位置 |
|---|------|------|
| 1 | **PWA 無法安裝**：manifest 只有 SVG icon（Chrome 安裝條件要求 192px/512px **PNG**）；`apple-touch-icon` 指向不存在的 `/icon-192.png`（404） | `public/manifest.json`、`index.html:11` |
| 2 | **圖鑑未捕捉的卡點擊無反應**（`onClick={undefined}`），但詳細頁明明有「尚未捕獲」狀態 — 應允許點入看資料 | `DexScreen.tsx` |
| 3 | **捕捉失敗後「返回繼續尋找」跳去收藏冊** — 應該回掃描器重試 | `App.tsx:23-27` |
| 4 | **BirdCard 普通圖也壞掉時沒有 fallback**：`imgError` 只影響異圖卡切換，普通圖 404 會一直顯示破圖，不會退回 emoji | `BirdCard.tsx:27-45` |
| 5 | **沒有 ErrorBoundary**：任何 runtime error（如 BUG-4）整頁白屏，建議加一個 fallback UI | `src/main.tsx` |
| 6 | **API 無 timeout**：`postBlob` 沒有 AbortController，HF 冷啟動/Vercel 504 時 analyzing 畫面無限轉圈 | `src/lib/aiClient.ts`、`api/analyze.js` |
| 7 | **API 無認證/限流**，`Access-Control-Allow-Origin: *` — HF_TOKEN 可被任何人濫用產生費用 | `api/analyze.js` |
| 8 | **README 聲稱「內建離線影像感知引擎」但根本沒接入**：`visionLocal.ts`（假 hash「AI」）沒有被任何地方 import，實際必須連 `/api/analyze` — 文件誤導 | `src/lib/visionLocal.ts` |
| 9 | **音訊功能是死碼**：`View` 有 `'audio'`、`AudioScannerScreen` 存在，但 `analyzeAudio()` 直接 throw、App 不 render | `src/lib/aiClient.ts:67` |
| 10 | **Scanner 死狀態**：`idle / countdown / found / missed` phase 從未被設定（countdown 倒數 UI 寫好了但沒人觸發） | `ScannerScreen.tsx` |
| 11 | **無地理位置**：`CaptureRecord.location` 有欄位，但 Scanner 從未呼叫 `geolocation` — 每次捕捉 location 都是 null | `types.ts` |
| 12 | **`lint` script 壞掉**：package.json 有 `npm run lint`，但 repo 沒有 ESLint config 檔 | `package.json` |
| 13 | **未使用依賴**：`@tensorflow/tfjs`（沒 import）、`clsx`、`tailwind-merge` — 可移除，減少安裝體積 | `package.json` |
| 14 | **Bundle 624KB（gzip 140KB）**：framer-motion + 全量 birds.json 塞進主 chunk，可對 Scanner/Detail 做 lazy import | `vite.config.ts` |

---

## 📱 手機友善度評估

**整體：中上（7/10）** — PWA、鏡頭 UX、觸控目標都做得不錯，但有以下具體問題：

### 版面（重要）
1. **`h-screen` = 100vh 的 iOS Safari 陷阱**（`App.tsx:46`）：iOS 的 100vh 是「工具列收合時」的高度，頁面剛載入（工具列展開）時底部導覽列會被 Safari 工具列遮住，而外層 `overflow-hidden` 無法滾動 → 導覽列「看不到也點不到」。**改用 `h-dvh`**（Tailwind 3.4 原生支援，舊瀏覽器可加 `h-screen` fallback）。
2. **底部導覽沒有 `env(safe-area-inset-bottom)`**：`index.html` 已設 `viewport-fit=cover`，iPhone 的 Home Indicator 會跟「捕捉」按鈕重疊。Navbar 應加 `pb-[env(safe-area-inset-bottom)]`（或 `h-[calc(5rem+env(safe-area-inset-bottom))]`）。
3. **`user-scalable=no, maximum-scale=1.0`**（`index.html:6`）：違反無障礙（WCAG 1.4.4 禁止文字縮放），而且對防止誤縮放沒幫助。刪掉它，改在 CSS 用 `touch-action: manipulation` 防雙擊縮放。

### 互動
4. **搜尋 input 只有 14px**（`DexScreen.tsx`）：iOS 聚焦字體 <16px 的 input 會**自動放大畫面**，跳來跳去。改成 `text-base`（16px）。
5. 很多文字用 10px，戶外強光下手機閱讀吃力 — 建議至少 12px 起跳。
6. 卡片圖片來自 R2，慢網時一片空白 — 可加 `bg` 佔位底色（已有 `bird-art-bg`，但 loading 時不顯示）。
7. 可選加分：捕捉成功時 `navigator.vibrate(100)` 震動回饋（Android）。

### 做得好的地方
- ✅ `playsInline` + `facingMode: 'environment'` + 1280×720 理想解析度
- ✅ 大觸控目標（快門 80px、導覽按鈕 ~48px）
- ✅ `overscroll-behavior-y: none`、`-webkit-tap-highlight-color: transparent`
- ✅ PWA `display: standalone`、`orientation: portrait`、主題色正確

---

## 📊 資料品質（birds.json）

- **569 種鳥全部** `hotspots: []`、`tags: []`、`call: "未知"`、`features: "尚未解鎖生態檔案..."`、`season: "四季"` → 卡片生態資訊全部空白（`BirdCard` 有防禦判斷所以不會崩，但「全港」會出現在每張卡上）。
- `globalRange` 有資料欄位但 UI 完全沒顯示。
- 這部分應該是你打算用 AvianDex 的資料補齊，建議寫個 sync script 驗證完整性。

---

## ✅ 做得好的地方（值得保留）

- 異圖卡「三重檢查 + 404 快取」設計（除 BUG-5 外）很扎實
- 捕捉動畫流程完整，成功/失敗分流清楚
- 資料防禦：`features === '尚未解鎖生態檔案...'` 的判斷避免了空卡面
- `useCollection` 邏輯清晰、`resetAll` 保留 R2 快取是對的
- TypeScript strict + build 零錯誤
- Admin backdoor 50 連點防誤觸設計細心

---

## 🛠 建議修復順序

1. **BUG-4**（localStorage 崩潰）— 最優先，會直接 crash
2. **BUG-1**（XP bar）— 5 分鐘可修完
3. **BUG-2 / BUG-3**（相機串流 + 分析中斷）
4. **手機版面**（`h-dvh` + safe-area + input 16px + 刪 user-scalable）
5. **BUG-5**（alt art 標記）
6. **BUG-6**（4 隻鳥資料）
7. **PWA icon**（補 PNG）
8. 其餘（ErrorBoundary、API timeout、死碼清理）

---

*報告完畢 — 需要我直接動手修的話，說一聲即可，建議先修 🔴 項目。*
