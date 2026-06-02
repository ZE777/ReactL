# Vite 工程化與 ESLint + Prettier + Husky 學習筆記

> 對應進度表：第六階段「工程化工具（Vite / ESLint）」
> 對象：有 .NET 背景，已熟悉 Next.js，現在要掌握 Vite 專案的工程化設定。
> 預估時間：~3h

---

## Part 1：Vite 工程化設定（Stage 6，Item 1）

### 1. 環境變數完整體系

#### .env 檔案的優先順序

```
.env                  ← 所有環境共用（最低優先）
.env.local            ← 本機覆寫，不 commit（加進 .gitignore）
.env.development      ← 只有 npm run dev 時載入
.env.production       ← 只有 npm run build 時載入
.env.development.local ← 本機開發覆寫（最高優先）
```

後者蓋前者，`.local` 系列永遠最優先。

#### VITE_ 前綴是安全閘門

Vite 的環境變數預設**不進 bundle**，只有加了 `VITE_` 前綴的才會被打包進前端程式碼。

```bash
# .env.local
VITE_API_URL=http://localhost:5000       # ✅ 前端能讀
VITE_CLAUDE_KEY=sk-...                   # ⚠️ 進 bundle，使用者能看到，不應放 secret

DB_PASSWORD=super_secret                 # ✅ 不進 bundle，前端讀不到（Vite 純 CSR 專案沒有 server，此變數無意義）
```

> **對比 Next.js**：`NEXT_PUBLIC_` 前綴進 bundle，沒有前綴的只在 Server Component / API Route 讀得到。Vite 純 CSR 沒有 server，所以非 `VITE_` 的變數根本就沒有用途。

#### 在程式碼中讀取

```typescript
// ✅ 正確：import.meta.env（Vite 的方式）
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ 錯誤：process.env（Node.js 的方式，Vite 不支援）
const apiUrl = process.env.VITE_API_URL;
```

#### TypeScript 型別補全

Vite 不自動為自訂環境變數提供型別，需要手動宣告：

```typescript
// src/vite-env.d.ts（通常已存在，補充自訂變數）
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

加了型別宣告後，`import.meta.env.VITE_API_URL` 就有 IDE 自動補全。

---

### 2. vite.config.ts 核心設定

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(), // 支援 JSX + HMR
  ],

  resolve: {
    alias: {
      // @ 對應到 src/ 目錄
      // 讓 import { api } from '@/lib/api' 不用寫相對路徑
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3001,
    // 代理 API 請求，繞過瀏覽器的 CORS 限制
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // .NET API
        changeOrigin: true,
        // 如果 .NET API 路徑不含 /api 前綴：
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        // 手動分 chunk，避免 vendor bundle 太大
        manualChunks: {
          vendor: ['react', 'react-dom'],          // React 核心
          router: ['react-router-dom'],             // 路由
          query: ['@tanstack/react-query'],         // React Query
          ui: ['@radix-ui/react-dialog', 'clsx'],  // UI 相關
        },
      },
    },
    // 單一 chunk 超過此大小（KB）會出現警告
    chunkSizeWarningLimit: 500,
  },
});
```

#### alias 的對應設定（TypeScript 要額外設定）

Vite 設定 alias 只讓 bundler 認識，TypeScript compiler 還不知道。要同步設定 `tsconfig.json`：

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]   // ← 與 vite.config.ts 的 alias 對應
    }
  }
}
```

| 設定位置 | 誰看得到 |
|---------|---------|
| `vite.config.ts` alias | Vite bundler（runtime） |
| `tsconfig.json` paths | TypeScript compiler（型別檢查、IDE 補全） |
| 兩者都要設 | 才能同時有 bundler 解析 + IDE 提示 |

#### .NET 對照

| Vite 設定 | .NET 對應 |
|---------|----------|
| `.env.local` | `appsettings.Development.json`（本機覆寫，不 commit） |
| `VITE_API_URL` | `appsettings.json` 的 `ConnectionStrings:ApiUrl` |
| `proxy` | IIS 反向代理 / YARP |
| `manualChunks` | Assembly 分拆 / NuGet 套件分離 |

---

### 3. Build 優化重點

```typescript
// 查看 build 產物分析（用 rollup-plugin-visualizer）
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ open: true }), // build 後自動開啟視覺化圖表
]
```

常見問題與解法：

| 問題 | 症狀 | 解法 |
|------|------|------|
| vendor bundle 太大 | 首次載入慢 | `manualChunks` 拆分 |
| 動態 import 沒生效 | 所有 code 在同一個 chunk | 用 `React.lazy()` + `import()` |
| 圖片沒壓縮 | 圖檔太大 | `vite-plugin-imagemin` |
| 沒有 source map | 生產環境難 debug | `build.sourcemap: true` |

---

## Part 2：ESLint + Prettier + Husky 全套設定（Stage 6，Item 2）

### 1. 三者的職責分工

| 工具 | 職責 | .NET 對照 |
|------|------|----------|
| **ESLint** | 找出程式碼問題（錯誤、反模式） | StyleCop / Roslyn Analyzer |
| **Prettier** | 強制統一格式（縮排、引號、分號） | VS 的 Format Document（Ctrl+K, D） |
| **Husky** | 在 git commit 時自動執行上面兩個 | Pre-commit build check |
| **lint-staged** | 只對 staged 的檔案執行，不掃整個 repo | （無對應，效能優化） |

這四個組合起來的效果：**每次 commit 前，自動把你改過的檔案修好再存入 git**。

---

### 2. ESLint v9（Flat Config）

ESLint v9 把設定從 `.eslintrc.js` 改成 `eslint.config.js`（Flat Config 格式）。

```bash
npm install -D eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint
```

```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 確保只 export components（Vite HMR 需要）
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // 不強制使用型別 import（依喜好調整）
      '@typescript-eslint/consistent-type-imports': 'warn',
      // 不允許 any（學習期間可先設 warn，日後改 error）
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

