# React 學習進度追蹤表

> 根據現有學習筆記、Skills 文件與前端實作準則，整合出完整的 React 知識學習清單。  
> 難度基準：有 .NET MVC 背景、2 年前端轉職目標。  
> 最後更新：2026-05-25

---

## 學習進度統計

| 指標 | 數值 |
|------|------|
| ✅ 已完成 | 2 |
| 📖 學習中 | 0 |
| ⬜ 未開始 / 未讀 | 161 |
| **總計項目** | **163** |
| **完成率** | **2 / 163　≈ 1.2%** |
| **預估已花時數** | ~0.5h |
| **預估剩餘時數** | ~136.5h |

> 每完成一項請更新上方統計數字與完成率。

---

## 總覽

| 階段 | 主題 | 項目數 | 預估時數 | 狀態 |
|------|------|--------|----------|------|
| 第一階段 | React 核心概念（鳥瞰） | 30 節 | 10h | 📖 學習中 |
| 第二階段 | React 進階機制（Hook 深度） | 29 節 | 20h | ⬜ 未開始 |
| 第三階段 | 狀態管理 | 4 項 | 8h | ⬜ 未開始 |
| 第四階段 | 資料層與 API | 4 項 | 6h | ⬜ 未開始 |
| 第五階段 | 路由設計（含 React Server Components） | 9 項 | 11h | ⬜ 未開始 |
| 第六階段 | 工程化工具（Vite / ESLint） | 2 項 | 3h | ⬜ 未開始 |
| 第七階段 | 實作 Skills（動手練） | 9 項 | 18h | ⬜ 未開始 |
| 第八階段 | 前端架構守則（閱讀＋實踐） | 9 項 | 9h | ⬜ 未開始 |
| 第九階段 | **TypeScript**（1 年實作水準） | 22 項 | 20h | ⬜ 未開始 |
| 第十階段 | **TailwindCSS**（1 年實作水準） | 24 項 | 16h | ⬜ 未開始 |
| 第十一階段 | **Vitest 自動化測試** | 9 節 | 8h | ⬜ 未開始 |
| 第十二階段 | **專案結構與架構概念** | 12 項 | 8h | ⬜ 未開始 |
| **合計** | | **163** | **~137h** | |

---

## 第一階段：React 核心概念鳥瞰
> 對應筆記：[react-框架初探-學習筆記.md](../學習筆記/react-框架初探-學習筆記.md)  
> 預估時間：10 小時（8 Parts × 約 1.25h）

### Part 1：React 五層架構鳥瞰

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 1 | 五層架構全景圖 | ✅ 已讀 | UI / State / Data / Routing / Build |
| 2 | 與 .NET MVC 的層次對照 | ✅ 已讀 | 理解 React 為何「散」 |

### Part 2：UI Layer — React 的本體

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 3 | React 的本質與定位 | ⬜ 未讀 | |
| 4 | JSX 不是 HTML | ⬜ 未讀 | className、{}插值、條件渲染 |
| 5 | Component 化思維 | ⬜ 未讀 | Props 傳遞、拆分粒度 |
| 6 | Declarative UI（宣告式 UI） | ⬜ 未讀 | vs jQuery 命令式 |
| 7 | Virtual DOM | ⬜ 未讀 | |
| 8 | 單向資料流（One-way Data Flow） | ⬜ 未讀 | |

### Part 3：State Layer — 工具選型矩陣

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 9 | State 的三種類型 | ⬜ 未讀 | Local / Shared / Server |
| 10 | 六大工具總覽 | ⬜ 未讀 | 選型決策樹 |
| 11 | useState — 元件內最小狀態單位 | ⬜ 未讀 | |
| 12 | useReducer — 把狀態變化集中管理 | ⬜ 未讀 | |
| 13 | Context API — 輕量全域傳遞 | ⬜ 未讀 | |
| 14 | Redux Toolkit — 嚴謹的全域 Store | ⬜ 未讀 | |
| 15 | Zustand — 極簡全域 Store | ⬜ 未讀 | |
| 16 | Jotai — 原子化狀態模型 | ⬜ 未讀 | |

