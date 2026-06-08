# IIS + pm2 + ngrok 對外部署指南（子應用路徑分流）

把本專案（前台 web / 後台 admin / 後端 API）透過**單一固定 ngrok 網址**對外發布。
核心：**後端發布檔當對外入口站台（:8000）**，admin 與 web 各掛成它的**子應用**；
ngrok 只指這個入口站台。

> ⚠️ 多數 IIS 步驟需要**系統管理員權限**：請用「以系統管理員身分執行」開 PowerShell 或 IIS 管理員。

---

## 0. 架構總覽

```
ngrok（election-hangnail-reopen.ngrok-free.dev）
        │
        ▼
IIS 入口站台 :8000  （站台名 ReactL，根目錄＝後端發布檔 C:\app\ReactL.api，App Pool：ReactL）
   ├─ /api/v1/*  → ASP.NET Core Module 直接託管後端          後端 API （0 代理，正向/直接）
   ├─ /admin/*   → 子應用，指向 admin 的 dist（C:\app\ReactL_Admin）  後台 admin（0 代理，靜態）
   └─ /app/*     → 子應用，反向代理 → http://localhost:3000/app/*      前台 web （反向，Next pm2）
```

| 角色 | 路徑 | 實體路徑 | 發布方式 | App Pool |
|------|------|----------|----------|----------|
| 入口站台 `ReactL`（＝後端 API） | `/`、`/api` | `C:\app\ReactL.api` | ASP.NET Core Module 直接託管 | **ReactL** |
| 後台 admin（子應用） | `/admin` | `C:\app\ReactL_Admin` | Vite `dist`（`base:'/admin/'`）靜態 | **ReactL** |
| 前台 web（子應用） | `/app` | `C:\app\ReactL_IIS_Web`（反代 web.config）；app 跑 `C:\app\ReactL_Web` | 反向代理 Next（`basePath:'/app'`，pm2 standalone） | **ReactL** |

- **App Pool**：全部共用一個 `ReactL`（No Managed Code）。（想做隔離也可後端/前端分兩個 pool。）
- **站台只有一個**（`ReactL`，port 8000）；admin、app 是它底下的**子應用（Application）**，不是獨立站台。
- 後端、admin 是「直接託管」（你習慣稱正向）；只有 web 是跑著的 Node，需「反向代理」。本架構沒有正向代理。

---

## 1. 前置需求：IIS + URL Rewrite + ARR + .NET Hosting Bundle

### 1-1. 檢查（一般 PowerShell 即可）

```powershell
Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll"                                  # URL Rewrite
Test-Path "$env:ProgramFiles\IIS\Application Request Routing\requestRouter.dll"            # ARR
Test-Path "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll"                  # Hosting Bundle
Get-Service W3SVC | Select-Object Status                                                   # IIS 服務
dotnet --list-runtimes | Select-String "AspNetCore"                                        # 需有 8.0.x（本專案 net8.0）
```

### 1-2. 安裝（若缺）

- URL Rewrite 2.1：<https://www.iis.net/downloads/microsoft/url-rewrite>
- ARR 3.0：<https://www.iis.net/downloads/microsoft/application-request-routing>（**先裝 URL Rewrite 再裝 ARR**）

```powershell
msiexec /i "rewrite_amd64_en-US.msi" /quiet /norestart
msiexec /i "requestRouter_amd64.msi" /quiet /norestart
```

#### .NET 8 Hosting Bundle（套件下載與安裝，必裝）

ASP.NET Core 要被 IIS 託管**必須**裝 Hosting Bundle（含 Runtime + ASP.NET Core Module），只裝 Runtime/SDK 不夠。

- **方式 A：官網下載** <https://dotnet.microsoft.com/download/dotnet/8.0> →「ASP.NET Core 8.0 Runtime」找「**Hosting Bundle**」→ `dotnet-hosting-8.0.x-win.exe`
  ```powershell
  .\dotnet-hosting-8.0.x-win.exe /quiet /norestart
  ```
- **方式 B：winget** `winget install Microsoft.DotNet.HostingBundle.8`

裝完**重啟 IIS**：`net stop was /y; net start w3svc`
驗證：`Test-Path "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll"` 應為 `True`。

### 1-3. 啟用 ARR Proxy（關鍵，常忘記）

