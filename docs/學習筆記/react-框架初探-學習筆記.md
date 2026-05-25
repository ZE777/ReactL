# React 框架初探學習筆記

> 整理自 Notion 知識庫：用「五層架構模型」鳥瞰整個 React 生態系
> 適合對象：有 .NET MVC 後端基礎、剛開始接觸 React 想建立全局視野的開發者
> 與其他筆記的關係：本文是**鳥瞰圖**（建立心智模型），其他筆記是**顯微鏡**（深入機制）

---

## 學習路徑建議

本文件分為 **8 個 Part、25 個章節**，建議按順序讀，因為 Part 1 的五層架構是後面所有討論的骨架。

時間有限時：

- **只有 30 分鐘**：Part 1（五層架構） + Part 2（UI Layer 本體）→ 建立 React 的定位
- **只有 1 小時**：Part 1 → 4 → 看完 UI / State / Data 三層
- **完整路徑**：Part 1 → 8，搭配結語的「核心心法」

> 如果你已經寫過幾個 React 專案、想深入 hook 機制與架構決策，請改讀 [React 進階學習筆記](react-進階學習筆記-notion版.md)。

---

## 與其他學習筆記的銜接

| 想深入的主題 | 對應筆記 |
| --- | --- |
| Hook 機制、記憶體模型、渲染時序、架構決策 | [React 進階學習筆記](react-進階學習筆記-notion版.md) |
| Next.js 架構、Server Action、語言/框架/Runtime 三層 | [Next.js 架構與 .NET MVC 對照學習筆記](nextjs-架構與mvc對照學習筆記.md) |
| TailwindCSS 工程化（JIT、Design Tokens、cn helper） | [TailwindCSS 進階學習筆記](tailwindcss-進階學習筆記.md) |
| Vitest 自動化測試、CI/CD 整合 | [Vitest 自動化測試學習筆記](vitest-自動化測試學習筆記.md) |

---

# Part 1：React 五層架構鳥瞰

> 在學任何 React 工具之前，先建立這張地圖。後面所有討論都圍繞這 5 層展開。理解了「誰負責什麼」，工具選型就不會迷路。

---

## 1. 五層架構全景圖

```text
┌─────────────────────────┐
│ UI Layer                │  ← React / JSX / Tailwind / Radix
├─────────────────────────┤
│ State Layer             │  ← useState / Zustand / Redux / Context
├─────────────────────────┤
│ Data Layer              │  ← fetch / React Query / SWR
├─────────────────────────┤
│ Routing Layer           │  ← React Router / Next.js
├─────────────────────────┤
│ Build / Tooling Layer   │  ← Vite / Webpack / TypeScript
└─────────────────────────┘
```

### 各層一句話定義

| 層 | 它回答的問題 | 代表工具 |
| --- | --- | --- |
| UI | 「在某個狀態下，畫面長怎樣？」 | React、JSX、CSS |
| State | 「資料從哪來、放在哪？」 | useState、Zustand |
| Data | 「後端資料怎麼拿、怎麼快取？」 | React Query |
| Routing | 「網址變了，要顯示哪個畫面？」 | React Router、Next.js |
| Build | 「程式怎麼變成瀏覽器能跑的東西？」 | Vite、TypeScript |

### 關鍵認知

> ❌ 錯誤理解：「React 是 framework，下載一包就什麼都有了」
> ✅ 正確理解：**React 只活在 UI Layer，其他四層都需要搭配生態系工具**

這就是為什麼從 .NET MVC（一套全包）跨到 React 會覺得「東西怎麼這麼多要選」——因為 React 故意只做一件事，其他交給專門工具。

---

## 2. 與 .NET MVC 的層次對照

| 層 | .NET MVC 對應 | React 生態 |
| --- | --- | --- |
| UI | Razor View | React + JSX |
| State | ViewBag / TempData / Session | useState / Zustand |
| Data | Service + EF Core | React Query / fetch |
| Routing | RouteConfig.cs / [Route] | React Router / Next.js |
| Build | csproj / MSBuild | Vite / Webpack |
| 語言 | C# | TypeScript |

### 為什麼 .NET 開發者會覺得「散」

| 項目 | .NET MVC | React 生態 |
| --- | --- | --- |
| 一個指令裝完？ | ✅ `dotnet new mvc` | ❌ 要自己選 router、state、data tool |
| 慣例？ | 強約定（資料夾名、檔名都有規範） | 鬆約定（看你選哪套） |
| 內建 Routing？ | ✅ | ❌（要選 React Router 或 Next.js） |
| 內建 ORM / Data？ | EF Core | ❌（要選 RTK Query / TanStack Query） |

