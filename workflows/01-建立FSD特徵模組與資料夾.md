---
description: 說明如何在前端建立具有良好封裝性的 FSD (Feature-Sliced Design) 模組，並明確定義 Type、Schema 與 API Action 的歸屬層級。
---

# 工作流程 (Workflow)：新增前端 Feature 模組與資料夾分割

當有新的功能需求時，不應該再把 Component 全部塞在 `src/components` 裡，請遵照以下流程建立特徵檔案夾，並遵守嚴格的分層架構。

## Step 1: 全域架構 vs 局部 Feature 架構

我們先區分哪些東西該放全域 (Global)，哪些該放特定功能內 (Feature)。

### 1-A. 全域共用層 (`/src`)
*   `/src/types/`：存放全域跨功能共用的 Type (例如 `UserToken`, `PaginatedResponse`)。
*   `/src/api/`：**共用的 Action 層設計**。存放 Axios Instance (由前一份文件定義的 `apiClient`)、共用 401/500 攔截器，以及全域的 Helper 函式 (如 `formatUrl`)。
*   `/src/shared/components/`：純 UI 元件 (如 `Button`, `Dialog_Base`)。

### 1-B. 功能專屬層 (`/src/features/{FeatureName}`)
與該業務 (如購物車 `Cart`, 登入 `Auth`) 深度綁定的邏輯，全部關在這個資料夾內。

## Step 2: 組織 Feature 內部結構 (細部技術對齊)
```text
src/features/ShoppingCart/
├── actions/         # Server-only：Next.js Server Actions（'use server'）
│   └── checkoutAction.ts # ← 表單提交、需 cookie / redirect 的副作用流程
├── api/             # Client-only：React Query hooks
│   └── useGetCart.ts  # ← 將 Axios 行為封裝進 React Query 的 Hook 中
├── components/      # 該業務獨有的 UI 元件
│   ├── CartItem.tsx   # Dumb Component：純接收 props 渲染
│   └── CartList.tsx   # Smart Component：呼叫 API Hook，將 DTO 映射給 UI
├── schemas/         # 表單驗證與資料防線
│   └── cartSchema.ts  # ← 放置針對 Zod 定義的驗證規則或 DTO Check
├── types/           # 當前功能私有的型別限制
│   └── index.ts       # ← 放置如 `type CartItemDTO` 等型別
├── lib/             # 純函式業務邏輯（無 React、無 I/O，可獨立單元測試）
│   └── cartCalc.ts    # ← 折扣計算、稅金規則、會員等級判定等純邏輯
├── hooks/           # React 耦合的客製 Hook（含 useState / useEffect）
│   └── useCartTotals.ts # ← 包裝 lib/cartCalc 並橋接 React 狀態
└── index.ts         # Feature 的**公共匯出層 (Public API)**
```

### 各層職責邊界（避免互相滲透）

| 層 | 職責 | 不能做什麼 |
|----|------|-----------|
| `actions/` | Server Action — 處理表單提交、設 cookie、redirect、寫資料庫 | ❌ 標 `'use client'`、❌ 用 React Hook |
| `api/` | TanStack Query 包裝（useQuery / useMutation） | ❌ 用在 Server Component（hook 只能 client 跑） |
| `lib/` | 純函式（同樣輸入永遠同樣輸出） | ❌ 引用 React、❌ 呼叫 fetch / cookie / DOM |
| `hooks/` | React 客製 hook，可引用 `lib/` | ❌ 標 `'use server'`、❌ 直接 fetch（請走 `api/`） |
| `components/` | UI 元件，可引用所有上述層 | ❌ 直接寫商業邏輯（請呼叫 `lib/`） |

> **關鍵分界 — `lib/` vs `hooks/`**：能不用 React 就獨立跑的純邏輯（如 `calculatePasswordStrength('abc')`），永遠放 `lib/`，因為單元測試零 mock 成本。`hooks/` 只負責「把 lib/ 接上 React 狀態」。

> **關鍵分界 — `actions/` vs `api/`**：兩者都是「跟後端對話」，但 `actions/` 是 server 端執行（'use server' 直接呼叫 Node 環境 API），`api/` 是 client 端執行（hook 只能瀏覽器跑）。詳見 [SKILL_表單與動態驗證](../skills/SKILL_表單與動態驗證.md) 第 3 節「表單提交策略」。

## Step 3: 限定跨模組匯出規則
*   **Public API 唯一出口：** 所有的元件、型別與方法，必須統一集中到 `index.ts` 中 `export` 出去。
*   **禁止深層拉取與耦合：**
    *   ❌ 錯誤: `import { CartItemDTO } from '@/features/ShoppingCart/types'`
    *   ✅ 正確: `import { CartItemDTO } from '@/features/ShoppingCart'` (統一由 index.ts 拋出)

## Step 4: API Action 共通層介接規範與資料映射
此層設計嚴格遵循「前端模組化與資料映射」概念：
當 feature 內的 `api/useGetCart.ts` (GET 查詢) 或 `api/useAddToCart.ts` (POST/PUT 變更) 發動請求時：
1. **呼叫底層發射器：** 必須引入全域的 `/src/api/client.ts` Axios 實體作為發射器，統一處理 Token、Timeout 與 401 攔截。
2. **DTO 資料映射 (Data Mapping)：** 必須在此 Hooks 層接收後端的 raw 資料 (DTO)，並**強制轉換 (Mapping)** 成前端容易理解的駝峰式結構。絕對禁止將後端伺服器特有的、醜陋的資料欄位直接往下傳遞給展示型 UI。

## Step 5: 業界官方最佳實踐參考 (Industry Best Practices)
這套架構設計深度參考了以下現代大師的主流演進方向，以確保最嚴格的**關注點分離 (Separation of Concerns)**：
*   **TanStack Query 維護者 TkDodo 的架構哲學：** 
    他的部落格重申「伺服器狀態 (Server State)」必須與「純前端狀態 (Client State)」徹底分開，不再將 API 拉回的資料同步存入 Redux/Zustand。透過將 `useQuery` / `useMutation` 封裝進獨立的 Custom Hook (如上述的 `api/` 目錄)，讓 React Component 完全不用知道背後是如何 Fetch、也不用管理 Query Keys 等細節，達到資料流與 UI 的完美解耦。
*   **Feature-Sliced Design (FSD) 官方方法論：** 
    FSD 官方明定了專案需依業務垂直切分為 **Entities (實體)**、**Features (特徵)** 與 **Shared (共用底層)**。我們上述的結構將 `types`, `schemas`, `api` 全數塞在 Feature 自己的目錄下，並透過 `index.ts` 當作對外的封裝出口 (Public API)，這正是 FSD 用來避免「檔案間義大利麵式牽連」、確保百萬行程式碼依然具備高度可維護性的核心理論。
