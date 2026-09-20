#!/usr/bin/env node
/**
 * 防增肥守護：改版時跑 `npm run check` 會擋下常見的 Vercel 配額炸彈。
 * 規則詳見根目錄 VERCEL_SLIM.md。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];

function sizeOf(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return 0;
  return fs.statSync(p).size;
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

// 1) 必要檔案
for (const must of ['.vercelignore', 'vercel.json', 'VERCEL_SLIM.md']) {
  if (!fs.existsSync(path.join(ROOT, must))) {
    errors.push(`缺少必要檔案：${must}`);
  }
}

// 2) 禁止備份 / 暫存檔混進 repo
const junk = walk(ROOT).filter((p) => /\.(bak|tmp|old|swp)$/i.test(p) || p.endsWith('~'));
for (const p of junk) {
  errors.push(`請刪除備份/暫存檔：${path.relative(ROOT, p)}`);
}

// 3) 禁止把測試上傳資料夾提交上來
for (const dir of ['uploads', 'tmp', 'temp']) {
  if (fs.existsSync(path.join(ROOT, dir))) {
    errors.push(`請不要提交 ${dir}/（應寫進 .gitignore / .vercelignore）`);
  }
}

// 4) public/ 單檔上限（PWA icon / 靜態圖）。超過代表沒壓縮或塞了設計原稿。
const PUBLIC_MAX = 400 * 1024;
const publicDir = path.join(ROOT, 'public');
for (const p of walk(publicDir)) {
  const st = fs.statSync(p);
  if (st.size > PUBLIC_MAX) {
    errors.push(`public/ 檔案過大（>${PUBLIC_MAX} bytes）：${path.relative(ROOT, p)} = ${st.size} bytes。請壓縮或移出。`);
  }
}

// 5) 已確認的死重檔不得回歸
if (fs.existsSync(path.join(ROOT, 'public/cards/kingfisher_card.png'))) {
  errors.push('public/cards/kingfisher_card.png 從未被程式引用，請勿加回。');
}

// 6) 生產 dependencies 黑名單（龐大、建置期才需要、或可用 CDN/原生 API 取代）
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const deps = pkg.dependencies || {};
const forbidden = [
  'sharp',
  '@tensorflow/tfjs',
  '@tensorflow/tfjs-node',
  'lodash',
  'moment',
  'aws-sdk',
  'firebase',
  'firebase-admin',
];
for (const name of forbidden) {
  if (deps[name]) {
    errors.push(`dependencies 不應包含「${name}」（肥、或應改放 devDependencies / 根本不該裝）。`);
  }
}

// 7) 建置工具必須在 devDependencies
const buildTools = ['vite', 'tailwindcss', 'typescript', 'eslint', '@vitejs/plugin-react', 'vite-plugin-pwa', 'autoprefixer', 'postcss'];
for (const name of buildTools) {
  if (deps[name]) {
    errors.push(`「${name}」是建置工具，請移到 devDependencies，不要讓 Vercel 當生產執行期套件快取。`);
  }
}

// 8) 提醒：參考資料很大，必須被 .vercelignore 排除
const vercelignore = fs.existsSync(path.join(ROOT, '.vercelignore'))
  ? fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8')
  : '';
if (!vercelignore.includes('scripts/reference_data')) {
  errors.push('.vercelignore 必須排除 scripts/reference_data/（約 1.6MB 開發用資料）。');
}
if (!vercelignore.includes('node_modules')) {
  errors.push('.vercelignore 必須排除 node_modules。');
}

const refSize = sizeOf('scripts/reference_data/ebird_en.csv');
if (refSize > 0) {
  warnings.push(`scripts/reference_data/ebird_en.csv = ${(refSize / 1024).toFixed(0)}KB（開發用，已由 .vercelignore 排除）。`);
}

if (warnings.length) {
  console.log('── 提醒 ──');
  for (const w of warnings) console.log('  ⚠', w);
}
if (errors.length) {
  console.error('── 防增肥檢查失敗 ──');
  for (const e of errors) console.error('  ✖', e);
  console.error('\n請閱讀 VERCEL_SLIM.md 後修正。');
  process.exit(1);
}

console.log('防增肥檢查通過 ✅');
