# Prompt Studio Admin

AI Prompt 管理後台，提供 Persona 設定、對話記錄管理與多模型切換功能。

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | React 19 + TypeScript |
| 建置工具 | Vite |
| 樣式 | Tailwind CSS v4 |
| 全域狀態 | Zustand（含 persist） |
| 表單驗證 | React Hook Form |
| HTTP 客戶端 | Axios（含攔截器） |
| 主題切換 | Context API + Tailwind dark mode |

## 功能

- **Persona 管理**：建立、編輯、切換 AI 角色設定
- **對話記錄**：側邊欄管理對話清單，支援新增與切換
- **深色 / 淺色主題**：全站雙色主題即時切換
- **多模型切換**：Gemini Flash、Groq Llama（免費方案）

## 本機開發

```bash
# 安裝相依套件
npm install

# 複製環境變數範本
cp .env.example .env.local

# 啟動開發伺服器
npm run dev
```

## 環境變數

| 變數名稱 | 說明 | 預設值 |
|----------|------|--------|
| `VITE_API_BASE_URL` | 後端 API 位址 | `http://localhost:5000` |

## 專案結構

```
src/
├── components/     # UI 元件
├── context/        # Context API（主題）
├── hooks/          # Custom Hooks
├── lib/            # Axios instance
├── store/          # Zustand stores
└── App.tsx
```
