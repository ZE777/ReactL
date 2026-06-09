# ReactL

前端轉職學習空間：React + TypeScript + Tailwind + Vitest 系統化筆記、Skills、Workflows 與 Project C「AI Prompt Studio」規劃文件。

## 目錄結構

```
ReactL/
├── prompt-studio-admin/   # 後台管理介面（Vite + React + Zustand + React Query）
├── prompt-studio-web/     # 前台展示網站（Next.js 16 App Router + Tailwind）
├── docs/                  # 學習筆記、進度追蹤、規劃文件
│   ├── 學習追蹤/           # React 學習進度表（163 項 / 137h）
│   ├── 學習筆記/           # React 鳥瞰、Hook 深度、Tailwind、Vitest 等
│   ├── 前端實作準則/        # 9 份架構守則
│   ├── 前端UIUX設計/        # 無障礙等設計文件
│   ├── 需求規劃/           # Project C AI Prompt Studio 規劃
│   ├── 部署指南/           # Bot 串接、環境設定等操作文件
│   └── 前端實作細節.md      # 前台 + 後台完整實作層細節（routing / 資料層 / 狀態 / 設計系統）
├── skills/                # 9 個前端實作 Skills（表單、API、路由、樣式…）
├── workflows/             # FSD 模組建立、CI/CD、測試自動化等工作流
├── rules/                 # 編碼規範
└── .claude/agents/        # Claude Code agent 定義（lead-reviewer、security-reviewer 等）
```

## 學習進度

詳見 [`docs/學習追蹤/React_學習進度表.md`](docs/學習追蹤/React_學習進度表.md)。

| 階段 | 主題 | 時數 |
|------|------|------|
| 1–2 | React 鳥瞰 + Hook 深度 | 30h |
| 3–6 | Zustand / React Query / 路由（含 RSC）/ Vite | 28h |
| 7–8 | 9 個 Skills 實作 + 9 份前端守則 | 27h |
| 9–10 | TypeScript + TailwindCSS | 36h |
| 11–12 | Vitest 測試 + 架構概念 | 16h |
| **合計** | **163 項** | **137h** |

## Project C：AI Prompt Studio

全端作品集專案 — 詳見 [`docs/需求規劃/AIPromptStudio規劃.md`](docs/需求規劃/AIPromptStudio規劃.md)。

整體技術棧：
- **前台**：Next.js 16 App Router + RSC + Tailwind + Framer Motion
- **後台**：Vite + React Router + Zustand + React Query（語意化 Design Token + 自建 UI 元件庫，含 Dark Mode）
- **後端**：ASP.NET Core 8 + EF Core 8（Code-First；schema 以 SqlScripts 版本化腳本管理）+ JWT
- **資料庫**：MS SQL Server
- **AI**：OpenAI 相容多 Provider（Groq / Mistral / Cerebras / SambaNova）+ SSE 串流；支援使用者自帶金鑰（BYOK）
- **Discord AI 管理**：`/chat` 自然語言 → AI function calling → 後端執行 Discord 伺服器管理（23 個工具：禁言 / 踢人 / 封鎖 / 移動語音 / 身分組 / 批次刪訊息 / 查詢…）；中高風險動作有**二次確認按鈕**，並具下指令者權限檢查、Bot 階級防護、特權身分組防護與白名單制
- **外部 Bot**：LINE Messaging API + Discord Interactions（Webhook）；Bot 憑證 AES 加密儲存、建立時自動驗證並標示有效性
- **部署**：IIS（API + 後台靜態）+ PM2（前台 Next.js）

### 技術應用概要

