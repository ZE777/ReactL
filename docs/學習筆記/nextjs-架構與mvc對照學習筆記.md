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

---

# Part 7：App Router 五大檔案約定（Stage 5-B，Item 3）

> 對應進度表：5-B 項目 3「Next.js App Router 基礎：page.tsx、layout.tsx、loading.tsx、error.tsx」
> ⚠️ 本 Part 的所有內容為 **Next.js App Router（SSR）專屬**，不適用於 Vite + React（CSR）專案。

### 框架對照：這套慣例只在 Next.js 存在

| 需求 | Next.js App Router（SSR）| Vite + React（CSR）|
|------|--------------------------|-------------------|
| 定義頁面 | 建 `app/dashboard/page.tsx` 檔案即完成 | 在 `App.tsx` 寫 `<Route path="/dashboard" element={...}>` |
| 共用 Layout | `app/dashboard/layout.tsx` | `<Outlet>` + wrapper component |
| Loading 狀態 | `app/dashboard/loading.tsx` 自動套 Suspense | 手動在元件內寫 `if (isLoading) return <Skeleton />` |
| 錯誤處理 | `app/dashboard/error.tsx` 自動套 ErrorBoundary | 手動包 `<ErrorBoundary>` 或 react-error-boundary |

**Project C 的分工**：`prompt-studio-web`（前台）用 Next.js，適用本 Part。`prompt-studio-admin`（後台）用 Vite，路由在 `App.tsx` 用 React Router 宣告，本 Part 不適用。

## 14. 五個特殊檔案的職責

Next.js App Router 用**檔名本身**宣告職責，不需要任何 Attribute 或 config。

| 檔名 | 自動作用 | .NET Razor 對照 |
|------|---------|----------------|
| `page.tsx` | 頁面本體，對應 URL | `Index.cshtml` |
| `layout.tsx` | 包住同層與子路由，**不因導航重新掛載** | `_Layout.cshtml` |
| `loading.tsx` | 自動把 `page.tsx` 包入 `<Suspense>` | （無原生對應） |
| `error.tsx` | 自動把 `page.tsx` 包入 `<ErrorBoundary>` | `_Error.cshtml` |
| `not-found.tsx` | 呼叫 `notFound()` 時顯示 | `404.cshtml` |

### 巢狀 Layout 的關鍵行為

```
app/
  layout.tsx          ← 根 Layout，包住所有頁面（<html><body>）
  page.tsx            ← /
  dashboard/
    layout.tsx        ← Dashboard Layout，只包住 /dashboard/*
    page.tsx          ← /dashboard
    settings/
      page.tsx        ← /dashboard/settings
```

- 從 `/dashboard` 導向 `/dashboard/settings` 時，**`dashboard/layout.tsx` 不重新掛載**（狀態保留）。
- 這是 Next.js 與 React Router 的重大差異：React Router 的 `<Outlet>` 每次都完整 re-render 外殼。

### loading.tsx 的真實展開

```tsx
// 你寫的：
// dashboard/loading.tsx
export default function Loading() {
  return <div className="skeleton" />;
}

// Next.js 自動等效為：
// dashboard/layout.tsx（概念上）
import { Suspense } from 'react';
import Loading from './loading';
import Page from './page';

<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

### error.tsx 的重要限制

- **必須加 `'use client'`**，因為它要用 `useEffect` 記錄 error 並提供 retry 按鈕。
- 它補捉的是**子樹的 render 錯誤**，不會捉 layout.tsx 自身的錯誤。
- 提供 `reset()` 函式讓使用者重試：

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <p>發生錯誤：{error.message}</p>
      <button onClick={reset}>重試</button>
    </div>
  );
}
```

### not-found.tsx 的觸發方式

```tsx
// page.tsx（Server Component）
import { notFound } from 'next/navigation';

async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();       // ← 觸發最近的 not-found.tsx
  return <OrderDetail order={order} />;
}
```

---

# Part 8：Server / Client 序列化限制（Stage 5-B，Item 4）