### Part 4：Data Layer — Server State 的特殊性

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 17 | 為什麼 Server State 要獨立看待 | ⬜ 未讀 | |
| 18 | fetch vs React Query | ⬜ 未讀 | |

### Part 5：Routing Layer — 兩種路由哲學

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 19 | React Router — 程式碼宣告路徑（CSR） | ⬜ 未讀 | |
| 20 | Next.js — 檔案路由 + SSR | ⬜ 未讀 | |
| 21 | 為什麼 Next.js 採用檔案路由 | ⬜ 未讀 | |

### Part 6：Build / Tooling Layer

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 22 | 三大支柱：編譯、打包、品質 | ⬜ 未讀 | TypeScript / Vite / ESLint |

### Part 7：Class → Hooks 思維革命

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 23 | Class Component 的三大痛 | ⬜ 未讀 | |
| 24 | Function + Hooks 怎麼解 | ⬜ 未讀 | |
| 25 | 常用 Hook 速查表 | ⬜ 未讀 | |

### Part 8：實戰案例 — Repair Alliance App

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 26 | Feature-Based 目錄結構 | ⬜ 未讀 | FSD 架構 |
| 27 | 從 .NET 到 Next.js 的職責對照 | ⬜ 未讀 | |
| 28 | 此架構解決的痛點 | ⬜ 未讀 | |
| 29 | 與傳統 MVC 的關鍵差異 | ⬜ 未讀 | |
| 30 | 整體技術棧解析 | ⬜ 未讀 | |

---

## 第二階段：React 進階機制（Hook 深度）
> 對應筆記：[react-進階學習筆記-notion版.md](../學習筆記/react-進階學習筆記-notion版.md)  
> 預估時間：20 小時（9 Parts × 約 2.2h，含實作練習）

### Part 1：核心哲學

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 1 | 從操作 DOM 到資料驅動 | ⬜ 未讀 | `UI = f(state)` |
| 2 | 單向資料流與受控組件 | ⬜ 未讀 | Controlled vs Uncontrolled |
| 3 | Virtual DOM 與 Diffing 機制 | ⬜ 未讀 | Reconciliation 演算法 |
| 4 | 與 .NET MVC 架構的映射 | ⬜ 未讀 | |

### Part 2：JavaScript 記憶體模型

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 5 | 嚴格相等對物件的判斷 | ⬜ 未讀 | 參考值 vs 值 |
| 6 | 不可變性原則 | ⬜ 未讀 | Immutability |
| 7 | 淺拷貝 vs 深拷貝 | ⬜ 未讀 | spread / structuredClone |

### Part 3：State 與渲染時序

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 8 | useState 的快照機制與批次更新 | ⬜ 未讀 | 閉包陷阱 |
| 9 | 渲染時序 Render Pipeline | ⬜ 未讀 | Trigger → Render → Commit |
| 10 | Class Component 生命週期 | ⬜ 未讀 | 對照 Hook 等價 |

### Part 4：useEffect 與副作用管理

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 11 | useEffect 三大模式 | ⬜ 未讀 | 掛載/更新/卸載 |
| 12 | 死循環陷阱 | ⬜ 未讀 | 依賴陣列設計 |
| 13 | Cleanup Function 清理機制 | ⬜ 未讀 | |
| 14 | 事件監聽器管理（Cleanup 應用 1） | ⬜ 未讀 | |
| 15 | 競態競爭處理（Cleanup 應用 2） | ⬜ 未讀 | Race condition |

### Part 5：衍生資料與效能優化

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 16 | useMemo vs useEffect 的選用 | ⬜ 未讀 | |
| 17 | 效能優化三大法寶 | ⬜ 未讀 | memo / useMemo / useCallback |

### Part 6：架構決策

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 18 | Prop Drilling 與 Context API | ⬜ 未讀 | |
| 19 | 全域狀態管理架構決策 | ⬜ 未讀 | 何時選 Zustand / Redux |
| 20 | Custom Hook 與 Context 權衡 | ⬜ 未讀 | |

