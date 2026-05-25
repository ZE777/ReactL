---
name: 對外官網路由與渲染 (Next.js App Router)
description: 對外公開網站採用 Next.js App Router 的路由、SSR/SSG 渲染策略、Metadata 動態化與部署細節。本文件僅涵蓋「對外」這一軌；對內後台請見 SKILL_後台管理路由_Vite。
---

# 技能指令：對外官網路由與渲染（Next.js）

> 本檔案是雙軌制的**對外**這一軌。架構決策、兩軌動機對照與不可混用原則見 [SKILL_雙軌路由與SSR切分](SKILL_雙軌路由與SSR切分.md)。

## 0. 為什麼是 Next.js？

對外網站需要被 **Google 蜘蛛完整收錄**。Vite SPA 的 client-render 在爬蟲眼中是空殼 HTML，TDK 與 OG Tags 也難以動態化，會直接傷害 SEO 排名。Next.js 的 App Router + SSR/SSG 能讓首屏 HTML 在伺服器端完整渲染，是面向客戶頁面唯一可接受的方案。

## 1. 路由機制：App Router（檔案系統路由）

統一採用 Next.js 14+ 的 **App Router**，禁止使用 Pages Router。

```
app/
├── (marketing)/              # Route Group，不影響 URL
│   ├── page.tsx              # → /
│   └── about/page.tsx        # → /about
├── products/
│   ├── page.tsx              # → /products
│   └── [id]/page.tsx         # → /products/:id（動態路由）
├── layout.tsx                # 全站共用 Layout
└── not-found.tsx             # 404 頁面
```

*   **Server Component 為預設：** 不要無腦在每個檔頂端加 `'use client'`，僅在需要瀏覽器 API、event handler、useState 時才標記。
*   **Route Group `(...)`：** 用於分組而不影響 URL（例如把行銷頁與產品頁分開維護）。
*   **Parallel / Intercepting Routes：** 進階場景（如 Modal 路由、儀表板多區塊獨立載入）才使用，初期不需。

## 2. 渲染策略：SSG / SSR / ISR 對照

| 頁面類型 | 渲染策略 | App Router 寫法 |
|---------|---------|----------------|
| 靜態首頁 / 關於我們 | SSG | 預設即為 Server Component，建構時自動靜態化 |
| 動態商品頁（有限路徑） | SSG + 動態路由 | 使用 `generateStaticParams()` 預先產生路徑 |
| 即時內容頁（庫存 / 價格） | SSR（每次請求） | `fetch()` 設定 `{ cache: 'no-store' }` |
| 半動態頁面 | ISR（增量靜態再生） | `fetch()` 設定 `{ next: { revalidate: 60 } }` |

> ⚠️ **App Router 不再使用** `getStaticProps` / `getServerSideProps` / `getInitialProps`。所有資料取得直接在 Server Component 中以 `async function` + `fetch` 完成。

詳細範例（含 `generateStaticParams` / `generateMetadata` / Server → Client 資料白名單過濾）見 [03_SEO與語意化實作指南](../docs/前端實作準則/03_SEO與語意化實作指南.md)。

## 3. Metadata 動態化（`generateMetadata`）

**每一個頁面**都必須提供完整的 TDK 與 OG Tags：