> 對應進度表：5-B 項目 4「Server Components vs Client Components：'use client' 邊界與序列化限制」

## 15. 什麼能跨越 Server → Client 邊界

### 核心規則

Server Component 把資料當 Props 傳給 Client Component 時，資料必須能被 JSON 序列化。

| 可以傳 ✅ | 不能傳 ❌ |
|---------|---------|
| `string`, `number`, `boolean`, `null` | 函式（callbacks、event handlers） |
| Plain Object `{}` | Class 實例（`new Foo()`） |
| Array | `Date` 物件（要先 `.toISOString()` 轉字串） |
| React elements（JSX） | `Map`, `Set` |
| `undefined`（Props 可省略） | `Symbol` |
| | Promise（要用特定方式傳） |

### 常見錯誤

```tsx
// ❌ 錯誤：把函式當 Props 傳給 Client Component
// ServerPage.tsx（Server Component）
import { ClientButton } from './ClientButton';

export default function Page() {
  const handleClick = () => console.log('clicked'); // ← 函式不可序列化
  return <ClientButton onClick={handleClick} />;     // ← 報錯
}

// ✅ 正確：event handler 定義在 Client Component 內部
// ClientButton.tsx
'use client';
export function ClientButton() {
  const handleClick = () => console.log('clicked'); // ← 函式在 client 側定義
  return <button onClick={handleClick}>Click</button>;
}
```

### `'use client'` 是邊界聲明，不是元件標記

`'use client'` 的意思是：**「從這個模組開始，以下的東西都在 Client 側執行」**。

- 同一個元件檔的**所有 import** 也會被拉進 client bundle。
- Server Component **可以 import Client Component**（Server 當容器，Client 當互動層）。
- Client Component **不能 import Server Component**（違反邊界方向）。

```tsx
// ✅ 合法：Server import Client
// ServerPage.tsx
import { SearchBox } from './SearchBox'; // 'use client' 元件
export default function Page() {
  return <div><SearchBox /></div>; // OK
}

// ❌ 非法：Client import Server
// SearchBox.tsx
'use client';
import { DataTable } from './DataTable'; // Server Component ← 報錯
```

---

# Part 9：RSC 資料抓取模式（Stage 5-B，Item 5）

> 對應進度表：5-B 項目 5「告別 useEffect + useState，Server Component 直接 await fetch」

## 16. 新舊寫法對照

### 舊寫法（CSR，Client Component）