`web` 子應用要反向代理，需開 ARR proxy。**IIS 管理員**：伺服器節點 →「Application Request Routing Cache」→
「Server Proxy Settings…」→ 勾「**Enable proxy**」→「**Response buffer threshold (KB)**」設 **0**
（前台聊天 SSE 串流不關緩衝會卡住）→ Apply。或指令：

```powershell
& "$env:SystemRoot\System32\inetsrv\appcmd.exe" set config -section:system.webServer/proxy /enabled:"true" /commit:apphost
```

---

## 2. 檢查 Port 佔用

⚠️ 本機是 **Windows PowerShell 5.1**，沒有 `Get-NetTCPListener`（會報 "not recognized"）。請用 `netstat`：

```powershell
$net = netstat -ano | Select-String "LISTENING"
foreach ($p in 80,3000,5173,8000,8080,44345) {
  $hit = $net | Select-String ":$p\s"
  if ($hit) { "Port $p : 被佔用" } else { "Port $p : 空閒" }
}
```

查某 port 是誰在用：`netstat -ano | findstr :8000` 看 PID，再 `Get-Process -Id <PID>`。

| Port | 用途 |
|------|------|
| 8000 | 對外入口站台 |
| 3000 | 前台 web（pm2 Next，basePath /app） |
| （5000 等） | 視需要 |

---

## 3. 後端（發布 + 建入口站台）

> 📦 **必裝套件：.NET 8 Hosting Bundle**（見 1-2）。後端 net8.0，沒裝 3-4 測 `/api` 會 500.19/500.30/502.5。

### 3-1. 發布後端

```powershell
cd C:\source\ReactL.api\ReactL.api\ReactL.api
dotnet publish -c Release -o C:\app\ReactL.api
```

> 🔑 **發布完先做 3-2 設定 JWT/加密金鑰與連線字串**，否則打 API 會 `IDX10703 key length is zero`、登入壞。
> 本架構後端**不需要**任何 rewrite 規則（web 改由 /app 子應用反代），保持 publish 產生的乾淨 web.config 即可。

### 3-2. 生產環境密鑰（重要）

User Secrets 在 IIS 不會載入（App Pool 身分 + Production），所以**開發用的密鑰要全部搬到 production**。
先列出全部：

```powershell
cd C:\source\ReactL.api\ReactL.api\ReactL.api
dotnet user-secrets list
```

| 設定鍵 | 注意 |
|--------|------|
| `JwtSettings:SecretKey` | ≥ 32 字元 / 256-bit Base64；沒設 → `IDX10703 key length is zero` |
| `EncryptionSettings:Key` | 32 bytes Base64；**必須照抄開發原值**，換新值 DB 既有加密資料解不開 |
| `EncryptionSettings:Iv` | 16 bytes Base64；同上，**不可換新值** |
| `ConnectionStrings:DefaultConnection` | 正式資料庫連線字串 |
| （其他 AI 金鑰 / Bot Token） | 視 user-secrets 內容一併搬 |

搬法（擇一，加密金鑰建議用環境變數，不落地成檔）：
- **環境變數**（巢狀用 `__`）：
  ```powershell
  [Environment]::SetEnvironmentVariable("JwtSettings__SecretKey","...","Machine")
  [Environment]::SetEnvironmentVariable("EncryptionSettings__Key","...","Machine")
  [Environment]::SetEnvironmentVariable("EncryptionSettings__Iv","...","Machine")
  [Environment]::SetEnvironmentVariable("ConnectionStrings__DefaultConnection","...","Machine")
  net stop was /y; net start w3svc
  ```
- **發布資料夾的 `appsettings.Production.json`**（不在 git repo，不算外漏；但下次 publish 會覆寫）。

> 也建議把 `RateLimitSettings:UseForwardedHeaders` 設 `true`，讓限流抓得到經 ngrok 轉發的真實 IP。

### 3-3. 建入口站台（系統管理員 PowerShell）

```powershell
Import-Module WebAdministration

# App Pool（全部共用這一個）：No Managed Code（ASP.NET Core 用 ASP.NET Core Module）
New-WebAppPool -Name "ReactL"
Set-ItemProperty "IIS:\AppPools\ReactL" -Name managedRuntimeVersion -Value ""

# 入口站台 ReactL：port 8000、主機名稱「留空」（不綁 ngrok 網址）、指向後端發布檔
New-WebSite -Name "ReactL" -Port 8000 -PhysicalPath "C:\app\ReactL.api" -ApplicationPool "ReactL" -Force

# 授予 IIS 讀取
icacls "C:\app\ReactL.api" /grant "IIS_IUSRS:(OI)(CI)RX" /T
```

