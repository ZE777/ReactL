---
name: 功能開關 (Feature Toggles / Flags)
description: 解答如何在不用重新編譯的狀態下，動態開啟或關閉測試性質的新功能組合。
---

# 技能指令：功能開關 (Feature Toggles) 實作架構

針對您提問的：**「這個 Flag 放哪邊？會不會提供頁面做功能開關？」**
這裡為您設計一套兼具「安全隱密性」與「強大可控性」的業界標準 Feature Flag 架構。

## 1. 開關設定來源優先級 (Fallbacks)

我們不用花大錢去買外部 LaunchDarkly 服務，而是自己搭建一個支援三層優先級的 Context：

1. **最高優先 (後端 API 即時派發)：** 由後端 API 根據使用者身份、環境、IP 白名單等條件，動態回傳該使用者可用的 Feature Flag 清單。
2. **次高優先 (管理員介面狀態)：** 透過受認證的管理 API 讀寫，狀態存於**後端資料庫**（非前端 localStorage）。
3. **最低優先 (系統預設定義)：** `.env` 中寫定的預設值，作為後端 API 無法取得時的 Fallback。

> ⚠️ **[安全規範] URL Query Override 的限制**
>
> **Production 環境嚴禁**透過 URL Query Parameters（如 `?features=NEW_PAYMENT`）覆寫 Feature Flag。
> 原因：前端環境變數判斷（如 `process.env.NODE_ENV`、`import.meta.env.DEV`）在建構時即被內嵌至 JavaScript bundle，
> 若 build 設定錯誤或攻擊者觀察到條件分支，即可繞過此防線。
>
> **正確做法：** URL Override 的判斷必須由**後端 API 層**執行（結合 IP 白名單或內部 VPN 判斷），前端不可自行決定是否啟用。

### 後端 API 控制模式（推薦）

Feature Flag 的解析由後端 API 負責，前端僅為消費者：

```typescript
// src/features/Flags/hooks/useFeatureFlags.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

/**
 * 從後端取得當前使用者可用的 Feature Flag 清單。
 * 後端根據環境、使用者角色、IP 白名單等條件決定回傳內容。
 * 開發環境的 URL Query Override 也由後端解析（前端傳遞 query string 至 API）。
 */
export function useFeatureFlags() {
  const { data: flags = [] } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: () => apiClient.get<string[]>('/api/feature-flags'),
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasFeature: (flag: string) => flags.includes(flag),
    flags,
  };
}
```

```csharp
// 後端 API 範例（ASP.NET Core）

// 1. 讀取端點 — 一般已認證使用者皆可呼叫
[HttpGet("feature-flags")]
[GL02Authentication]
public IActionResult GetFeatureFlags()
{
    var flags = _featureFlagService.GetFlagsForUser(CurrentUserID);

    // URL Override 僅在非 Production + 內部 IP 時允許
    if (!_env.IsProduction() && IsInternalIP(HttpContext.Connection.RemoteIpAddress))
    {
        var urlOverrides = Request.Query["features"].ToString().Split(',');
        flags = flags.Union(urlOverrides).ToList();
    }

    return Ok(flags);
}

// 2. 管理端點 — 僅限 SYSTEM_ADMIN 角色，需搭配 GL02Authorization 權限檢查
[HttpPut("admin/feature-flags")]
[GL02Authentication]
[GL02Authorization(FunctionCodes = new[] { "FEATURE_FLAG_ADMIN" })]
public IActionResult UpdateFeatureFlag([FromBody] FeatureFlagUpdateDto dto)
{
    _featureFlagService.UpdateFlag(dto.Flag, dto.Enabled, CurrentUserID);
    // 審計日誌：記錄操作者、時間、變更內容
    _auditLogService.Log("FeatureFlag", $"User {CurrentUserName} set {dto.Flag} = {dto.Enabled}");
    return Ok();
}
```

### 前端本地開發 Fallback（僅限開發環境）

當後端 API 尚未就緒時，前端可從 `.env.development` 讀取預設值作為 Fallback：

```env
# .env.development
VITE_DEFAULT_FEATURES=NEW_CART_UI,AI_CHATBOT
```

```typescript
// 僅在後端 API 無法取得時使用 .env fallback
const fallbackFlags = (import.meta.env.VITE_DEFAULT_FEATURES ?? '').split(',');
```

## 2. 對於您的疑問：有沒有提供頁面？

**有的。** 我們會在後台管理 SPA 中建立 Feature Toggle 管理介面（路由如 `/admin/feature-config`）。

> ⚠️ **[安全規範] 管理介面的認證與授權要求**
>
> Feature Toggle 管理頁面**嚴禁**僅依賴「隱形路由」（Security through Obscurity）作為保護。
> SPA 的所有路由路徑會被完整包含在 JavaScript bundle 中，攻擊者只要檢視 bundle 即可發現所有路由。
>
> **必要安全措施：**
> 1. 路由必須受 Auth Guard 保護，且限制為 `SYSTEM_ADMIN` 角色（對應後端 `[GL02Authorization(FunctionCodes)]`）
> 2. Feature Flag 的狀態**不可存放在 localStorage**（任何人可透過 DevTools 直接修改），必須透過受認證的後端 API 進行讀寫，狀態儲存於後端資料庫
> 3. 所有 Feature Flag 的啟用/停用操作必須記錄**審計日誌 (Audit Log)**，包含操作者、時間、變更內容

**前端路由保護範例：**
```tsx
// 路由定義 — 必須加入角色檢查
<Route
  path="/admin/feature-config"
  element={
    <RequireAuth roles={['SYSTEM_ADMIN']}>
      <FeatureConfigPanel />
    </RequireAuth>
  }
/>
```

**管理介面功能：**
*   [✓] 啟用全新 Tailwind 購物車套件 (NEW_CART_UI)
*   [ ] 啟用 AI 客服系統 (AI_CHATBOT)

當管理員在此頁面切換勾選並儲存時，透過受認證的 API 將狀態寫入後端資料庫。前端透過 React Query 的 `invalidateQueries(['featureFlags'])` 觸發重新取得最新 Flag 狀態，引發畫面更新。

```typescript
// 管理介面中的 Feature Flag 更新
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { flag: string; enabled: boolean }) =>
      apiClient.put('/api/admin/feature-flags', payload),
    onSuccess: () => {
      // 更新成功後，使所有 Feature Flag 快取失效，觸發重新取得
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
    },
  });
}
```

## 3. 在 Component 內如何使用這把鑰匙？
我們把 Feature Flag 封裝成全域的 Custom Hook `useFeatureFlags()`。

**實作範例：控制是否顯示新版元件**
```tsx
import { useFeatureFlags } from '@/features/Flags/hooks';
import { OldCart, NewTailwindCart } from './components';

export const CartPage = () => {
  const { hasFeature } = useFeatureFlags();

  // 若開關被打開，渲染尚未正式發布的 A/B 測試元件
  if (hasFeature('NEW_CART_UI')) {
    return <NewTailwindCart />;
  }

  // 預設穩定版
  return <OldCart />;
};
```
透過這套簡單強悍的機制，即使在正式機上發現致命錯誤，您也能在設定面板「一秒關閉此 Feature」，完全不需要等工程師滿頭大汗重新跑 CI/CD 去退版！
