# Project C：AI Prompt Studio — 需求規劃

> 完整作品集專案：**前台 Next.js + 後台 Vite + 後端 ASP.NET Core + MS SQL**  
> 定位：AI 對話管理 + Prompt 設計工作室 + 多平台 Bot 控制台  
> 最後更新：2026-05-28

---

## 1. 專案定位

一個**個人 AI Bot 控制台**，讓使用者在後台設計 Persona 與 Prompt、測試 AI 回應，並將設定部署到網頁聊天室、Line Bot 或 Discord Bot 供外部使用者使用。

- **後台（私有 Admin）**：設計 Persona、撰寫 Prompt、測試對話、管理 Bot 綁定、監控外部對話、查看 Token 統計
- **前台（公開 Web）**：外部使用者的網頁聊天介面、公開分享頁（SSR/SEO）、Landing Page
- **外部平台**：Line Bot、Discord Bot（接收訊息 → 帶入 Persona 設定 → 呼叫 AI → 回覆）
- **後端（自建）**：ASP.NET Core Web API + MS SQL + AI 代理層 + Webhook 端點

---

## 2. 技術架構

```text
┌──────────────────────────────────────────────────────┐
│ 前台 Next.js（App Router）                            │
│  - Landing、公開分享頁（SSR / SSG + SEO）             │
│  - 外部使用者聊天室（CSR）                            │
│  - NextAuth 登入入口（連到後端驗證）                  │
├──────────────────────────────────────────────────────┤
│ 後台 Vite + React + React Router（Dashboard CSR）     │
│  - 聊天測試、Persona 設計、Prompt Builder             │
│  - Bot 綁定管理、外部對話監控、Token 統計              │
│  - Axios + React Query 串後端 API                     │
│  - JWT 存於 HttpOnly Cookie                          │
├──────────────────────────────────────────────────────┤
│ 後端 ASP.NET Core 8 Web API                           │
│  - Controller / Service / Repository 分層             │
│  - JWT 驗證、Refresh Token                           │
│  - AI 代理層（Gemini / Groq SSE Streaming）           │
│  - Line Webhook + Discord Webhook 端點                │
│  - 集中錯誤處理、Serilog 日誌                         │
├──────────────────────────────────────────────────────┤
│ 資料庫 MS SQL Server + EF Core 8                      │
│  - Code-First Migration                              │
│  - Users / Conversations / Messages / Personas /     │
│    PersonaVersions / PromptTemplates /               │
│    BotBindings / ExternalMessages / TokenUsageStats  │
└──────────────────────────────────────────────────────┘
         ↕ Webhook               ↕ Webhook
   ┌──────────┐             ┌──────────────┐
   │ Line Bot │             │ Discord Bot  │
   └──────────┘             └──────────────┘
```

### 技術棧明細

| 層 | 技術 |
|----|------|
| 前台 | Next.js 14+（App Router）、TypeScript、Tailwind、shadcn/ui、Framer Motion |
| 後台 | Vite、React 18、React Router v6、Zustand、React Query、RHF + Zod、Tailwind |
| 後端 | ASP.NET Core 8、EF Core 8、AutoMapper、FluentValidation、Serilog、JWT Bearer |
| 資料庫 | MS SQL Server 2022（本機 Express 即可）|
| AI 服務 | Gemini 2.0 Flash（免費）、Groq Llama 3.1 70B（免費）|
| 外部平台 | Line Messaging API（免費）、Discord Bot API（免費）|
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

-- Conversations：Admin 測試對話
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

-- Messages：Admin 對話訊息
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
  PromptSections  NVARCHAR(MAX)       -- JSON，儲存 Prompt Builder 各區塊原始內容
  CurrentVersion  INT
  Emoji           NVARCHAR(10)
  IsBuiltin       BIT
  CreatedAt       DATETIME2
  UpdatedAt       DATETIME2
)

