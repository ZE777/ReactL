import type { NextConfig } from "next";

// 允許 ASP.NET Core 的自簽憑證（localhost:44345）
// 使用 NEXT_IGNORE_TLS=1 明確啟用，而非隱式依賴 NODE_ENV=development
// 避免 production build 在本機測試時意外停用 TLS 驗證
if (process.env.NEXT_IGNORE_TLS === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
