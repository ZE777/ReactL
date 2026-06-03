# LINE Bot 設定步驟

本文件說明如何將 Prompt Studio 後台建立的 Bot 與 LINE Official Account 串接，使 LINE 使用者的訊息能透過 Webhook 觸發 AI 回應。

---

## 前置條件

- 擁有 LINE 帳號（一般使用者帳號即可）
- 後端 API 服務正在運行

> 若已有 LINE Messaging API Channel 與後台 Bot，可直接跳至步驟一。

---

## 步驟零：建立 LINE Messaging API Channel 並取得憑證

### 0-1 建立 Provider 與 Channel

1. 前往 [LINE Developers Console](https://developers.line.biz/) 並以 LINE 帳號登入
2. 點選 **Create a Provider** → 輸入名稱（例如 `Prompt Studio`）→ 建立
3. 在 Provider 頁面點選 **Create a channel** → 選擇 **Messaging API**
4. 填入以下欄位：
   - **Channel name**：Bot 的顯示名稱（例如 `My AI Bot`）
   - **Channel description**：簡短說明
   - **Category / Subcategory**：任選
5. 勾選同意條款 → **Create**

### 0-2 取得 Channel Secret

1. 進入剛建立的 Channel → 點選 **Basic settings** 分頁
2. 找到 **Channel secret** 欄位
3. 點「**Issue**」（若尚未產生）或直接複製現有值
4. 記下此值，後續填入後台 Bot 建立表單的 **Channel Secret** 欄位

### 0-3 取得 Channel Access Token（長期有效版）

1. 點選 **Messaging API** 分頁
2. 捲動至 **Channel access token** 區塊
3. 點「**Issue**」產生長期有效 Token（Long-lived channel access token）
4. 複製此 Token，後續填入後台 Bot 建立表單的 **Token** 欄位

> **Channel Secret vs Channel Access Token 的用途：**
> - **Channel Secret**：後端用來驗證 LINE 傳來的 Webhook 請求是否真實（簽名驗證），防偽造
> - **Channel Access Token**：後端用來呼叫 LINE Reply API 回傳 AI 訊息給使用者

### 0-4 在後台建立 Bot 並填入憑證

1. 進入 Prompt Studio 後台 → **Bot 管理頁** → **新增 Bot**
2. 填入以下資訊：
   - **Bot 名稱**：自訂識別名稱
   - **Platform**：選擇 `Line`
   - **Token**：貼上步驟 0-3 取得的 Channel Access Token
   - **Channel Secret**：貼上步驟 0-2 取得的 Channel Secret
   - **AI 模型**：選擇要使用的模型
   - **Persona**：（選填）指定 AI 角色設定
3. 儲存後確認 Bot 狀態 Toggle 為**運行中**（藍色）

---

## 步驟一：取得 Webhook 路徑

1. 進入後台 **Bot 管理頁**
2. 在對應 Bot 的卡片上，找到 Token 行下方的灰色 Webhook 路徑
3. 點「**複製路徑**」按鈕，取得格式為 `/webhooks/line/{botId}` 的路徑

> 此路徑需要加上後端的 Base URL 才是完整的 Webhook URL。

---

## 步驟二：取得可公開訪問的 HTTPS URL

LINE 要求 Webhook URL 必須是公開可訪問的 HTTPS 位址。

### 正式環境
直接使用部署後的後端 Domain，例如：
```
https://api.yourdomain.com
```

### 本地開發環境（使用 ngrok）

**安裝 ngrok：**
1. 前往 [https://ngrok.com/download](https://ngrok.com/download) 下載 Windows 版本
2. 解壓縮，將 `ngrok.exe` 放置於任意目錄（建議 `C:\ngrok\`）
3. 前往 [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) 複製 authtoken
4. 設定 authtoken：
   ```powershell
   & "C:\ngrok\ngrok.exe" config add-authtoken <你的authtoken>
   ```

**啟動 tunnel：**
```powershell
& "C:\Users\ze7\Downloads\ngrok.exe" http --host-header=rewrite https://localhost:44345
```

> **重要：必須加上 `--host-header=rewrite`**
> IIS Express 只接受 Host header 為 `localhost:44345` 的請求。若不加此參數，ngrok 會把外部網址（如 `xxxx.ngrok-free.dev`）直接帶入 Host header，導致 IIS Express 在 ASP.NET Core 啟動前就回傳 400 Bad Request，後端程式碼完全不會執行。

啟動後會顯示類似：
```
Forwarding  https://xxxx-xxx-xxx.ngrok-free.app -> https://localhost:44345
```

複製 `https://xxxx-xxx-xxx.ngrok-free.app` 作為本次的 Base URL。

> **注意：** 免費版 ngrok 每次重啟 URL 會變更，需重新至 LINE Developer Console 更新 Webhook URL。

---

## 步驟三：設定 LINE Developer Console

1. 前往 [LINE Developers Console](https://developers.line.biz/) → 選擇對應的 Channel
2. 點選 **Messaging API** 分頁
3. 將 **Webhook URL** 填入完整路徑：
   ```
   https://<Base URL>/webhooks/line/<botId>
   ```
   範例：
   ```
   https://xxxx-xxx-xxx.ngrok-free.app/webhooks/line/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
4. 開啟 **Use webhook**（切換為 Enabled）
5. 點擊 **Verify** 確認後端回傳 200 成功

---

## 步驟四：設定 LINE OA Manager 回應模式

LINE Official Account 預設會開啟聊天與自動回覆，必須切換為 Webhook 模式，否則訊息不會交由後端處理。

1. 前往 [LINE Official Account Manager](https://manager.line.biz/)
2. 選擇對應帳號 → 左側選單 **回應設定**
3. 依照下表設定各項目：

   | 項目 | 正確設定 | 說明 |
   |------|----------|------|
   | 聊天 | **關閉** | 開啟時由真人客服回覆，Webhook 不會觸發 |
   | Webhook | **開啟** | 必須開啟，訊息才會送至後端 Webhook URL |
   | 自動回應訊息 | **關閉** | 開啟會導致 LINE 自動回覆，干擾 AI 回應 |
   | 加入好友歡迎訊息 | 可依需求開關 | 不影響 Webhook 運作 |

4. 儲存後，回到 **回應設定** 頁頂端確認「**回應模式**」顯示為 **Webhook**

> **驗證方式：** 傳訊息給 Bot 後，LINE 畫面出現「**已讀**」代表訊息已送達並由後端 Webhook 接收成功。若仍顯示「**傳送中**」或沒有已讀，請重新確認 Webhook URL 設定（步驟三）。

---

## 步驟五：測試驗證

1. 用 LINE 加入你的官方帳號為好友
2. 傳送一則訊息
3. Bot 應回傳 AI 回應（非「本帳號無法個別回覆」的預設訊息）
4. 回到後台 **外部對話監控頁**，確認訊息記錄出現

---

## 常見問題

| 問題 | 原因 | 解法 |
|------|------|------|
| Bot 回覆「本帳號無法個別回覆用戶的訊息」| LINE OA 自動回覆未關閉 | 步驟四關閉自動回覆 |
| Verify 失敗 | Webhook URL 錯誤或後端未啟動 | 確認 URL 格式、後端服務正常運行 |
| ngrok 啟動後 Verify 成功但收不到訊息 | Use webhook 未開啟 | LINE Console → Messaging API → Use webhook → Enabled |
| 重啟 ngrok 後無法收訊 | ngrok 免費版 URL 已更換 | 重新取得新 URL 並更新 Webhook URL |
| Verify 回傳 400，但後端 log 完全沒輸出 | ngrok 未加 `--host-header=rewrite`，IIS Express 因 Host header 不符拒絕請求 | 停止 ngrok，改用 `ngrok http --host-header=rewrite https://localhost:44345` 重啟 |
| 後台監控頁無資料 | Bot 狀態為「已停用」| Bot 管理頁將 Toggle 開啟為「運行中」|
| 訊息顯示已讀但 Bot 無回應 | LINE OA 回應模式未切換為 Webhook，或 Webhook 設定未儲存 | 步驟四確認「回應模式」頂端顯示 **Webhook**，並確認 Webhook 欄位為「開啟」|