### Part 7：邏輯封裝與實戰

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 21 | Custom Hook 實戰：封裝 useFetch | ⬜ 未讀 | 含實作練習 |
| 22 | 表單處理與驗證：Controlled vs Uncontrolled vs RHF | ⬜ 未讀 | react-hook-form |
| 23 | HOC 高階組件：橫切關注點與權限控管 | ⬜ 未讀 | |

### Part 8：路由與全域狀態

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 24 | React Router：巢狀路由、Guard、URL 參數 | ⬜ 未讀 | |
| 25 | React.lazy 與 Suspense：延遲載入 | ⬜ 未讀 | Code Splitting |
| 26 | Zustand 全域狀態管理：對照 .NET DI Lifetimes | ⬜ 未讀 | |

### Part 9：品質保證與部署

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 27 | React DevTools 與效能診斷 | ⬜ 未讀 | |
| 28 | Vite 建置工具與環境配置 | ⬜ 未讀 | |
| 29 | MVC 在 React 中的最終實踐 | ⬜ 未讀 | |

---

## 第三階段：狀態管理（深度實作）
> 預估時間：8 小時

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | Zustand 基礎：建 Store、讀寫、分片 | ⬜ 未開始 | 2h | 對照 .NET DI |
| 2 | Zustand 進階：persist、devtools、middleware | ⬜ 未開始 | 2h | |
| 3 | Context API 實作：Theme / Auth / Lang | ⬜ 未開始 | 2h | |
| 4 | Redux Toolkit 入門（選修）| ⬜ 未開始 | 2h | 大型專案需要 |

---

## 第四階段：資料層與 API
> 對應 Skill：[SKILL_API層與攔截快取.md](../../skills/SKILL_API層與攔截快取.md)  
> 預估時間：6 小時

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | Axios 攔截器實作（token 自動帶入、錯誤統一處理）| ⬜ 未開始 | 1.5h | |
| 2 | React Query：useQuery / useMutation 基礎 | ⬜ 未開始 | 2h | |
| 3 | React Query：快取策略、staleTime、invalidate | ⬜ 未開始 | 1.5h | |
| 4 | 錯誤邊界（Error Boundary）與 Suspense 整合 | ⬜ 未開始 | 1h | |

---

## 第五階段：路由設計
> 對應 Skill：[SKILL_對外官網路由_Next.md](../../skills/SKILL_對外官網路由_Next.md)、[SKILL_後台管理路由_Vite.md](../../skills/SKILL_後台管理路由_Vite.md)  
> 對應筆記：[nextjs-架構與mvc對照學習筆記.md](../學習筆記/nextjs-架構與mvc對照學習筆記.md)  
> 預估時間：11 小時

### 5-A：CSR 路由（React Router）

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | React Router v6：BrowserRouter、巢狀路由、Outlet | ⬜ 未開始 | 1.5h | |
| 2 | React Router：Route Guard（PrivateRoute 實作） | ⬜ 未開始 | 1h | |

### 5-B：SSR 路由與 React Server Components（Next.js App Router）

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 3 | Next.js App Router 基礎：page.tsx、layout.tsx、loading.tsx、error.tsx | ⬜ 未開始 | 2h | 檔案約定速查 |
| 4 | Server Components vs Client Components：`'use client'` 邊界與序列化限制 | ⬜ 未開始 | 1h | RSC 核心概念，Props 必須可序列化 |
| 5 | RSC 資料抓取模式：在 Server Component 直接 `await fetch`，告別 useEffect + useState | ⬜ 未開始 | 1h | 對照傳統 CSR fetch；Next 的 fetch 快取策略 |
| 6 | Streaming + Suspense：`<Suspense>` 邊界、loading.tsx、RSC payload 漸進送達 | ⬜ 未開始 | 1h | TTFB 與 LCP 的關係 |
| 7 | Server Actions：`'use server'`、`<form action={fn}>`、`useFormState` / `useFormStatus` | ⬜ 未開始 | 1.5h | 取代傳統 API Route + fetch |
| 8 | RSC 決策樹：何時選 Server / Client、Client Boundary 上推陷阱、`children` 透傳模式 | ⬜ 未開始 | 0.5h | 最常見錯誤：整頁誤標 'use client' |

### 5-C：雙軌架構整合

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 9 | 雙軌路由架構（Next SSR + Vite CSR 分工）| ⬜ 未開始 | 1.5h | 對應 SKILL_雙軌路由 |

