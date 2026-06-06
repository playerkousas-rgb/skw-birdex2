# BIRD-DEX 異圖卡 v2.1：王者的權利 👑

> ⚠️ 這個 v2.1 取代上一個 birddex_altart_update.zip 的所有檔案，
> 直接用這個覆蓋即可，不需要先裝舊版。

---

## 🆕 v2.1 變更
- **創世神後門從 7 下改為 50 下**（避免一般用戶不小心開啟）
- 點到 25 下後 console 會印進度（給開發者看，普通用戶看不到）

---

## ✨ 異圖卡顯示三重檢查

```
模式允許  &&  用戶已解鎖  &&  R2 上確實存在
   ↑              ↑                   ↑
Profile      達 UR 才獲得         前端自動偵測
三段切換     (王者的權利)         (首次載入 = 真實檢測)
```

### 三種解鎖路徑
| # | 方法 | 結果 |
|---|---|---|
| 🥉 | **某鳥升到 UR**（捕捉 15 次） | 自動解鎖**那一張**的異圖卡 |
| 👑 | **創世神後門**（Profile 頭像連點 **50 下**）| 一次解鎖**全部** |
| 🔄 | 重置記錄 | 清空已解鎖（R2 偵測快取保留） |

### 自動偵測 R2（不用維護名單）
- 載入 `0021_UR.avif` 成功 → 記到 `existsOnR2`
- 載入失敗（404）→ 記到 `missingOnR2`，**永不再請求**
- 兩個清單存進 localStorage（key：`bd_altart_v1`）
- 你新做卡傳到 R2 後，下次開 App 自動發現

---

## 🎨 UI 變化

### Profile 頁
- 標題右上角：`已解鎖 [confirmed] / 持有 [unlocked]`
- 三段切換按鈕：關閉 / 僅 UR・LR / 全部使用異圖卡

### 詳細頁卡片右上角徽章
| 狀態 | 徽章 |
|---|---|
| 正在顯示異圖卡 | ✨ **ALT ART**（紫粉漸層） |
| 已解鎖但 R2 沒檔 | `異圖卡尚未繪製` |
| 未達 UR | `🔒 達 UR 解鎖異圖` |

---

## 📦 內容（5 個檔案）

| ZIP 內路徑 | GitHub 上對應路徑 |
|---|---|
| `src/hooks/useCollection.ts`              | 同 |
| `src/context/CollectionContext.tsx`       | 同 |
| `src/components/BirdCard.tsx`             | 同 |
| `src/components/BirdDetailScreen.tsx`     | 同 |
| `src/components/ProfileScreen.tsx`        | 同 |

---

## 🌐 GitHub 網頁部署

1. 進 https://github.com/playerkousas-rgb/skw-birdex2
2. 依路徑找到 5 個檔案 → 鉛筆 🖉 → **全選清空** → 貼上新內容 → Commit
3. Vercel 自動部署（約 1 分鐘）

---

## ✅ 驗證
1. 進 **Profile（我的）** → 應看到「已解鎖 0」
2. 點頭像 **50 下**（要連續，每下間隔 < 2 秒） → 觸發創世神
3. 切到「全部使用異圖卡」 → 有做好 `_UR.avif` 的鳥會顯示精靈版
4. 沒做的鳥仍顯示普通卡 + 「異圖卡尚未繪製」徽章

---

## 💾 localStorage 鍵值
```
bd_collection_v2   ← 捕捉記錄
bd_profile_v1      ← 訓練師資料
bd_settings_v1     ← 異圖卡模式
bd_altart_v1       ← 異圖卡解鎖名單 + R2 偵測快取
```
