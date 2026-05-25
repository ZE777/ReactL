---
name: 建立表單與型別動態驗證 (Form & Validation)
description: 如何使用 React Hook Form 搭配 Zod 在專案中建構出無卡頓的表單驗證層。
---

# 技能指令：建立表單與驗證

當開發者要求 AI 或自行建立「填寫表單」、「會員註冊」等元件時，必須依循本技能說明。

## 1. 核心套件
*   `react-hook-form` (RHF)
*   `zod`
*   `@hookform/resolvers`

## 2. 實作架構與步驟

### Step 1: 定義 Zod Schema
Schema 必須單獨抽離，不僅用於 RHF 的 Resolver，也可做為 TypeScript 的純粹型別。
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("信箱格式不正確"),
  password: z.string().min(8, "密碼至少 8 個字元"),
});

// 自動產出 Type 供後續傳遞使用
export type LoginFormData = z.infer<typeof loginSchema>;
```

### Step 2: 在 Hook 中綁定 Resolver
嚴禁使用傳統 `useState` 做雙向綁定 (Two-way binding)。必須交由 RHF 的 `register` 或 `Controller` 接管：
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function useLoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // 離開焦點時才驗證，避免打字時一直報錯
  });

  return { register, handleSubmit, errors };
}
```

## 3. 表單提交策略：Server Action 為主、useMutation 為輔

對外站採用 Next.js App Router 時，**表單一律走 Server Action**，零碎操作（按愛心、刪一筆、Toggle 開關）才用 React Query 的 `useMutation`。

### 3.1 判斷準則

| 操作類型 | 用什麼 | 主要理由 |
|---------|--------|---------|
| 登入 / 註冊 / 編輯個資 / 重設密碼 | **Server Action** | Progressive Enhancement（JS 沒載入也能送）、可直接 `redirect()`、cookie 操作 |
| 按愛心 / 取消收藏 / 切換狀態 / 刪一筆 | **`useMutation`** | 樂觀更新、自動精準 cache 失效、`isPending` 內建 |
| 即時搜尋（debounce） | **`useQuery` + debounce** | TQ 自動處理請求競態 |

### 3.2 Server Action 標準寫法（搭配 `useActionState`）

Server Action 應放在 `features/{name}/actions/`（見 [workflows/01](../workflows/01-建立FSD特徵模組與資料夾.md) Step 2）。表單元件用 `useActionState` 接 action 回傳的 state，並把 RHF 的 `register` 欄位 `name` 對齊 FormData：

```typescript
// features/auth/actions/loginAction.ts
'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema } from '../schemas/loginSchema';
import { apiClient } from '@/api/client';

export async function loginAction(prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const { token } = await apiClient.post('/auth/login', parsed.data);
    (await cookies()).set('token', token, { httpOnly: true, sameSite: 'lax' });
  } catch {
    return { error: '帳號或密碼錯誤' };
  }
  redirect('/account');
}
```

```tsx
// features/auth/components/LoginForm.tsx
'use client';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';
import { loginAction } from '../actions/loginAction';

export function LoginForm() {
  const { register, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction}>  {/* ⚠️ form action，不是 onSubmit */}
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      <button disabled={isPending}>{isPending ? '登入中...' : '登入'}</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

### 3.3 為什麼不用傳統 `onSubmit + axios`？

| 寫法 | 失去的能力 |
|------|-----------|
| `onSubmit={handleSubmit(data => axios.post(...))}` | ❌ JS 失效時表單完全送不出（無 Progressive Enhancement） |
| 同上 | ❌ 無法在 server 端設 `httpOnly` cookie（必須額外做 API endpoint） |
| 同上 | ❌ 無法直接 `redirect()`，要 `useRouter().push()` 多一層 |

### 3.4 Server Action 的雙重驗證

Zod schema 必須在 RHF（client）與 Server Action（server）**各驗一次**：

- **Client 端驗證**：UX，即時錯誤訊息
- **Server 端驗證**：安全防線，永遠不信任客戶端送來的資料

兩端共用同一個 `schemas/loginSchema.ts`，禁止寫兩份。

## 4. 防呆與驗證安全
在 `onSubmit` 前端被觸發時，如果表單發生了驗證錯誤，RHF 預設就不會觸發你的 Ajax Call，達到了最有效的前端第一線防護，降低後端被無意義 Request 打擊的次數。