常用 rule 說明：

| Rule | 作用 |
|------|------|
| `react-hooks/rules-of-hooks` | Hook 只能在頂層呼叫 |
| `react-hooks/exhaustive-deps` | useEffect deps 不能遺漏 |
| `@typescript-eslint/no-explicit-any` | 禁止 `any` |
| `@typescript-eslint/no-unused-vars` | 禁止宣告但未使用的變數 |

---

### 3. Prettier

```bash
npm install -D prettier eslint-config-prettier
```

`eslint-config-prettier` 的作用：**關掉 ESLint 中會與 Prettier 衝突的格式規則**，讓兩者共存不打架。

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

在 `eslint.config.js` 加入 prettier 配置（放最後，覆蓋衝突規則）：

```javascript
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // ... 其他設定
  prettierConfig,  // ← 放最後
);
```

---

### 4. Husky + lint-staged

```bash
# 安裝
npm install -D husky lint-staged

# 初始化 Husky（在 .husky/ 建立 hooks）
npx husky init
```

`npx husky init` 會：
1. 建立 `.husky/` 資料夾
2. 建立 `.husky/pre-commit`（預設內容是 `npm test`）
3. 在 `package.json` 加入 `"prepare": "husky"` script

修改 `.husky/pre-commit`：

```bash
# .husky/pre-commit
npx lint-staged
```

在 `package.json` 加入 lint-staged 設定：

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

#### 完整的 package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "prepare": "husky"
  }
}
```

---

### 5. 執行流程圖解

```
git commit -m "feat: add persona form"
      │
      └─ Husky pre-commit hook 觸發
            │
            └─ lint-staged 執行
                  │
                  ├─ 找出本次 staged 的 .ts/.tsx 檔案
                  │
                  ├─ eslint --fix（自動修可修的問題）
                  │     ├─ 有修復 → 繼續
                  │     └─ 有無法修的 error → commit 中斷，顯示錯誤
                  │
                  ├─ prettier --write（統一格式）
                  │
                  └─ 修改後的檔案自動 re-stage
                        │
                        └─ commit 成功建立
```

#### 跳過 hook（緊急情況）

```bash
git commit --no-verify -m "hotfix: urgent fix"
```

> 應只在緊急修 production bug 且確認程式碼沒問題時使用。

---

### 6. VS Code 整合（編輯時即時顯示問題）

安裝 Extensions：
- `ESLint`（dbaeumer.vscode-eslint）
- `Prettier - Code formatter`（esbenp.prettier-vscode）

`.vscode/settings.json`：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

設定後存檔時自動 Prettier 格式化 + ESLint 自動修復，與 Husky 的 pre-commit check 形成兩層保護。

---

## 設定順序 Cheatsheet（新專案）

```bash
# 1. 建立 Vite + React + TypeScript 專案
npm create vite@latest my-app -- --template react-ts

# 2. 安裝 ESLint + Prettier + Husky
npm install -D eslint @eslint/js typescript-eslint globals \
  eslint-plugin-react-hooks eslint-plugin-react-refresh \
  prettier eslint-config-prettier \
  husky lint-staged

# 3. 初始化 Husky
npx husky init

# 4. 手動建立設定檔
# - eslint.config.js（見 Part 2-2）
# - .prettierrc（見 Part 2-3）
# - 修改 .husky/pre-commit（見 Part 2-4）
# - 在 package.json 加 lint-staged（見 Part 2-4）

# 5. 設定 vite.config.ts
# - alias @/ → src/
# - proxy /api → localhost:5000
# - 同步設定 tsconfig.json paths

# 6. 測試
echo "test" > test.ts && git add test.ts && git commit -m "test hook"
# 應該看到 lint-staged 執行
git reset HEAD~1  # 還原測試 commit
rm test.ts
```