---

## 第六階段：工程化工具（Vite / ESLint）
> TypeScript 與 Vitest 已拆為獨立階段（第九、十一階段），本階段聚焦建置工具設定。  
> 預估時間：3 小時

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | Vite：環境變數（.env）、alias 設定、build 優化 | ⬜ 未開始 | 1.5h | 對應進階筆記 Part 9 |
| 2 | ESLint + Prettier + Husky pre-commit 全套設定 | ⬜ 未開始 | 1.5h | |

---

## 第七階段：實作 Skills（動手練）
> 對應 `skills/` 資料夾文件  
> 預估時間：18 小時（每 Skill 約 2h）

| # | Skill | 完成度 | 預估 | 關聯知識點 |
|---|-------|--------|------|-----------|
| 1 | [SKILL_表單與動態驗證](../../skills/SKILL_表單與動態驗證.md) | ⬜ 未開始 | 2h | RHF + Zod |
| 2 | [SKILL_API層與攔截快取](../../skills/SKILL_API層與攔截快取.md) | ⬜ 未開始 | 2h | Axios + React Query |
| 3 | [SKILL_多國語系i18n實作](../../skills/SKILL_多國語系i18n實作.md) | ⬜ 未開始 | 2h | next-intl |
| 4 | [SKILL_功能開關FeatureToggles](../../skills/SKILL_功能開關FeatureToggles.md) | ⬜ 未開始 | 2h | 環境變數 + Context |
| 5 | [SKILL_動態設定與Mock假資料](../../skills/SKILL_動態設定與Mock假資料.md) | ⬜ 未開始 | 2h | MSW / JSON |
| 6 | [SKILL_對外官網路由_Next](../../skills/SKILL_對外官網路由_Next.md) | ⬜ 未開始 | 2h | Next.js App Router |
| 7 | [SKILL_後台管理路由_Vite](../../skills/SKILL_後台管理路由_Vite.md) | ⬜ 未開始 | 2h | React Router v6 |
| 8 | [SKILL_樣式與UI_Tailwind](../../skills/SKILL_樣式與UI_Tailwind.md) | ⬜ 未開始 | 2h | TailwindCSS + cn |
| 9 | [SKILL_雙軌路由與SSR切分](../../skills/SKILL_雙軌路由與SSR切分.md) | ⬜ 未開始 | 2h | SSR / CSR 混合 |

---

## 第八階段：前端架構守則（閱讀＋實踐）
> 對應 `docs/前端實作準則/` 資料夾  
> 預估時間：9 小時（每份文件約 1h）

| # | 文件 | 完成度 | 與 React 的關係 |
|---|------|--------|----------------|
| 1 | [01_前端技術架構與優化指南](../前端實作準則/01_前端技術架構與優化指南.md) | ⬜ 未讀 | React 生態選型決策 |
| 2 | [02_錯誤處理策略](../前端實作準則/02_錯誤處理策略.md) | ⬜ 未讀 | Error Boundary / toast |
| 3 | [03_SEO與語意化實作指南](../前端實作準則/03_SEO與語意化實作指南.md) | ⬜ 未讀 | Next.js metadata |
| 4 | [04_微互動與體驗指南](../前端實作準則/04_微互動與體驗指南.md) | ⬜ 未讀 | Framer Motion / CSS |
| 5 | [05_元件架構與切分](../前端實作準則/05_元件架構與切分.md) | ⬜ 未讀 | FSD 模組化 |
| 6 | [06_效能優化與程式碼分割守則](../前端實作準則/06_效能優化與程式碼分割守則.md) | ⬜ 未讀 | React.lazy / memo |
| 7 | [07_前端資安防護守則](../前端實作準則/07_前端資安防護守則.md) | ⬜ 未讀 | XSS / CSRF |
| 8 | [08_前端日誌與操作追蹤策略](../前端實作準則/08_前端日誌與操作追蹤策略.md) | ⬜ 未讀 | Sentry / 事件追蹤 |
| 9 | [09_全域UI狀態管理守則](../前端實作準則/09_全域UI狀態管理守則.md) | ⬜ 未讀 | Zustand / Context |

