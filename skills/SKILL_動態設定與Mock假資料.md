---
name: 動態環境切換與假資料攔截 (Env Config & Mock Data)
description: 網頁開發初期在無後端 API 時的隔離開發策略，包含如何利用 .env 環境變數切換 API 來源與啟用 MSW 假資料攔截。
---

# 技能指令：.env 開發環境設定與 Mock 隔離

這個技能解決了「前端比後端早開工」以及「需要在不同環境指向不同後端連線」的實務痛點。我們將全數透過環境變數 (`.env`) 來嚴格控制。

## 1. 導入 MSW (Mock Service Worker) 作為唯一的假資料方案
**絕對禁止**在 Component 或原本的業務邏輯中寫 `if (isMock) return fakeData`。
*   **機制：** 導入 `msw` 套件。它會在瀏覽器的 Service Worker (或是 Node 層) 攔截發送出去的 HTTP 請求。讓前端程式碼以為正在打真實 API，完全不需修改業務邏輯。
*   **存放位置：** 所有 Mocks 定義檔與路由攔截統一放在 `/src/mocks/`。

## 2. `.env` 環境變數檔的切分與職責
專案根目錄必須定義以下環境變數檔，並設定好 Git Ignore (`.env.local` 勿進版控)：
*   `.env` (全域共用變數，如網頁站台名稱)
*   `.env.development` (開發環境：連線測試資料庫、啟用 Mock 機制)
*   `.env.production` (正式環境：連線正式外部 API)

**重要變數定義範例：**
```env
# 決定前端應用的對外 Base Web URL
VITE_WEB_BASE_URL=https://my-app.com

# 決定發送 API 請求的目標伺服器 (若有 BFF 則指回本身)
VITE_API_BASE_URL=https://api.my-app.com

# 是否在開發期啟用假資料 (Mock) 攔截
VITE_USE_MOCK=true
```

## 3. Axios 取用 API 來源並掛載攔截

所有的 Request 預設就是去讀取 `.env` 的 Base URL。

> ⚠️ **雙軌架構注意：** 本專案採用 Vite（後台 SPA）+ Next.js（對外官網）雙軌制，兩者的環境變數語法**完全不同**，不可混用在同一個檔案中。各軌道應各自建立獨立的 `apiClient.ts`。

### Vite 後台 SPA（`import.meta.env`）
```typescript
// src/api/client.ts (Vite 專案)
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});
// (底下承接 SKILL_API層與攔截快取 中的 Interceptors 設定)
```

對應 `.env` 變數命名規則：所有變數必須以 `VITE_` 開頭，否則 Vite 不會暴露給前端。

### Next.js 對外官網（`process.env`）
```typescript
// lib/api/client.ts (Next.js 專案)
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});
// (底下承接 SKILL_API層與攔截快取 中的 Interceptors 設定)
```

對應 `.env` 變數命名規則：僅前端（Client Component）需要存取的變數必須以 `NEXT_PUBLIC_` 開頭。Server Component 中可直接使用不帶前綴的環境變數（如 `process.env.API_SECRET_KEY`），這些變數不會洩漏至瀏覽器端。

## 4. 入口點整合：環境變數啟動 Mock
在應用程式啟動前，判斷環境變數，決定是否掛載 MSW：
```typescript
// src/main.tsx (Vite) 或 index.tsx
async function enableMocking() {
  // 嚴格讀取環境變數，非 true 即跳出 (確保 Production 絕對不會跑到假資料)
  if (import.meta.env.VITE_USE_MOCK !== 'true') return; 

  // 動態載入 MSW worker 以免增加 production 打包體積
  const { worker } = await import('./mocks/browser');
  return worker.start();
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(<App />);
});
```

總結：透過這套 `.env` 切分機制，我們只需要在本地開發時調整 `VITE_USE_MOCK` 開關，就能即時切換「全假資料開發」或是「串接開發站測試 API」，且程式碼永遠不須改動。