> ⚠️ **繫結主機名稱留空**：ngrok 只把流量轉到 `localhost:8000`，IIS 只認 port、看不到 DNS。
> 留空＝萬用繫結，本機與 ngrok 進來都收得到；綁死網址反而會被擋（400/404）。`AllowedHosts:"*"` 已放行任何 Host。
>
> GUI 設資料夾權限：發布資料夾右鍵 → 內容 → 安全性 → 編輯 → 新增 → 輸入 **`IIS AppPool\ReactL`**
> （是 **`AppPool` 單數**，不是 AppPools；虛擬帳號不能用搜尋，要手打再「檢查名稱」）→ 給「讀取和執行」。

### 3-4. 驗證後端（只測 /api）

```powershell
curl http://localhost:8000/api/v1/public/personas
```

回 JSON / `success:true` 即後端託管成功。
此時 `/`、`/admin`、`/app` 還沒接，404 屬正常。

> ℹ️ **Swagger 只在開發模式提供，部署環境刻意關閉：**
> - 開發（Development）：有 Swagger，路徑 `/swagger`（不是 `/v1/swagger`）。
> - 部署（Production，8000）：刻意不提供，打 `/swagger` 一律 404，屬正常。
> 想看文件用本機 `https://localhost:44345/swagger`。

---

## 4. 前台 web（standalone build + pm2 + /app 子應用反向代理）

兩個資料夾各司其職：
- **`C:\app\ReactL_Web`**：Next 的 standalone 自包含輸出，用 **pm2 跑 `server.js`**（port 3000）。
- **`C:\app\ReactL_IIS_Web`**：IIS `/app` 子應用的實體資料夾，**只放一個反向代理 `web.config`**。

### 4-1. build 成 standalone 並搬到 C:\app\ReactL_Web

`next.config.ts` 已設 `basePath:'/app'` 與 `output:'standalone'`（改了要重 build，值烤進 bundle）。
確認 `.env.local` 是 ngrok 那組後：

```powershell
cd C:\source\ReactL\prompt-studio-web
npm install
npm run build

# 搬 standalone 輸出到 C:\app\ReactL_Web（standalone 不會自動帶 public 與 .next\static，要手動補）
$dest = "C:\app\ReactL_Web"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item ".next\standalone\*" -Destination $dest -Recurse -Force
Copy-Item "public"            -Destination $dest -Recurse -Force
Copy-Item ".next\static"      -Destination "$dest\.next" -Recurse -Force
# 手動放入 .env.local（standalone server.js 啟動時會讀；NEXT_PUBLIC_* 雖已 build 時烤入，仍建議放）
Copy-Item ".env.local"        -Destination "$dest\.env.local" -Force

# ★ 驗證必要項都在（缺 public / .next\static 會樣式跑掉或資源 404）
"server.js   : $(Test-Path "$dest\server.js")"
".next\static: $(Test-Path "$dest\.next\static")"
"public      : $(Test-Path "$dest\public")"
".env.local  : $(Test-Path "$dest\.env.local")"
```

產出 `C:\app\ReactL_Web\`（含精簡 `server.js`、`node_modules`、`.next\static`、`public`、`.env.local`）。
上面四個 `Test-Path` 都要是 `True` 才往下。

### 4-2. 用 pm2 跑 standalone（port 3000）

```powershell
npm install -g pm2     # 沒裝過才需要
pm2 start "C:\app\ReactL_Web\server.js" --name ps-web    # standalone server，預設 3000；因 basePath 服務在 /app
pm2 save
```

> 指定 port：server.js 讀 `PORT` 環境變數（預設 3000）。
> 開機自動：`pm2 startup`（Windows 需 pm2-windows-startup / NSSM）。
> 單獨測：`http://localhost:3000/app`（注意有 /app，因 basePath）。

### 4-3. 建 /app 子應用（反向代理，指向 C:\app\ReactL_IIS_Web）