---

## 建議學習順序

```
【基礎建立】
第九階段 TS 基礎概念 → 第一階段（React 鳥瞰）→ 第十二階段（專案結構概念）

【核心機制】
第二階段 Part 1-3（哲學 + 記憶體 + 渲染時序）
→ 第九階段 TS React 專用型別
→ 第三階段 Zustand → 第四階段 React Query
→ 第二階段 Part 4-7（副作用 + 效能 + 封裝）

【技術廣度】
第五階段（路由）→ 第十階段（TailwindCSS）→ 第六階段（Vite/ESLint）

【整合驗收】
第七階段（Skills 動手練）→ 第十一階段（Vitest 測試）
→ 第八階段（守則閱讀）
```

> 每完成一個項目，將 `⬜ 未讀 / 未開始` 改為 `📖 學習中` 或 `✅ 完成`。

---

---

## 第九階段：TypeScript（目標：1 年實作水準）
> 預估時間：20 小時  
> 目標：能在 React 專案中獨立定義型別、閱讀泛型程式碼、不依賴 `any` 解決問題。

### 9-A：核心概念

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | 為何用 TypeScript：型別安全、IDE 補全、重構保障 | ⬜ 未開始 | 0.5h | vs 純 JS 對比 |
| 2 | 靜態型別 vs 動態型別（對照 C# vs JavaScript）| ⬜ 未開始 | 0.5h | |
| 3 | 結構型別系統（Structural Typing）—「形狀相符就可用」| ⬜ 未開始 | 0.5h | TS 與 C# 最大差異 |
| 4 | 型別推斷（Type Inference）—讓 TS 自己猜 | ⬜ 未開始 | 0.5h | |

### 9-B：基礎型別語法

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 5 | 基本型別：string, number, boolean, null, undefined, void, never, unknown, any | ⬜ 未開始 | 1h | `never` 與 `unknown` 常考 |
| 6 | 聯合型別（Union `\|`）與交叉型別（Intersection `&`）| ⬜ 未開始 | 1h | |
| 7 | 字面型別（Literal Type）與 `as const` | ⬜ 未開始 | 0.5h | 限制參數為特定值 |
| 8 | `type` Alias vs `interface`：選用時機 | ⬜ 未開始 | 1h | extend vs & |
| 9 | Enum vs Union 字面型別：何時用哪個 | ⬜ 未開始 | 0.5h | |
| 10 | Tuple：固定長度與型別的陣列 | ⬜ 未開始 | 0.5h | |

### 9-C：函式與物件型別

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 11 | 函式型別簽名、可選參數 `?`、預設值、Rest 參數 | ⬜ 未開始 | 1h | |
| 12 | 物件型別、Index Signature `[key: string]: T`、Readonly | ⬜ 未開始 | 0.5h | |
| 13 | 型別縮窄（Type Narrowing）：typeof、instanceof、in | ⬜ 未開始 | 1h | 實戰最常用 |

### 9-D：進階型別（1 年水準門檻）

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 14 | 泛型（Generics）基礎：`<T>` 的用法與意義 | ⬜ 未開始 | 1.5h | 對照 C# Generic |
| 15 | 泛型約束：`extends` 限制 T 的形狀 | ⬜ 未開始 | 1h | |
| 16 | 工具型別：`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record` | ⬜ 未開始 | 1.5h | 每天都在用 |
| 17 | `ReturnType<T>`, `Parameters<T>`, `Awaited<T>` | ⬜ 未開始 | 1h | 推導函式型別 |
| 18 | `keyof`, `typeof`：從物件萃取型別 | ⬜ 未開始 | 1h | |

### 9-E：React 中的 TypeScript 實戰

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 19 | 元件 Props 型別：FC vs 直接型別化函式、`PropsWithChildren` | ⬜ 未開始 | 1h | |
| 20 | Event 型別：`React.ChangeEvent`, `React.MouseEvent`, `React.FormEvent` | ⬜ 未開始 | 0.5h | |
| 21 | Hook 型別：`useState<T>`, `useRef<T>`, `useReducer` action 聯合型別 | ⬜ 未開始 | 1h | |
| 22 | Custom Hook 回傳值型別設計、Generic Component 實作 | ⬜ 未開始 | 1.5h | |