> 這不是 React 的缺點，是設計哲學的差異——React 把選擇權留給開發者，代價是學習曲線。

---

# Part 2：UI Layer — React 的本體

> React 真正只活在這一層。這層只關心：「在某個狀態下，畫面該長怎樣」。

---

## 3. React 的本質與定位

### React 是 Library，不是 Framework

| 項目 | React | Vue / Angular / Next.js |
| --- | --- | --- |
| 定位 | **UI Library** | Framework |
| 負責範圍 | UI 渲染 | UI + Routing + Data + Build |
| 自由度 | 高（生態系自由組合） | 中～低（內建慣例） |
| 學習曲線 | 前期低、後期高 | 前期高、後期穩 |

### 核心職責

```text
React 只做一件事：
   UI = f(state)
   ↑           ↑
 畫面       狀態
```

換句話說：**畫面是由 state 計算出來的結果**，React 負責「state 變動時自動重算畫面」。

### React 不關心的事

- API 從哪來（Data Layer 處理）
- 資料怎麼存到 LocalStorage（State Layer 處理）
- URL 變化（Routing Layer 處理）
- 怎麼打包（Build Layer 處理）

> 這就是為什麼 React 必須搭配生態系——它的設計初衷就是「只做 UI、做到極致」。

### .NET 對照

| 角色 | .NET | React |
| --- | --- | --- |
| 純 UI 渲染引擎 | Razor | **React** |
| 整套 web 框架 | ASP.NET Core MVC | Next.js（基於 React） |

---

## 4. JSX 不是 HTML

> 這是 .NET 開發者最容易誤會的地方：「JSX 看起來像 HTML 那它就是 HTML 模板吧？」其實完全不是。

### 沒有 JSX，React 也能寫

React 真的可以這樣寫（編譯後的樣子）：

```jsx
React.createElement(
  'div',
  { className: 'card' },
  React.createElement('h1', null, title),
  React.createElement('p', null, description),
);
```

問題是：

- 結構難讀
- 不直覺
- 不像在寫 UI

> JSX 解決的是 **人類可讀性**，不是功能缺失。

### JSX 的編譯本質

```jsx
<h1>{title}</h1>
```

編譯後就是：

```jsx
React.createElement('h1', null, title);
```

❌ 錯誤理解：JSX 是 HTML 模板字串
✅ 正確理解：JSX 是 **JavaScript 的語法擴充**，最後會被編譯成 JS 物件（不是字串）

### 為什麼結構必須是 JS 可運算的東西？

因為 UI Layer 必須做這些事：

```jsx
{isLogin && <UserMenu />}
{items.map(item => <Item key={item.id} />)}
```

這些能力都是 JavaScript 原生提供的：

- 條件判斷
- 迴圈
- 函式呼叫

### 與 Razor 對照

| 項目 | Razor | JSX |
| --- | --- | --- |
| 本質 | 字串模板（在 server 編譯成 HTML） | 函式呼叫的語法糖（編譯成 JS 物件） |
| 條件判斷 | `@if (isLogin) { ... }` | `{isLogin && <X />}` |
| 迴圈 | `@foreach (var x in items) { ... }` | `{items.map(x => <X />)}` |
| 編譯目標 | HTML 字串 | Virtual DOM 物件樹 |
| 渲染時機 | Server 端產出 HTML | Client 端用 React diff 後 patch DOM |

> JSX 不是「字串模板」，而是「結構化的 UI 物件」。這個差異是 React 能做 Virtual DOM 與 diff 的基礎。

---

## 5. Component 化思維

### Component = function

```jsx
function Button() {
  return <button>Click</button>;
}
```

每個 Component 處理三件事：

- **接收資料**（Props）
- **管理狀態**（State）
- **回傳 UI**（JSX）

### 實戰範例：商品卡片

```jsx
function ProductCard({ name, price }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>${price}</p>
    </div>
  );
}
```

### 為什麼要 Component 化

| 優點 | 解決的痛 |
| --- | --- |
| 高重用性 | 商品卡在訂單頁、列表頁、收藏頁通用 |
| 易維護 | 樣式只改一個地方 |
| 易測試 | 單獨對 ProductCard 寫測試 |
| 團隊分工 | A 寫 Card、B 寫 Header，互不干擾 |

### .NET 對照

| 角色 | .NET MVC | React |
| --- | --- | --- |
| UI 重用單位 | Partial View（`@Html.Partial`） | Component |
| 參數傳遞 | ViewBag / Model | Props |
| 區域狀態 | ViewState（已過時） | useState |

---

## 6. Declarative UI（宣告式 UI）

### 命令式 vs 宣告式

❌ 命令式（Imperative）：你下指令，DOM 一步步執行

