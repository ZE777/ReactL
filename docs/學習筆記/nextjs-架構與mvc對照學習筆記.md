# Next.js 架構與 .NET MVC 對照學習筆記

> 整理自學習對話：從「.NET MVC 後端思維」轉換到「Next.js 全棧思維」的心智模型對照
> 適合對象：有 C# / ASP.NET Core MVC 後端基礎，正要理解 Next.js 整體架構的開發者
> 前置知識：建議先讀完《React 進階學習筆記》前 3 章

---

## 學習路徑

本文件分為 **6 個 Part、13 個章節**，建議照順序讀。如果時間有限：

- **只有 30 分鐘**：Part 1（語言 vs 框架）+ Part 2（路由系統）→ 釐清最常見的觀念誤解
- **只有 1 小時**：Part 1、2、3 → 完整建立心智模型
- **想理解 SSR 為何快**：Part 4 第 8 章 → 看 Network Waterfall 與 Web Vitals 對照
- **想理解打包與工具鏈**：Part 1 + Part 5 → 弄懂 Turbopack / SWC、與 Vite 的差異
- **完整路徑**：Part 1 → 6，外加結語

---

# Part 1：先釐清「語言、框架、Runtime」三個層次

> 從 .NET 過來最容易混淆的觀念是「TypeScript 到底負責什麼？」。先把這三個層次拆開，後面所有對應關係才不會錯位。

---

## 1. 三層架構對照

### 觀念

寫一個後端應用，從來都不是「一個東西」在做事，而是**三層協作**：

| 層次 | 角色 | C# / .NET 世界 | TS / Next.js 世界 |
| --- | --- | --- | --- |
| **語言（Language）** | 提供語法、型別、編譯規則 | C# | **TypeScript** |
| **框架（Framework）** | 提供路由、生命週期、慣例 | ASP.NET Core MVC | **Next.js** |
| **執行環境（Runtime）** | 實際把程式跑起來的引擎 | .NET CLR | **Node.js** |

### 重點

- **TypeScript 不是 Next.js**。TS 只是語言，就像 C# 只是語言。
- **Next.js 不是 React**。Next.js 是框架，React 是它內建的 UI 引擎，就像 ASP.NET MVC 內建 Razor 一樣。
- **Node.js 不是瀏覽器**。Node.js 是 server 端的 JS 執行環境，就像 .NET CLR 是執行 .dll 的環境。

### 常見誤區修正

> ❌「TS 在這個專案中也負責 Controller 和 Route」
>
> ✅「TS（語言）+ Next.js（框架）共同負責 Controller 和 Route。TS 是『用什麼語法寫』，Next.js 是『寫好的東西怎麼被執行、被路由』。」

> ❌「Route 透過 React Route 處理」
>
> ✅「Route 透過 **Next.js File-System Router** 處理。React 本身不管路由；React Router 是純 React 專案才會用的第三方函式庫，**並且 React Router 實務用法大多採 CSR 模式對 SEO 不友善**，Next.js 專案用的是它自己內建的路由，**並且預設 SSR 模式對 SEO 及初次載入速度較友善（也可切換成 CSR）**。」

---

## 2. 為什麼 Next.js 不只是「React 的工具」

### 觀念

很多人誤以為 Next.js 只是「讓 React 變得好用一點」的工具，其實 Next.js 是一個**完整的全棧框架**。它做的事比 React 多太多：

| 功能 | 純 React (CRA / Vite) | Next.js |
| --- | --- | --- |
| 元件渲染 | ✅ | ✅（透過 React） |
| 路由 | ❌ 要裝 React Router | ✅ 內建 File-System Router |
| 後端 API | ❌ 要另外開 Express / .NET | ✅ 內建 API Routes / Server Actions |
| SSR / SSG | ❌ 純 CSR | ✅ 預設 SSR + SSG + ISR |
| Build 工具 | ❌ 要設定 Webpack / Vite | ✅ 內建 Turbopack |
| 圖片優化 | ❌ 自己處理 | ✅ `<Image>` 元件 |
| 字型優化 | ❌ 自己處理 | ✅ `next/font` |
| 部署 | ❌ 自己配 Nginx | ✅ Vercel / 自託管都支援 |

### 類比

> 純 React = 引擎（只能做車子的核心動力）
> Next.js = 整台車（引擎 + 變速箱 + 車身 + 儀表板 + 導航）
> ASP.NET Core MVC = 整台車（C# 是引擎、MVC 是車身、Routing 是導航）

所以 **Next.js 的對手不是 React，而是 ASP.NET Core MVC**。

---

# Part 2：路由系統的根本差異

