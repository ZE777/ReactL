# Discord Bot 設定步驟

本文件說明如何將 Prompt Studio 後台建立的 Bot 與 Discord 串接，使 Discord 使用者能透過 Slash Command `/chat` 觸發 AI 回應。

---

## 前置條件

- 擁有 Discord 帳號
- 後端 API 服務正在運行
- 已安裝並登入 ngrok（本地開發環境）

> 若已有 Discord Application 與後台 Bot，可直接跳至步驟三。

---

## 步驟零：建立 Discord Application 並取得憑證

### 0-1 建立 Application 與 Bot

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications) 並登入
2. 點選右上角 **New Application** → 輸入名稱 → **Create**
3. 左側選單點選 **Bot**
4. 點選 **Add Bot** → 確認 **Yes, do it!**

### 0-2 取得 Bot Token

1. Bot 頁面找到 **Token** 區塊
2. 點選 **Reset Token** → 確認後複製 Token
3. 此 Token 後續填入後台 Bot 建立表單，**請勿洩漏或寫入版控**

### 0-3 取得 Application Public Key

1. 左側選單點選 **General Information**
2. 找到 **Public Key** 欄位（64 字元的 hex 字串）
3. 複製此值，後續設定 User Secrets 用

### 0-4 取得 Application ID

1. **General Information** 頁面找到 **Application ID**
2. 複製此值，後續 ngrok 測試驗證端點時需要用到

### 0-5 開啟 Message Content Intent

1. 左側選單點選 **Bot**
2. 往下找到 **Privileged Gateway Intents**
3. 開啟 **Message Content Intent**（讀取使用者訊息文字所需）
4. 儲存變更

---

## 步驟一：在後台建立 Discord Bot

1. 進入 Prompt Studio 後台 → **Bot 管理頁** → **新增 Bot**
2. 填入以下資訊：
   - **Bot 名稱**：自訂識別名稱
   - **Platform**：選擇 `Discord`
   - **Token**：貼上步驟 0-2 取得的 Bot Token
   - **AI 模型**：選擇要使用的模型
   - **Persona**：（選填）指定 AI 角色設定
   - **Discord Application ID**：貼上步驟 0-4 取得的 Application ID
   - **Discord Public Key**：貼上步驟 0-3 取得的 64 字元 hex 公鑰
   - **Webhook 基礎 URL**：（選填）若此 Bot 部署在特定伺服器可填入，留空使用系統預設 BaseUrl
3. 儲存後確認 Bot 狀態 Toggle 為**運行中**（藍色）

> **★ 儲存時會自動註冊 `/chat` 指令：** 後端會用你填入的 Token 與 Application ID 自動向 Discord 註冊 Global `/chat` 指令（取代舊版需手動執行的 PowerShell 步驟）。
> - **成功** → 跳出綠色提示「/chat 指令已自動註冊」。
> - **失敗**（多為 Token / Application ID 填錯）→ 跳出**錯誤 Modal** 顯示原因，且該 Bot 卡片狀態欄會顯示紅色 **`⚠ 指令無效`**（重新整理後仍會顯示）。請點「編輯」修正 Token / Application ID 後重新儲存，紅標消失即代表註冊成功。
> - 此時請確保**後端 + ngrok 已啟動**（註冊需即時連線 Discord）。

---

## 步驟二：取得 Webhook 路徑

1. 進入後台 **Bot 管理頁**
2. 在對應 Bot 的卡片上找到 Webhook 路徑
3. 點「**複製路徑**」取得格式為 `/webhooks/discord/{botId}` 的路徑

> 此路徑需要加上後端的 Base URL 才是完整的 Interactions Endpoint URL。

---

## 步驟三：取得可公開訪問的 HTTPS URL

Discord 要求 Interactions Endpoint URL 必須是公開可訪問的 HTTPS 位址。

### 正式環境

直接使用部署後的後端 Domain：
```
https://api.yourdomain.com
```

### 本地開發環境（使用 ngrok）

**ngrok 免費帳號靜態 Domain 說明：**

