---
name: 建立 API 共用介面與快取層 (API Interception & Caching)
description: 說明如何實作 Axios 攔截器及導入 React Query 作為非同步狀態管理機制。
---

# 技能指令：API 資料層寫法

本技能定義專案發起非同步請求 (AJAX / Fetch) 時的標準架構，廢棄直接在 Component 中執行原生 `fetch` 或自幹 loading state 的做法。

## 1. Axios 攔截器 (Action Layer Interface)

所有 Request 必須統一走 API Client。

> ⚠️ **Token 存取安全須知：** 依據 `docs/07_前端資安防護守則.md` 規範，JWT Access Token **不應**存放在 `localStorage`（XSS 攻擊可輕易讀取）。建議方案為後端設定 **HttpOnly Secure Cookie**，瀏覽器自動帶上 Token，前端 JS 完全碰不到真實 Token。以下同時提供兩種模式的範例。

### 方案 A：HttpOnly Cookie 模式（推薦）

```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // Vite 專案；Next.js 請見 SKILL_動態設定
  timeout: 10000,
  withCredentials: true, // 關鍵：讓瀏覽器自動帶上 HttpOnly Cookie
});

// Request Interceptor：Cookie 模式下無須手動塞 Token
apiClient.interceptors.request.use((config) => {
  // CSRF Token 防護（若後端啟用 CSRF 機制）
  const csrfToken = document.querySelector<HTMLMetaElement>(
    'meta[name="csrf-token"]'
  )?.content;
  if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method ?? '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

### 方案 B：localStorage 模式（僅限無敏感資料操作的場景，不建議用於後台管理）

> ⚠️ **安全警告：** 後台管理系統雖為內部使用，但通常具有**最高權限**（管理訂單、存取客戶 PII、修改系統設定）。
> 一旦 Token 被 XSS 竊取，攻擊者獲得的是**管理員等級**的存取權限，影響範圍遠大於對外官網。
> 因此後台管理系統**強烈建議**使用方案 A（HttpOnly Cookie），而非方案 B。
>
> 若因技術限制必須使用 localStorage，須同時滿足以下條件：
> - Token 有效期限設為極短（建議 5 分鐘以內）
> - 必須實作嚴格的 CSP 策略（參見 `docs/07_前端資安防護守則.md`）
> - Token 加入 fingerprint（綁定瀏覽器指紋），防止跨裝置重播

```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Response Interceptor：含 Token Refresh 競態條件處理

無論採用哪種 Token 存取模式，Response Interceptor 的 401 處理皆須考慮**多個並發請求同時遇到 401** 的競態條件（Race Condition）。若每個請求各自觸發 Refresh，會發出多次重複 Refresh 請求，可能導致 Refresh Token 過早消耗。

```typescript
// Token Refresh 競態條件處理
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function onRefreshSuccess(newToken: string) {
  pendingRequests.forEach(({ resolve }) => resolve(newToken));
  pendingRequests = [];
}

function onRefreshFailure(error: unknown) {
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 若已有一個 Refresh 正在進行，將此請求排入等待佇列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          // Refresh 成功後，以新 Token 重發原始請求
          if (typeof token === 'string') {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 發送 Refresh Token 請求（Cookie 模式下由瀏覽器自動帶上 Refresh Token）
        const { data } = await axios.post('/api/auth/refresh', null, {
          withCredentials: true,
        });

        const newToken = data.accessToken;
        onRefreshSuccess(newToken);
        isRefreshing = false;

        // 重發原始請求
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        onRefreshFailure(refreshError);
        isRefreshing = false;

        // Refresh 失敗：統一登出，導回登入頁
        // Cookie 模式：呼叫後端 logout API 清除 HttpOnly Cookie
        // localStorage 模式：清除本地儲存的 Token
        await axios.post('/api/auth/logout', null, { withCredentials: true }).catch(() => {});
        localStorage.removeItem('access_token'); // localStorage 模式才有效，Cookie 模式下為空操作但無害
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## 2. React Query 快取與非同步狀態

呼叫 API 取得資料，嚴禁手動設定 `isLoading` 或 `isError`，全部交還給 React Query 的 `useQuery` / `useMutation` 處理。

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.get(`/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 分鐘內不重新發出 Ajax
  });
}
```

如果在元件層使用：
```tsx
const { data, isLoading, isError } = useUserProfile('123');
if (isLoading) return <Skeleton />;
if (isError) return <ErrorFallback />;
return <div>{data.name}</div>;
```
