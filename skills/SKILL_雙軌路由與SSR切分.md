---
name: 雙軌路由與渲染策略 (Routing & SSR vs CSR) — 導讀
description: 對外官網採 Next.js 以滿足 SEO，對內後台採 Vite 以最大化渲染效率。本文件僅為導讀與決策摘要，實作細節請依用途參閱對應的子規範。
---

# 技能指令：雙軌路由與渲染策略（導讀）

本專案存在兩種屬性截然不同的前端流量：「對外公開網站」需要被搜尋引擎收錄，「對內管理後台」只服務已登入的內部人員。兩者的最佳化目標不同，因此**強制採用雙軌制**，依用途分流框架，不可混用。

> 為方便閱讀，兩軌的實作細節已拆分為獨立檔案。本檔僅保留**架構決策**與**指引**。

## 0. 看哪一份？

| 你正在做的工作 | 請看這份 |
|----------------|----------|
| 對外公開網站（行銷頁、商品列表、文章）—— 路由、SSR/SSG、Metadata、部署 | **[SKILL_對外官網路由_Next](SKILL_對外官網路由_Next.md)** |
| 對內管理後台（儀表板、訂單管理、Feature Toggle 後台）—— 路由、Auth Guard、SPA 部署 | **[SKILL_後台管理路由_Vite](SKILL_後台管理路由_Vite.md)** |
| 不確定屬於哪一軌、或想了解整體決策 | 繼續閱讀本文件 |

## 1. 架構決策：兩軌的選型理由

| 軌道 | 框架 | 路由 | 主要動機 | 不採用對方的原因 |
|------|------|------|----------|------------------|
| 對外公開網站 | **Next.js (App Router)** | 檔案系統路由 + `generateMetadata` | **SEO**：必須 SSR/SSG 讓 Google 蜘蛛抓到完整 HTML、TDK、OG | Vite SPA 的 client-render 對爬蟲不友善，TDK 也難動態化 |
| 對內管理後台 | **React + Vite (SPA)** | `react-router-dom` (`<BrowserRouter>` + `<Routes>`) | **渲染效率**：純靜態打包、瀏覽器快取、零伺服器算力浪費；HMR 開發體驗最快 | 後台不需被搜尋引擎收錄，Next.js 的 SSR 反而是浪費伺服器資源、增加部署複雜度 |

## 2. 不可混用原則

> **同一個應用內不可同時掛 Next.js 與 Vite。** 要分流就分專案（或 monorepo 下的兩個 package），不要讓任何模組同時被兩邊 import。

具體禁忌：

| 場景 | 為什麼不行 |
|------|-----------|
| 在 Vite SPA 寫 `generateMetadata` / `getServerSideProps` | 這是 Next 專屬 API，Vite 不認得 |
| 在 Next.js 用 `react-router-dom` 取代 App Router | 會繞過 SSR，SEO 效益歸零 |
| 把 `process.env.NEXT_PUBLIC_*` 與 `import.meta.env.VITE_*` 在同一份 `apiClient.ts` 混用 | 兩者語法不相容，必有一邊拿到 `undefined` |
| 把對外站的 Server Component 直接 import 到後台 SPA | Server Component 含 server-only 程式碼，會直接 build 失敗 |

## 3. 跨軌共用的議題

兩軌雖然框架不同，但以下議題必須維持一致或共享規範：

| 議題 | 共用規範與位置 |
|------|---------------|
| Design Tokens | 共用同一份 `tailwind.config.js` 基礎，後台允許更密集佈局 → [01_設計系統與視覺規範](../docs/前端UIUX設計/01_設計系統與視覺規範.md) |
| API Client | 各軌**各自**建立 `apiClient.ts`，但攔截器邏輯（Token、CSRF、Refresh）共通 → [SKILL_API層與攔截快取](SKILL_API層與攔截快取.md) |
| 環境變數 | 變數命名前綴不同（`NEXT_PUBLIC_` vs `VITE_`），但職責切分一致 → [SKILL_動態設定與Mock假資料](SKILL_動態設定與Mock假資料.md) |
| i18n | 對外採 `next-intl`、後台採 `react-i18next`；JSON 字典結構保持一致 → [SKILL_多國語系i18n實作](SKILL_多國語系i18n實作.md) |
| 安全 Headers / CSP | 兩軌都必須實作；對外由 Next middleware 注入，後台由 IIS Web.config 設定 → [07_前端資安防護守則](../docs/前端實作準則/07_前端資安防護守則.md) |
| Feature Toggles | 後端統一發 Flag，前端兩軌都消費同一支 API → [SKILL_功能開關FeatureToggles](SKILL_功能開關FeatureToggles.md) |
| 響應式設計 | 對外嚴格 Mobile-First，後台允許 Desktop-First → [03_響應式設計與斷點策略](../docs/前端UIUX設計/03_響應式設計與斷點策略.md) |

## 4. 怎麼判斷我的需求屬於哪一軌？

簡單判別流程：

1. **這個頁面需要被 Google 搜尋到嗎？**
   * 是 → **對外，走 Next**
   * 否 → 進入下一題
2. **這個頁面只給已登入的內部人員看嗎？**
   * 是 → **對內，走 Vite**
   * 否（給未登入訪客看，但不需 SEO，例如純 landing page）→ 仍走 **Next**，因為日後若加上 SEO 需求成本較低；除非有非常明確的「不會 SEO 化」承諾，否則別走 Vite
3. **混合需求（例如官網內含登入後的會員區）？**
   * 全部走 Next，登入後區塊用 Client Component + Auth Guard 即可。**不要為了登入區另起一個 Vite 應用**

## 5. 延伸閱讀

*   [SKILL_對外官網路由_Next](SKILL_對外官網路由_Next.md) — 對外站完整實作守則
*   [SKILL_後台管理路由_Vite](SKILL_後台管理路由_Vite.md) — 對內後台完整實作守則
*   [03_SEO與語意化實作指南](../docs/前端實作準則/03_SEO與語意化實作指南.md) — App Router 下的 SSG/SSR/ISR 範例
*   [01_前端技術架構與優化指南](../docs/前端實作準則/01_前端技術架構與優化指南.md) — 整體技術雷達
