# Project C：AI Prompt Studio — 需求規劃

> 完整作品集專案：**前台 Next.js + 後台 Vite + 後端 ASP.NET Core + MS SQL**  
> 定位：融合 AI 對話介面與 Prompt 管理工具的全端作品  
> 最後更新：2026-05-25

---

## 1. 專案定位

一個**個人 AI 對話管理工具**，串接免費 LLM API（Gemini / Groq），並整合 Prompt 模板庫。

- **前台（公開）**：Landing Page、作品集展示、對話公開分享頁（SSR/SEO）
- **後台（私有）**：聊天介面、對話管理、Persona、Prompt 模板、Token 用量統計
- **後端（自建）**：ASP.NET Core Web API + MS SQL Server + AI 代理層

---

## 2. 技術架構

```text
┌──────────────────────────────────────────────────────┐
│ 前台 Next.js（App Router）                            │
│  - Landing、公開分享頁（SSR / SSG + SEO）             │
│  - NextAuth 登入入口（連到後端驗證）                  │
├──────────────────────────────────────────────────────┤
│ 後台 Vite + React + React Router（Dashboard CSR）     │
│  - 聊天、對話管理、Persona、Prompt 模板、統計          │
│  - Axios + React Query 串後端 API                     │
│  - JWT 存於 HttpOnly Cookie                          │
├──────────────────────────────────────────────────────┤
│ 後端 ASP.NET Core 8 Web API                           │
│  - Controller / Service / Repository 分層             │
│  - JWT 驗證、Refresh Token                           │
│  - AI 代理層（Gemini / Groq SSE Streaming）           │
│  - 集中錯誤處理、Serilog 日誌                         │
├──────────────────────────────────────────────────────┤
│ 資料庫 MS SQL Server + EF Core 8                      │
│  - Code-First Migration                              │
│  - Users / Conversations / Messages / Personas /     │
│    PromptTemplates / TokenUsageStats                  │
└──────────────────────────────────────────────────────┘
```

### 技術棧明細

| 層 | 技術 |
|----|------|
| 前台 | Next.js 14+（App Router）、TypeScript、Tailwind、shadcn/ui、Framer Motion |
| 後台 | Vite、React 18、React Router v6、Zustand、React Query、RHF + Zod、Tailwind |
| 後端 | ASP.NET Core 8、EF Core 8、AutoMapper、FluentValidation、Serilog、JWT Bearer |
| 資料庫 | MS SQL Server 2022（本機 Express 即可）|
| AI 服務 | Gemini 2.0 Flash（免費）、Groq Llama 3.1 70B（免費）|
| 測試 | Vitest + RTL（前端）、xUnit（後端）|
| 部署 | Vercel（前台）、自架 IIS / Docker（後端）|

---

## 3. 資料庫設計

```sql
-- Users：使用者
Users (
  Id              UNIQUEIDENTIFIER PK
  Email           NVARCHAR(256) UNIQUE
  PasswordHash    NVARCHAR(500)
  DisplayName     NVARCHAR(100)
  CreatedAt       DATETIME2
)

-- Conversations：對話
Conversations (
  Id              UNIQUEIDENTIFIER PK
  UserId          FK → Users.Id
  Title           NVARCHAR(200)
  PersonaId       FK → Personas.Id (nullable)
  ModelType       NVARCHAR(50)        -- 'gemini-flash' / 'groq-llama'
  IsPinned        BIT
  IsPublic        BIT
  ShareSlug       NVARCHAR(20) UNIQUE -- 公開分享用短碼
  CreatedAt       DATETIME2
  UpdatedAt       DATETIME2
)

-- Messages：訊息
Messages (
  Id              UNIQUEIDENTIFIER PK
  ConversationId  FK → Conversations.Id
  Role            NVARCHAR(20)        -- 'user' / 'assistant' / 'system'
  Content         NVARCHAR(MAX)
  TokensIn        INT
  TokensOut       INT
  CreatedAt       DATETIME2
)

-- Personas：角色設定
Personas (
  Id              UNIQUEIDENTIFIER PK
  UserId          FK → Users.Id (nullable，null=系統內建)
  Name            NVARCHAR(100)
  SystemPrompt    NVARCHAR(MAX)
  Emoji           NVARCHAR(10)
  IsBuiltin       BIT
)

-- PromptTemplates：Prompt 模板庫
PromptTemplates (
  Id              UNIQUEIDENTIFIER PK
  UserId          FK → Users.Id
  Title           NVARCHAR(200)
  Content         NVARCHAR(MAX)
  Category        NVARCHAR(50)        -- '寫作' / '程式' / '翻譯' / '其他'
  Tags            NVARCHAR(500)       -- 以逗號分隔
  UsageCount      INT
  CreatedAt       DATETIME2
)

-- TokenUsageStats：用量統計（每日彙總）
TokenUsageStats (
  Id              UNIQUEIDENTIFIER PK
  UserId          FK → Users.Id
  Date            DATE
  ModelType       NVARCHAR(50)
  TokensIn        INT
  TokensOut       INT
  RequestCount    INT
)
```

