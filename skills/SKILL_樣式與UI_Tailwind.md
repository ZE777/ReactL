---
name: 尾風樣式系統 (Tailwind CSS)
description: 定義專案中使用 Tailwind CSS 快速原型的標準寫法與元件抽離原則。
---

# 技能指令：Tailwind CSS 樣式與設計系統

既然確定期初採用輕量、快速開發的 **Tailwind CSS**，為了防止後續畫面維護變成一場災難（通篇寫滿幾十個 Class 名稱），所有實作必須遵守以下規範：

## 1. 嚴禁在 HTML 標籤留下一長串的「義大利麵樣式」
Tailwind 的最大缺點是讓元件變得難以閱讀。請使用 `@apply` 或是將常用的組合利用現代套件 `tailwind-merge` 與 `clsx` 包裝起來。

**❌ 錯誤示範（幾個月後沒人看得懂）：**
```html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">按鈕</button>
```

## 2. 解決方案：實作 UI 元件函式庫 (如 shadcn/ui 或自行包裝)
利用 `cva (class-variance-authority)` 與 `twMerge`，我們可以做出強大且乾淨的樣式元件。

**✅ 正確寫法：** 建立一個共用的 Button Component 統一封裝。
```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 在共用的 /src/shared/components/Button.tsx
export const Button = ({ variant, className, ...props }) => {
  return (
    <button 
      className={cn(
        "py-2 px-4 rounded font-bold transition-colors", // 共用基礎樣式
        variant === 'primary' && "bg-blue-500 hover:bg-blue-700 text-white",
        className // 允許外部從這裡微調
      )} 
      {...props} 
    />
  )
}
```

## 3. 全局 Design Tokens
顏色、間距、字體大小必須全部定義在專案根目錄的 `tailwind.config.js`。
*   不准寫死色號 `text-[#1a2b3c]` 或 Magic Number `w-[27px]`。
*   一律使用有語意的 Token，如 `text-brand-primary` 或 `w-8`。
