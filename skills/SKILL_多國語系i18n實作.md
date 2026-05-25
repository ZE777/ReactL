---
name: 多國語系與在地化 (i18n Implementation)
description: 如何從專案 Day 1 就將所有字串抽離，實踐國際化 (i18n) 擴充。
---

# 技能指令：多國語系 (i18n) 實作機制

當我們確定網站有擴張可能性時，**絕對禁止**在 UI Component (HTML) 中直接寫入中文死碼 (Hard-coded text)。

## 1. 核心套件與詞綴字典夾
我們將採用業界標準的 `react-i18next` (或 Next.js 環境下的 `next-intl`)。
*   建立專屬字典庫資料夾：`public/locales/`
    *   `zh-TW/translation.json`
    *   `en-US/translation.json`

## 2. JSON 詞綴結構規劃
詞綴必須依照 FSD 的特徵 (Features) 分門別類，不可全部攤平。
```json
// zh-TW/translation.json
{
  "common": {
    "submit": "送出",
    "cancel": "取消"
  },
  "ShoppingCart": {
    "title": "您的購物車",
    "itemCount": "您有 {{count}} 件商品"
  }
}
```

## 3. Component 中的語系提取
所有的文案必須使用 `t()` 函數動態抓取。不僅能抽換語系，還能透過傳入變數達成動態字串：
```tsx
import { useTranslation } from 'react-i18next';

export const CartHeader = ({ count }) => {
  const { t } = useTranslation();

  return (
    <header>
      {/* 若是簡單句子 */}
      <h1>{t('ShoppingCart.title')}</h1>
      
      {/* 若需要動態代入數量變數 (Pluralization) */}
      <p>{t('ShoppingCart.itemCount', { count })}</p>
      
      <button>{t('common.submit')}</button>
    </header>
  );
};
```

**小結：** 只要我們現在維持這條防線，未來老闆突然說要擴展日本市場，我們只需要把 JSON 檔案發包給翻譯社，前端程式碼一行都不用改！