```javascript
if (isLogin) {
  document.querySelector('#user').style.display = 'block';
} else {
  document.querySelector('#user').style.display = 'none';
}
```

✅ 宣告式（Declarative）：你描述「該長怎樣」，React 自己想辦法

```jsx
{isLogin ? <UserMenu /> : <LoginButton />}
```

### 你只需要描述

> 「在某個狀態下，UI 應該長怎樣」

React 自動處理：

- DOM 操作
- 更新順序
- 效能最佳化（Virtual DOM diff）

> 這就像告訴司機「我要去台北車站」（宣告式），而不是「先右轉、再直走 200 公尺、再左轉...」（命令式）。

---

## 7. Virtual DOM

### 為什麼需要 Virtual DOM

直接操作真實 DOM 很慢：

- DOM API 複雜
- Reflow / Repaint 成本高
- 容易寫錯

### React 的工作流程

```text
State 改變
   ↓
產生新的 Virtual DOM 樹
   ↓
Diff 新舊樹（找出差異）
   ↓
最小變更套用到真實 DOM
```

### 實戰場景

> 一個頁面有 1000 筆列表，只更新其中一筆時：
>
> - **傳統做法**：可能整個列表重繪（成本高）
> - **React**：只更新該筆對應的 DOM 節點（最小成本）

### 副作用：跨平台能力

因為 Virtual DOM 是「抽象的 UI 樹」，可以渲染到不同目標：

- Web → React DOM
- Mobile → React Native
- Terminal → Ink

> 詳細的 Diffing 機制與 key 的重要性，見 [React 進階筆記第 3 章](react-進階學習筆記-notion版.md)。

---

## 8. 單向資料流（One-way Data Flow）

### 概念

```text
Parent State
     ↓ props
Child Component
```

- State 只存在於擁有它的元件
- 資料只能由父元件 → 子元件
- 子元件**不能直接修改**父元件的狀態

### 為什麼這樣設計？

❌ Vue 雙向綁定：`v-model` 一行解決，但資料流向不明
✅ React 單向：稍微囉嗦，但資料流可預測

### 三大保證

- **Single Source of Truth**：每份資料有唯一來源
- **狀態變化路徑固定**：可預測、可追蹤
- **除錯容易**：UI 出錯一定是 state 出錯，不會是「不知道誰偷改了」

> 子元件想改父狀態？父層傳一個 callback 下來：`<Child onChange={setCount} />`。這保持了資料流向的明確性。

---

# Part 3：State Layer — 工具選型矩陣

> 「**這個資料要給誰用？**」是判斷該用什麼工具的唯一標準。

---

## 9. State 的三種類型

| 類型 | 說明 | 例子 |
| --- | --- | --- |
| Local State | 只有自己用 | Modal 開關、輸入框內容 |
| Shared State | 多元件共用 | 登入者資訊、主題色 |
| Server State | 後端來的資料 | 訂單列表、商品詳情 |

> 三種 state 對應三種工具家族：Hook（local）、Store（shared）、Query lib（server）。

---

## 10. 六大工具總覽

| 工具 | 狀態位置 | 更新粒度 | 心智負擔 | 適合 |
| --- | --- | --- | --- | --- |
| useState | Component | 極小 | ⭐ | 單一元件狀態（Modal、輸入） |
| useReducer | Component | 小 | ⭐⭐ | 複雜 state 流程（表單、wizard） |
| Context | React Tree | 大（全部 consumer） | ⭐⭐ | 主題、登入（低頻變動） |
| Redux Toolkit | Global Store | 中 | ⭐⭐⭐⭐ | 大型專案、需追蹤 |
| Zustand | Global Store | 小（selector） | ⭐⭐ | 中小型、跨頁共享 |
| Jotai | Atom | 極小 | ⭐⭐⭐ | 高度組合、複雜依賴 |

---

## 11. useState — 元件內最小狀態單位

### 解決什麼問題

- 元件內的 UI 狀態
- 點擊、開關、輸入框內容

### 用法

```jsx
const [count, setCount] = useState(0);
```

### 運作流程

```text
Component render
  → React 依 hook 呼叫順序找到對應 state slot
  → setState 被呼叫
  → React 標記該 component 為 dirty
  → 該 component 重新 render
```

### 不適合的場景

- 多個元件需要共用
- 狀態之間有複雜流程關係

> 深入機制（snapshot、批次更新、updater function）見 [React 進階筆記第 8 章](react-進階學習筆記-notion版.md)。

---

## 12. useReducer — 把狀態變化集中管理

### 解決什麼問題

- 狀態多
- 狀態之間有流程關係（A → B → C）

### 用法

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

### 運作流程

```text
dispatch(action)
  → reducer(state, action)
  → 回傳 newState
  → component rerender
```