> Routing 是後端開發者最容易卡關的地方。.NET 用 Attribute 註冊路由，Next.js 用「檔案結構」就是路由表，是完全不同的設計哲學。

---

## 3. File-System Routing 哲學

### 核心觀念

Next.js 的路由規則只有一句話：

> **資料夾結構就是 URL 結構。**

| 檔案路徑 | 對應 URL |
| --- | --- |
| `app/page.tsx` | `/` |
| `app/booking/page.tsx` | `/booking` |
| `app/booking/[id]/page.tsx` | `/booking/123`（`[id]` 是動態參數） |
| `app/api/orders/route.ts` | `/api/orders` |
| `app/api/[...proxy]/route.ts` | `/api/任意路徑`（catch-all） |

### .NET 對照

```csharp
// .NET 寫法：用 Attribute 註冊
[Route("api/orders")]
public class OrdersController : ControllerBase {
    [HttpGet("{id}")]
    public IActionResult Get(int id) { ... }
}
```

```typescript
// Next.js 寫法：檔案路徑就是路由
// 檔案：app/api/orders/[id]/route.ts
export async function GET(req, { params }) {
    const { id } = await params;
    // ...
}
```

### 兩種設計的優缺點

| 維度 | .NET Attribute Routing | Next.js File-System Routing |
| --- | --- | --- |
| 找對應檔案 | 要看 Attribute 才知道 URL | 看資料夾結構就知道 |
| 重構搬家 | URL 不會跟著變 | 改資料夾名 = 改 URL |
| 路由衝突 | 編譯時可能遺漏 | 結構上不可能衝突（同層不能有同名資料夾） |
| 學習曲線 | 要熟 Routing 表達式 | 看資料夾就懂 |

---

## 4. HTTP Method 分派的差異

### .NET 寫法

```csharp
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase {
    [HttpGet]    public IActionResult Get() { ... }
    [HttpPost]   public IActionResult Post([FromBody] Order o) { ... }
    [HttpPut]    public IActionResult Put(...) { ... }
    [HttpDelete] public IActionResult Delete(...) { ... }
}
```

一個 Controller 類別，每個方法用 `[HttpXxx]` Attribute 標記。

### Next.js 寫法

```typescript
// app/api/orders/route.ts
export async function GET(req)    { ... }
export async function POST(req)   { ... }
export async function PUT(req)    { ... }
export async function DELETE(req) { ... }
```

一個檔案，每個 HTTP method **export 一個同名的函式**。Next.js 看到 `export GET` 就知道這是處理 GET 請求的函式。

### 心法

> .NET 用「Attribute 標記方法」分派
> Next.js 用「export 函式名稱」分派
> 結果一樣，但**慣例不同**。Next.js 的好處是少一層抽象（沒有 Controller 類別），缺點是多個 method 的共用邏輯要靠**內部輔助函式**整理。

實例可看你專案的 [route.ts](src/app/api/[...proxy]/route.ts) 最底下：

```typescript
async function handleRequest(req, ctx, method) { /* 共用邏輯 */ }

export async function GET(req, ctx)    { return handleRequest(req, ctx, 'GET'); }
export async function POST(req, ctx)   { return handleRequest(req, ctx, 'POST'); }
// ... PUT / PATCH / DELETE
```

這就是 Next.js 風格的「**共用一個 handler，五個 export 只負責分派**」。

---

# Part 3：MVC 結構在 Next.js 的對應

> 最常見的疑問：「Next.js 也是 MVC 嗎？」答案是「**部分對應**」。Next.js 沒有強制 MVC，但你可以把現有檔案對應到 MVC 三層。

---

## 5. Model / View / Controller 對照表

### 主對應表

| MVC 角色 | C# / ASP.NET MVC | Next.js（你的專案） | 你專案的實際檔案 |
| --- | --- | --- | --- |
| **Model** | `Order.cs`、`IOrderService` | `types/domain.ts` + `services/*.ts` + Zod Schema | `src/types/domain.ts`、`src/features/booking/services/bookingService.ts` |
| **View** | Razor 檔（`.cshtml`） | React Component (`.tsx`) | `src/app/booking/**/page.tsx`、`src/components/**/*.tsx` |
| **Controller** | `OrdersController.cs` | API Route + Server Action | `src/app/api/[...proxy]/route.ts`、`src/features/booking/actions.ts` |

### 細部對照

