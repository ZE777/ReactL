---
name: 後台管理路由與 SPA (React + Vite)
description: 對內管理後台採用 Vite 打包的 React SPA、react-router-dom 路由與 Auth Guard 守則。本文件僅涵蓋「對內」這一軌；對外官網請見 SKILL_對外官網路由_Next。
---

# 技能指令：後台管理路由與 SPA（Vite）

> 本檔案是雙軌制的**對內**這一軌。架構決策、兩軌動機對照與不可混用原則見 [SKILL_雙軌路由與SSR切分](SKILL_雙軌路由與SSR切分.md)。

## 0. 為什麼是 Vite 而不是 Next.js？

後台管理系統**完全不需要被搜尋引擎收錄**（事實上應該被 `robots.txt` 阻擋），SSR 就成了純粹的伺服器算力浪費。Vite 把整個應用打包成靜態檔，瀏覽器一次載入後完全脫離 Server，後續換頁全部走 client-side route，互動延遲最低；開發期 Vite 的冷啟動與 HMR 也明顯快於 Next.js dev server，是內部高頻迭代的最佳選擇。

## 1. 路由機制：`react-router-dom`

統一採用 `react-router-dom` v6+ 的宣告式路由：

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/Auth/RequireAuth';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { OrderListPage } from '@/pages/Orders/List';
import { FeatureConfigPage } from '@/pages/Admin/FeatureConfig';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公開路由 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保護路由：必須登入才能進入 */}
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrderListPage />} />

          {/* 高權限路由：再多套一層角色檢查 */}
          <Route
            path="/admin/feature-config"
            element={
              <RequireAuth roles={['SYSTEM_ADMIN']}>
                <FeatureConfigPage />
              </RequireAuth>
            }
          />
        </Route>

        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

*   **巢狀 Layout：** 用 `<Route element={<AdminLayout />}>` 包子路由，避免每頁重複寫 Sidebar / Topbar
*   **Lazy Load：** 路由元件以 `React.lazy(() => import('./pages/...'))` 載入，配合 Vite 自動 code-splitting
*   **參數化路由：** `path="/orders/:id"`，元件內以 `useParams()` 取出

## 2. Auth Guard：頂層 Token 攔截

所有受保護的路由都必須走頂層 `RequireAuth` 元件，**不可**只靠隱藏選單按鈕來保護路由（該路徑會出現在打包後的 JS bundle 中，攻擊者直接打 URL 即可繞過）。

```tsx
// src/features/Auth/RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from './hooks/useCurrentUser';

interface Props {
  children: React.ReactNode;
  roles?: string[]; // 可選的角色限制
}

export function RequireAuth({ children, roles }: Props) {
  const { user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) return <FullScreenSpinner />;

  // Token 無效 → 導去登入頁，記住來源以便登入後返回
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 角色不符 → 403
  if (roles && !roles.some(r => user.roles.includes(r))) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
```

> ⚠️ **權限驗證**最終必須在**後端**完成。前端 Auth Guard 只是 UX 優化（避免使用者看到無權限的畫面與錯誤訊息），不是安全邊界。後端每一支 API 都必須獨立檢查 `[GL02Authentication]` 與 `[GL02Authorization(FunctionCodes)]`。

## 3. 環境變數：`import.meta.env.VITE_*`

```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true, // 走 HttpOnly Cookie 模式
});
```

*   所有要暴露給瀏覽器的變數必須以 `VITE_` 開頭，否則 Vite 不會注入
*   詳細切分見 [SKILL_動態設定與Mock假資料](SKILL_動態設定與Mock假資料.md)

## 4. CSP：由 IIS Web.config 設定

Vite 產出純靜態檔，**沒有 Server runtime 可動態組 CSP**，必須交給 Web Server（IIS / Nginx）在回應時注入。

```xml
<!-- IIS Web.config 片段 -->
<httpProtocol>
  <customHeaders>
    <add name="Content-Security-Policy"
         value="default-src 'self'; script-src 'self'; ..." />
  </customHeaders>
</httpProtocol>
```

完整設定（含所有安全 Headers、`X-Frame-Options`、HSTS）見 [workflows/02-版本控管與CI-CD部署管線](../workflows/02-版本控管與CI-CD部署管線.md)。

> ⚠️ **Vite 建置陷阱：** Vite 預設會產生 `modulepreload polyfill` 的 inline `<script>`。若 CSP 嚴格禁用 inline script，需安裝 `vite-plugin-csp` 自動注入 hash，或在 `vite.config.ts` 設定 `build.modulePreload.polyfill: false` 避免。

## 5. i18n：採 `react-i18next`

後台採用 `react-i18next`（純 client-side，與 SPA 模式契合），詞綴字典結構與 [SKILL_多國語系i18n實作](SKILL_多國語系i18n實作.md) 規範一致。

## 6. Token 存放：強烈建議 HttpOnly Cookie

後台具有**最高權限**（管理訂單、客戶 PII、系統設定），一旦 Token 被 XSS 竊取，影響遠大於對外站。

*   **首選：** HttpOnly Secure Cookie（前端 JS 完全碰不到 Token）
*   **次選（不建議）：** localStorage — 僅在無敏感操作的特殊情境下使用，須極短 Token 有效期 + 嚴格 CSP + 瀏覽器指紋綁定

詳見 [SKILL_API層與攔截快取](SKILL_API層與攔截快取.md) 方案 A / B。

## 7. 部署

*   **建置產物：** `vite build` → `dist/` 純靜態檔
*   **服務方式：** 直接由 IIS / Nginx 服務靜態檔，**不需要** Node.js runtime
*   **SPA Fallback：** Web Server 必須將所有未命中的路徑 fallback 到 `index.html`（讓 react-router 接管），否則重整深層路由會 404

```xml
<!-- IIS URL Rewrite 範例 -->
<rule name="SPAFallback" stopProcessing="true">
  <match url=".*" />
  <conditions>
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
  </conditions>
  <action type="Rewrite" url="/index.html" />
</rule>
```

## 8. 不可做的事

| ❌ 禁止 | 為什麼 |
|--------|--------|
| 把後台路徑放進 `sitemap.xml` 或允許爬蟲索引 | 後台是內部資產，不應出現在搜尋引擎 |
| 用「不在選單顯示」當作權限保護 | 路徑包含在 JS bundle 中，DevTools 可直接看到，必須走 Auth Guard + 後端權限 |
| 把 Feature Flag 狀態寫進 `localStorage` | 任何人可用 DevTools 改值，必須由後端 API 控管 |
| 在 Vite SPA 寫 `getServerSideProps` 之類的 Next.js API | 框架不同，會直接報錯 |
| 用 `process.env.VITE_xxx` 取環境變數 | Vite 用 `import.meta.env.VITE_*`，混用會拿不到值 |