---

## 4. 路由規劃

### 4.1 前台 Next.js

| 路由 | 渲染方式 | 說明 |
|------|---------|------|
| `/` | SSG | Landing Page（介紹、特色、Demo 截圖） |
| `/about` | SSG | 作品集個人介紹 |
| `/share/[slug]` | SSR | 對話公開分享頁（動態 metadata SEO）|
| `/login` | CSR | 登入頁（呼叫後端 JWT API）|
| `/api/auth/*` | Server | NextAuth 整合（如使用）|

### 4.2 後台 Vite

| 路由 | 守衛 | 說明 |
|------|------|------|
| `/login` | Public | 登入 |
| `/chat` | PrivateRoute | 新對話（選 Persona、選模型）|
| `/chat/:id` | PrivateRoute | 繼續對話 |
| `/conversations` | PrivateRoute | 對話列表 + 搜尋 |
| `/personas` | PrivateRoute | 角色管理 CRUD |
| `/prompts` | PrivateRoute | Prompt 模板庫 CRUD |
| `/stats` | PrivateRoute | Token 用量統計（圖表） |
| `/settings` | PrivateRoute | 預設模型、個人資料設定 |

### 4.3 後端 ASP.NET Core API

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/auth/register` | 註冊 |
| POST | `/api/auth/login` | 登入，回傳 JWT |
| POST | `/api/auth/refresh` | Refresh Token |
| GET | `/api/conversations` | 取得對話列表 |
| POST | `/api/conversations` | 建立對話 |
| GET | `/api/conversations/{id}` | 取得單一對話 + 訊息 |
| PATCH | `/api/conversations/{id}` | 改名、置頂、公開設定 |
| DELETE | `/api/conversations/{id}` | 刪除對話 |
| POST | `/api/chat/stream` | **AI Streaming 端點（SSE）** |
| POST | `/api/chat/abort/{conversationId}` | 中斷生成 |
| GET | `/api/personas` | 角色列表（含內建）|
| POST/PATCH/DELETE | `/api/personas/...` | 角色 CRUD |
| GET | `/api/prompts` | Prompt 模板列表 |
| POST/PATCH/DELETE | `/api/prompts/...` | 模板 CRUD |
| GET | `/api/stats?from=&to=` | Token 用量查詢 |
| GET | `/api/export/{id}` | 對話導出為 Markdown |
| GET | `/api/public/{slug}` | 取得公開對話（不需驗證）|

---

## 5. 功能規格

### 5.1 聊天核心

| 功能 | 技術要點 |
|------|---------|
| Streaming 打字機效果 | 後端用 `IAsyncEnumerable<string>` + `Response.WriteAsync` SSE；前端用 `EventSource` 或 `fetch` + `ReadableStream` |
| 停止生成 | `AbortController`（前端）+ `CancellationToken`（後端）|
| Markdown 渲染 | `react-markdown` + `remark-gfm` |
| 程式碼高亮 | `shiki`（推薦，輕量、SSR 友善）|
| 重新生成 | 刪除最後一則 assistant 訊息並重送 |
| 複製訊息 | `navigator.clipboard.writeText` |
| 自動標題 | 第一輪對話後請 AI 產生標題 |

### 5.2 對話管理

- Sidebar 顯示對話列表（標題、時間、置頂、公開狀態圖示）
- 新增 / 刪除 / 改名 / 置頂
- 搜尋（依標題，後端 LIKE 查詢）
- Markdown 導出（後端產生 `.md` 字串、前端觸發下載）
- 公開分享：產生 `ShareSlug`，分享頁走 SSR + metadata

### 5.3 Persona 角色

- 內建 4–5 個預設角色（工程師、寫作助手、翻譯員、UX 顧問、產品經理）
- 自訂角色 CRUD（名稱、System Prompt、Emoji 頭像）
- 開聊時下拉選擇

### 5.4 模型切換

| 模型 | API 提供者 | 特點 |
|------|-----------|------|
| Gemini 2.0 Flash | Google AI Studio（免費）| 多語言強、context 大 |
| Groq Llama 3.1 70B | Groq（免費）| 速度極快（300+ tokens/s）|

後端用 Strategy Pattern 封裝兩種 Provider，切換時前端只傳 `modelType` 字串。

### 5.5 Prompt 模板庫

- 分類（寫作 / 程式 / 翻譯 / 其他）
- 標籤搜尋
- 「使用此模板」按鈕 → 帶入聊天輸入框
- 使用次數計數（後端原子遞增）

### 5.6 Token 統計

- 折線圖：近 30 天每日用量趨勢（`recharts`）
- 卡片顯示：本月累計、各模型分布
- 預估費用（用各 API 公開定價計算，免費額度內顯示 $0）

---

## 6. 版本規劃

### V1：核心可用（40–50h）
- 帳號登入、JWT 驗證
- 對話 CRUD + Streaming 聊天
- 內建 Persona、單一模型

### V2：完整功能（+30–35h）
- 自訂 Persona、Prompt 模板庫
- 對話搜尋、置頂、Markdown 導出
- Token 用量統計

### V3：進階亮點（+25–30h）
- 模型切換（Gemini ↔ Groq）
- 公開分享頁（前台 SSR + SEO）
- Landing Page 精修、Dark Mode、Framer Motion 動畫

### V4：作品集打磨（+15–20h）
- 單元測試覆蓋核心 service
- E2E Playwright 測試 happy path
- README、架構圖、部署文件

---

## 7. 時程總覽

| 項目 | 預估時數 |
|------|---------|
| 前端（前台 + 後台）| 80–100h |
| 後端（ASP.NET Core + EF Core）| 35–45h |
| AI 代理層（SSE Streaming）| 8–10h |
| 部署 + 文件 | 7–10h |
| **實作合計** | **~130–165h** |
| 教學講解（搭配開發過程）| **30–40h** |
| **總計** | **~160–205h** |

---

## 8. 與學習進度表的關係

```
┌─────────────────────────────────────┐
│ 學習進度表（132h）                    │
│   158 項知識點 + 微練習              │
└─────────────────────────────────────┘
                ↓ 學完才有能力做
