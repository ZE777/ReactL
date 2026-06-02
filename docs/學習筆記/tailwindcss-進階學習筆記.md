# TailwindCSS 進階學習筆記

> 整理自學習對話：從 BS5 / 傳統 CSS 過渡到 Utility-First 工程化的思維轉換
> 適合對象：有 Bootstrap 5 或傳統 CSS 經驗、正在 React / Next.js 專案中導入 Tailwind 的開發者
> 前置知識：HTML / CSS 基礎、了解 React 組件化思維（可搭配 [React 進階學習筆記](react-進階學習筆記-notion版.md) 第 22、29 章）

---

## 學習路徑建議

本文件分為 **4 個 Part、10 個章節**：

- **只有 30 分鐘**：Part 1（哲學與 JIT）→ 看懂為什麼 Tailwind 不是「另一套 CSS class」
- **只有 1 小時**：Part 1、2 → 完整理解工程化價值
- **完整路徑**：Part 1 → 4，外加結語的「核心心法」

如果你是從 BS5 過來，**Part 2（設計系統）和 Part 3（組件化）是你必須補的兩塊**——它們解釋了「為什麼複合 class（如 .btn-primary）反而是反模式」。

---

# Part 1：核心哲學與 JIT 引擎

> 在動手寫 class 之前，先理解 Tailwind 的設計理念。為什麼是 Utility-First？JIT 怎麼運作？這部分回答「為什麼這樣寫不會比傳統 CSS 慢」。

---

## 1. Utility-First 與原子化思維

### 觀念

❌ 錯誤理解：Tailwind 就是「把 CSS class 縮短成兩三個字母」
✅ 正確理解：Tailwind 是「把樣式拆解成最小單位（原子），由組件把它們組裝起來」

公式：

```text
傳統 CSS：頁面 / 模組 → 一堆語意化 class 名稱 → 對應 CSS 規則
Tailwind：原子 class → 在 JSX 上組裝 → 由組件封裝重複組合
```

### 與 BS5 的最大差異

| 項目 | Bootstrap 5 | TailwindCSS |
| --- | --- | --- |
| 預設樣式 | 提供完整的「組件樣式」（`.btn-primary`） | 不提供組件樣式，只提供原子工具 |
| 客製化 | 改變數 + 寫覆蓋 CSS | 改 `tailwind.config.js` |
| 命名負擔 | 必須想 class 名稱（card-list-item-title） | 幾乎不需要命名 |
| HTML 整潔度 | 短而語意化 | 長但無命名負擔 |
| 體積 | 預設 ~150KB（要刪不用的較麻煩） | 最終產物通常只有 10~30KB |

### 思維轉換

> BS5：「我有一個按鈕，去找一個現成的 class」
> Tailwind：「我有一個按鈕，由 padding、background、rounded 等原子組成」

這個轉換對 React 開發特別自然——既然組件本來就是封裝單位，何必在 CSS 裡再封裝一次？

---

## 2. JIT 引擎：靜態掃描與動態 class 陷阱

### JIT（Just-In-Time）是什麼

Tailwind v3 之後，CSS 不是預先生成「全部可能的 class」，而是**邊掃描你的代碼邊產出對應規則**。

| 階段 | 機制 |
| --- | --- |
| 你寫 `<div class="flex p-4">` | Tailwind 編譯器掃描到 `flex` 與 `p-4` |
| 編譯器查內建規則 | 生成 `.flex { display: flex }` 與 `.p-4 { padding: 1rem }` |
| 沒用到的 class | **完全不會出現在最終 CSS** |

### 工程價值

| 項目 | 傳統 CSS | Tailwind JIT |
| --- | --- | --- |
| 開發 vs 生產體積 | 開發時可能膨脹到數百 KB | 開發與生產幾乎一致（10~30KB） |
| 死碼（Dead Code） | 容易殘留 | 沒用過的 class 絕不會被打包 |
| 自定義樣式 | 改 SCSS 重 build | 改 config 即時生效 |