### 為什麼不是全域？

❌ 常見誤解：useReducer 就是「組件內的 Redux」，所以是全域
✅ 正確理解：reducer 只是**模式（pattern）**，state 仍綁在 component tree 某一節點

### .NET 對照

| 角色 | .NET | React |
| --- | --- | --- |
| 集中處理動作 | Command Pattern / MediatR | reducer |
| 動作描述 | ICommand | action |
| 動作執行者 | Handler | reducer function |

---

## 13. Context API — 輕量全域傳遞

### 解決什麼問題

- Props Drilling（跨多層傳資料很煩）
- 全站共用但不複雜的狀態（theme / auth）

### 用法

```jsx
<Context.Provider value={state}>
  <App />
</Context.Provider>
```

子孫用 `useContext(Context)` 訂閱。

### 隱藏代價（重要）

> ⚠️ Provider value 一變，**所有 consumer 都 rerender**

不適合高頻更新的資料（例如：滑鼠座標、輸入框內容）。

### 使用建議

- 拆多個小 Context（theme 一個、auth 一個、language 一個）
- value 要包 useMemo，避免每次渲染都產生新物件

> 詳細 Context 陷阱與架構決策見 [React 進階筆記第 18 章](react-進階學習筆記-notion版.md)。

---

## 14. Redux Toolkit — 嚴謹的全域 Store

### 解決什麼問題

- 大型專案
- 多人協作
- 需要追蹤狀態變化（time travel debug）

### 運作流程

```text
UI → dispatch(action)
   → reducer
   → store state 改變（不可變更新）
   → 通知訂閱者
```

### 三大原則

| 原則 | 意義 |
| --- | --- |
| 單一 Store | 全應用一個 store，不分散 |
| 不可變資料 | state 永遠是新物件（呼應 React 嚴格相等機制） |
| 純函式 reducer | 同樣輸入永遠同樣輸出，方便測試 |

### RTK 的甜頭

```jsx
state.value++;  // 看起來像 mutation
```

實際上 RTK 內建 Immer，會幫你產生不可變副本。寫起來像直接改，但底層是 immutable。

### 代價

- 樣板程式碼多
- 學習曲線陡

---

## 15. Zustand — 極簡全域 Store

### 解決什麼問題

- 想要 Redux 的「全域」
- 但不想要 Redux 的「儀式感」

### 用法

```jsx
const useStore = create(set => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}));
```

### 三大特性

| 特性 | 來源 |
| --- | --- |
| 不用 Provider | Store 是獨立物件，不依賴 React tree |
| 細粒度更新 | selector 只訂閱用到的 slice |
| 直覺 | 沒有 action / reducer 樣板 |

### 與 Redux 對照

| 項目 | Redux Toolkit | Zustand |
| --- | --- | --- |
| Provider | 必須 | 不需要 |
| 樣板 | 多 | 極少 |
| Devtools | ✅ | ✅（搭配 Redux DevTools） |
| 跨 React 環境存取 | ✅ | ✅（`useStore.getState()`） |

> 深入 Zustand 與 .NET DI Lifetimes 對照見 [React 進階筆記第 26 章](react-進階學習筆記-notion版.md)。

---

## 16. Jotai — 原子化狀態模型

### 解決什麼問題

- 高度可組合
- 複雜依賴關係
- 需要極細粒度更新

### 用法

```jsx
const countAtom = atom(0);
const doubledAtom = atom(get => get(countAtom) * 2);
```

### 運作流程

```text
atom 改變
  → 只通知訂閱該 atom 的 component
  → 衍生 atom 自動重算
```

### 心智模型

> 狀態像「電路」——atom 是節點，變化會沿著連線傳遞。

### 適合場景

- 大量小型獨立狀態（每個 cell、每個圖示）
- 衍生狀態複雜（A 變 → B 算 → C 算）

---

# Part 4：Data Layer — Server State 的特殊性

> 後端來的資料是一種特殊的狀態：**它不是你的，你只是它的代理人**。

---

## 17. 為什麼 Server State 要獨立看待

### Local State vs Server State

| 項目 | Local State（useState） | Server State |
| --- | --- | --- |
| 真理來源 | 在你的記憶體 | 在後端 |
| 是否會 stale | 不會 | **會**（後端可能改了） |
| 是否要快取 | 不需要 | **需要**（避免重複請求） |
| 是否要 retry | 不需要 | **需要**（網路會失敗） |
| 跨組件共享 | 看設計 | 通常需要 |

> Server State 不是「狀態」，更像是「快取的副本」。處理 server state 的工具其實是在管「快取一致性」。

---

## 18. fetch vs React Query

### 直接用 fetch 的痛