-- PersonaVersions：Persona Prompt 版本歷史
PersonaVersions (
  Id              UNIQUEIDENTIFIER PK
  PersonaId       FK → Personas.Id
  Version         INT                 -- 1, 2, 3...
  SystemPrompt    NVARCHAR(MAX)
  PromptSections  NVARCHAR(MAX)       -- JSON snapshot
  ChangeNote      NVARCHAR(500)       -- 本次修改說明（可空）
  CreatedAt       DATETIME2
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

-- BotBindings：Line / Discord Bot 綁定設定
BotBindings (
  Id              UNIQUEIDENTIFIER PK
  UserId          FK → Users.Id
  Platform        NVARCHAR(20)        -- 'line' / 'discord'
  BotName         NVARCHAR(100)
  BotToken        NVARCHAR(500)       -- 加密儲存（AES）
  ChannelSecret   NVARCHAR(500)       -- Line 專用，加密儲存
  PersonaId       FK → Personas.Id
  ModelType       NVARCHAR(50)
  IsEnabled       BIT
  CreatedAt       DATETIME2
  UpdatedAt       DATETIME2
)

-- ExternalMessages：Line / Discord 外部對話記錄
ExternalMessages (
  Id              UNIQUEIDENTIFIER PK
  BotBindingId    FK → BotBindings.Id
  Platform        NVARCHAR(20)        -- 'line' / 'discord'
  ExternalUserId  NVARCHAR(200)       -- Line UserId / Discord UserId
  Role            NVARCHAR(20)        -- 'user' / 'assistant'
  Content         NVARCHAR(MAX)
  TokensIn        INT
  TokensOut       INT
  CreatedAt       DATETIME2
)

-- TokenUsageStats：用量統計（每日彙總）
TokenUsageStats (
  Id              UNIQUEIDENTIFIER PK
  UserId          FK → Users.Id
  Date            DATE
  ModelType       NVARCHAR(50)
  Source          NVARCHAR(20)        -- 'admin' / 'web' / 'line' / 'discord'
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
| `/` | SSG | Landing Page（介紹、特色、Demo 截圖）|
| `/about` | SSG | 作品集個人介紹 |
| `/chat` | CSR | 外部使用者聊天室（選 Persona）|
| `/share/[slug]` | SSR | 對話公開分享頁（動態 metadata SEO）|
| `/login` | CSR | 登入頁（呼叫後端 JWT API）|

### 4.2 後台 Vite

| 路由 | 守衛 | 說明 |
|------|------|------|
| `/login` | Public | 登入 |
| `/chat` | PrivateRoute | 新對話（選 Persona、選模型）|
| `/chat/:id` | PrivateRoute | 繼續對話 |
| `/conversations` | PrivateRoute | Admin 測試對話列表 |
| `/personas` | PrivateRoute | Persona 管理（含 Prompt Builder）|
| `/personas/:id/versions` | PrivateRoute | Persona Prompt 版本歷史 |
| `/prompts` | PrivateRoute | Prompt 模板庫 CRUD |
| `/bots` | PrivateRoute | Bot 綁定管理（Line / Discord）|
| `/monitor` | PrivateRoute | 外部對話監控（Line / Discord / Web）|
| `/stats` | PrivateRoute | Token 用量統計（圖表）|
| `/settings` | PrivateRoute | 預設模型、個人資料設定 |

### 4.3 後端 ASP.NET Core API

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/auth/register` | 註冊 |
| POST | `/api/auth/login` | 登入，回傳 JWT |
| POST | `/api/auth/refresh` | Refresh Token |
| GET/POST | `/api/conversations` | 對話列表 / 建立 |
| GET/PATCH/DELETE | `/api/conversations/{id}` | 單一對話操作 |
| POST | `/api/chat/stream` | **AI Streaming 端點（SSE）**|
| POST | `/api/chat/abort/{id}` | 中斷生成 |
| GET/POST | `/api/personas` | 角色列表 / 建立 |
| GET/PATCH/DELETE | `/api/personas/{id}` | 角色操作 |
| POST | `/api/personas/{id}/enhance` | **AI 強化 Prompt（呼叫 Groq）**|
| GET | `/api/personas/{id}/versions` | 版本歷史列表 |
| POST | `/api/personas/{id}/versions/{v}/restore` | 回滾到指定版本 |
| GET/POST/PATCH/DELETE | `/api/prompts/...` | Prompt 模板 CRUD |
| GET/POST | `/api/bots` | Bot 綁定列表 / 建立 |
| GET/PATCH/DELETE | `/api/bots/{id}` | Bot 綁定操作 |
| GET | `/api/monitor?botId=&from=&to=` | 外部對話記錄查詢 |
| GET | `/api/stats?from=&to=` | Token 用量查詢 |
| GET | `/api/export/{id}` | 對話導出為 Markdown |
| GET | `/api/public/{slug}` | 公開對話（不需驗證）|
| POST | `/api/webhook/line` | **Line Bot Webhook**（不需 JWT）|
| POST | `/api/webhook/discord` | **Discord Bot Webhook**（不需 JWT）|

---

## 5. 功能規格

### 5.1 聊天核心

| 功能 | 技術要點 |
|------|---------|
| Streaming 打字機效果 | 後端 `IAsyncEnumerable<string>` + SSE；前端 `fetch` + `ReadableStream` |
| 停止生成 | `AbortController`（前端）+ `CancellationToken`（後端）|
| Markdown 渲染 | `react-markdown` + `remark-gfm` |
| 程式碼高亮 | `shiki`（輕量、SSR 友善）|
| 重新生成 | 刪除最後一則 assistant 訊息並重送 |
| 複製訊息 | `navigator.clipboard.writeText` |
| 自動標題 | 第一輪對話後請 AI 產生標題 |

### 5.2 對話管理

- Sidebar 顯示 Admin 測試對話列表（標題、時間、置頂、公開狀態）
- 新增 / 刪除 / 改名 / 置頂
- 搜尋（依標題）
- Markdown 導出
- 公開分享：產生 `ShareSlug`，分享頁走 SSR + metadata

### 5.3 Persona 管理

- 內建 4–5 個預設角色（工程師、寫作助手、翻譯員、UX 顧問、產品經理）
- 自訂角色 CRUD（名稱、Emoji、System Prompt）
- **Prompt Builder**（見 5.7）
- **版本管理**（見 5.8）

### 5.4 模型切換

| 模型 | API 提供者 | 特點 |
|------|-----------|------|
| Gemini 2.0 Flash | Google AI Studio（免費）| 多語言強、context 大 |
| Groq Llama 3.1 70B | Groq（免費）| 速度極快（300+ tokens/s）|

後端用 Strategy Pattern 封裝兩種 Provider，切換時前端只傳 `modelType` 字串。

### 5.5 Prompt 模板庫

- 分類（寫作 / 程式 / 翻譯 / 其他）
- 標籤搜尋
- 「使用此模板」→ 帶入聊天輸入框
- 使用次數計數

### 5.6 Token 統計

- 折線圖：近 30 天每日用量趨勢（`recharts`）
- 依來源分色（Admin / Web / Line / Discord）
- 卡片：本月累計、各模型分布、預估費用

### 5.7 Prompt Builder（新）

幫助使用者撰寫完整、AI 能準確執行的 System Prompt，三層機制並存：

**A — 結構化表單（引導填寫）**

| 區塊 | 說明 | 範例 |
|------|------|------|
| 角色定義 | 這個 AI 是誰 | 你是一位專業的客服人員 |
| 背景說明 | 所在情境 | 服務於電商平台 |
| 任務描述 | 主要職責 | 負責處理退換貨相關問題 |
| 輸出格式 | 回答的格式要求 | 條列式，不超過 3 點 |
| 限制條件 | 不能做什麼 | 不討論競品，不做承諾 |
| 範例對話 | （可選）輸入輸出範例 | Q: 我要退貨 A: 請提供... |

填完後自動組裝成完整 System Prompt（可預覽、可複製、可直接存入 Persona）。

**B — AI 強化按鈕**

使用者輸入白話描述，點按後由 Groq 改寫成結構完整的 System Prompt：

```
輸入：「幫我做一個回答客服的機器人」
  ↓
輸出：你是一位專業、親切的客服助理，服務於 [公司名稱]...
```

改寫結果回填到結構化表單，使用者可再微調。

**C — 即時完整度提示**

編輯器旁顯示即時檢查清單：

```
✅ 有角色定義
✅ 有任務描述
⚠️  缺少輸出格式（建議補充）
⚠️  缺少限制條件（建議補充）
❌ 沒有範例（可選）

完整度 60%
```

### 5.8 Persona 版本管理（新）

- 每次儲存 Persona 時自動建立版本快照（版號 +1）
- 版本歷史頁顯示所有版本（時間、修改說明、Prompt 差異）
- 支援回滾：點選舊版本一鍵還原
- 用途：改壞了 Prompt 可以回到上一個可用版本

### 5.9 外部平台整合（新）

**Bot 綁定管理頁（`/bots`）**

| 欄位 | 說明 |
|------|------|
| 平台 | Line / Discord |
| Bot 名稱 | 自訂顯示名稱 |
| Bot Token | 加密儲存，前端只顯示後 4 碼 |
| 綁定 Persona | 選擇此 Bot 使用哪個角色設定 |
| 模型 | 選擇使用 Gemini 或 Groq |
| 啟用 / 停用 | Toggle 開關 |

**Webhook 處理流程**

```
外部訊息到達 /api/webhook/line (或 /discord)
  ↓
驗證簽章（Line Signature / Discord 驗證）
  ↓
查找對應 BotBinding + Persona.SystemPrompt
  ↓
呼叫 AI（帶入 Persona + 使用者訊息）
  ↓
回傳回覆給 Line / Discord
  ↓
寫入 ExternalMessages（供監控頁查看）
```

### 5.10 外部對話監控（新）

- 列表顯示所有來源（Line / Discord / Web）的對話記錄
- 可依平台、Bot、時間範圍篩選
- 點進去看完整對話內容
- Token 消耗顯示

---

## 6. 版本規劃

### V1：核心可用（40–50h）

| 功能 | 說明 |
|------|------|
| 帳號登入 | JWT 驗證、PrivateRoute |
| 對話 CRUD | Admin 測試對話 |
| AI Streaming | SSE 打字機效果 |
| 內建 Persona | 5 個預設角色 |
| 單一模型 | Groq Llama |

### V2：完整後台（+40–50h）

| 功能 | 說明 |
|------|------|
| 自訂 Persona | CRUD + **Prompt Builder（A+B+C）**|
| Persona 版本管理 | 自動快照 + 回滾 |
| Prompt 模板庫 | CRUD + 分類 + 搜尋 |
| 對話管理 | 搜尋、置頂、Markdown 導出 |
| Token 統計 | recharts 圖表 |
| 模型切換 | Gemini ↔ Groq |

### V3：多平台整合（+40–50h）

| 功能 | 說明 |
|------|------|
| Line Bot 整合 | Webhook + 回覆 |
| Discord Bot 整合 | Webhook + 回覆 |
| Bot 綁定管理頁 | 後台 `/bots` |
| 外部對話監控頁 | 後台 `/monitor` |
| 前台聊天室 | Next.js 外部使用者介面 |
| 公開分享頁 | SSR + SEO |

### V4：Landing & 精修（+20–25h）

| 功能 | 說明 |
|------|------|
| Landing Page | Next.js SSG + Framer Motion |
| Dark Mode 完整覆蓋 | 前台同步後台主題系統 |
| 行動裝置適配 | 前台 RWD 優化 |

### V5：作品集打磨（+15–20h）

| 功能 | 說明 |
|------|------|
| 單元測試 | Vitest + RTL 核心元件 |
| E2E 測試 | Playwright happy path |
| README + 架構圖 | 部署說明、技術決策記錄 |

---

## 7. 時程總覽

### 實作時數明細

| 模組 | 預估時數 |
|------|---------|
| V1 核心（聊天 + 登入 + 基礎 Persona）| 40–50h |
| V2 完整後台（Prompt Builder + 版本管理 + 統計）| 40–50h |
| V3 多平台整合（Line + Discord + 前台）| 40–50h |
| V4 Landing + 精修 | 20–25h |
| V5 測試 + 文件 | 15–20h |
| **實作合計** | **155–195h** |

### 總投入估算

| 項目 | 時數 |
|------|------|
| 前端學習（163 項知識點）| 137h |
| 專案實作 | 155–195h |
| 教學講解（Review + 配對寫）| 30–40h |
| JIT 並行節省 | −45–55h |
| **總計** | **~277–317h** |

換算：10h/週 → 28–32 週；15h/週 → 19–21 週；20h/週 → 14–16 週。

---

## 8. 分工模型

| 模組 | Claude（我）| 使用者 |
|------|------------|--------|
| 後端 CRUD / Auth / EF Migration / Serilog | ✅ 實作 + 解說 | 👀 看 commit + 提問 |
| Line / Discord Webhook 後端 | ✅ 實作 + 解說 | 👀 看 commit + 提問 |
| AI Streaming SSE | 🤝 示範後配對寫 | ✅ 親手寫第二個端點 |
| Strategy Pattern AI Provider | 🤝 一起設計 | 一起寫 |
| 所有前端（後台 Vite + 前台 Next.js）| 🔍 Review + 諮詢 | ✅ 親手寫全部 |
| 部署（IIS + PM2）| 提供設定建議 | ✅ 親自做 |

---

## 9. 與學習進度表的關係

| 學習階段 | 對應 Project C 模組 |
|---------|-------------------|
| 第二階段 Hook + 第九階段 TS | 後台框架搭建、登入頁 |
| 第三階段 Zustand + 第四階段 React Query | 對話列表 CRUD |
| 第二階段 Part 4-7（副作用 / 效能）| Streaming 聊天介面 |
| 第五階段路由 + 第七階段 Skills | 後台多路由、Prompt Builder 表單 |
| 第十階段 Tailwind | 全站 UI 精修 |
| 第六階段 Next.js RSC | 前台聊天室 + 公開分享頁 |
| 第十一階段 Vitest | V5 測試覆蓋 |
| 第八階段架構守則 | 上線前 Review |

---

## 10. 風險與取捨

| 風險 | 緩解方案 |
|------|---------|
| AI API 免費額度用完 | 後端設每日請求上限；額度達警示時切換 Provider |
| Streaming 在某些環境不穩 | 失敗 fallback 為非 streaming 模式 |
| Line / Discord API 規格變動 | 後端 Webhook 層用 Adapter 封裝，只改一個類別 |
| Bot Token 安全疑慮 | 後端 AES 加密儲存；前端只顯示後 4 碼 |
| MS SQL 部署複雜 | 可選 Azure SQL Free Tier 或 Docker SQL Server |
| 全端範圍大、易倦怠 | 嚴格按 V1 → V5 推進，V1 完成即部署看到成果 |

---

## 11. 待辦清單

- [x] 確認 .NET 後端版本（.NET 8 LTS）
- [x] 申請 Gemini API Key（Google AI Studio）
- [x] 申請 Groq API Key
- [ ] 安裝 MS SQL Server Express 或 Docker SQL Server
- [ ] 申請 Line Developers 帳號（免費）
- [ ] 建立 Discord Application + Bot（免費）
- [ ] 後端 V1 開工（Claude 負責）
- [ ] 前端 V1 開工（使用者在完成 Stage 5–6 學習後）