ngrok **免費帳號**登入後，系統會配發一個**永久固定**的靜態 Domain（格式為三個英文單字）。本專案目前的靜態 Domain 為：

```
https://election-hangnail-reopen.ngrok-free.dev
```

此 URL 不論重啟幾次都不會改變，不需要每次回 Discord Developer Portal 更新 Interactions Endpoint URL。

> 未登入帳號時，每次重啟 ngrok 都會產生全新的隨機 URL（如 `a1b2c3.ngrok-free.app`），需手動重新設定。**強烈建議登入帳號並使用靜態 Domain。**

**啟動 ngrok tunnel（必須指定 `--domain`）：**
```powershell
& "C:\Users\ze7\Downloads\ngrok.exe" http --domain=election-hangnail-reopen.ngrok-free.dev --host-header=rewrite https://localhost:44345
```

> **`--domain` 參數**：指定使用靜態 Domain。缺少此參數時 ngrok 會另外產生一個臨時 URL，靜態 Domain 就沒有用到。
>
> **`--host-header=rewrite`**：IIS Express 只接受 Host header 為 `localhost:44345` 的請求。若不加此參數，ngrok 會把外部網址直接帶入 Host header，導致 IIS Express 在 ASP.NET Core 啟動前就回傳 400，後端程式碼完全不會執行。

啟動成功後會顯示：
```
Forwarding  https://election-hangnail-reopen.ngrok-free.dev -> https://localhost:44345
```

---

## 步驟四：在後台填入 Discord 憑證與設定 Interactions Endpoint URL

> **架構說明：** PublicKey 與 Application ID 存在每筆 BotBinding 資料庫記錄中，不再使用全域 User Secrets。後端驗簽時從 DB 讀取對應 Bot 的公鑰，因此多組 Discord Bot 互不干擾。

### 4-1 在後台 Bot 管理頁填入 Discord 憑證

1. 進入 Prompt Studio 後台 → **Bot 管理頁**
2. 找到目標 Bot → 點選**編輯**（鉛筆圖示）
3. 填入以下欄位：
   - **Discord Application ID**：Developer Portal → General Information → Application ID
   - **Discord Public Key**：Developer Portal → General Information → Public Key（64 字元 hex）
4. 儲存變更，後端即可正確驗簽

> PublicKey 用於 Ed25519 簽名驗證，確保每個 Interactions 請求確實來自 Discord，防偽造。未填時後端會記錄警告並暫時放行（僅限本機開發）。