| 元素 | C# 寫法 | TS / Next.js 寫法 |
| --- | --- | --- |
| 資料 DTO | `class Order { public string Id { get; set; } }` | `interface Order { id: string }` |
| Validation | `[Required]` `[StringLength(50)]` | Zod `z.string().min(1).max(50)` |
| DI 注入 Service | 建構式注入 + `IServiceCollection` | 直接 `import` |
| Controller 入口 | `public IActionResult Get()` | `export async function GET()` |
| 回傳 JSON | `return Ok(data)` | `return NextResponse.json(data)` |
| 回傳錯誤 | `return BadRequest("..."")` | `return NextResponse.json({...}, { status: 400 })` |

### 重要差別 1：Service 的注入方式

.NET：
```csharp
public class OrdersController(IBookingService bookingService) {
    [HttpPost]
    public IActionResult Create() => bookingService.Create(...);
}
```

Next.js：
```typescript
import { bookingService } from '@/features/booking/services/bookingService';

export async function POST(req) {
    return NextResponse.json(await bookingService.create(...));
}
```

**Next.js 沒有 DI 容器**，直接 `import`。簡單但失去了 mock 替換的便利性（要靠 jest.mock 之類的測試工具）。

### 重要差別 2：Validation 落在哪一層

| 階段 | C# 做法 | Next.js 做法 |
| --- | --- | --- |
| 前端表單 | jQuery Validation / 手刻 | Zod + React Hook Form |
| 進 Controller 時 | DataAnnotation 自動驗證 | 手動 call `OrderSchema.parse(data)` |
| 共用同一份規則 | ❌ 前後端要各寫一次 | ✅ **Zod schema 前後端共用同一份** |

> 這是 Next.js（同源 TS）對比 .NET（C# 後端 + JS 前端）最大的優勢之一：**型別與驗證規則跨前後端共用，沒有手動翻譯的過程**。

---

## 6. Custom Hook 在 MVC 中扮演什麼角色

### 觀念釐清

❌「`useXxx` hook 是 Model」

✅「`useXxx` hook 是 **Client 端的 Repository / 資料存取層**」

### 為什麼這樣分

| 元素 | 在 MVC 中的角色 | 在你專案中的位置 |
| --- | --- | --- |
| Model（資料結構） | DTO / Entity 定義 | `types/domain.ts` 裡的 `interface Order` |
| Model（業務邏輯） | Service 類別 | `services/bookingService.ts` |
| Repository（資料存取） | DbContext / IRepository | API Route + **Custom Hook** |
| View（畫面） | Razor / React Component | `*.tsx` |

Custom Hook（`useAirports`、`useCities` 等）做的事其實是：

1. 呼叫 Controller（API Route）
2. 把回來的資料快取起來（localStorage / sessionStorage）
3. 暴露給 React 元件用

這個職責**比 Model 更貼近 Repository / Data Access 層**。

### 心法

> **Hook ≠ Model**
>
> Hook 是「**前端怎麼拿、怎麼存** Model 資料」。
> Model 本身是 `domain.ts` 裡的型別與 `services` 裡的業務邏輯。

---

# Part 4：Next.js 真正獨特的東西（MVC 沒有的）

> 如果 Next.js 只是「換語言寫 MVC」，那它沒什麼好學的。Next.js 真正的價值在於 **Server / Client 邊界劃分** 和 **Server Action**，這是傳統 MVC 沒有的概念。

---

## 7. Server Component vs Client Component

### 核心觀念

傳統 MVC 中，畫面**只在 Server 端產生**（Razor）或**只在 Client 端產生**（React SPA）。Next.js 提出第三條路：

> **每個 Component 都可以選擇在 Server 或 Client 渲染。**

### 兩種 Component 對照

| 維度 | Server Component | Client Component |
| --- | --- | --- |
| 標記 | 預設（不用標） | 檔案頂端寫 `"use client"` |
| 執行位置 | Server 上跑 | 瀏覽器跑 |
| 能用 hook 嗎 | ❌ 不能用 useState / useEffect | ✅ 全部可以 |
| 能 await fetch 嗎 | ✅ 直接 `await fetch()` | ❌ 要用 `useEffect` 包 |
| 能直接連資料庫嗎 | ✅ 可以 `prisma.user.findMany()` | ❌ 絕對不行 |
| 包進 bundle 嗎 | ❌ 不會送到瀏覽器 | ✅ 會 |
| 能互動嗎 | ❌ 不能 onClick | ✅ 全部互動事件 |

### 比喻

> Server Component = Razor View（在 Server 跑完才送 HTML）
> Client Component = 傳統 React（在瀏覽器跑）
> **Next.js = 兩個合在一起，可以混搭**

### 在你專案的實際應用

打開 [src/features/booking/hooks/useAirports.ts](src/features/booking/hooks/useAirports.ts) 第一行：

```typescript
"use client";
```

這就是宣告「這支 hook 只能在 Client Component 裡用」。因為它用了 `useState`、`useEffect`、`localStorage`，這些都是瀏覽器才有的東西。