### ❌ 陷阱：動態字串組裝

```jsx
// ❌ 失敗：Tailwind 不執行 JS，掃描器看不到完整字串
const colorClass = `text-${color}-500`;
return <div className={colorClass}>Hello</div>;
```

JIT 是**靜態掃描器**，它不執行你的 JavaScript。它只看代碼字面上有沒有「完整的 class 字串」。`text-${color}-500` 這種拼接寫法，編譯器看不到 `text-blue-500`，因此**不會生成對應的 CSS**，最後畫面會沒有顏色。

### ✅ 正確做法

```jsx
// 方案 A：完整字串
const colorClass = isError ? 'text-red-500' : 'text-blue-500';

// 方案 B：對照表（Mapping）
const themeMap = {
  primary: 'bg-blue-600',
  danger: 'bg-red-600',
  success: 'bg-green-600',
};
const className = themeMap[type];
```

> 規則：**Tailwind 的 class 必須以完整、不可拆分的字串出現在源碼中**。掃描器看到 `bg-blue-600` 才會生成它。

### JIT 任意值寫法（Arbitrary Values）

如果遇到「設計稿就是要 117px」這種非標準值，可以用方括號語法即時生成：

```jsx
<div className="w-[117px] top-[3.25rem] bg-[#1da1f2]" />
```

| 用途 | 寫法 | 生成的 CSS |
| --- | --- | --- |
| 任意寬度 | `w-[117px]` | `width: 117px` |
| 任意顏色 | `bg-[#1da1f2]` | `background-color: #1da1f2` |
| 任意字級 | `text-[15px]` | `font-size: 15px` |

> 這讓你「享受系統化的便利，又保有應對特殊情況的彈性」。但慎用——大量任意值意味著你脫離了設計系統，要回頭檢討 config。

---

# Part 2：設計系統與規範

> Part 1 講完了 JIT 機制，但 Tailwind 真正的工程價值在於它強制團隊使用同一套「設計規範」。這部分是 BS5 經驗者最容易忽略的——預設值不是隨機數字，而是一套刻意設計的比例尺。

---

## 3. Design Tokens 與 8-Point Grid

### 預設間距比例（Spacing Scale）

Tailwind 預設使用 **4px = 1 單位** 的比例尺，背後是現代 UI 設計的 **8-point Grid 規範**：

| Class | rem | px |
| --- | --- | --- |
| `p-1` | 0.25rem | 4px |
| `p-2` | 0.5rem | 8px |
| `p-4` | 1rem | 16px |
| `p-6` | 1.5rem | 24px |
| `p-10` | 2.5rem | 40px |

### 為什麼 4 的倍數？

❌ 常見誤解：這只是 Tailwind 隨便挑的數字
✅ 正確理解：這是 Material Design、Apple HIG、Bootstrap 等主流設計系統共用的規範

### 工程效益：消除「決策疲勞」

| 傳統開發 | Tailwind |
| --- | --- |
| 「這裡該空 15px 還是 16px？」 | 「該用 p-3 還是 p-4？」 |
| 不同工程師寫出 13、14、15、16、17px 各種值 | 全團隊只能在 0、1、2、3、4、6、8... 之間選 |

> 在 Tailwind 中，**你不再思考像素，而是思考「比例層級」**。設計師與工程師之間有一套共通的數值語言。

---

## 4. tailwind.config.js：擴充設計系統

### theme.extend：增加新的數值