### 4-2 填入 Discord Developer Portal

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications) → 選擇你的 Application
2. 左側選單點選 **General Information**
3. 找到 **Interactions Endpoint URL** 欄位
4. 填入完整路徑：
   ```
   https://election-hangnail-reopen.ngrok-free.dev/webhooks/discord/{botId}
   ```
   範例：
   ```
   https://election-hangnail-reopen.ngrok-free.dev/webhooks/discord/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
5. 點選 **Save Changes**，Discord 會立即發送 PING 請求驗證端點
6. 後端回傳 `{"type":1}` 即驗證通過，欄位旁出現綠色勾勾

> 若儲存時顯示錯誤，代表 PING 驗證失敗，請確認：後端服務正在運行、ngrok 已啟動、User Secrets 已設定並重啟後端。

---

## 步驟五：邀請機器人進入伺服器

最簡單的方式是直接用**後台卡片上的邀請連結**：

1. 後台 **Bot 管理頁** → 該 Discord Bot 卡片 → 點「**複製邀請連結**」或「**開啟邀請**」
   - 此連結由後台依 Application ID 自動產生，已內含所需 scope（`bot`、`applications.commands`）與權限（`Send Messages`、`Read Message History` = `67584`）
2. 開啟連結 → 選擇要加入的 Discord 伺服器 → **授權**

> 也可改從 Discord Developer Portal → **OAuth2 → URL Generator** 自行產生（Scopes 勾 `bot`、`applications.commands`；Bot Permissions 勾 `Send Messages`、`Read Message History`），效果相同。
>
> Bot 加入後在成員列表顯示「離線」是正常的——本 Bot 走 HTTP Interactions，不維持長連線，但 `/chat` 照常可用。

---

## 步驟六：`/chat` 指令已自動註冊（無須手動）

**自步驟一儲存 Bot 起，後端已自動為你註冊 Global `/chat` 指令**，不需要再手動執行任何 API 或 PowerShell。

- 註冊採 **Global 指令**：對 Bot 加入的所有伺服器皆生效，建立當下不需要 GuildId。
- 首次註冊後，`/chat` 出現在伺服器斜線選單最久約數分鐘 ~ 1 小時傳播（通常很快）。
- 在後台**編輯 Bot 或更換 Token** 時也會自動重新註冊。

> **若 `/chat` 一直沒出現：** 先確認後台該 Bot 卡片**沒有**紅色 `⚠ 指令無效` 標記。若有，代表自動註冊失敗，請點「編輯」修正 Token / Application ID 後重新儲存。
>
> **手動註冊（備援，一般用不到）：** 萬一需要手動處理，可用 Discord API 全量覆寫指令：
> ```powershell
> $headers = @{ "Authorization" = "Bot 你的BotToken"; "Content-Type" = "application/json" }
> $body = @(@{
>     name = "chat"; description = "與 AI 助理對話"; type = 1
>     options = @(@{ name = "message"; description = "你想問的問題"; type = 3; required = $true })
> }) | ConvertTo-Json -Depth 5
> # Global 指令（與後端自動註冊一致）
> Invoke-RestMethod -Uri "https://discord.com/api/v10/applications/你的ApplicationId/commands" -Method Put -Headers $headers -Body $body
> ```

---

## 步驟七：測試驗證

1. 進入你的 Discord 伺服器
2. 在任意頻道輸入 `/chat`，選單應出現 `chat` 指令
3. 填入 `message` 參數並送出
4. Bot 顯示「思考中...」，片刻後出現 AI 回應
5. 回到後台 **外部對話監控頁** → 切換至 Discord 分頁，確認訊息記錄出現

---

## 常見問題

| 問題 | 原因 | 解法 |
|------|------|------|
| Interactions Endpoint URL 儲存失敗 | PING 驗證未通過 | 確認後端運行、ngrok 啟動、User Secrets 已設定後重啟後端 |
| 輸入 `/chat` 後沒有出現指令選單 | 自動註冊失敗，或 Global 指令仍在傳播 | 先看後台卡片有無紅色 `⚠ 指令無效`：有 → 編輯修正 Token / Application ID 重存；無 → 等數分鐘讓 Global 指令傳播後重整 Discord |
| 後台卡片顯示紅色 `⚠ 指令無效` | `/chat` 自動註冊失敗（Token / Application ID 錯誤等） | 點「編輯」依錯誤 Modal 提示修正後重新儲存，紅標消失即成功 |
| Bot 無回應（沒有「思考中...」）| Interactions Endpoint URL 設定錯誤或後端未運行 | 確認 URL 格式與後端狀態 |
| Bot 出現「思考中...」但沒有後續回應 | AI 呼叫失敗或後端錯誤 | 查看後端 log（`logs/log-日期.txt`）確認錯誤原因 |
| 後台監控頁 Discord 分頁無資料 | Bot 狀態為「已停用」 | Bot 管理頁將 Toggle 開啟為「運行中」 |
| 重啟 ngrok 後 Interactions 失敗 | 未使用靜態 Domain，URL 已更換 | 改用 `--domain=election-hangnail-reopen.ngrok-free.dev` 啟動 ngrok |
| 伺服器錯誤 400，後端 log 無輸出 | ngrok 未加 `--host-header=rewrite` | 停止 ngrok，加上 `--host-header=rewrite` 重啟 |
| Ed25519 驗簽失敗 | PublicKey 填寫錯誤 | 後台 Bot 編輯頁確認 Discord Public Key 與 Developer Portal 的 Public Key 一致（64 字元 hex）|
