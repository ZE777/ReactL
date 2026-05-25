# Vitest 自動化測試學習筆記

> 整理自學習對話：從「手動點測」進化到「自動化品質保證體系」的工程思維
> 適合對象：有 .NET 單元測試經驗（NUnit / xUnit），正在 React / Next.js 專案中導入測試的開發者
> 前置知識：React 組件、Custom Hook、CI/CD 概念（可搭配 [React 進階學習筆記](react-進階學習筆記-notion版.md) Part 9）

---

## 學習路徑建議

本文件分為 **4 個 Part、8 個章節**：

- **只有 30 分鐘**：Part 1（測試金字塔）+ 第 3 章（Vitest 入門）→ 看懂為什麼要寫測試
- **只有 1 小時**：Part 1、2 → 寫得出第一個單元測試
- **完整路徑**：Part 1 → 4，外加結語的「核心心法」

---

# Part 1：自動化測試的工程價值

> 在動手寫測試之前，先理解「為什麼要寫」。對於從手動點測過來的開發者，這部分是觀念基礎。

---

## 1. 測試金字塔：Vitest vs Playwright vs 其他

### 為什麼需要分層

❌ 錯誤理解：寫一種測試（例如 E2E）就能涵蓋所有情況
✅ 正確理解：不同層級的測試解決不同的問題，要組合使用

### 三層測試結構

```text
       ╱╲
      ╱E2╲      Playwright（端對端，慢、貴、覆蓋窄）
     ╱─────╲
    ╱整合測試╲   React Testing Library（中速、組件互動）
   ╱─────────╲
  ╱ 單元測試  ╲ Vitest（快、便宜、覆蓋廣）
 ──────────────
```

| 層級 | 工具 | 速度 | 涵蓋 | 維護成本 |
| --- | --- | --- | --- | --- |
| 單元測試 | Vitest / Jest | 毫秒級 | 函式、Hook、純邏輯 | 低 |
| 整合測試 | Vitest + RTL | 數十毫秒 | 組件互動、表單流程 | 中 |
| 端對端測試 | Playwright / Cypress | 秒級 | 完整使用者流程 | 高 |

### 比例建議

> **70% 單元 + 20% 整合 + 10% E2E**

E2E 看似最貼近真實使用，但它最慢、最脆弱（小改動就壞）、最難 debug。

### .NET 對照

| 角色 | .NET | 前端 |
| --- | --- | --- |
| 單元測試 | xUnit / NUnit | Vitest / Jest |
| Mock | Moq | vi.mock() |
| 端對端 | Selenium | Playwright |
| CI 跑測試 | dotnet test | npm test / pnpm test |

---

## 2. 為什麼大型專案必備

### ERP / CRM 的痛點

> 「改了 A 欄位的計算，結果 B 報表壞了」

### 沒有自動化測試的後果

| 階段 | 問題 |
| --- | --- |
| 改動代碼後 | 不知道影響範圍，靠記憶 |
| 提交 PR 時 | reviewer 也不知道有沒有破壞舊功能 |
| 每次發版前 | 手動點測幾百個功能（人力黑洞） |
| 線上出 Bug | 不知道是新版本造成，還是早就壞了 |

### 自動化測試的回饋

| 階段 | 自動化提供 |
| --- | --- |
| 改動代碼後 | 即時跑相關測試，秒回饋 |
| 提交 PR | CI 自動驗證所有測試 |
| 每次發版 | 跑完整測試套件，10 秒內知道是否安全 |
| 線上出 Bug | 補一條測試，永久防止再發生 |

### 必備的標準

- **小型專案 / 外包**：通常不是必備（手動點最快）
- **大型 ERP / CRM**：**必備**，否則會被自己的代碼淹沒

---

# Part 2：Vitest 入門與實戰

> 理解了為什麼要測，這部分學怎麼寫。Vitest 是現代 React 專案的首選，與 Vite 完美整合。

---

## 3. Vitest 基礎用法

### 為什麼選 Vitest（vs Jest）

| 項目 | Jest | Vitest |
| --- | --- | --- |
| 設定 | 需要 babel / ts-jest 配置 | 直接用 Vite 設定 |
| 啟動速度 | 較慢 | 極快（共用 Vite 的轉譯） |
| ESM 支援 | 較差 | 原生支援 |
| API | 業界熟悉 | 與 Jest 95% 相容 |

### 安裝

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 設定（vite.config.ts）

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

### 第一個單元測試