```jsx
function UserList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // ...
}
```

問題：

- ❌ 沒快取（切回頁面重打）
- ❌ 沒共用（兩個元件用同 API 各打一次）
- ❌ 沒重試（網路失敗就 GG）
- ❌ 樣板多（每個 API 都要寫 loading/error）

### React Query 解決什麼

```jsx
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // ...
}
```

| 功能 | React Query 提供 |
| --- | --- |
| 自動快取 | 同 queryKey 共用快取 |
| 失效自動重抓 | 視窗 focus、網路恢復時 refetch |
| Loading / Error 管理 | 內建 isLoading / error |
| 樂觀更新 | mutation 立刻更新 UI、失敗 rollback |
| 請求去重 | 同時 10 個元件 useQuery 只發 1 次 request |

### 為什麼叫 Server State

> React Query 不是「fetch 函式庫」，而是「Server State 管理工具」——它的職責是讓前端的快取與後端的資料保持一致。

### 與其他工具的關係

| 工具 | 處理什麼 |
| --- | --- |
| useState | UI 狀態 |
| Zustand | 跨頁 Local/Shared State |
| **React Query** | **Server State（快取一致性）** |

---

# Part 5：Routing Layer — 兩種路由哲學

> 同樣是「URL → 渲染哪個畫面」，React Router 與 Next.js 解法完全不同。差異不在語法，在**何時決定要渲染什麼**。

---

## 19. React Router — 程式碼宣告路徑（CSR）

### 用法

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 運作流程

```text
點擊 <Link to="/users">
  → URL 改變（不 reload）
  → React Router 重新比對 routes
  → 對應 <UsersPage /> 被 render
```

### 特性

- 純客戶端（CSR）
- URL 切換不打 server
- 適合純 SPA、後台系統

> 深入 React Router 進階用法（Guard、useParams、useNavigate）見 [React 進階筆記第 24 章](react-進階學習筆記-notion版.md)。

---

## 20. Next.js — 檔案路由 + SSR

### 用法

```text
app/
 ├─ login/page.tsx      → /login
 ├─ users/
 │   ├─ page.tsx        → /users
 │   └─ [id]/page.tsx   → /users/123
```

❌ 不需要寫 `<Route>`
✅ **資料夾結構就是路由**

### 運作流程

```text
Request: /users/123
  → Server 解析 URL
  → 對應 app/users/[id]/page.tsx
  → 執行該 Component（可同步抓資料）
  → 產出完整 HTML
  → 回傳給瀏覽器
```

### 適合場景

- 需要 SEO
- 需要 SSR / SSG
- 全端整合（前端 + API Route）

---

## 21. 為什麼 Next.js 採用檔案路由

> Server 必須在「還沒執行任何 JavaScript」之前，就知道要回傳哪個頁面。

### React Router 對 SSR 的天生不適合

```jsx
<Route path="/product/:id" element={<ProductPage />} />
```

這段路由規則：

- 需要 **JavaScript 執行後**才能解析
- 依賴：bundle 載入、Router 初始化、route matching 計算

對 Server 而言：

```text
HTTP Request 進來
  ↓
Server 無法直接得知對應的 Component
  ↓
只能先回傳空殼 HTML
  ↓
瀏覽器載入 JS
  ↓
React Router 才決定要顯示哪個畫面
```

📌 這就是典型 **SPA + CSR**——SEO 友善度差。

### Next.js 的 Server-Side 流程

```text
Request: /product/ABC123
  ↓
Server 解析 URL → 直接對應 app/product/[id]/page.tsx
  ↓
執行 Component（可同步 fetch 資料）
  ↓
產出完整 HTML
  ↓
回傳瀏覽器
```

✅ 整個過程**不需要執行 Router JavaScript**。

### SEO 對照

#### React Router（CSR）爬蟲看到的

```html
<html>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

- ❌ 無商品名稱
- ❌ 無描述
- ❌ 幾乎無可索引內容

#### Next.js（SSR）爬蟲看到的

```html
<html>
  <body>
    <h1>iPhone 15 Pro</h1>
    <p>價格：NT$39,900</p>
  </body>