> 技術選型 → **實際應用於本專案的什麼地方**。實作層細節見 [`docs/前端實作細節.md`](docs/前端實作細節.md)；後端見 [`ReactL.api`](https://github.com/ZE777/ReactL.api) repo 的 README 與 `workflows/`。

#### 前台 `prompt-studio-web`（公開展示 + 訪客聊天）

| 技術 | 在本專案的應用 |
|------|---------------|
| **Next.js 16（App Router）** | Landing / About / Share 走 Server Component（SSR + 動態 metadata）；聊天頁 `page.tsx` 以 `<Suspense>` 包 Client 的 `ChatClient`，子路徑 `/app`（`basePath`）、`output: standalone` 供 PM2 |
| **React 19** | 聊天 UI 狀態以 hooks 就地管理（無全域狀態庫）|
| **TypeScript 5** | `src/types` 定義 `Message` / `Persona` / `SharedConversation` 等 API 合約 |
| **Tailwind CSS 4** | `@import "tailwindcss"` 單一入口、`@theme` 變數、class-based 深色模式 + `ThemeScript` 防閃白 |
| **Framer Motion** | Landing 各 section 的捲動觸發淡入 / stagger 動畫 |
| **fetch + ReadableStream** | `lib/api.ts` 包裝 fetch（10s timeout）；聊天以手動 SSE 解析串流 AI 回應，`AbortController` 支援「停止」|
| **react-markdown + remark/rehype + KaTeX + Mermaid + highlight.js** | 聊天訊息渲染：GFM 表格、數學、Emoji、程式碼高亮、Mermaid 圖、裸 URL 轉影音嵌入；`rehype-sanitize` 白名單沙箱防 XSS |

#### 後台 `prompt-studio-admin`（管理介面）

| 技術 | 在本專案的應用 |
|------|---------------|
| **Vite 8 + React 19** | SPA 後台，子路徑 `/admin/`（`base`），`@tailwindcss/vite` 整合 |
| **react-router-dom 7** | `createBrowserRouter` 路由樹；`PrivateRoute` token 守衛、`AdminLayout` 強制改密與「最小金鑰閘門」|
| **axios** | `lib/api.ts` 實例 + 攔截器：注入 Bearer token、401 發 `auth:logout`、403/429/5xx 全域 Toast |
| **@tanstack/react-query 5** | 對話 / 角色 / Prompt / 金鑰等伺服器狀態快取與去重（`retry:false`、`enabled` 條件查詢、mutation 失效）|
| **Zustand 5** | `conversationStore` 持久化對話清單與 `activeId` 至 localStorage |
| **react-hook-form 7** | 登入 / 角色 / Bot 等表單；`noSpace` 去空白工具、root vs 欄位錯誤分流 |
| **Design Token + 自建 UI 元件庫** | `tokens/colors.ts` 語意色 + `components/ui` 20+ 元件（Button / Modal / Badge / DropdownSelect…），含深色模式 |
| **react-markdown 同套堆疊** | 聊天測試與監控頁的訊息渲染，與前台一致 |

## 部署指南

| 文件 | 說明 |
|------|------|
| [LINE Bot 設定步驟](docs/部署指南/LINE-Bot設定步驟.md) | LINE Messaging API Webhook 串接、ngrok 本地測試、自動回覆關閉設定 |
| [Discord Bot 設定步驟](docs/部署指南/Discord-Bot設定步驟.md) | Discord Interactions Endpoint 串接、Slash Command 註冊、ngrok 靜態 Domain 設定 |
| [Discord Bot AI 管理功能使用說明](docs/部署指南/Discord-Bot-AI管理功能使用說明.md) | 用 `/chat` 自然語言指揮 Bot 做伺服器管理（禁言/踢人/封鎖/移動/身分組/查詢…）；含各功能所需 Bot 權限對照、二次確認流程、常見問題 |

### 本地開發 Webhook / Interactions 測試（ngrok）

LINE Webhook 與 Discord Interactions Endpoint 都需要公開 HTTPS 網址，本地開發使用 [ngrok](https://ngrok.com/download) 建立 tunnel。

> **IIS Express 必須加 `--host-header=rewrite`**，否則 IIS Express 會因 Host header 不符直接回 400，後端程式碼不會執行。

**一般啟動（每次 URL 不同）：**
```powershell
& "C:\Users\ze7\Downloads\ngrok.exe" http --host-header=rewrite https://localhost:44345
```

**使用靜態 Domain（URL 固定不變，推薦）：**
```powershell
& "C:\Users\ze7\Downloads\ngrok.exe" http --domain=election-hangnail-reopen.ngrok-free.dev --host-header=rewrite https://localhost:44345
```

> **靜態 Domain 說明：** 登入 ngrok 帳號後系統配發一個固定 Domain（三個英文單字格式），每次重啟 ngrok 都是同一個 URL，不需要回 LINE / Discord 後台重新更新設定。必須加上 `--domain` 參數才會使用靜態 Domain，缺少此參數 ngrok 會另產生一個新的臨時 URL。

詳細步驟與常見問題見各平台設定文件：[LINE Bot 設定步驟](docs/部署指南/LINE-Bot設定步驟.md) ｜ [Discord Bot 設定步驟](docs/部署指南/Discord-Bot設定步驟.md)

## 本機環境設定

Clone 後需要手動建立以下檔案（均已被 `.gitignore` 排除，不會進版控）：

### 後台（prompt-studio-admin）

複製 `.env.example` 為 `.env.local`：

```bash
cp prompt-studio-admin/.env.example prompt-studio-admin/.env.local
```

| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_API_BASE_URL` | 後端 API 位址（含版本前綴）| `https://localhost:44345/api/v1` |
| `VITE_UI_URL` | 後台前端完整網址 | `http://localhost:5173` |

### 前台（prompt-studio-web）

複製 `.env.example` 為 `.env.local`：

```bash
cp prompt-studio-web/.env.example prompt-studio-web/.env.local
```

| 變數 | 說明 | 範例 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 後端 API 位址（**需含 `/api/v1` 版本前綴**，與後端路由一致）| `https://localhost:44345/api/v1` |

### 後端（ASP.NET Core）

`appsettings.Development.json` 需包含：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=PromptStudio;..."
  },
  "Jwt": {
    "Key": "your-secret-key",
    "Issuer": "PromptStudio",
    "Audience": "PromptStudio"
  }
}
```

> 後端 repo 獨立管理，此處僅列出對接所需的設定項目。

## License

Private — personal learning repo.