❌ 常見誤解：自定義樣式必須改 CSS
✅ 正確理解：在 config 裡擴充，Tailwind 會幫你自動生成所有相關 class

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1A73E8',
        'erp-danger': '#D32F2F',
      },
      spacing: {
        '13': '3.25rem',  // 52px
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
};
```

### 自動延伸：一個值產出全套 class

當你在 `spacing` 加入 `'13'`，Tailwind 會自動為你生成：

```text
p-13, pt-13, pb-13, pl-13, pr-13, px-13, py-13
m-13, mt-13, mb-13, ml-13, mr-13, mx-13, my-13
w-13, h-13, gap-13, top-13, left-13...
```

> 這就是「Design Token 系統化」的威力——你定義一個比例值，整個工具庫都跟著擴充。

### theme vs theme.extend

| 寫法 | 行為 |
| --- | --- |
| `theme: { spacing: {...} }` | **覆蓋** 預設比例尺（會失去 p-1 ~ p-96） |
| `theme: { extend: { spacing: {...} } }` | **擴充** 預設值（推薦） |

### 與預處理器的對照

| 工具 | 共用樣式值 | 約束範圍 |
| --- | --- | --- |
| SCSS / Less 變數 | `$primary: #1A73E8` | 只能在 SCSS 內共用 |
| CSS Variables | `var(--primary)` | runtime 可變、跨工具共用 |
| Tailwind config | `'brand-primary'` | 同時提供「值」與「比例約束」 |

> Tailwind 的優勢不是「能定義值」，而是**它強制團隊只能從預定義的值中挑選**——這是傳統 CSS 變數做不到的「規範約束」。

### 常見設定項目

```javascript
theme: {
  extend: {
    colors: { /* 品牌色、語意色 */ },
    spacing: { /* 間距 */ },
    fontSize: { /* 字級 */ },
    fontFamily: {
      sans: ['Noto Sans TC', 'sans-serif'],
    },
    boxShadow: { /* 陰影層級 */ },
    screens: {
      'tablet': '768px',
      'desktop': '1280px',
    },
  },
}
```

---

# Part 3：組件化與動態樣式

> Part 2 解決了「規範」問題，但實務上還有兩個痛點：重複組合的樣式怎麼辦？動態切換樣式怎麼寫？這部分介紹三個必備工具：clsx、tailwind-merge、@apply。

---

## 5. 組件化策略：拒絕複合 class

### 新手最常問的問題

> 「難道我每個按鈕都要寫 10 個 class 嗎？」

### React 的答案：組件就是封裝單位

❌ 反模式：在 CSS 裡寫 `.btn-primary { @apply px-4 py-2 bg-blue-500 ...; }`
✅ 推薦：寫一個 `<Button />` 組件，把 class 封裝在組件內

```jsx
function Button({ variant = 'primary', children, ...props }) {
  const variantClass = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    danger: 'bg-red-500 hover:bg-red-600',
  }[variant];

  return (
    <button
      className={`px-4 py-2 rounded text-white transition ${variantClass}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 為什麼這比 BS5 的 `.btn-primary` 好？

| 項目 | BS5 .btn-primary | React `<Button>` |
| --- | --- | --- |
| 樣式來源 | 全域 CSS 檔 | 組件內封裝 |
| 客製化邊界 | 改全域影響所有按鈕 | 改組件只影響這個按鈕 |
| Props 控制 | 加 class 控制（class 巨多） | 用 props（variant / size / disabled） |
| TS 支援 | 無型別檢查 | 完整型別檢查 |
| 跨專案複用 | 整套 BS5 | 單獨複製組件即可 |

### .NET 對照

| 角色 | .NET MVC | React + Tailwind |
| --- | --- | --- |
| 全域樣式庫 | Site.css | tailwind.config.js |
| 共用 UI 元素 | Partial View | React Component |
| 樣式參數化 | ViewBag / Model | Props |