</html>
```

- ✅ 可直接索引實際內容
- ✅ 可動態產生 meta
- ✅ 每個 `/product/:id` 都是獨立頁面

### 檔案路由的工程紅利

| 紅利 | 說明 |
| --- | --- |
| build 階段即知所有頁面 | 可做靜態分析、預渲染 |
| Request 時 O(1) 定位 | 直接對應檔案，不用 runtime 計算 |
| 自動 code splitting | 每個 page 自動拆 bundle |
| 自動 SEO / metadata | 內建 metadata API |

### 一句話總結

> Next.js 的檔案路由，本質是把「路由判斷」**從執行期（runtime JS）提前到結構層（檔案系統）**，讓 Server 可以直接產生 HTML。

> Next.js 與 .NET MVC 的更深度對照（Server Action vs Controller、Service Layer 等）見 [Next.js 架構與 .NET MVC 對照學習筆記](nextjs-架構與mvc對照學習筆記.md)。

---

# Part 6：Build / Tooling Layer

> 這層不影響 React 思維，但影響開發體驗。.NET 開發者過來會發現：原來前端的 build 流程比想像的複雜。

---

## 22. 三大支柱：編譯、打包、品質

| 工具類型 | 代表 | 職責 |
| --- | --- | --- |
| 編譯器 | Babel / SWC / esbuild | 把 JSX / TS 轉成瀏覽器看得懂的 JS |
| 打包工具 | Vite / Webpack | 把幾百個檔案合併成幾個 bundle |
| 品質工具 | ESLint / Prettier / TypeScript | 抓錯、統一風格、強型別 |

### Vite vs Webpack

| 項目 | Webpack | Vite |
| --- | --- | --- |
| 開發啟動速度 | 慢（要 build 整包） | 極快（ESM 原生） |
| HMR（熱更新） | 中等 | 極快 |
| 設定複雜度 | 高 | 低（開箱即用） |
| 生態 | 成熟豐富 | 較新但快速擴張 |
| 業界趨勢 | 被取代中 | **新專案首選** |

### TypeScript 為什麼必備

| 痛點 | TS 解法 |
| --- | --- |
| 寫 user.naem 沒人提醒 | 紅線立刻警告 |
| 重構改參數其他地方沒跟上 | 整個專案掃描 |
| 不知道函式回傳什麼 | 自動推斷 |
| API response 結構不確定 | interface 寫死 |

### .NET 對照

| 角色 | .NET | React 生態 |
| --- | --- | --- |
| 編譯器 | csc / Roslyn | tsc / SWC / esbuild |
| 打包 | MSBuild | Vite / Webpack |
| 強型別 | C# 內建 | TypeScript |
| Lint | StyleCop / Roslyn Analyzers | ESLint |
| 格式 | EditorConfig + .NET formatter | Prettier |

> 深入 Vite 環境配置與 production / development 差異見 [React 進階筆記第 28 章](react-進階學習筆記-notion版.md)。

---

# Part 7：Class → Hooks 思維革命

> Hooks 出現之前，React 是 Class Component 的世界。Hooks 不只是新 API，是整個編程模式的轉變。

---

## 23. Class Component 的三大痛

### A. this 綁定容易出錯

```jsx
class Button extends React.Component {
  handleClick() {
    console.log(this);  // ❌ undefined
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

必須額外處理 `bind(this)` 或改用 arrow function。

### B. 邏輯分散在多個生命週期

```jsx
class User extends React.Component {
  componentDidMount() {
    document.title = 'User Page';
    this.subscribe();
  }

  componentDidUpdate() {
    document.title = 'User Page';  // 重複
  }

  componentWillUnmount() {
    this.unsubscribe();
  }
}
```

❌ 同一件事被拆到三個方法、容易漏寫 cleanup。

### C. 邏輯難以共用

複用邏輯只能靠：

- HOC（Higher-Order Component）
- Render Props

兩者都會造成「Wrapper Hell」（巢狀過深）。

---

## 24. Function + Hooks 怎麼解

### 沒有 this（A 痛點解決）

```jsx
function Button() {
  const handleClick = () => {
    console.log('clicked');  // 不用想 this
  };
  return <button onClick={handleClick}>Click</button>;
}
```

### 邏輯集中（B 痛點解決）

```jsx
function User() {
  useEffect(() => {
    document.title = 'User Page';
    const sub = subscribe();
    return () => sub.unsubscribe();  // cleanup 與 setup 在同一個地方
  }, []);
}
```

### Custom Hook 抽出邏輯（C 痛點解決）

```jsx
function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function Profile() {
  usePageTitle('Profile Page');
  return <div>Profile</div>;
}
```

> 深入 Custom Hook 設計與 useFetch / useSearch 實戰見 [React 進階筆記第 21 章](react-進階學習筆記-notion版.md)。

---

## 25. 常用 Hook 速查表

| Hook | 一句話定位 | 經典使用情境 |
| --- | --- | --- |
| useState | 元件內狀態 | 表單、Modal 開關 |
| useEffect | 副作用（fetch、訂閱、計時器） | API、監聽事件 |
| useContext | 訂閱全域 Context | Theme、Auth |
| useRef | DOM 引用 / 不觸發渲染的私有變數 | focus、計時器 ID |
| useMemo | 記憶計算結果 | 重計算昂貴的衍生值 |
| useCallback | 記憶函式引用 | 傳給 React.memo 子元件 |
| useReducer | 元件內複雜流程 | 多步驟表單、wizard |
| useLayoutEffect | DOM 寫入後同步副作用 | 量測尺寸再渲染 |

> Hook 三大規則（必須以 use 開頭、不能在條件/迴圈內、只能在組件或其他 Hook 裡呼叫）見 [React 進階筆記第 21 章](react-進階學習筆記-notion版.md)。

---

# Part 8：實戰案例 — Repair Alliance App

> 一個 .NET MVC 開發者眼中的 Next.js 專案結構。把上面所有 Layer 落地到一個真實專案。

---

## 26. Feature-Based 目錄結構

### 設計理念

❌ 傳統前端：依「技術類別」分（components/、hooks/、services/ 全攤平）
✅ Feature-Based：依「業務功能」分（features/auth/、features/orders/ 各自完整）

### 結構範例

```text
src/
├─ features/
│  ├─ auth/
│  │  ├─ actions/         ← Server Action（命令）
│  │  ├─ services/        ← API 封裝（工具箱）
│  │  ├─ components/      ← 該功能私有 UI
│  │  └─ types/           ← TS 型別 / Zod schema
│  ├─ members/
│  └─ work-orders/
├─ app/                   ← Next.js 路由與佈局
└─ store/                 ← 全域 Zustand store
```

### 為什麼這樣分

| 優點 | 解釋 |
| --- | --- |
| 高內聚 | 改「工單」只動 `features/work-orders/` 一個資料夾 |
| 低耦合 | 各 feature 之間不共享私有組件 |
| 刪除安全 | 砍掉一個功能就是砍一個資料夾，不會留孤兒 |
| 多人協作衝突少 | 不同人改不同資料夾，git conflict 機率低 |

### 缺點

- 資料夾層級較深（要習慣跳轉）
- 跨 feature 共用的東西要小心放（通常放 `src/shared/` 或 `src/lib/`）

---

## 27. 從 .NET 到 Next.js 的職責對照

| .NET MVC 概念 | Next.js 對應 | 具體職責 |
| --- | --- | --- |
| Controller Action | **Server Action**（`actions/*.ts`） | 接收 Request、呼叫 Service、處理 Cookie/Session |
| Service Layer | **Service Class**（`services/*.ts`） | 商業邏輯、串接外部 Web API、資料 Mapping |
| ViewModel / DTO | **TypeScript Types / Zod** | 定義資料結構、輸入驗證 |
| Global Filter | **Middleware** | 全域路由保護、身分驗證 |
| Web.config / appsettings.json | **.env.local** | 環境變數 |

### Server Action：你的「非同步 Controller」

```typescript
// actions/auth-action.ts
'use server';  // 關鍵指令：告訴 React 這個函數在 Server 跑

export async function loginAction(data) {
  const service = new AuthService();
  return await service.login(data);
}
```

職責對應 Controller：

- 從 Request 拿參數
- 呼叫 Service
- 處理錯誤（try/catch）
- 設定 Cookie（`cookies().set()` ≈ `Response.Cookies`）

### Service Class：你的「Business / Data Logic」

```typescript
// services/auth-service.ts
export class AuthService {
  async login(data) {
    return await apiPost('/login', data);
  }

  // AutoMapper 的角色
  private transformUser(rawUser) {
    return { /* 將 API 回傳轉成前端 ViewModel */ };
  }
}
```

職責對應 Service：

- 隱藏連線細節
- 資料轉換（AutoMapper 的角色）
- 不知道呼叫者是誰（Action / 其他 Service / 測試）

---

## 28. 此架構解決的痛點

### A. 強型別一條龍

> 在 .NET 裡，後端 C# 型別跟前端 JS 型別是斷掉的。在這個專案，**Service 回傳什麼 interface，前端 UI 直接享受 IntelliSense 與型別檢查**。

### B. BFF（Backend for Frontend）的進化

❌ 以前：在 .NET 裡寫一段 Controller 只為了幫前端轉發 API（避免 CORS）
✅ 現在：**Server Action 本身就是 BFF**，後端調用與前端 UI 在同一個 Git 專案裡

---

## 29. 與傳統 MVC 的關鍵差異

### 傳統 .NET MVC 流程

```text
Request → Controller → 渲染 View → 回傳 HTML
```

每次互動都是完整往返 + 整頁刷新。

### 此 Next.js 專案流程

```text
1. 畫面渲染在 Client（React）
2. 使用者點擊 → 單獨觸發 Server Action
3. Server 處理完 → 回傳純資料（JSON-like）
4. React 組件決定怎麼動態更新 UI
```

互動局部更新，不刷新整頁。

### 一句話總結

> 這套開發方式，本質是把 **「.NET 的 Controller 邏輯」搬到 Next.js 的 Server Action**，並透過 TypeScript 把整條管線都接上「型別安全」的保險絲。

---

## 30. 整體技術棧解析

### Next.js 15+ App Router

- ✅ SSR / Streaming → 減少白屏時間
- ✅ Server Components → 減少 client JS 負擔
- ❌ 學習曲線陡（Server vs Client Component 邊界要熟）

### Tailwind CSS v4 + Radix UI

- ✅ Tailwind v4：CSS 變數驅動，編譯極快
- ✅ Radix UI：100% 無障礙支援、無樣式組件
- ❌ HTML 標籤內 class 多，初看雜亂

### Zustand（狀態管理）

```typescript
export const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      login: (userData) => set({ user: userData }),
    }),
    { name: 'auth-storage' },  // 存 LocalStorage
  ),
);
```

- ✅ 輕量、高效、無樣板
- ❌ 太自由，需團隊統一 Store 劃分規範

### React Hook Form + Zod

- ✅ Zod 提供 compile-time + runtime 雙重型別安全
- ✅ 表單驗證、錯誤訊息一條龍

### 資料流：Server-Centric

| 操作 | 實作 |
| --- | --- |
| 讀取資料 | 在 `page.tsx`（Server Component）中直接呼叫 service |
| 修改資料 | 透過 Server Action |

> 不再需要手動寫 `fetch('/api/...')`，直接 `import` Server Action 函式呼叫即可，Next.js 自動處理網路傳輸。

---

# 結語

## 核心心法

### 1. React 只是 UI Layer

別把 React 當 Framework 用。它的設計哲學就是「只做 UI、做到極致」，其他四層交給專門工具。

### 2. 五層架構是地圖

迷路時回頭看這張圖。「我現在的問題在哪一層？該找哪類工具？」

### 3. 工具選型問三個問題

- **誰用？**（Local / Shared / Server）
- **多頻繁更新？**（Context 不適合高頻）
- **要不要快取？**（Server State 必須快取）

### 4. JSX 不是 HTML

它是 JS 物件。理解這點才能理解 Virtual DOM、diff、key 為什麼重要。

### 5. Class → Hooks 是思維革命

不只是新 API，是把「生命週期分散」改成「邏輯集中」、「邏輯難共用」改成「Custom Hook 抽出」。

### 6. Next.js 是 .NET MVC 思維的現代繼承者

Server Action ≈ Controller、Service Class ≈ Service Layer、Middleware ≈ Filter、TS Types ≈ ViewModel。把後端思維帶進前端，反而比純前端開發者更有架構優勢。

---

## 知識體系總覽

```text
React 框架初探
├── Part 1: 五層架構鳥瞰
│   ├── UI / State / Data / Routing / Build
│   └── 與 .NET MVC 層次對照
├── Part 2: UI Layer (React 本體)
│   ├── Library vs Framework
│   ├── JSX 不是 HTML（編譯成 JS 物件）
│   ├── Component 化思維
│   ├── Declarative UI
│   ├── Virtual DOM
│   └── 單向資料流
├── Part 3: State Layer (六大工具)
│   ├── 三種 State（Local / Shared / Server）
│   ├── useState / useReducer
│   ├── Context API
│   └── Redux / Zustand / Jotai
├── Part 4: Data Layer (Server State)
│   ├── 為什麼要獨立看待
│   └── React Query 解決什麼
├── Part 5: Routing (兩種哲學)
│   ├── React Router (CSR)
│   ├── Next.js (檔案路由 + SSR)
│   └── SEO 對照
├── Part 6: Build / Tooling
│   ├── Vite / Webpack
│   └── TypeScript 必要性
├── Part 7: Class → Hooks 思維革命
│   ├── Class 三大痛
│   ├── Hooks 怎麼解
│   └── 常用 Hook 速查
└── Part 8: 實戰案例 (Repair Alliance App)
    ├── Feature-Based 結構
    ├── .NET → Next.js 職責對照
    ├── Server Action / Service Class
    └── 整體技術棧
```

---

## 延伸學習主題

- **React Server Components**：Server / Client Component 的邊界與資料邊界
- **Streaming SSR**：Suspense + Server Component 的漸進式渲染
- **Edge Runtime**：在 CDN 邊緣執行 Server Action
- **Monorepo 工具**：Turborepo / Nx 管理多專案
- **設計系統**：Storybook + Radix + Tailwind 建立組件庫

---

> 本文件為 React 生態系的「鳥瞰圖」。當你需要深入特定主題時，請參考開頭表格中對應的學習筆記。