而 [src/app/booking/[id]/page.tsx](src/app/booking/[id]/page.tsx) 如果**沒有** `"use client"`，它就是 Server Component — 可以在 server 上直接 `await fetch()` 拿資料，渲染好 HTML 再送給瀏覽器。

### 心法

> **Server Component = 後端工廠（產 HTML）**
> **Client Component = 前端互動層（接事件）**
>
> 設計時要問自己：「這個元件**需要使用者互動嗎？需要瀏覽器 API 嗎？**」
> 需要 → Client；不需要 → Server（預設）。

---

## 8. CSR vs SSR：效能與 SEO 深度對照

> 第 7 章說明 Server / Client Component 的「機制差異」，這一章解釋背後的「為什麼這樣設計」——SSR 對效能與 SEO 的優勢，是 Next.js 區別於純 React 的關鍵理由，也是 Part 2 常見誤區修正中「對 SEO 與初次載入速度較友善」這句話的證明。

### CSR 的真實時間軸

❌ 你以為的 CSR：「先看到結構，後填內容」
✅ 實際上的 CSR：「**先看到 1 秒白畫面 → 看到 skeleton → 1.5 秒後才看到真正內容**」

```text
T=0ms    瀏覽器發 request
T=50ms   Server 回傳「空殼 HTML」（<div id="root"></div>）
T=100ms  瀏覽器開始下載 bundle.js（500KB ~ 5MB）
T=800ms  bundle 下載完成
T=900ms  React 解析、渲染骨架（Skeleton）
T=950ms  useEffect 觸發 fetch API
T=1300ms API 回傳資料
T=1400ms React 重新渲染，使用者「終於」看到內容
```

### SSR 的真實時間軸

✅ SSR：「**0.25 秒就看到真實內容**，1 秒後可以互動」

```text
T=0ms    瀏覽器發 request
T=100ms  Server 內部 fetch 資料（server 到 DB 通常 <50ms）
T=200ms  Server 渲染完整 HTML（含真實內容）
T=250ms  瀏覽器收到 HTML，立即顯示真正內容
T=300ms  瀏覽器開始下載 bundle.js（背景）
T=900ms  bundle 下載完成
T=1000ms React Hydration（補上互動能力）
```

### Web Vitals 指標

業界用以下指標衡量「載入體驗」：

| 指標 | 全名 | 意思 | CSR | SSR |
| --- | --- | --- | --- | --- |
| FCP | First Contentful Paint | 第一個內容出現時間 | 慢（要等 JS） | **快**（HTML 直接有內容） |
| LCP | Largest Contentful Paint | 主要內容出現時間 | 慢（要等 API） | **快**（server 已 fetch 完） |
| TTI | Time to Interactive | 可互動時間 | 中 | 中（Hydration 需要時間） |
| TTFB | Time to First Byte | 第一個 byte 到達時間 | 快 | 稍慢（server 要 fetch 資料） |

> 「初次載入友善」指的是 FCP / LCP——使用者**看到真實內容**的時間。SSR 在這兩項完勝 CSR。

### Network Waterfall：CSR 慢的根本原因

CSR 的請求鏈至少有 3 次依序往返：

```text
請求 1：HTML
  Browser ──► Server          (取空殼 HTML)
  Browser ◄── Server          ~50ms

請求 2：JS Bundle（通常還會有多個 chunk）
  Browser ──► CDN/Server      (取 bundle.js)
  Browser ◄── CDN/Server      ~500ms（500KB~5MB 大檔案）

  ↓ 瀏覽器解析、執行 JS、React 掛載

請求 3：API Data
  Browser ──► API Server      (拿真正的資料)
  Browser ◄── API Server      ~300ms

  ↓ React 重新渲染

使用者終於看到內容！
```

#### 為什麼這個流程慢

| 因素 | 影響 |
| --- | --- |
| 依序執行（Serial） | 第 2 步沒完成、第 3 步根本不能開始 |
| 每次往返都有網路延遲 | 4G 環境每次 RTT 約 50~200ms |
| JS bundle 是大檔案 | 比 HTML 大 10~100 倍 |
| 執行 JS 也要時間 | 老手機 / 弱裝置上特別明顯 |

> 這個現象在效能領域有專有名詞叫 **Network Waterfall**（瀑布式網路請求）——一個請求等另一個，像瀑布一樣往下流，**總時間是所有環節相加**，無法平行化。

### SSR 為什麼快：把瀑布塞進伺服器內部

