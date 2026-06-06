# BIRD-DEX 更新檔案

## 📦 內容（5 個檔案）

把下面的檔案**直接覆蓋到 GitHub repo `skw-birdex2` 對應位置**，
其它檔案不要動。

| ZIP 內路徑 | GitHub 上對應路徑 | 改動內容 |
|---|---|---|
| `api/analyze.js` | `api/analyze.js` | 加入「鳥類前置閘 Bird Gate」（先用 ImageNet 通用模型判斷是不是鳥，不是就拒絕） |
| `src/lib/aiClient.ts` | `src/lib/aiClient.ts` | 改為真正呼叫 `/api/analyze`，並輸出 `analyzeImageDetailed` |
| `src/types.ts` | `src/types.ts` | `CaptureResult` 新增 `failReason` / `failKind` 欄位 |
| `src/components/ScannerScreen.tsx` | `src/components/ScannerScreen.tsx` | 三種失敗情境分別帶 kind 傳給結果頁 |
| `src/components/CaptureResultScreen.tsx` | `src/components/CaptureResultScreen.tsx` | 加上動態背景：成功用該鳥卡圖、逃走用隨機卡、不是鳥用深色星塵 |

---

## 🌐 GitHub 網頁部署步驟

1. 進入 https://github.com/playerkousas-rgb/skw-birdex2
2. 依路徑找到上述 5 個檔案 → 點開 → 點右上角鉛筆 🖉
3. **全選清空 → 貼上 ZIP 對應檔案內容 → Commit changes**
4. 5 個檔案都更新完後，Vercel 會自動部署（約 1 分鐘）

---

## 🔧 可選的 Vercel 環境變數（不設定也能用）

進 Vercel → Project → Settings → Environment Variables：

| 變數名 | 預設值 | 說明 |
|---|---|---|
| `BIRD_GATE_MIN_SCORE` | `0.30` | 鳥類分數加總門檻，調高 → 更嚴格 |
| `MIN_SPECIES_SCORE` | `0.35` | 鳥種 Top-1 信心度門檻 |
| `DISABLE_BIRD_GATE` | （不設定） | 設成 `1` 可暫時關閉前置閘，方便 debug |

`HF_TOKEN` 已經設好就無需動。

---

## ✅ 部署後驗證

打開 `https://skw-birdex2.vercel.app/api/analyze` (GET)，
回應應該長這樣：

```json
{
  "ok": true,
  "version": "v1.5.0",
  "engines": { "huggingface": true, ... },
  "gate": {
    "enabled": true,
    "minBirdScore": 0.3,
    "minSpeciesScore": 0.35
  }
}
```

看到 `"version": "v1.5.0"` 和 `"gate"` 區塊 = 部署成功。

---

## 🎯 三種情境效果

| 你影什麼 | 結果 |
|---|---|
| 真的鳥 ✅ | 成功捕捉，背景是該鳥的卡圖（模糊放大 + 稀有度顏色暈染） |
| 模糊的鳥 💨 | 「鳥兒逃走了」，背景隨機抽一張鳥卡 |
| 牆／桌子／貓 ❌ | 「看起來像 XX，請對準鳥類再試」，背景純深色 + 星塵 |
