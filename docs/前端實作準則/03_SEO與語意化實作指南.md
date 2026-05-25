# SEO 與語意化實作具體指南 (SEO Implementation Guide)

這份文件詳述如何在前端落實具體的 SEO（搜尋引擎優化）實測方式與標籤結構，幫助內容在爬蟲中獲得最高排名。

## 1. 渲染架構的選擇 (Rendering Architecture)

> 本專案採雙軌制：**對外公開網站 = Next.js（為 SEO）**、**對內管理後台 = Vite SPA（為渲染效率）**。框架選型與路由守則見 [SKILL_雙軌路由與SSR切分](../../skills/SKILL_雙軌路由與SSR切分.md)。

*   **對內管理後台（Vite SPA）：** 由於需登入且不需爬蟲索引，維持 Client-Side Rendering (CSR) 即可，無需任何 SEO 處理。
*   **對外公開網站（Next.js 14+ App Router）：** 必須採用 SSR (Server-Side Rendering) 或 SSG (Static Site Generation)。本專案統一採用 **App Router** 架構（非 Pages Router），渲染策略如下：

    | 頁面類型 | 渲染策略 | App Router 寫法 |
    |---------|---------|----------------|
    | 靜態首頁 / 關於我們 | SSG (靜態生成) | 預設即為 Server Component，建構時自動靜態化 |
    | 動態商品頁 (有限路徑) | SSG + 動態路由 | 使用 `generateStaticParams()` 預先產生路徑 |
    | 即時內容頁 (庫存/價格) | SSR (每次請求) | 在 `fetch()` 中設定 `{ cache: 'no-store' }` |
    | 半動態頁面 | ISR (增量靜態再生) | 在 `fetch()` 中設定 `{ next: { revalidate: 60 } }` |

    > ⚠️ **注意：** App Router 已不使用 Pages Router 的 `getStaticProps` / `getServerSideProps` / `getInitialProps`。
    > 所有資料取得皆在 Server Component 中直接以 `async function` + `fetch` 完成。

    **App Router SSG 範例（動態路由）：**
    ```tsx
    // app/products/[id]/page.tsx
    
    // 取代 getStaticPaths — 預先產生靜態路徑
    export async function generateStaticParams() {
      const products = await fetch('https://api.example.com/products').then(r => r.json());
      return products.map((p: { id: string }) => ({ id: p.id }));
    }
    
    // 取代 getStaticProps — 直接在 Server Component 取得資料
    export default async function ProductPage({ params }: { params: { id: string } }) {
      const rawProduct = await fetch(`https://api.example.com/products/${params.id}`, {
        next: { revalidate: 3600 }, // ISR：每小時重新驗證
      }).then(r => r.json());
    
      // ⚠️ [安全規範] Server → Client 資料過濾
      // Server Component 傳遞 props 至 Client Component 時，
      // 必須使用白名單模式 (allowlist) 明確挑選安全欄位。
      // 禁止直接傳遞完整 API 回應物件，否則敏感欄位
      //（如 Amount、CustomerID、成本價、內部備註）將被序列化至
      // HTML 的 RSC payload 中，任何人皆可在瀏覽器原始碼中檢視。
      const safeProduct = {
        id: rawProduct.id,
        name: rawProduct.name,
        description: rawProduct.description,
        imageUrl: rawProduct.imageUrl,
        publicPrice: rawProduct.publicPrice,
        // 禁止傳遞: amount, cost, internalNotes, customerID,
        //           relatedRentalOrderNo, createUser, modifyUser 等
      };
    
      return <ProductDetail product={safeProduct} />;
    }
    
    // 取代 next/head — 動態 Metadata
    export async function generateMetadata({ params }: { params: { id: string } }) {
      const product = await fetch(`https://api.example.com/products/${params.id}`).then(r => r.json());
      return {
        title: `${product.name} | 品牌名稱`,
        description: product.description,
        openGraph: { title: product.name, images: [product.imageUrl] },
      };
    }
    ```

## 2. TDK (Title, Description, Keyword) 動態管理
*   **動態 `<head>` 注射：** 每個 Route/Page 都必須動態變更 `<title>` 與 `<meta name="description">`。
*   **Title 格式：** 統一規範網頁標題格式，例如：`{當前頁面標題} | {品牌名稱}`。
*   **Open Graph (OG Tags)：** 確保 Facebook、Twitter 分享時有正確的縮圖。這需要動態生成或寫死 `<meta property="og:title">`, `<meta property="og:image">` 等標籤。

## 3. SEO 友善的語意化 HTML 架構
爬蟲聽不懂 `div`，它只看懂語意：
*   **H1 唯一性：** 一個頁面**只能有一個 `<h1>`**，通常是該頁的主題（如商品名稱、文章標題）。H2 到 H6 必須依序遞減，不可斷層。
*   **正確使用 `<button>` 與 `<a>`：** 
    *   如果是「切換頁面、跳轉網址」，請務必使用 `<a>` 標籤，並加上 `href`，爬蟲才懂得跟隨。
    *   如果是「送出表單、開啟 Modal」，請使用 `<button type="button">`。**切勿用 `div` 綁定 `onClick` 來當作按鈕，這是 SEO 與無障礙體驗的災難。**
*   **圖片的 Alt 屬性：** 所有 `<img>` 都必須強制補上 `alt="圖片描述"`，若純粹為裝飾圖片則設為 `alt=""` 讓閱讀器忽略。

## 4. 結構化資料 (Structured Data - JSON-LD)
對於電子商務或部落格，應在 `<head>` 中插入 `<script type="application/ld+json">` 的 JSON-LD 結構化資料，告訴 Google 這個頁面具體是一項「產品 (Product)」、「評價 (Review)」，還是「文章 (Article)」，以爭取 Rich Snippets (複合式搜尋結果)。