```text
請求 1：HTML（這是「使用者看得到」的唯一請求）
  Browser ──► Server
              ↓
              Server 內部做：
              ├─ Fetch DB              (~10ms 內網)
              ├─ Fetch 第三方 API      (~50ms 同 region)
              ├─ 並行打多個資料源      (善用 Promise.all)
              └─ 渲染完整 HTML
              ↓
  Browser ◄── Server          (HTML 已含真實資料)

  ↓ 瀏覽器立刻顯示內容（FCP 快）

背景請求：JS Bundle（已經能看到內容了，這在背景下載）
  Browser ──► CDN
  Browser ◄── CDN
              ↓
              React Hydration（補上互動能力）
```

### 關鍵差異

| 項目 | CSR | SSR |
| --- | --- | --- |
| 使用者感知到的請求數 | 3+ 次依序往返 | 1 次往返就看到內容 |
| 網路延遲累積 | 每一步都要繞地球一圈 | 集中在 server 內部處理 |
| Server ↔ DB 距離 | （client 不直接打 DB） | 同機房，極快 |
| 大檔案下載擋路 | bundle.js 擋住 API 請求 | bundle 在背景下載，不擋畫面 |

### 用真實數字感受差異

假設網路延遲 100ms / 一趟，bundle 下載 500ms，API 處理 100ms：

#### CSR 總時間

```text
HTML        100ms (來回)
+ Bundle    500ms (下載)
+ JS 執行   100ms
+ API       200ms (來回 + 處理)
─────────────────────
= 900ms 才看到內容
```

#### SSR 總時間

```text
HTML + Server 內部處理    250ms
─────────────────────
= 250ms 看到內容
+ Bundle  500ms（背景）  → 750ms 可互動
```

> **看到內容的時間：CSR 900ms vs SSR 250ms**——差 3.6 倍。對使用者來說就是「卡頓」與「順暢」的分水嶺。

### 對照實務場景（以 booking 系統為例）

使用者打開 `/booking/123` 時：

- **SSR 模式**：server 直接從 DB 拿訂單資料、產出含真實資料的 HTML，使用者一進來就看到訂單
- **CSR 模式**：使用者先看到一片白 → 看到 skeleton → 等 1.5 秒才看到資料

對訂車流程的轉換率影響非常大——這就是為什麼業務型網站普遍選擇 Next.js。

### .NET 對照

這個概念對 .NET 開發者很熟悉：

| 場景 | .NET 對應 | 前端對應 |
| --- | --- | --- |
| ASP.NET MVC + Razor | Server query DB + 渲染 cshtml + 回傳含資料 HTML | **SSR**（Next.js） |
| ASP.NET Web API + jQuery SPA | Server 回 HTML 殼 → 前端 AJAX 拿資料 | **CSR**（純 React + React Router） |

> 早期的 jQuery + AJAX 模式其實就是 CSR 的雛形。React + Vite 純 CSR 等於把這個老模式「組件化」了，但網路瀑布的問題完全沒變。**Next.js SSR 反而是回到 ASP.NET MVC 那種「server 渲染好再送」的傳統，只是換成 React 來渲染。**

---

## 9. Server Action — Controller 的「速食版」

### 核心觀念

Server Action 是 Next.js 14 後正式推出的功能。它讓你**不用寫 API Route，也能呼叫 Server 端邏輯**。

### 寫法對照

#### 傳統做法（API Route）

```typescript
// 1. 後端：app/api/orders/route.ts
export async function POST(req) {
    const data = await req.json();
    return NextResponse.json(await createOrder(data));
}

// 2. 前端：components/Form.tsx
const onSubmit = async (data) => {
    const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await res.json();
};
```

要寫**兩份**：後端 endpoint + 前端 fetch。

#### Server Action 做法

```typescript
// 1. 後端：features/booking/actions.ts
'use server';
export async function createOrderAction(data: Order) {
    return await bookingService.create(data);
}

// 2. 前端：components/Form.tsx
import { createOrderAction } from '@/features/booking/actions';

const onSubmit = async (data) => {
    const result = await createOrderAction(data);  // 直接呼叫，看起來像本地函式
};
```

只寫**一份**。`'use server'` 標記後，Next.js 自動在背後幫你建 endpoint、處理序列化、走 fetch。

### .NET 對照

> Server Action 等於「**自動生成 Controller + 自動產 Client SDK**」
>
> 想像你在 .NET 寫了一個 Service，編譯器**自動幫你產生對應的 ApiController + 一份 TypeScript Client**，前端 import 就能直接呼叫 — 那就是 Server Action 的效果。

C# 沒有原生對應功能。最接近的是 SignalR Hub 或 Blazor Server，但機制不同。

### 兩者的取捨