---

## 第十階段：TailwindCSS（目標：1 年實作水準）
> 對應筆記：[tailwindcss-進階學習筆記.md](../學習筆記/tailwindcss-進階學習筆記.md)  
> 預估時間：16 小時  
> 目標：能獨立建立設計系統、解決動態 class 問題、維護大型專案 Tailwind 規範。

### 10-A：核心哲學與概念

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | Utility-First 哲學：原子 class vs 傳統 BEM/SCSS | ⬜ 未開始 | 0.5h | 理解「為何這樣設計」 |
| 2 | Atomic CSS 概念：每個 class 只做一件事 | ⬜ 未開始 | 0.5h | |
| 3 | JIT 引擎原理：靜態掃描、按需產生、動態 class 陷阱 | ⬜ 未開始 | 1h | 對應筆記 Part 1 |
| 4 | Design Token 概念：間距/顏色/字級的設計語言 | ⬜ 未開始 | 0.5h | |
| 5 | 8-Point Grid System：為何間距用 4/8/16/32 | ⬜ 未開始 | 0.5h | |

### 10-B：核心語法（版面 + 間距 + 色彩）

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 6 | Flexbox：`flex`, `items-`, `justify-`, `flex-col`, `gap-` | ⬜ 未開始 | 1h | |
| 7 | Grid：`grid`, `grid-cols-`, `col-span-`, `grid-rows-` | ⬜ 未開始 | 1h | |
| 8 | 間距系統：`p-`, `m-`, `space-x/y-`（對應 8pt Grid）| ⬜ 未開始 | 0.5h | |
| 9 | 尺寸：`w-`, `h-`, `min-w-`, `max-w-`, `size-` | ⬜ 未開始 | 0.5h | |
| 10 | 色彩：`bg-`, `text-`, `border-`, `ring-`（Tailwind 色板）| ⬜ 未開始 | 0.5h | |
| 11 | 字體：`text-sm/base/lg`, `font-bold`, `leading-`, `tracking-` | ⬜ 未開始 | 0.5h | |
| 12 | 邊框 + 圓角 + 陰影：`border-`, `rounded-`, `shadow-` | ⬜ 未開始 | 0.5h | |
| 13 | 定位：`relative`, `absolute`, `fixed`, `sticky`, `z-` | ⬜ 未開始 | 0.5h | |
| 14 | 動畫過渡：`transition-`, `duration-`, `ease-`, `hover:scale-` | ⬜ 未開始 | 0.5h | |

### 10-C：響應式 + 狀態修飾符

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 15 | 斷點前綴：`sm:` `md:` `lg:` `xl:`，Mobile-first 思維 | ⬜ 未開始 | 1h | |
| 16 | 狀態修飾符：`hover:`, `focus:`, `active:`, `disabled:` | ⬜ 未開始 | 0.5h | |
| 17 | `group` + `peer`：父子狀態聯動 | ⬜ 未開始 | 1h | 進階常用 |
| 18 | Dark Mode：`dark:` 前綴，`class` 策略設定 | ⬜ 未開始 | 1h | |

### 10-D：進階工程化（1 年水準門檻）

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 19 | `tailwind.config.js`：擴充 colors, spacing, fontSize | ⬜ 未開始 | 1h | 對應筆記 Part 2 |
| 20 | `@layer components / utilities` 與 `@apply`：使用時機與限制 | ⬜ 未開始 | 1h | 對應筆記 Part 3 |
| 21 | `clsx` + `tailwind-merge` + `cn helper`：動態 class 標準解 | ⬜ 未開始 | 1h | 對應筆記 §6-8 |
| 22 | `cva`（class-variance-authority）：Variant 模式建元件 | ⬜ 未開始 | 1h | Button/Badge 常見模式 |
| 23 | Arbitrary values `[px]`：脫離設計系統的取捨 | ⬜ 未開始 | 0.5h | |
| 24 | shadcn/ui 整合：理解 Tailwind + Radix 的組合模式 | ⬜ 未開始 | 1h | |

---

