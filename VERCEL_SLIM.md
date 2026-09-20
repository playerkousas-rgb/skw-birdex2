# Vercel 防增肥守則（必讀再改版）

> **目的：** 防止 Vercel 儲存空間／上傳配額爆滿，同時保證 BIRD-DEX 2 既有功能、邏輯、UI **100% 不變**。
> 每次改版、加功能、加圖、加套件前，先掃過這份清單。`npm run check` 會自動擋下常見炸彈。

---

## 核心原則

1. **Vercel 只該拿到「能建置出網站」的最小集合。** 開發廢檔、參考資料、備份、設計原稿一律不准上船。
2. **鳥卡圖在 Cloudflare R2，不進 Git、不進 Vercel。** `birds.json` 只存 URL。
3. **不要為了方便把東西丟進 `public/`。** 沒被 HTML/CSS/JS 引用的圖 = 死重，直接刪。
4. **建置工具 ≠ 執行期依賴。** Vite / Tailwind / TypeScript / ESLint 只能放 `devDependencies`。

---

## 部署架構（不要改亂）

| 項目 | 設定 | 說明 |
|------|------|------|
| 框架 | Vite（`vercel.json` → `framework: vite`） | Vercel 自動跑 `npm run build` |
| 靜態輸出 | `outputDirectory: dist` | **只上傳建置產物**，不是整個開發目錄 |
| Serverless | `/api/analyze.js` | 辨識代理；需要 `form-data`、`node-fetch` 留在 `dependencies` |
| 排除清單 | `.vercelignore` | 決定「哪些檔案根本不會上傳到 Vercel」 |

本地驗證：

```bash
npm run check   # tsc + 防增肥守護
npm run lint
npm run build   # 必須零錯誤才可部署
```

---

## `.vercelignore` 必須排除的東西

改 `.vercelignore` 前先問：這份檔 **Vite build 或 `/api` 用得到嗎？** 用不到就排除。

目前已排除：

- `.git/`、`node_modules/`（Vercel 會自己 install）
- `dist/`、`.vite/`、`.cache/`、`.vercel/`（建置快取，禁止重複上傳）
- `*.log` `*.bak` `*.tmp` `*.old`、`uploads/`
- `scripts/reference_data/`（約 1.6MB 的 eBird/Wiki 對照，**僅本機重建 aliases 用**）
- `BIRD_ID_MAPPING.csv`、`fix_r2_urls2.cjs`（一次性遷移）
- 開發文件：`APP_REVIEW.md`、`PROMPT_GUIDE.md`、`DATABASE_SYNC_GUIDE.md`、`README_UPDATE.md`、維護需知 txt
- `.env*`（含 `HF_TOKEN`，**絕不可上傳**）

**不要** 把下列必要檔案加進 ignore，否則建置會壞：

- `src/`、`public/`（實際有引用的）、`api/`、`index.html`
- `package.json`、`package-lock.json`
- `vite.config.ts`、`tsconfig*.json`、`tailwind.config.js`、`postcss.config.js`

---

## 靜態資源紀律（`public/`）

上傳前用 grep 確認引用。沒被引用 = 刪。

```bash
# 例：檢查某張圖有沒有被程式用到
grep -r "檔名.png" src index.html public --include='*.ts' --include='*.tsx' --include='*.html' --include='*.css' --include='*.json'
```

| 允許 | 禁止 |
|------|------|
| PWA icon（`icon-192.png` / `icon-512.png`，單檔 < 400KB） | 設計原稿、高解析展示圖、截圖、未引用的 `public/cards/` |
| `favicon.svg`、`manifest.json` | 把 R2 鳥卡下載進 repo |
| | `uploads/` 測試照片 |

**已刪除、禁止加回：** `public/cards/kingfisher_card.png`（293KB，程式從未引用）。

單檔超過 400KB，`npm run check` 會失敗。請先壓縮：

```bash
convert input.png -strip -define png:compression-level=9 output.png
```

---

## `package.json` 極簡依賴

### `dependencies`（Vercel 生產 / Serverless 執行期）

**只准放瀏覽器 App 或 `/api/analyze.js` 真正 `import` 的套件：**

- `react` / `react-dom` — UI
- `framer-motion` — 捕捉動畫
- `lucide-react` — 圖示
- `form-data` / `node-fetch` — Serverless 呼叫 Nyckel / HF（不要移到 dev）

### `devDependencies`（只在 build）

Vite、Tailwind、TypeScript、ESLint、`vite-plugin-pwa`、PostCSS……全部放這裡。

### 黑名單（`npm run check` 會擋）

不要裝進 `dependencies`：

- `sharp`（從未使用，且原生模組極肥）
- `@tensorflow/tfjs`（本專案辨識走 `/api/analyze`，不在前端跑模型）
- `lodash` / `moment` / `aws-sdk` / `firebase*`

需要新套件時：先確認「能否用原生 API / 既有程式 / R2 URL」解決。非必要不上。

---

## 資料檔 vs 媒體檔

| 檔案 | 去向 |
|------|------|
| `src/data/birds.json`、`nameAliases.json` | **要進 Git**（圖鑑邏輯），圖片 URL 指向 R2 |
| `scripts/reference_data/*` | **只留本機**，`.vercelignore` 排除 |
| 鳥卡 `.avif` | **只放 R2**，禁止 commit |

同步資料請看 `DATABASE_SYNC_GUIDE.md`，不要為了「方便對照」把 CSV/JSON 參考庫拷進 `public/`。

---

## 改版檢查清單（PR 前）

- [ ] 沒有新增 `*.bak` / `*.tmp` / `*.old` / `uploads/`
- [ ] 新圖片都有被程式引用，且單檔 < 400KB
- [ ] 沒有把 R2 鳥卡、設計原稿、截圖推進 `public/`
- [ ] 新 npm 套件：執行期才放 `dependencies`，建置工具放 `devDependencies`
- [ ] 沒有動到 `.vercelignore` 的必要排除項（尤其 `scripts/reference_data/`、`node_modules`、`dist`）
- [ ] `npm run check` && `npm run lint` && `npm run build` 全綠
- [ ] 相機捕捉、圖鑑、收藏、訓練師、每日任務、成就、熱點、夥伴鳥、異圖卡行為與改前一致

---

## 為什麼之前會肥？

1. 沒有 `.vercelignore` → 開發 CSV、審查文件、一次性腳本全部上傳。
2. `public/cards/kingfisher_card.png` 展示圖從未引用。
3. `sharp` 裝在 devDependencies 但程式完全沒用到（原生模組安裝體積巨大）。
4. `scripts/reference_data/ebird_en.csv` 約 1.5MB，只給本機重建別名用。

這些都已經處理。**之後不要再加回來。**