> 這呼應了 [React 進階筆記第 19 章](react-進階學習筆記-notion版.md#19-全域狀態管理架構決策) 的「組件獨立性原則」：通用組件靠 props 傳資料，才能跨專案複用。

---

## 6. clsx：動態 class 的邏輯判斷工具

### 用途

把「條件判斷拼出 class 字串」的工作從 `if/else` 與 `+` 字串拼接中抽出來，讓代碼更清晰。

### 沒有 clsx 的痛點

```jsx
// ❌ 字串拼接很亂
const className =
  'px-4 py-2 rounded' +
  (isError ? ' bg-red-500' : ' bg-blue-500') +
  (isLarge ? ' p-8' : ' p-4') +
  (disabled ? ' opacity-50' : '');
```

### 用 clsx 後

```jsx
import { clsx } from 'clsx';

const className = clsx(
  'px-4 py-2 rounded',
  isError ? 'bg-red-500' : 'bg-blue-500',
  isLarge ? 'p-8' : 'p-4',
  disabled && 'opacity-50',
);
```

### clsx 支援的語法

```jsx
clsx('a', 'b')                    // 'a b'
clsx('a', condition && 'b')       // 'a b'（condition 為真時）
clsx('a', { 'b': true, 'c': false })  // 'a b'
clsx(['a', 'b'])                  // 'a b'
```

### .NET / Razor 對照

| 場景 | Razor | clsx |
| --- | --- | --- |
| 條件 class | `class="@(isError ? "text-danger" : "")"` | `clsx({ 'text-danger': isError })` |
| 多條件組合 | 字串拼接、難讀 | clsx 結構化 |

---

## 7. tailwind-merge：解決 class 衝突

### 問題：CSS 優先權與 class 順序

❌ 常見誤解：HTML 上的 class 順序決定優先權（`class="p-2 p-4"` → 用 p-4）
✅ 正確理解：**CSS 優先權由「規則在 CSS 檔中的定義順序」決定**，不是 HTML 上的順序

```jsx
// 問題範例
<div className="p-2 p-4" />
```

到底是 p-2 還是 p-4 生效？取決於 Tailwind 編譯出來的 CSS 中誰排後面，這是不可預測的。

### tailwind-merge 的解法

它直接幫你**改寫字串**，把衝突的 class 後者覆蓋前者：

```jsx
import { twMerge } from 'tailwind-merge';

twMerge('p-2', 'p-4');                  // 'p-4'
twMerge('px-2 py-1', 'p-4');            // 'p-4'（p-4 涵蓋 px / py）
twMerge('text-red-500', 'text-blue-500'); // 'text-blue-500'
twMerge('bg-red-500 hover:bg-red-700', 'bg-blue-500'); // 'hover:bg-red-700 bg-blue-500'
```

> tailwind-merge 知道「p-4 會涵蓋 px-2 + py-1」這種語意關係，不只是粗暴地比字串。

### 經典使用情境：可覆蓋的組件樣式

```jsx
function Button({ className, ...props }) {
  return (
    <button
      className={twMerge(
        'px-4 py-2 rounded bg-blue-500',  // 內部預設
        className,                          // 外部可覆蓋
      )}
      {...props}
    />
  );
}

// 使用：外部傳入的 px-8 會正確覆蓋內部的 px-4
<Button className="px-8 bg-red-500">特殊按鈕</Button>
```

---

## 8. cn helper：clsx + tailwind-merge 的標準組合

業界標準寫法（你會在 shadcn/ui 等專案看到）：

```typescript
// utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 完整 Button 組件範例

```jsx
import { cn } from '@/utils/cn';

export const Button = ({
  variant = 'primary',
  className,
  ...props
}) => (
  <button
    className={cn(
      // 基礎樣式
      'px-4 py-2 rounded font-medium transition-colors',
      // 變體樣式（用 clsx 邏輯）
      variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
      variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600',
      // 外部覆蓋（用 twMerge 解衝突）
      className,
    )}
    {...props}
  />
);
```

> `cn()` 是現代 React + Tailwind 專案的標配 helper。建議專案開始時就建好這個檔案。

---

## 9. @apply：在 CSS 檔中引用 Tailwind 原子

### 用途

在自訂 CSS 中引用 Tailwind 的 utility，類似 SCSS 的 `@extend`，但更強大。

### 範例

```css
/* global.css */
@layer components {
  .erp-input {
    @apply block w-full rounded-md border-gray-300 shadow-sm
           focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm;
  }
}
```

```jsx
<input className="erp-input" />
```

### 適用時機

✅ **建議使用**：
- 第三方套件樣式覆蓋（DatePicker、富文本編輯器等不能改 JSX 的場合）
- 全域 typography（h1、h2 統一樣式）
- 動態類名（無法在 JSX 編譯期決定的）

❌ **避免使用**：
- 自訂組件樣式（用 React 組件封裝就好）
- 業務元件（讓你回到「命名 + 全域 CSS」的老路）

### 為什麼過度用 @apply 是反模式

| 寫 @apply 等於 | 後果 |
| --- | --- |
| 重新發明 BS5 的命名 CSS | 失去 Tailwind 直觀的優勢 |
| 把樣式關心點散到 CSS 檔 | 看 JSX 時不知道實際樣式長怎樣 |
| 命名爭議捲土重來 | `.erp-input` 還是 `.app-input`？ |

> 90% 的情況，直接寫在 JSX 裡 + 用組件封裝，比 @apply 更乾淨。

---

# Part 4：實戰類別庫導覽

> 前三個 Part 講的是哲學與工具，這部分是**實用對照表**。如果你從 BS5 過來，這章是你的快速查表手冊。

---

## 10. 常用類別總覽（對照 BS5）

### 佈局與 Flexbox

| 功能 | BS5 | Tailwind | 備註 |
| --- | --- | --- | --- |
| Flex 容器 | `d-flex` | `flex` | |
| Flex 方向 | `flex-column` | `flex-col` | |
| 主軸對齊 | `justify-content-center` | `justify-center` | |
| 交叉軸對齊 | `align-items-center` | `items-center` | |
| 子元素間距 | 自己 margin | `gap-4` | **超好用**，不用再 mb-3 |
| 包裹換行 | `flex-wrap` | `flex-wrap` | 同名 |
| 垂直水平置中 | `d-flex justify-content-center align-items-center` | `flex justify-center items-center` | |

### Grid 系統

| 功能 | BS5 | Tailwind |
| --- | --- | --- |
| 12 等分欄 | `col-md-6` | `w-full md:w-1/2` 或 `md:col-span-6` |
| 自訂欄位 | 改變數重編譯 | `grid grid-cols-12 gap-4` |
| 子元素跨欄 | `col-md-6 col-lg-4` | `md:col-span-6 lg:col-span-4` |

### 間距與尺寸

| 功能 | Tailwind | 範例 |
| --- | --- | --- |
| 內距 | `p-`, `px-`, `py-`, `pt-`, `ps-`, `pe-` | `p-4` = 1rem |
| 外距 | `m-`, `mx-`, `my-`, `mt-`... | `mt-2` |
| 邏輯方向（v3+） | `ms-`, `me-` (margin-start / end) | 支援 RTL 語系 |
| 寬度 | `w-full`, `w-screen`, `w-1/2`, `w-[117px]` | full=100%、screen=100vw |
| 高度 | `h-full`, `h-screen`, `h-[400px]` | |
| 最大寬度 | `max-w-7xl`, `max-w-md`, `max-w-prose` | 常用於 Container |

### 顏色與背景

| 功能 | Tailwind | 備註 |
| --- | --- | --- |
| 文字色 | `text-gray-700`, `text-blue-500` | 數字越小越淺（50~950） |
| 背景色 | `bg-blue-50`, `bg-white` | 50 是最淡的 |
| 邊框色 | `border-gray-200` | |
| 透明度 | `bg-blue-500/50` | 50% 透明 |

### 圓角與邊框

| 功能 | Tailwind |
| --- | --- |
| 圓角 | `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` |
| 部分圓角 | `rounded-t-lg`（上方）、`rounded-tl-lg`（左上） |
| 邊框寬度 | `border`, `border-2`, `border-4` |
| 邊框樣式 | `border-solid`, `border-dashed`, `border-dotted` |

### 陰影

| Tailwind | 視覺效果 |
| --- | --- |
| `shadow-sm` | 微陰影（卡片、輸入框） |
| `shadow` | 標準陰影 |
| `shadow-md` | 中等陰影（彈出元件） |
| `shadow-lg` | 較深陰影 |
| `shadow-xl` | 很深陰影 |
| `shadow-2xl` | 最深陰影（Modal） |
| `shadow-inner` | 內陰影（按下效果） |

### 狀態修飾子（Modifiers）

| 修飾子 | 觸發時機 | 範例 |
| --- | --- | --- |
| `hover:` | 滑鼠懸停 | `hover:bg-blue-700` |
| `focus:` | 取得焦點 | `focus:ring-2 focus:ring-blue-500` |
| `active:` | 按下時 | `active:scale-95` |
| `disabled:` | 禁用時 | `disabled:opacity-50` |
| `dark:` | 深色模式 | `dark:bg-gray-900` |
| `group-hover:` | 父層 hover 時 | 配合 `group` class |

### 響應式（Mobile First）

| 斷點 | 觸發寬度 | 範例 |
| --- | --- | --- |
| 預設 | < 640px | `text-sm` |
| `sm:` | ≥ 640px | `sm:text-base` |
| `md:` | ≥ 768px | `md:text-lg` |
| `lg:` | ≥ 1024px | `lg:text-xl` |
| `xl:` | ≥ 1280px | `xl:text-2xl` |
| `2xl:` | ≥ 1536px | `2xl:text-3xl` |

> Mobile First：直接寫不加前綴的 class 是手機樣式，加 `md:` 才是平板以上。
> 範例：`w-full md:w-1/2 lg:w-1/3` = 手機全寬、平板一半、電腦三分之一。

### 動畫過渡

| 功能 | Tailwind |
| --- | --- |
| 過渡屬性 | `transition`, `transition-colors`, `transition-all` |
| 持續時間 | `duration-150`, `duration-300`, `duration-500` |
| 緩動函式 | `ease-in`, `ease-out`, `ease-in-out` |
| 變形 | `scale-95`, `rotate-45`, `translate-x-2` |
| 動畫 | `animate-spin`, `animate-pulse`, `animate-bounce` |

### 群組選取器（group / peer）

當父層 hover 時，子層變色：

```jsx
<div className="group p-4 hover:bg-gray-100">
  <span className="text-gray-500 group-hover:text-blue-500">
    滑過時我會變藍
  </span>
</div>
```

| 修飾子 | 用途 |
| --- | --- |
| `group` + `group-hover:` | 父子聯動 |
| `peer` + `peer-checked:` | 同層元素聯動（如 checkbox + label） |

---

## 11. 官方資源與工具

| 資源 | 網址 | 用途 |
| --- | --- | --- |
| 官方文件 | tailwindcss.com/docs | 完整 class 查詢，按 `Ctrl+K` 搜尋最快 |
| Playground | play.tailwindcss.com | 線上即時練習，右側顯示生成的 CSS |
| VS Code 插件 | Tailwind CSS IntelliSense | 自動補全 + 即時預覽顏色 / 間距 |
| Headless UI | headlessui.com | 官方無樣式組件庫（Modal、Listbox） |

> 強烈推薦裝 **Tailwind CSS IntelliSense**——你打 `flex` 它會跳出對應的 CSS 說明，這是學習最快的方式。

---

# 結語

## 核心心法

### 1. 不要在 CSS 裡封裝，要在組件裡封裝

❌ 寫 `.btn-primary { @apply ...; }` 然後 `<button class="btn-primary">`
✅ 寫 `<Button variant="primary" />`

### 2. JIT 看不到動態字串

`text-${color}-500` 永遠失效。要嘛用完整字串，要嘛建對照表。

### 3. 4 的倍數是團隊的共通語言

不要寫 `p-[15px]`，用 `p-4`（16px）。決策疲勞減少 90%，視覺一致性飆升。

### 4. cn() 是基礎建設

專案開始時就把 `clsx + tailwind-merge` 包成 `cn()` helper，後續每個組件都用得到。

### 5. 安全感來自規範約束

Tailwind 強大不在於「能寫什麼」，而在於「不能寫什麼」——它強制你只用 config 裡定義的值，這就是設計系統的本質。

---

## 延伸學習主題

- **Tailwind UI / shadcn/ui**：基於 Tailwind 的高品質組件庫
- **CSS Container Queries**（Tailwind v3.2+ 已支援）
- **Tailwind 與設計工具整合**：Figma Tokens 同步到 config
- **CSS-in-JS 的取代**：為什麼 Tailwind 在 React 中比 styled-components 更受歡迎

---

## 附錄：Tailwind v4 Plugin 管理與 @tailwindcss/typography

> 以下內容來自 AI Prompt Studio 專案實作，記錄 v4 與 v3 在 plugin 設定上的差異。

### Tailwind v4 的 @plugin 語法

Tailwind v4 **移除了 `tailwind.config.js` 的 `plugins[]` 陣列**，改在 CSS 進入點直接宣告：

```css
/* index.css（v4 寫法）*/
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

v3 的舊寫法（放在這裡只作對照，v4 專案不可用）：
```js
// tailwind.config.js（v3）
module.exports = {
  plugins: [require('@tailwindcss/typography')]
}
```

### @tailwindcss/typography：prose class 是什麼

`@tailwindcss/typography` 這個套件提供 `prose` 系列 class，專門用來讓**後端吐出的或使用者撰寫的長文 HTML** 有漂亮的排版。

沒有 prose 的問題：Tailwind 的 Preflight（CSS Reset）把所有 `<h1>`、`<p>`、`<ul>` 的預設樣式清空，這讓元件自己排版很方便，但對於 Markdown 渲染後的 HTML 就會一片平整、沒有視覺層次。

```tsx
// 有 prose：<h1> 大字、<p> 間距、<strong> 粗體、<code> 底色
<div className="prose prose-sm dark:prose-invert max-w-none">
  <ReactMarkdown>{content}</ReactMarkdown>
</div>

// 沒有 prose：所有標籤被 Preflight 重設，看起來像純文字
<div>
  <ReactMarkdown>{content}</ReactMarkdown>
</div>
```

### 常用 prose 修飾符

| Class | 效果 |
|---|---|
| `prose` | 基礎排版（行高、間距、字體）|
| `prose-sm` | 縮小版，適合 chat bubble、側欄 |
| `prose-lg` | 放大版，適合文章主體 |
| `dark:prose-invert` | dark mode 下文字自動反轉為淺色 |
| `max-w-none` | 移除 prose 預設的最大寬度限制 |
| `prose-p:my-1` | 覆寫段落上下間距 |
| `prose-code:before:content-none` | 移除行內 code 前後的引號裝飾 |
| `prose-pre:bg-slate-100` | 覆寫程式碼區塊背景色 |

### 與 rehype-highlight 搭配的完整 Markdown 渲染設定

Markdown 渲染需要四個工具各司其職（詳見 React 進階學習筆記第 31 章）：

```
react-markdown      → Markdown 字串 → React 元素（結構）
rehype-highlight    → 程式碼 block 加上 hljs-* CSS class（語法標記）
highlight.js CSS    → hljs class 的顏色規則（程式碼顏色）
prose class         → 整體排版（字體、間距、層次）
```

```tsx
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

<div className="prose prose-sm dark:prose-invert max-w-none
  prose-code:before:content-none prose-code:after:content-none">
  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{markdownContent}</ReactMarkdown>
</div>
```

dark mode 的 `hljs` 顏色需另外在 CSS 覆寫（因為 github.css 是淺色主題）：

```css
/* index.css */
html.dark .hljs {
  background: #27272a;  /* zinc-800 */
  color: #e4e4e7;       /* zinc-200 */
}
```

---

> 本文件搭配 [React 進階學習筆記](react-進階學習筆記-notion版.md) 第 22 章（Field 組件封裝）與第 29 章（MVC 中的 View 層）一起閱讀，能完整建立「React + Tailwind 工程化」的思維。
