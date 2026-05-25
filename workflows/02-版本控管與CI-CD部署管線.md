---
description: 說明從 Git 本機開發、Pull Request 合併，直到 CI/CD 自動化建置並推此至 IIS/PM2 伺服器的完整 DevOps 生命週期。
---

# 工作流程 (Workflow)：版本控管與 CI/CD 自動化發布管線

這個工作流將開發者的「日常 Git 提交」、上線前的「自我檢查」，與雲端的「自動部署」整併為一條連貫的自動化管線 (DevOps Pipeline)。

## Phase 1: 本機開發與發起 PR (Local Development)
在我們開始寫 Code 並準備提交時，遵守以下主幹開發流程：
1. **開立分支：** 嚴禁推送 `main` 分支。一律開設如 `feature/TASK-123/add-login-form` 分支。
2. **前端自我防護卡控 (Pre-commit Hooks)：**
   透過 Husky 與 lint-staged，每一次 `git commit` 都會在背景自動執行 `npm run lint` 與 `npm run test:run`。只要語法有錯或測試未過，絕對無法提交。
3. **發布 Pull Request (PR) 審核：**
   將程式推上雲端後建立 PR，強制套用 AI 或資深工程師的 **RADIO 框架** 進行審查。
4. **Squash and Merge：**
   確保同意合併時選用 Squash Merge，把無數個小 Commit 壓縮成單一有意義的節點，讓版控歷史永遠維持一條乾淨直線。

## Phase 2: CI 持續整合 (Continuous Integration)
當 PR 發起進入 `main` 分支的同時，觸發雲端 CI Runner (如 GitHub Actions 的 `ci.yml`)：
1. **環境建立：** 在雲端跑起 Node.js 容器。
2. **靜態分析與防護：** 雲端再次強制執行 ESLint 與 Unit Tests。
3. **安全掃描 (Security Scanning)：**
   > ⚠️ 此步驟為**必要的安全防線**，不可跳過或標記為 allow-failure。
   
   *   **SCA (Software Composition Analysis) — 第三方套件漏洞掃描：**
       執行 `npm audit --audit-level=high`，若發現 HIGH 或 CRITICAL 等級的已知漏洞，Pipeline 即告失敗。
       建議額外整合 Dependabot 或 Renovate 進行自動化依賴更新 PR。
   *   **Secret Scanning — 機敏資訊洩漏偵測：**
       使用 GitLeaks 或 TruffleHog 掃描 commit 內容，防止 API Key、密碼、Private Key 等機敏資訊意外提交至版控。
       ```yaml
       # GitHub Actions 範例
       - name: Secret Scanning
         uses: gitleaks/gitleaks-action@v2
         env:
           GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
       ```
   *   **SAST (Static Application Security Testing) — 程式碼安全分析：**
       使用 Semgrep 掃描常見的安全漏洞模式（XSS、Injection、不安全的 eval 使用等）。
       ```yaml
       - name: SAST Scan
         uses: returntocorp/semgrep-action@v1
         with:
           config: >-
             p/owasp-top-ten
             p/react
             p/typescript
       ```

4. **編譯預演 (Dry Run Build)：** 
   雲端執行 `npm run build` 以及型別檢查 `tsc --noEmit`。這裡特別監控 **Chunk Size**，如果打包出超過 500kb 的異常大檔案，Pipeline 即告失敗，通知開發者回去切分 Code Splitting。

## Phase 3: CD 持續部署與發布架構 (Continuous Deployment)
當主管按下綠色 Merge 按鈕，PR 正式進入 `main` 分支後，自動觸發 CD 腳本 (`deploy.yml`) 去對接我們的 IIS 伺服器：

### 1. 安全連線與覆蓋
自動透過 SSH 金鑰連入生產機 (IIS 伺服器)，拉取最新的打包產物。

### 2. PM2 守護進程自動重啟
利用 PM2 作為 Node 服務守護者，觸發 `pm2 reload ecosystem.config.js` 達到 **零停機重啟 (Zero downtime)**。
*(註：專案首次建置的 pm2 設定檔範例)*
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "frontend-app",
    script: "npm",
    args: "start",
    instances: "max",
    exec_mode: "cluster"
  }]
}
```

### 3. IIS 反向代理 (Reverse Proxy) 接管
外部使用者的 80/443 與 SSL 憑證交由 IIS 負責。IIS 再透過 **URL Rewrite 與 ARR** 將流量全數轉發給內部悄悄運作的 PM2 (如 Port 3000)。
*(註：站台 Web.config 轉發設定範例 — 含安全 Headers)*

> ⚠️ **安全 Headers 為必要配置。** 缺少這些 Headers 將導致 XSS、Clickjacking、MIME Sniffing 等攻擊面暴露。

```xml
<configuration>
  <system.webServer>
    <!-- 安全 HTTP Headers -->
    <httpProtocol>
      <customHeaders>
        <!-- 防止 MIME Type Sniffing -->
        <add name="X-Content-Type-Options" value="nosniff" />
        <!-- 防止 Clickjacking（禁止被嵌入 iframe） -->
        <add name="X-Frame-Options" value="DENY" />
        <!-- 停用瀏覽器內建 XSS Filter（現代瀏覽器建議關閉，改用 CSP） -->
        <add name="X-XSS-Protection" value="0" />
        <!-- 限制 Referrer 資訊洩漏 -->
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <!-- 限制瀏覽器 API 權限（攝影機、麥克風、地理位置） -->
        <add name="Permissions-Policy" value="camera=(), microphone=(), geolocation=()" />
        <!-- 強制 HTTPS（啟用前請確認 SSL 憑證已正確配置） -->
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
        <!-- CSP — 依專案實際使用的 CDN/API 域名調整白名單 -->
        <!-- 注意：若 Vite 建置產生 inline script（如 modulepreload polyfill），
             需使用 vite-plugin-csp 自動注入 hash，或調整 vite.config.ts 設定
             build.modulePreload.polyfill: false 避免產生 inline script。 -->
        <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" />
        <!-- 移除洩漏伺服器技術的 Headers -->
        <remove name="X-Powered-By" />
      </customHeaders>
    </httpProtocol>
    <!-- 移除 Server Header -->
    <security>
      <requestFiltering removeServerHeader="true" />
    </security>
    <!-- 反向代理轉發 -->
    <rewrite>
      <rules>
        <rule name="ReverseProxyToPM2" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

**Headers 說明：**
| Header | 防禦目標 |
|--------|---------|
| `X-Content-Type-Options: nosniff` | 防止瀏覽器猜測 MIME Type，阻止將非腳本檔案當作 JS 執行 |
| `X-Frame-Options: DENY` | 禁止本站被嵌入任何 iframe，防禦 Clickjacking |
| `Strict-Transport-Security` | 強制瀏覽器僅透過 HTTPS 連線，防止 SSL Stripping 攻擊 |
| `Referrer-Policy` | 限制跳轉時洩漏的 URL 資訊（防止 URL 中的 Token/ID 外洩） |
| `Permissions-Policy` | 停用不需要的瀏覽器 API，縮小攻擊面 |
| `Content-Security-Policy` | 限制可執行腳本/可連線 API 的來源，核心 XSS 防線 |
| 移除 `X-Powered-By` / `Server` | 隱藏伺服器技術棧資訊，增加攻擊者偵察成本 |

## Phase 4: Slack/Teams 部署通知
不論 Phase 2 或 Phase 3 成功與否，Pipeline 最終會自動打一支 Webhook 到團隊通訊軟體，通知 QA 開發版或正式版已經上線可供測試。