┌─────────────────────────────────────┐
│ Project C 實作（130–165h）            │
│   + 教學講解（30–40h）                │
│   合計 160–205h                       │
└─────────────────────────────────────┘

兩者獨立計算，總投入 ~290–340h
```

### 推進策略（建議「並行」）

| 學習階段 | 對應 Project C 模組 |
|---------|-------------------|
| 第一階段 React 鳥瞰 | 規劃階段（畫線稿、定資料表）|
| 第二階段 Hook + 第九階段 TS | 後台框架搭建、登入頁 |
| 第三階段 Zustand + 第四階段 React Query | 對話列表 CRUD |
| 第二階段 Part 4-7（副作用 / 效能）| Streaming 聊天介面 |
| 第十階段 Tailwind | 全站 UI 精修 |
| 第五階段路由 + 第七階段 Skills | 後台多路由、表單驗證 |
| 第十一階段 Vitest | V4 測試覆蓋 |
| 第八階段架構守則 | 上線前 Review |

---

## 9. 風險與取捨

| 風險 | 緩解方案 |
|------|---------|
| AI API 免費額度用完 | 後端設每日請求上限、用量達警示時切換 Provider |
| Streaming 在某些網路環境不穩 | 失敗 fallback 為非 streaming 模式 |
| MS SQL 部署複雜 | 可選 Azure SQL Free Tier 或 Docker SQL Server |
| 全端範圍大、易倦怠 | 嚴格按 V1 → V4 推進，V1 完成就先部署看到成果 |

---

## 10. 待辦清單（建議下一步）

- [ ] 確認 .NET 後端版本（建議 .NET 8 LTS）
- [ ] 申請 Gemini API Key、Groq API Key
- [ ] 安裝 MS SQL Server Express 或 Docker SQL Server
- [ ] 建立 Git Repo 與分支策略
- [ ] 畫線稿（手繪或 Figma 都行）
- [ ] V1 開工
