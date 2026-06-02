# ReactL

前端轉職學習空間：React + TypeScript + Tailwind + Vitest 系統化筆記、Skills、Workflows 與 Project C「AI Prompt Studio」規劃文件。

## 目錄結構

```
ReactL/
├── prompt-studio-admin/   # 後台管理介面（Vite + React + Zustand + React Query）
├── prompt-studio-web/     # 前台展示網站（Next.js 14 App Router + Tailwind）
├── docs/                  # 學習筆記、進度追蹤、規劃文件
│   ├── 學習追蹤/           # React 學習進度表（163 項 / 137h）
│   ├── 學習筆記/           # React 鳥瞰、Hook 深度、Tailwind、Vitest 等
│   ├── 前端實作準則/        # 9 份架構守則
│   ├── 前端UIUX設計/        # 無障礙等設計文件
│   └── 需求規劃/           # Project C AI Prompt Studio 規劃
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
- **前台**：Next.js 14 App Router + RSC + Tailwind + shadcn/ui
- **後台**：Vite + React Router + Zustand + React Query
- **後端**：ASP.NET Core 8 + EF Core 8（Code-First Migration）+ JWT
- **資料庫**：MS SQL Server
- **AI**：Gemini 2.0 Flash / Groq Llama 3.1 70B
- **部署**：IIS（API + 後台靜態）+ PM2（前台 Next.js）

## License

Private — personal learning repo.