```tsx
// app/products/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`).then(r => r.json());
  return {
    title: `${product.name} | 品牌名稱`,
    description: product.description,
    openGraph: {
      title: product.name,
      images: [product.imageUrl],
    },
  };
}
```

*   **Title 格式：** 統一 `{頁面標題} | {品牌名稱}`
*   **OG Image：** 必須有，否則社群分享時呈現空白縮圖
*   **JSON-LD（結構化資料）：** 商品 / 文章類頁面在 `<script type="application/ld+json">` 中嵌入，爭取 Rich Snippets

## 4. 環境變數：`process.env.NEXT_PUBLIC_*`

```typescript
// lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});
```

*   **僅 Client Component 需要存取的變數**必須以 `NEXT_PUBLIC_` 開頭
*   **Server Component 中**可直接用不帶前綴的環境變數（如 `process.env.API_SECRET_KEY`），不會洩漏至瀏覽器
*   詳細切分見 [SKILL_動態設定與Mock假資料](SKILL_動態設定與Mock假資料.md)

## 5. Middleware：CSP nonce 與認證守衛

`src/middleware.ts` 統一承擔兩件事：CSP nonce 動態注入（XSS 防禦）與**認證路由守衛**（未登入導向 `/login`）。

### 5.1 CSP nonce 注入

```typescript
// middleware.ts — Edge Runtime，使用 Web Crypto API
const array = new Uint8Array(16);
crypto.getRandomValues(array);
const nonce = btoa(String.fromCharCode(...array));
// ... 組 CSP header 並設定 x-nonce 給 Server Component 使用
```

完整 CSP 設定與安全 Headers 詳見 [07_前端資安防護守則](../docs/前端實作準則/07_前端資安防護守則.md) 第 4 節。

### 5.2 認證守衛（受保護路徑全域攔截）

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/account', '/orders', '/checkout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname); // 登入後可導回原頁
      return NextResponse.redirect(loginUrl);
    }
  }
  // ...其他邏輯（CSP nonce 等）
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 5.3 為什麼選 middleware 而不是其他方案？

| 方案 | 問題 |
|------|------|
| ❌ `(account)/layout.tsx` 內檢查 cookie | layout 已在 server render 才執行，浪費伺服器資源；且每一個受保護群組都要重複寫 |
| ❌ Client 端 HOC + `useEffect` 重導 | 太晚了：頁面已 hydrate，使用者短暫看到內容後才被踢出；且 token 邏輯曝露在 client bundle |
| ✅ `middleware.ts` | 在請求進入時就攔截，不浪費 render 資源；認證邏輯集中一份 |

### 5.4 守衛的層級分工

middleware 只做「**有沒有 token**」的粗粒度攔截。細粒度權限（角色、租戶、資源所有權）必須在 Server Action / API 內二次驗證 — 永遠不信任 middleware 通過 = 有權限。

## 6. Provider 組裝（`app/providers/`）

App Router 的 Root Layout 是 Server Component（必須產出 `<html>` 與 metadata），但全域 Provider（QueryClient、Theme、Auth Context）必須是 Client Component。橋樑是 `app/providers/` 資料夾。

### 6.1 結構與職責分離

```text
src/app/providers/
├── QueryProvider.tsx    # 'use client' — 包 QueryClientProvider
├── ThemeProvider.tsx    # 'use client' — 主題切換（dark/light）
└── index.tsx            # 'use client' — 組裝順序固定
```

> 不要寫成單一檔 `app/providers.tsx`。多個 Provider 拆檔讓職責單一、新增 Provider 不動既有檔案。

### 6.2 QueryClient 必須用 `useState` 包

```tsx
// app/providers/QueryProvider.tsx
'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

| 寫法 | 後果 |
|------|------|
| ❌ `const queryClient = new QueryClient()` 寫在 module 頂層 | SSR 時跨使用者共享同一份 cache，A 看到 B 的資料（嚴重資安漏洞） |
| ❌ `const queryClient = new QueryClient()` 寫在 component 函式內 | 每次 re-render 建新 instance，cache 永遠重置 |
| ✅ `useState(() => new QueryClient(...))` | 每次請求一份、render 期間 stable |

### 6.3 Root Layout 引用方式

```tsx
// app/layout.tsx — Server Component
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/providers/index.tsx
'use client';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
```

> Provider 巢狀順序原則：「**外層提供基礎設施、內層消費**」。QueryClient 通常最外（其他 Provider 可能用 React Query 取資料），Theme 在中間，Auth Context 最內（要等資料）。

### 6.4 Zustand 不需 Provider

[09_全域UI狀態管理守則](../docs/前端實作準則/09_全域UI狀態管理守則.md) 規定 Zustand 為純前端 UI 狀態方案，**不需要 Provider 包覆**。只有 React Query 與 Context API 才需要進 `app/providers/`。

## 7. i18n：採 `next-intl`

對外網站使用 `next-intl`（與 App Router 整合最完整），詞綴字典結構與 [SKILL_多國語系i18n實作](SKILL_多國語系i18n實作.md) 規範一致。

## 8. 部署

*   **建置產物：** `next build` → `.next/`，由 Node.js Server 執行 `next start`
*   **Process 守護：** PM2 cluster mode（`exec_mode: "cluster"`）
*   **反向代理：** IIS URL Rewrite + ARR 將 80/443 轉發至內部 PM2 port
*   完整 CI/CD 管線見 [workflows/02-版本控管與CI-CD部署管線](../workflows/02-版本控管與CI-CD部署管線.md)

## 9. 不可做的事

| ❌ 禁止 | 為什麼 |
|--------|--------|
| 用 `react-router-dom` 取代 App Router | 失去 SSR / SSG 能力，SEO 失效 |
| Client Component 中讀資料庫 | 暴露連線資訊、無法 SSR |
| 把 API Secret 寫成 `NEXT_PUBLIC_*` | 會被打包到 client bundle，外洩 |
| 在 Server Component 把完整 API 物件 props 傳給 Client | 敏感欄位（金額、成本、PII）會出現在 RSC payload；必須白名單挑選欄位 |
| Server Action 內讀取或回傳敏感欄位給 client | 同上 RSC payload 外洩問題 |
| QueryClient 寫在 module scope（`const qc = new QueryClient()`） | SSR 跨使用者共享 cache，A 看到 B 的資料 |