```powershell
# 1) 建資料夾並放入反代 web.config（內容見 docs/部署指南/app-child-web.config）
New-Item -ItemType Directory -Force "C:\app\ReactL_IIS_Web" | Out-Null
# 把 app-child-web.config 複製成 C:\app\ReactL_IIS_Web\web.config

# 2) 掛成入口站台 ReactL 的 /app 子應用（用「新增應用程式」，不要「新增網站」；App Pool 沿用 ReactL）
Import-Module WebAdministration
New-WebApplication -Site "ReactL" -Name "app" -PhysicalPath "C:\app\ReactL_IIS_Web" -ApplicationPool "ReactL"
icacls "C:\app\ReactL_IIS_Web" /grant "IIS_IUSRS:(OI)(CI)RX" /T
```

> ⚠️ 同 5-2：`/app` 用「子應用（Add Application）」掛在 8000 站台底下，別用「新增網站」，否則 ngrok 到不了。
> GUI：右鍵 `ReactL` 站台 →「新增應用程式」→ 別名 `app`、集區 `ReactL`、實體路徑 `C:\app\ReactL_IIS_Web`。

> 反向代理對應：Next 設 `basePath:'/app'`，子應用收到 `/app/chat` 時規則的 `{R:1}=chat`，
> 補回 `/app` 反代成 `http://localhost:3000/app/chat`，與 Next 的 basePath 一致。

### 4-4. 驗證前台

```
http://localhost:8000/app          → 反向代理到 Next（/app），看到前台
```

---

## 5. 後台 admin（build + /admin 子應用）

### 5-1. 設定 env 並 build 成發布檔

`prompt-studio-admin` 已設 `base:'/admin/'`。確認 `.env.local` 是 ngrok 那組後 build 到指定資料夾：

```powershell
cd C:\source\ReactL\prompt-studio-admin
npm install
npx tsc -b
npx vite build --outDir "C:\app\ReactL_Admin" --emptyOutDir
```

產出 `C:\app\ReactL_Admin\`，index.html 資源為 `/admin/...`，並含 SPA fallback `web.config`（由 `public\` 帶入）。

> ⚠️ `tsc -b` 會型別檢查擋 build。曾修過：`PluggableList` 從 `unified` import（非 react-markdown）；
> `IconButton color` 只接受 `Color`（`violet|slate|green|red|amber|blue`），綠色用 `green`（即 emerald 配色），不可用 `emerald`。
> ⚠️ 改了 `VITE_*`（如 `VITE_PUBLIC_WEB_URL`）要**重 build**，值會烤進靜態檔。

### 5-2. 掛成 /admin 子應用（系統管理員）

> ⚠️ **一定要用「子應用（Application）」，不要用「新增網站（Add Website）」。**
> 「新增網站」會另開一個有自己 port 的**獨立站台**（例如 8001）——**ngrok 只轉發到 8000，到不了它**，
> admin 等於沒對外。「子應用」才是掛在 8000 站台底下的 `/admin` 路徑，ngrok 才到得了。
> 這步**不能省**：admin 要從 `.../admin` 出現，必須以子應用掛在入口站台底下。

**GUI 做法**（對照「新增應用程式」對話框逐欄填）：

1. IIS 管理員 → 左側展開 8000 入口站台 **`ReactL`** → **右鍵該站台** →「**新增應用程式…**」（Add Application）
2. **別名(Alias)**：`admin`　（→ 網址會是 `/admin`；對話框上方會顯示「站台名稱：ReactL、路徑：/」）
3. **應用程式集區**：按「選取」選 **`ReactL`**
4. **實體路徑**：`C:\app\ReactL_Admin`
5. （「預先載入已啟用」勾不勾皆可，靜態檔影響不大）→ **確定**

**指令做法**：
```powershell
Import-Module WebAdministration
# App Pool 沿用 3-3 建的 ReactL
New-WebApplication -Site "ReactL" -Name "admin" -PhysicalPath "C:\app\ReactL_Admin" -ApplicationPool "ReactL"
icacls "C:\app\ReactL_Admin" /grant "IIS_IUSRS:(OI)(CI)RX" /T
```

> 能直接服務靜態檔：後端 publish 的 web.config 有 `inheritInChildApplications="false"`，
> `/admin` 子應用不繼承 ASP.NET Core 處理器，IIS 以靜態檔模式服務。

### 5-3. 驗證後台

```
http://localhost:8000/admin        → 後台登入頁（靜態 dist，含 SPA fallback）
```

---

## 6. 啟動 ngrok，指向入口站台（8000）

> IIS 站台繫結**不要綁 ngrok 網址**（主機名稱留空即可）。ngrok 只是把流量轉到 `localhost:8000`，
> IIS 只認 port、看不到 DNS；綁死網址反而會因 Host header 不符被擋。`AllowedHosts:"*"` 已放行任何 Host。

### 6-1. 先停掉舊的 ngrok（免費版只能同時開一條）

到原本跑 ngrok 的視窗按 **Ctrl + C**；找不到視窗就強制關：
```powershell
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 6-2. 重新指到 8000