| 場景 | 用 API Route | 用 Server Action |
| --- | --- | --- |
| 第三方系統會呼叫 | ✅ 是穩定 endpoint | ❌ endpoint 內部產生會變動 |
| 純內部前端呼叫 | 兩者皆可 | ✅ 寫法更簡潔 |
| 需要自定 HTTP method/header | ✅ | ❌ 限定 POST |
| 表單 submit | 兩者皆可 | ✅ 可直接綁 `<form action={...}>` |

你專案的 [actions.ts](src/features/booking/actions.ts) 就是 Server Action 範例，[route.ts](src/app/api/[...proxy]/route.ts) 是 API Route 範例 — 兩者**並存**，各司其職。

---

## 10. 跨前後端共用型別（Full-Stack TypeScript）

### 觀念

C# / .NET 開發的痛點：

```
後端 (C#)：           前端 (TS)：
class Order {         interface Order {
    Id: string         id: string;
    Name: string       name: string;
}                     }

⚠️ 兩份要手動同步，常常漂移
```

Next.js + TS 的解法：**一份檔案，前後端都用**。

```typescript
// src/types/domain.ts ← 共用
export interface Order { ... }

// src/app/api/orders/route.ts ← 後端用
import { Order } from '@/types/domain';

// src/components/OrderForm.tsx ← 前端用
import { Order } from '@/types/domain';
```

### 為什麼能這樣

因為**前後端用同一個語言（TS）跑在同一個 build 系統裡**。C# 後端 + TS 前端的世界做不到，只能：
- 後端產 OpenAPI / Swagger
- 用 NSwag / OpenAPI Generator 自動產 TS Client
- 多一層 build pipeline

Next.js 一份檔案搞定，**這是全棧 TS 最大的優勢**。

---

# Part 5：編譯流水線與工具鏈對照

> Next.js 不只是「React 的框架」，它包含一整套 **build 工具鏈**。這是 .NET 開發者過來最容易忽略的一層，但理解它能解決很多「為什麼這樣設定」「跟 Vite 差在哪」「為什麼 Vitest 跑得起來」的疑問。

---

## 11. Next.js 的編譯流水線

### 三個編譯角色協作

❌ 常見誤解：「Next.js 自己編譯所有東西」
✅ 正確理解：Next.js 內部由**三個獨立工具協作**

| 角色 | 工具 | 職責 | 取代誰 |
| --- | --- | --- | --- |
| 轉譯器 | **SWC**（Rust 寫的） | TS / JSX → 標準 JS | Babel |
| 開發 bundler | **Turbopack**（Rust 寫的，Next 16 預設） | dev server + HMR | Webpack（舊版預設） |
| 生產 bundler | **Webpack 或 Turbopack** | 打包成靜態資源 | （兩者皆可） |
| CSS 處理 | **PostCSS + Tailwind plugin** | CSS / Tailwind 編譯 | （獨立模組） |

### 兩階段流程

```text
開發階段（npm run dev）
  ↓ Turbopack 啟動 dev server
  ↓ SWC 即時轉譯 TS / JSX
  ↓ HMR 熱更新

部署階段（npm run build）
  ↓ Webpack / Turbopack 完整打包
  ↓ SWC 轉譯 + minify
  ↓ 產出 .next/ 目錄
       ├─ server bundle（給 Node.js 跑）
       └─ client bundle（給瀏覽器跑）
```

### 為什麼 SWC 比 Babel 快 20 倍

| 工具 | 寫於什麼語言 | 並行能力 |
| --- | --- | --- |
| Babel | JavaScript（單執行緒） | 受限 |
| SWC | **Rust**（多執行緒） | 充分利用多核 CPU |

> 對於有 500 個檔案的中型專案，SWC build 可能 3 秒，Babel 要 60 秒。這就是為什麼 Next.js 13 後全面換成 SWC。

### .NET 對照

| 階段 | .NET | Next.js |
| --- | --- | --- |
| 編譯器 | csc / Roslyn | **SWC** |
| 開發執行 | `dotnet run` | `next dev`（Turbopack） |
| 發佈打包 | `dotnet publish` | `next build`（Webpack/Turbopack） |
| 產出位置 | `bin/Release/...` | `.next/` |
| 部署 Runtime | .NET CLR | **Node.js** |

> 你部署用的 PM2 + IIS 反向代理，跑的就是 `next build` 產出的 `.next/standalone/` 目錄裡的 Node 程式（對應 .NET 的 `dotnet publish` 後丟給 IIS）。

### 你不需要設定的東西

新專案 `npx create-next-app` 後就自動配好：