```tsx
'use client';

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Skeleton />;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

痛點：3 個 state、useEffect 競態競爭風險、白畫面閃爍。

### 新寫法（RSC，Server Component）

```tsx
// 不需要 'use client'
async function UserList() {
  const users = await fetch('/api/users').then(r => r.json());
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

零 state、零 effect、無競態風險，HTML 到瀏覽器時資料已在其中。

### Next.js 擴充的 fetch 選項

Next.js 對原生 fetch 加了快取選項（Node.js 原生 fetch 沒有這些）：

```tsx
// 完全快取（類似 SSG，build 時抓一次）
const data = await fetch('/api/config', { cache: 'force-cache' });

// 不快取（每次 request 都抓，類似傳統 SSR）
const data = await fetch('/api/orders', { cache: 'no-store' });

// 定時重驗證（類似 ISR，N 秒後視為 stale 重抓）
const data = await fetch('/api/stats', { next: { revalidate: 3600 } });
```

| 選項 | 行為 | .NET 對照 |
|------|------|----------|
| `force-cache` | Build 時快取，不再重抓 | 靜態資源 / OutputCache 永久 |
| `no-store` | 每次 request 都 fetch | 無快取的 API 呼叫 |
| `revalidate: N` | N 秒後 stale，背景重抓 | OutputCache 含 `Duration=N` |

### 平行抓取（避免瀑布式）

```tsx
async function DashboardPage() {
  // ❌ 瀑布式：users 抓完才抓 orders，總時間疊加
  const users = await fetchUsers();
  const orders = await fetchOrders();

  // ✅ 平行：同時發出兩個 request，總時間 = 最慢那個
  const [users, orders] = await Promise.all([fetchUsers(), fetchOrders()]);

  return <Dashboard users={users} orders={orders} />;
}
```

---

# Part 10：Streaming + Suspense（Stage 5-B，Item 6）

> 對應進度表：5-B 項目 6「Streaming + Suspense：RSC payload 漸進送達」

## 17. 傳統 SSR 的問題與 Streaming 的解法

### 傳統 SSR 的瓶頸

```text
傳統 SSR（全部等最慢的資料）：

T=0ms   Browser 請求
T=200ms Server 開始抓資料
        ├─ 使用者資料    50ms  ✅
        ├─ 訂單列表    200ms  ✅
        └─ 推薦商品    2000ms ← 最慢，其他人等它
T=2200ms 全部抓完，Server 才開始渲染 HTML
T=2300ms Browser 才收到任何 HTML
```

### Streaming 解法

```text
Streaming SSR：

T=0ms   Browser 請求
T=100ms Server 送出 HTML 骨架（立刻）
T=300ms 使用者資料好了 → 串流送出這部分 HTML
T=450ms 訂單列表好了 → 串流送出這部分 HTML
T=2100ms 推薦商品好了 → 串流送出這部分 HTML
```

Browser 在 T=100ms 就能顯示骨架，使用者不再對著空白頁等 2 秒。

### 手動 Suspense 邊界

```tsx
import { Suspense } from 'react';

async function StorePage() {
  return (
    <div>
      <h1>商店</h1>                          {/* 立刻顯示 */}

      <Suspense fallback={<CartSkeleton />}>
        <CartSummary />                        {/* 快，50ms */}
      </Suspense>

      <Suspense fallback={<ProductSkeleton />}>
        <RecommendedProducts />                {/* 慢，2000ms */}
      </Suspense>
    </div>
  );
}

// 這個元件是 Server Component，內部 await 慢 API
async function RecommendedProducts() {
  const products = await fetchRecommendations(); // 2000ms
  return <ProductGrid products={products} />;
}
```

`<CartSummary>` 完成時就先顯示，不用等 `<RecommendedProducts>`。

### loading.tsx 等同於自動 Suspense

```
app/dashboard/
  loading.tsx   ← fallback
  page.tsx      ← 被包住的 async Server Component
```

Next.js 自動展開為：
```tsx
<Suspense fallback={<Loading />}>
  <DashboardPage />
</Suspense>
```

### 什麼時候手動 Suspense，什麼時候用 loading.tsx

| 場景 | 用哪個 |
|------|--------|
| 整個頁面載入中顯示骨架 | `loading.tsx`（自動，一行不用寫） |
| 頁面內特定區塊慢，其他區塊先顯示 | 手動 `<Suspense>` 邊界 |
| 跨多個路由共用同一個骨架 | 上層 `layout.tsx` 旁的 `loading.tsx` |

---

# Part 11：Server Actions + useFormState / useFormStatus（Stage 5-B，Item 7）

> 對應進度表：5-B 項目 7「Server Actions、useFormState / useFormStatus」

## 18. Server Actions 的完整寫法

Part 9 章節已介紹過基礎，這裡補完整合表單的寫法。

### 三種呼叫方式

```tsx
'use server';
// actions.ts
export async function createPersona(formData: FormData) {
  const name = formData.get('name') as string;
  await db.personas.create({ name });
  revalidatePath('/personas'); // 讓快取失效，下次請求重抓
}
```

```tsx
// 方式 1：原生 <form action>（無 JS 也能運作，漸進增強）
<form action={createPersona}>
  <input name="name" />
  <button type="submit">建立</button>
</form>

// 方式 2：JS 直接呼叫（Client Component 內）
'use client';
const handleClick = async () => {
  await createPersona(new FormData());
};

// 方式 3：useFormState 包裝（有回傳值需求時）
'use client';
import { useFormState } from 'react-dom';
const [state, formAction] = useFormState(createPersona, null);
<form action={formAction}>...</form>
```

### useFormStatus — 讀取 Submit 的 pending 狀態

```tsx
// SubmitButton.tsx（必須是 <form> 的子元件才能讀到 pending）
'use client';
import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '送出中...' : '送出'}
    </button>
  );
}

// PersonaForm.tsx
<form action={createPersona}>
  <input name="name" />
  <SubmitButton />    {/* ← 子元件才讀得到 pending */}
</form>
```

> **為何要拆子元件？** `useFormStatus` 讀取的是**最近的祖先 `<form>`** 的狀態，必須在 `<form>` 內部的元件才能用，不能在同一層。

### useFormState — 接收 Action 回傳值

```tsx
// actions.ts
'use server';
export async function createPersona(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return { error: '名稱不能空白' }; // ← 回傳值
  await db.personas.create({ name });
  return { success: true };
}

// PersonaForm.tsx
'use client';
import { useFormState } from 'react-dom';
import { createPersona } from './actions';

export function PersonaForm() {
  const [state, formAction] = useFormState(createPersona, null);
  //     ↑ state = action 的回傳值（初始 null）
  //            ↑ formAction = 包裝後的 action，用於 <form action>

  return (
    <form action={formAction}>
      {state?.error && <p className="text-red-500">{state.error}</p>}
      {state?.success && <p className="text-green-500">建立成功！</p>}
      <input name="name" />
      <SubmitButton />
    </form>
  );
}
```

> React 19 把 `useFormState` 改名為 `useActionState`（從 `react` import，不再從 `react-dom`）。目前 Next.js 14/15 仍用 `react-dom` 版本，兩者概念相同。

---

# Part 12：RSC 決策樹 + Client Boundary 陷阱（Stage 5-B，Item 8）

> 對應進度表：5-B 項目 8「RSC 決策樹：何時選 Server / Client、陷阱、children 透傳模式」

## 19. RSC 決策樹

```
這個元件需要：

1. useState / useReducer / useContext？
   → 'use client'

2. useEffect / useCallback / useMemo（依賴瀏覽器時序）？
   → 'use client'

3. onClick / onChange 等事件監聽？
   → 'use client'

4. window / document / localStorage 等 Browser API？
   → 'use client'

5. 以上都不需要（純展示、需要直接 await 資料）？
   → Server Component（不加任何標記，預設）
```

### 常見誤解：「互動的元件才需要 'use client'」

更精確的說法是：**「需要瀏覽器環境的元件才需要 'use client'」**。

一個只有 `onClick` 的按鈕需要 `'use client'`。但一個資料展示卡片，即使視覺上很複雜，只要沒有 Hook 和事件，就應該是 Server Component。

## 20. Client Boundary 陷阱

### 陷阱 1：把 Layout 整個標成 'use client'

```tsx
// ❌ 錯誤：整個 AdminLayout 都變 client，連帶的子路由都進 bundle
'use client';
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
      {children}
    </div>
  );
}
```

問題：`children`（子頁面）原本可以是 Server Component，但因為 Layout 標了 `'use client'`，整棵子樹都被拉進 client bundle，資料抓取都變成 CSR。

### 陷阱 1 的正確做法：抽出互動部分

```tsx
// ✅ 正確：只把 Sidebar 抽成 Client Component

// Sidebar.tsx
'use client';
export function Sidebar() {
  const [open, setOpen] = useState(false);
  return <aside>...</aside>;
}

// AdminLayout.tsx（Server Component，不加 'use client'）
import { Sidebar } from './Sidebar';
export default function AdminLayout({ children }) {
  return (
    <div>
      <Sidebar />    {/* Client Component，只有它進 bundle */}
      {children}     {/* 子頁面維持 Server Component 能力 */}
    </div>
  );
}
```

### 陷阱 2：在 Client Component 中 import Server Component

```tsx
// ❌ 非法：Client 不能 import Server
'use client';
import { DataTable } from './DataTable'; // DataTable 是 Server Component
```

Next.js 會報錯或把 DataTable 降格為 Client Component。

## 21. children 透傳模式（Client Boundary 穿透）

這是最重要的模式，解決「需要 Context Provider 但不想讓子元件都變 Client」的問題。

```tsx
// ThemeProvider.tsx — Client Component（必須，因為用到 useState）
'use client';
import { ThemeContext } from './ThemeContext';
import { useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}   {/* ← children 的 Server/Client 身份由它的定義決定，不受這裡影響 */}
    </ThemeContext.Provider>
  );
}

// layout.tsx — Server Component
import { ThemeProvider } from './ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}    {/* ← 這裡的 children（各頁面）仍然是 Server Component */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**為什麼 children 能穿透？**

`children` 是從 Server Component（`layout.tsx`）傳入的，它的身份在**被定義的地方**決定，不是在被使用的地方決定。`ThemeProvider` 把 `children` 當成不透明的 slot 輸出，不改變它的渲染位置。

| 元件 | 渲染位置 |
|------|---------|
| `ThemeProvider` | Client（有 useState） |
| `children`（各頁面） | Server（由 layout.tsx 傳入） |
| `useContext(ThemeContext)` 的子元件 | Client（因為要讀 Context） |

---

# Part 13：雙軌路由架構（Stage 5-C，Item 9）

> 對應進度表：5-C 項目 9「雙軌路由架構（Next SSR + Vite CSR 分工）」

## 22. 為什麼需要雙軌

單一框架的限制：

| 需求 | Next.js 優劣 | Vite + React 優劣 |
|------|-------------|-----------------|
| 對外網站 SEO | ✅ SSR 天然支援 | ❌ CSR 爬蟲看空殼 |
| 後台管理系統 | 🔶 SSR 多餘，部署複雜 | ✅ SPA 輕量，靜態部署 |
| 開發速度 | 🔶 App Router 學習曲線 | ✅ 快速起步 |
| 部署成本 | 🔶 需 Node server | ✅ 靜態檔案 IIS/CDN |

**結論**：兩個應用目標不同，用不同工具各自最佳化。

## 23. Project C 的雙軌架構

```
monorepo/
├── prompt-studio-web/      ← Next.js（對外前台，SSR + SEO）
│   └── app/
│       ├── page.tsx        ← 首頁（公開展示）
│       └── share/[id]/     ← 分享頁（公開 Prompt 展示）
│
├── prompt-studio-admin/    ← Vite + React（後台管理，CSR SPA）
│   └── src/
│       ├── App.tsx
│       └── features/
│
└── ReactL.api/             ← .NET API（前後台共用同一個後端）
```

### 部署分工

```
使用者 / 瀏覽器
    │
    ├─ https://promptstudio.com/          → Next.js (Node server, PM2)
    │                                        port 3000
    │
    ├─ https://admin.promptstudio.com/    → Vite build 靜態檔
    │                                        IIS / Nginx
    │
    └─ https://api.promptstudio.com/      → .NET API
                                             IIS + Kestrel
                                             port 5000
```

### 共用的東西

| 共用什麼 | 做法 |
|---------|------|
| 後端 API | 同一份 .NET API，兩個前端都打 `/api/*` |
| TypeScript 型別 | `packages/shared-types/`（monorepo shared package） |
| 設計系統元件 | `packages/ui/`（可選，前期直接複製也行） |
| 環境變數命名 | 統一前綴，前台用 `NEXT_PUBLIC_`，後台用 `VITE_` |

### 路由職責分界

| 路由 | 誰負責 | 理由 |
|------|--------|------|
| `/` 首頁 | Next.js | SSR，SEO |
| `/share/[id]` 分享頁 | Next.js | SSR，OG 圖像、爬蟲 |
| `/login`（管理者登入）| Vite | 不需 SEO，SPA |
| `/personas`, `/prompts` | Vite | 後台，不需 SEO |
| `/chat` | Vite | 高度互動，不適合 SSR |
