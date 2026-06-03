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
│   └── 部署指南/           # Bot 串接、環境設定等操作文件
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

技術棧：
- **前台**：Next.js 16 App Router + RSC + Tailwind + Framer Motion
- **後台**：Vite + React Router + Zustand + React Query
- **後端**：ASP.NET Core 8 + EF Core 8（Code-First Migration）+ JWT
- **資料庫**：MS SQL Server
- **AI**：Gemini 2.0 Flash / Groq Llama 3.3 70B
- **部署**：IIS（API + 後台靜態）+ PM2（前台 Next.js）

## 部署指南

| 文件 | 說明 |
|------|------|
| [LINE Bot 設定步驟](docs/部署指南/LINE-Bot設定步驟.md) | LINE Messaging API Webhook 串接、ngrok 本地測試、自動回覆關閉設定 |

### 本地開發 Webhook 測試（ngrok）

LINE Webhook 需要公開 HTTPS 網址，本地開發使用 [ngrok](https://ngrok.com/download) 建立 tunnel。

> **IIS Express 必須加 `--host-header=rewrite`**，否則 IIS Express 會因 Host header 不符直接回 400，後端程式碼不會執行。

```powershell
& "C:\Users\ze7\Downloads\ngrok.exe" http --host-header=rewrite https://localhost:44345
```

啟動後將顯示的 `https://xxxx.ngrok-free.app` 填入 LINE Developers Console 的 Webhook URL：

```
https://xxxx.ngrok-free.app/webhooks/line/<botId>
```

詳細步驟與常見問題見 [LINE Bot 設定步驟](docs/部署指南/LINE-Bot設定步驟.md)。

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
| `NEXT_PUBLIC_API_URL` | 後端 API 位址（不含版本前綴）| `http://localhost:5000` |

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