```powershell
ngrok http --url=election-hangnail-reopen.ngrok-free.dev 8000
# 若 --url 不吃，改用 --domain：
# ngrok http --domain=election-hangnail-reopen.ngrok-free.dev 8000
```

確認 `Forwarding` 那行右邊是 **`http://localhost:8000`**：
```
https://election-hangnail-reopen.ngrok-free.dev -> http://localhost:8000
```

### 6-3. 從對外網址測

- `https://election-hangnail-reopen.ngrok-free.dev/app` → 前台（連資料；首訪先點過 ngrok 警告頁）
- `https://election-hangnail-reopen.ngrok-free.dev/admin` → 後台

### 6-4. 設成常駐服務（不停機）

手動跑的 ngrok 視窗一關就斷。要常駐，設定檔 `%LOCALAPPDATA%\ngrok\ngrok.yml`（addr 設 8000）：

```yaml
version: "2"
authtoken: 你的TOKEN
tunnels:
  reactl:
    proto: http
    addr: 8000
    domain: election-hangnail-reopen.ngrok-free.dev
```

```powershell
ngrok service install --config "$env:LOCALAPPDATA\ngrok\ngrok.yml"
ngrok service start
```

---

## 7. 驗證順序（由下而上）

| # | 測試 | 預期 |
|---|------|------|
| 1 | `http://localhost:3000/app` | 前台 web 單獨 OK（有 /app） |
| 2 | `http://localhost:8000/api/v1/public/personas` | 後端直接託管 OK |
| 3 | `http://localhost:8000/app` | /app 子應用反代到前台 OK |
| 4 | `http://localhost:8000/admin` | /admin 子應用靜態 OK |
| 5 | `https://election-...ngrok-free.dev/app` | 經 ngrok 開前台（首訪點過警告頁） |
| 6 | `https://election-...ngrok-free.dev/admin` | 經 ngrok 開後台 |
| 7 | 前台送一則聊天 | API 不撞警告頁、SSE 串流逐字出現 |

> 對外入口：訪客用 `.../app`（前台）、`.../admin`（後台）。裸網址根目錄打到後端，無頁面屬正常。

---

## 8. 常見問題排查

| 症狀 | 可能原因 / 解法 |
|------|----------------|
| `/api` 回 500.19/500.30/502.5 | App Pool 非 No Managed Code；或缺 .NET 8 Hosting Bundle；或權限 |
| 登入失敗 / `IDX10703 key length is zero` | `JwtSettings:SecretKey` 沒搬到 production（3-2） |
| 加密相關 500 | `EncryptionSettings:Key/Iv` 沒搬或換了新值（3-2） |
| `/app` 回 502 | ARR proxy 未啟用（1-3）；或 web 沒在 3000 跑 |
| `/app` 資源 404 / 樣式跑掉 | Next 沒設 `basePath:'/app'`，或子應用反代沒補回 /app 前綴 |
| 聊天串流卡住、一次吐完 | ARR「Response buffer threshold」沒設 0（1-3） |
| `/app` 或 API 回 ngrok 警告頁 HTML | 前端請求沒帶 `ngrok-skip-browser-warning`（程式已加，確認有重新 build） |
| `/admin` 白畫面 / 資源 404 | admin 未以 `base:'/admin/'` build；或沒掛成 /admin 子應用 |
| `/admin` 重整子頁 404 | dist 缺 SPA fallback web.config（應由 public\ 帶入） |
| 邀請/分享連結指錯 | admin `VITE_PUBLIC_WEB_URL` 要含 `/app`（web 在 /app），改了要重 build admin |
| ngrok 網址重開就變 | 啟動沒帶 `--url=固定網址` |

---

## 9. 純本機開發如何切回

兩個前端 `.env.local` 的 ngrok 區註解掉、解開 dev 區，改 `npm run dev`：
- 後台：`http://localhost:5173/admin/`（Vite base `/admin/`）
- 前台：`http://localhost:3000/app`（Next basePath `/app` 在 dev 也生效）
- 後端：照舊 VS / IIS Express（44345）