```typescript
// utils/format.ts
export function formatCurrency(amount: number) {
  return `$${Math.round(amount).toLocaleString()}`;
}

// utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('應正確格式化整數', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
  });

  it('應四捨五入小數', () => {
    expect(formatCurrency(100.5)).toBe('$101');
  });

  it('應處理零', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});
```

### 執行測試

```bash
pnpm vitest          # watch 模式
pnpm vitest run      # 單次執行
pnpm vitest --ui     # 開啟 UI 介面
pnpm vitest --coverage  # 含覆蓋率報告
```

---

## 4. Vitest 能測什麼？

### 三種主要應用

#### A. 純函式邏輯

最簡單也最有價值。給輸入，看輸出。

```typescript
// 測試貨幣格式化、權限判斷、日期計算、字串 parse
expect(formatCurrency(100.5)).toBe('$101');
expect(canEditOrder(user, order)).toBe(true);
expect(parseAddress('台北市信義區市府路 1 號')).toEqual({...});
```

#### B. Custom Hook 測試

用 `@testing-library/react` 的 `renderHook`：

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('初始值應為 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('呼叫 increment 後應變為 1', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

#### C. 組件快照測試（Snapshot Testing）

把組件渲染結果存成字串檔，下次跑測試比對是否變動：

```typescript
import { render } from '@testing-library/react';

it('Button 結構不應意外變動', () => {
  const { container } = render(<Button>Click</Button>);
  expect(container).toMatchSnapshot();
});
```

✅ 優點：偵測「不小心動到 UI 結構」
❌ 缺點：UI 經常調整時，每次都要更新 snapshot，容易麻木

> 快照測試適合**穩定的基礎組件**，不適合常改的業務頁面。

### 是必備嗎？

| 專案規模 | 必要性 |
| --- | --- |
| 小型外包 / 一次性網站 | 通常不是必備 |
| 中大型業務系統（ERP / CRM） | **必備** |
| 共用組件庫 / 開源專案 | **必備**（API 穩定性的承諾） |

---

## 5. 常用斷言與 Mock

### 常用斷言

```typescript
// 基本相等
expect(value).toBe(1);                    // ===
expect(obj).toEqual({ a: 1 });            // 深度相等
expect(value).toBeTruthy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// 數字
expect(value).toBeGreaterThan(0);
expect(value).toBeCloseTo(0.3);           // 浮點數比較

// 字串
expect(str).toContain('hello');
expect(str).toMatch(/regex/);

// 陣列
expect(arr).toHaveLength(3);
expect(arr).toContain('item');

// 函式拋錯
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('特定訊息');

// 非同步
await expect(fetchData()).resolves.toEqual({...});
await expect(fetchData()).rejects.toThrow();
```

### Mock 函式

```typescript
import { vi } from 'vitest';

// 監聽函式呼叫
const mockFn = vi.fn();
mockFn('hello');
expect(mockFn).toHaveBeenCalledWith('hello');
expect(mockFn).toHaveBeenCalledTimes(1);

// Mock 模組
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
}));
```

### Mock 計時器

```typescript
import { vi } from 'vitest';

it('防抖應在 500ms 後執行', () => {
  vi.useFakeTimers();
  const callback = vi.fn();

  const debounced = debounce(callback, 500);
  debounced();

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalled();

  vi.useRealTimers();
});
```

---

# Part 3：Playwright 與 E2E 測試

> Vitest 守邏輯，Playwright 守流程。這部分介紹端對端測試的核心觀念與實戰。

---

## 6. Playwright 基礎

### 用途

Playwright 啟動真實瀏覽器（Chromium / Firefox / WebKit），模擬真人操作。

### 適合的測試對象：Happy Path

> 「使用者能否完成關鍵流程？」

範例：

- 登入流程：開啟登入頁 → 輸入帳密 → 點登入 → 確認進入儀表板
- 結帳流程：選商品 → 加購物車 → 填地址 → 付款 → 看到訂單成功
- 後台 CRUD：建立資料 → 列表看到 → 編輯 → 確認變更 → 刪除

### 安裝與執行

```bash
pnpm create playwright
pnpm playwright test                    # 執行所有測試
pnpm playwright test --ui               # 互動 UI
pnpm playwright test --debug            # debug 模式（會開啟瀏覽器）
pnpm playwright codegen localhost:3000  # 錄製操作生成測試代碼
```

### 第一個 E2E 測試

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test('使用者可以登入並進入儀表板', async ({ page }) => {
  // 1. 開啟登入頁
  await page.goto('/login');

  // 2. 輸入帳密
  await page.getByLabel('帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('password');

  // 3. 點擊登入
  await page.getByRole('button', { name: '登入' }).click();

  // 4. 確認跳轉並看到儀表板
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: '歡迎' })).toBeVisible();
});
```

### Locator 策略（從穩定到脆弱）

| 策略 | 範例 | 穩定性 |
| --- | --- | --- |
| `getByRole` | `getByRole('button', { name: '登入' })` | ⭐⭐⭐⭐⭐（無障礙語意） |
| `getByLabel` | `getByLabel('帳號')` | ⭐⭐⭐⭐⭐（表單） |
| `getByTestId` | `getByTestId('submit-btn')` | ⭐⭐⭐⭐（明確標記） |
| `getByText` | `getByText('登入')` | ⭐⭐⭐（可能改文案） |
| CSS 選擇器 | `page.locator('.btn-primary')` | ⭐（重構容易壞） |

> 優先用語意化 selector，避免 CSS class 或 XPath。

### Vitest vs Playwright 抉擇

| 你的測試需求 | 用什麼 |
| --- | --- |
| 純邏輯（formatter、validator） | Vitest |
| Custom Hook 行為 | Vitest + RTL |
| 單一組件互動（按鈕點擊改 state） | Vitest + RTL |
| 表單填寫 → API 呼叫 → UI 更新 | Vitest + RTL（mock API） |
| 真實登入 → 跨頁操作 → 登出 | Playwright |
| 視覺迴歸（畫面長相是否變動） | Playwright（screenshot） |

---

# Part 4：CI/CD 整合與部署機制

> 寫了測試，怎麼確保它們真的跑？這部分解答兩個常見疑惑：build 時測試會被打包進去嗎？Git PR 上的「小幫手」是什麼？

---

## 7. Build 時的物理隔離：測試代碼絕對不會出貨

### 機制

❌ 常見擔心：測試代碼會被打包進產品，影響效能或洩漏實作細節
✅ 正解：透過 **Tree Shaking + 命名慣例 + devDependencies**，測試代碼物理上不會出現在最終產物中

### 三道防線

| 防線 | 作用 |
| --- | --- |
| 命名慣例（`*.test.ts` / `*.spec.ts`） | 測試工具的識別前綴，產品代碼絕不 import |
| `devDependencies` | Vitest、RTL 等只裝在開發依賴 |
| Tree Shaking | 打包工具從 `main.tsx` 開始掃描，沒被 import 的模組通通砍掉 |

### 與你的 IIS + PM2 部署場景

```text
1. 開發階段        → pnpm vitest（在 Node 環境跑測試）
2. CI 階段         → pnpm vitest run + pnpm build
3. 部署階段        → 把 dist / .next 推到伺服器
4. PM2 啟動         → 只執行 production bundle
5. IIS 反向代理     → 把 / 轉到 PM2 的 port
```

> Vitest 在第 1、2 階段是「考官」，到第 3 階段就被解雇了。它從未進入最終產物。

### 與 .NET 對照

| 場景 | .NET | 前端 |
| --- | --- | --- |
| 測試專案 | 獨立的 `.Tests` 專案 | 同 repo 但 `*.test.ts` 命名 |
| 部署排除 | `csproj` 設定 / `dotnet publish` 不含測試專案 | Tree Shaking + devDependencies |
| 測試執行環境 | dotnet test runner | Node + jsdom |

---

## 8. CI/CD 整合：Git PR 的「小幫手」是什麼

### Git PR 上的綠色勾勾從哪來

❌ 常見誤解：GitHub 自己有測試能力
✅ 正解：是 **GitHub Actions / GitLab CI** 在遠端執行 Vitest，把結果回報給 PR 頁面

### 完整流程

```text
1. 你 git push 觸發 PR
2. CI 平台啟動一台虛擬機
3. 虛擬機 git clone 你的 repo
4. 執行 pnpm install
5. 執行 pnpm vitest run
6. 執行 pnpm playwright test
7. 把結果（pass/fail）回報到 PR 頁面
8. 全綠才允許 merge
```

### GitHub Actions 範例

```yaml
# .github/workflows/test.yml
name: Test
on:
  pull_request:
    branches: [master, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install
      - run: pnpm vitest run
      - run: pnpm playwright test
```

### 兩者是合作而非取代

❌ 誤解：CI 可以取代 Vitest，所以不用寫測試
✅ 正解：

> **Vitest 是考卷，CI 是監考老師。沒考卷，監考老師沒得改。**

| 角色 | 職責 |
| --- | --- |
| Vitest / Playwright | 提供測試案例（考卷） |
| GitHub Actions | 啟動環境、執行測試（監考） |
| GitHub PR 頁面 | 顯示結果（公告欄） |

### Pre-commit Hook（更前置的防線）

用 [Husky](https://typicode.github.io/husky/) + lint-staged 在 commit 前自動跑相關測試：

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

> 提交前在本地就攔下錯誤，不用等 CI 才發現。

---

## 9. 開發模式 vs 生產模式：React 的人格分裂

### 環境變數的分水嶺

| 變數值 | 觸發 | 行為 |
| --- | --- | --- |
| `NODE_ENV=development` | `npm run dev` | 完整警告、DevTools 對接、變數名保留 |
| `NODE_ENV=production` | `npm run build` | 警告砍掉、DevTools 限制、變數名混淆 |

### React 的條件編譯

React 源碼充滿類似這樣的判斷：

```javascript
if (process.env.NODE_ENV !== 'production') {
  // 啟動 DevTools 對接
  // 顯示 propTypes 警告
  // 監控組件渲染效能
} else {
  // 關閉 DevTools 接口
  // 刪除所有警告字串
  // 啟動效能優化路徑
}
```

打包時，`process.env.NODE_ENV` 被替換成字串常數（如 `"production"`），編譯器把整個用不到的 if 區塊視為 Dead Code 移除。

### 物理差異對照

| 項目 | Development | Production |
| --- | --- | --- |
| 變數名 | `fetchCustomerData` | `a`（混淆 / Uglification） |
| 註解與空白 | 保留 | 全部移除（Minification） |
| 警告訊息 | 完整 | 從打包檔砍掉 |
| Console.log | 保留 | 通常移除 |
| 測試代碼 | 不影響執行 | 完全不會被打包 |
| DevTools | 完整可用 | 變數名混淆、Profiler 停用 |
| Source Map | 完整 | 通常關閉或單獨上傳到 Sentry |

### 為什麼 production 安全性夠了

> 真正的安全應該依賴**後端 API 權限驗證**，不是依賴「前端代碼藏起來」。

只要後端：
1. 每個 API 都檢查 Token
2. 不該回傳的敏感欄位永遠不回傳
3. 權限不足的請求一律 403

那即使前端代碼能被看穿，也不會洩漏資料。

---

# 結語

## 核心心法

### 1. 測試是合約，不是奢侈品

寫測試不是「有空才做的事」，而是**對未來的自己許下的承諾**：「這個函式按這樣的規則運作」。半年後忘光了，測試還記得。

### 2. 70/20/10 比例

70% 單元（快、穩）、20% 整合（覆蓋互動）、10% E2E（守關鍵流程）。E2E 看似最逼真，但最脆弱、最慢、最難維護。

### 3. Vitest 是考卷，CI 是監考老師

兩者缺一不可。沒測試就沒得驗證，沒 CI 就只能靠自律。把驗證權交給機器。

### 4. 測試代碼不會出貨

放心寫，devDependencies + Tree Shaking 會幫你把測試從生產 bundle 中物理移除。

### 5. 安全防線在後端

前端 production 模式的混淆只是「降低偷窺成本」，真正的資安在於後端 Token 驗證與資料過濾。前端代碼能被看到是常態。

---

## 知識體系總覽

```text
自動化測試
├── Part 1：工程價值
│   ├── 測試金字塔（單元 / 整合 / E2E）
│   └── 大型專案的必要性
├── Part 2：Vitest 入門
│   ├── 基礎用法與設定
│   ├── 三種應用（純函式 / Hook / 快照）
│   └── 斷言與 Mock
├── Part 3：Playwright 與 E2E
│   └── Happy Path 守護
└── Part 4：CI/CD 整合
    ├── Build 時的物理隔離
    ├── GitHub Actions 工作流程
    └── 開發 vs 生產模式
```

---

## 延伸學習主題

- **React Testing Library 進階**：useFormState、suspense 邊界測試
- **MSW（Mock Service Worker）**：在測試與開發中 mock API 請求
- **覆蓋率工具**：c8 / istanbul，理解 branch / line / function coverage
- **視覺迴歸測試**：Playwright + Chromatic / Percy
- **效能測試**：Lighthouse CI、Web Vitals
- **契約測試（Contract Testing）**：Pact，前後端 API 合約驗證

---

> 本文件搭配 [React 進階學習筆記](react-進階學習筆記-notion版.md) Part 9（品質保證與部署）一起閱讀，能完整建立「從寫得出功能」到「寫得出可上線系統」的工程化思維。