- ✅ TS / JSX 轉譯
- ✅ Tailwind CSS 整合
- ✅ Code splitting（自動拆 bundle）
- ✅ Tree shaking（砍死碼）
- ✅ Source map
- ✅ 圖片 / 字型優化

> 對比純 React + Vite，你還是要寫 vite.config.ts、決定 plugin、自己接 CSS 處理。Next.js 把這些**全部包好**——這是「Framework」的價值。

---

## 12. Next.js vs Vite — 不在同一個層級

### 命名與分類釐清

❌ 錯誤理解：「Next.js 跟 Vite 是同類，可以擇一使用」
✅ 正確理解：**它們不在同一層**

| 項目 | Next.js | Vite |
| --- | --- | --- |
| 分類 | **Framework**（框架） | **Build Tool**（建置工具） |
| 取代誰 | ASP.NET Core MVC | Webpack |
| 包含 build 工具嗎 | ✅ 內建 Turbopack/Webpack | ✅ Vite 本身就是 |
| 包含 routing 嗎 | ✅ File-System Router | ❌ 要自己裝 React Router |
| 包含 SSR 嗎 | ✅ 預設支援 | ❌ 純 CSR |
| 包含 API 端點嗎 | ✅ Route Handler / Server Action | ❌ 沒有 server 端 |

### 兩者**不能**同時用

| 衝突點 | 後果 |
| --- | --- |
| 兩套 dev server | 互搶 port、HMR 互相覆蓋 |
| 兩套 bundler | 編譯規則衝突、輸出格式不相容 |
| Routing 機制不同 | Vite 不認識 `app/` 資料夾路由 |
| Server Component 失效 | Vite 沒有 RSC 機制 |

✅ 結論：**「替代關係」，不是「搭配關係」**。

### 該選 Vite 的場景

| 場景 | 為什麼 Vite | 為什麼 Next.js 不適合 |
| --- | --- | --- |
| 純 SPA 後台系統 | 內部用、不需 SEO | RSC / Server Action 浪費 |
| 元件函式庫（npm package） | 打包成 ESM / CJS | Next.js 是「應用框架」，不是 library 打包器 |
| Demo / Prototype | 啟動快、設定少 | 殺雞用牛刀 |
| Vue / Svelte / Solid 專案 | Vite 原生支援 | Next.js 只服務 React |
| Electron / Tauri 桌面應用 | 純 client，無 server | Next.js 仰賴 Node server |

### 該選 Next.js 的場景

| 場景 | 為什麼 Next.js | 為什麼 Vite 不夠 |
| --- | --- | --- |
| 對外網站 / SEO 需求 | SSR / SSG | Vite 純 CSR，爬蟲看到空殼 |
| 全棧應用（前後端整合） | Route Handler + Server Action | Vite 沒有 server 能力 |
| 多人協作的中大型專案 | 強約定（資料夾即路由） | Vite 鬆散，每組設定不同 |
| **booking 系統等業務應用** | 需 SEO + Server Action | Vite 只有打包能力 |

### 一句話判斷

> 「我有沒有 server 端需求（SSR / API / Server Action）？」
>
> - **有** → 用 Next.js（Vite 不夠用）
> - **沒有** → Vite CP 值最高

### .NET 對照

這個對照特別清楚：

| 場景 | .NET 對應 | 前端對應 |
| --- | --- | --- |
| 完整 web 應用 | ASP.NET Core MVC | **Next.js**（你目前這個） |
| 純 client app（Blazor WASM / WPF） | 桌面 / WASM | **Vite + React**（純 SPA） |
| 純函式庫（.dll） | Class Library | **Vite Library Mode**（打 npm 套件） |

> 你不會問「我該用 ASP.NET Core 還是 MSBuild」——它們不在同一層。「Next.js vs Vite」也是同類問題。

---

> Next.js 沒有內建測試工具，這是它跟 Angular 等框架的差異。測試工具（Vitest、Playwright）與 Next.js 編譯軌道**完全獨立**——`next build` 不會碰測試檔，測試工具也不會碰 `.next/`。詳見 [Vitest 自動化測試學習筆記](vitest-自動化測試學習筆記.md)。

---

# Part 6：你專案結構在這個心智模型下的意義

> 把上面所有觀念套回你專案實際的資料夾結構，看看每一層做什麼。

---

## 13. 你專案的分層解析

### 完整對照表