## 第十一階段：Vitest 自動化測試
> 對應筆記：[vitest-自動化測試學習筆記.md](../學習筆記/vitest-自動化測試學習筆記.md)  
> 對應 Workflow：[03-單元測試與自動化驗證.md](../../workflows/03-單元測試與自動化驗證.md)  
> 預估時間：8 小時

### Part 1：自動化測試的工程價值

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 1 | 測試金字塔：Vitest（單元）vs Playwright（E2E）vs 其他 | ⬜ 未讀 | 為什麼分層 |
| 2 | 為什麼大型專案必備（回歸保護、重構信心） | ⬜ 未讀 | |

### Part 2：Vitest 入門與實戰

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 3 | Vitest 基礎用法：`describe`, `it`, `expect`, `beforeEach` | ⬜ 未讀 | |
| 4 | Vitest 能測什麼：純函式、Hook、元件行為 | ⬜ 未讀 | |
| 5 | 常用斷言與 Mock：`vi.fn()`, `vi.mock()`, `vi.spyOn()` | ⬜ 未讀 | |

### Part 3：Playwright 與 E2E 測試

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 6 | Playwright 基礎：locator、click、fill、expect | ⬜ 未讀 | |

### Part 4：CI/CD 整合

| # | 章節 | 完成度 | 備註 |
|---|------|--------|------|
| 7 | Build 時的物理隔離：測試碼不會出貨 | ⬜ 未讀 | |
| 8 | GitHub Actions 整合：PR 觸發自動跑測試 | ⬜ 未讀 | |
| 9 | 開發模式 vs 生產模式：React 的行為差異 | ⬜ 未讀 | |

---

## 第十二階段：專案結構與架構概念
> 本階段聚焦「知識性理解」—不是單一工具，而是讓你能看懂並設計出可維護的專案骨架。  
> 預估時間：8 小時

### 12-A：目錄結構設計

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 1 | Feature-Sliced Design（FSD）概念：app / pages / widgets / features / entities / shared | ⬜ 未開始 | 1.5h | 對照 .NET 分層 |
| 2 | 何時用 Feature-Based，何時用 Layer-Based | ⬜ 未開始 | 0.5h | 規模判斷 |
| 3 | Barrel exports（`index.ts`）：優缺點與陷阱 | ⬜ 未開始 | 0.5h | 循環依賴問題 |
| 4 | `types/` 集中管理策略：全域 vs 模組內 vs 就近定義 | ⬜ 未開始 | 0.5h | |

### 12-B：命名慣例

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 5 | 檔案命名：PascalCase 元件 vs kebab-case 工具模組 | ⬜ 未開始 | 0.5h | |
| 6 | 函式/變數命名：camelCase、`use` 前綴 Hook、`handle` 前綴 handler | ⬜ 未開始 | 0.5h | |
| 7 | 型別命名慣例：`XxxProps`, `XxxState`, `XxxPayload` | ⬜ 未開始 | 0.5h | |

### 12-C：元件設計模式

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 8 | Compound Component 模式：`<Select>` + `<Select.Option>` | ⬜ 未開始 | 1h | 高可組合性 |
| 9 | Render Props vs HOC vs Custom Hook：三種橫切關注點解法 | ⬜ 未開始 | 1h | 知道何時選哪個 |
| 10 | Headless Component 概念：邏輯與樣式分離（Radix / Headless UI）| ⬜ 未開始 | 1h | |

### 12-D：可維護性原則

| # | 主題 | 完成度 | 預估 | 備註 |
|---|------|--------|------|------|
| 11 | 關注點分離（SoC）：UI / 邏輯 / 資料三層不混寫 | ⬜ 未開始 | 0.5h | |
| 12 | 元件粒度判斷：何時拆、何時不拆（避免過度工程）| ⬜ 未開始 | 0.5h | |

---

## 完成度圖例

| 符號 | 意義 |
|------|------|
| ⬜ 未讀 / 未開始 | 尚未進入 |
| 📖 學習中 | 正在進行，或已讀但未實作 |
| ✅ 完成 | 讀完且理解，或實作通過 |
| 🔁 需複習 | 曾讀過，需要再鞏固 |