```
src/
├── app/                          ← Next.js Routing 層（File-System Router）
│   ├── booking/page.tsx          ← View (頁面 Server Component)
│   ├── booking/[id]/page.tsx     ← View (動態路由)
│   └── api/[...proxy]/route.ts   ← Controller (API Route, catch-all)
│
├── features/booking/             ← Domain 層（功能模組）
│   ├── actions.ts                ← Controller (Server Action)
│   ├── services/bookingService.ts ← Model (業務邏輯)
│   ├── hooks/useXxx.ts           ← Repository (Client 端資料存取)
│   └── components/Xxx.tsx        ← View (Client Component)
│
├── components/                   ← View（共用元件）
│
├── types/domain.ts               ← Model (資料型別 / DTO)
│
└── lib/                          ← Infrastructure 層
    ├── api/backend.ts            ← HTTP Client 封裝
    └── server/mock-handlers/     ← Mock 資料層（開發用）
```

### 與 .NET 解決方案結構對照

| Next.js 資料夾 | 等價於 .NET 專案 |
| --- | --- |
| `app/` | `Controllers/` + `Views/` |
| `app/api/` | `Controllers/Api/` |
| `features/*/services/` | `Services/` |
| `features/*/actions.ts` | `Controllers/`（速寫版） |
| `types/domain.ts` | `Models/` + `DTOs/` |
| `lib/` | `Infrastructure/` + `Helpers/` |
| `components/` | `Views/Shared/` |

### 一個請求的完整流程（以「建立訂單」為例）

1. 使用者在 [BookingForm.tsx](src/features/booking/components) 填寫表單（**View / Client Component**）
2. 表單透過 `useBookingForm` hook 處理狀態（**Repository on client**）
3. submit 時呼叫 `createOrderAction(data)`（**Server Action / Controller**）
4. Server Action 用 Zod 驗證 `data`（**Validation**）
5. 呼叫 `bookingService.create(data)`（**Service / Model 業務邏輯**）
6. Service 透過 `apiRequest` 呼叫真實後端（**Infrastructure**）
7. 結果回傳給 Server Action → 序列化 → Client 收到
8. UI 更新顯示結果（**View 重新渲染**）

對照 .NET：

1. View（Razor / 前端 SPA）submit
2. → `OrdersController.Create()`（Controller）
3. → `[ApiController]` 自動驗證 ModelState
4. → `_bookingService.Create()`（Service）
5. → `_dbContext.Orders.Add()`（Repository / EF Core）
6. → 回傳 → View 重新渲染

**流程幾乎一樣，只是名字、語法、檔案組織不同**。

---

# 結語：核心心法

學完這些後，你應該建立起以下心智模型：

### 1. 三層拆解法

> 看到一個 Next.js 專案，先問三個問題：
> 1. **語言**是什麼？→ TypeScript
> 2. **框架**是什麼？→ Next.js
> 3. **執行環境**是什麼？→ Node.js
>
> 三個答案分清楚，後面學習就不會混淆。

### 2. C# 思維直接套用，但要記住三件事

| 不一樣的地方 | 心理準備 |
| --- | --- |
| 沒有 DI 容器 | `import` 直接拿，測試時用 mock 工具 |
| 沒有 ModelState 自動驗證 | 用 Zod 手動 parse，但好處是前後端共用 schema |
| 沒有 Razor / SignalR | 用 Server Component / Server Action 取代 |

### 3. Next.js 的核心賣點是「邊界劃分」

> 寫 .NET 時，「在哪邊跑」是清楚的：Razor 是 Server、JS 是 Client。
> 寫 Next.js 時，**每個元件都要做選擇**：Server Component 還是 Client Component？
>
> 這個選擇權是 Next.js 的價值，也是學習曲線的痛點。

### 4. Hook 不是 Model，是 Client Repository

> 「`useAirports` 是 Model 嗎？」 ← ❌
> 「`useAirports` 是 Client 端怎麼**取得並暫存** Airport 資料的方式」 ← ✅
>
> Model 永遠是 `types/domain.ts` 和 `services/*.ts`。

### 5. 同一個概念，三種寫法都能達成

需求：「使用者按按鈕，建立一筆訂單」

| 方案 | 適用情境 |
| --- | --- |
| API Route + fetch | 對外公開 API、第三方會呼叫 |
| Server Action | 純內部前端使用，寫法最簡潔 |
| Server Component + form action | 表單提交、不需 JS 也要能用（漸進增強） |

**三種都正確**，差別在於需求情境。學會在三者之間判斷選擇，就達到 Next.js 中階水準。

---

> **一句話總結整份筆記：**
>
> Next.js 不是「React 的工具」，它是**取代 ASP.NET Core MVC 的全棧框架**。TS 是它的語言（對應 C#），Node.js 是它的 Runtime（對應 .NET CLR），React 是它的 UI 引擎（對應 Razor）。它**完全可以對應 MVC 三層**，但又多了 Server/Client 邊界劃分這個 MVC 沒有的維度，這既是它的學習曲線，也是它真正的價值所在。
