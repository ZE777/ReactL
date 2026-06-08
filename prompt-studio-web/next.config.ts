import type { NextConfig } from "next";

// 允許 ASP.NET Core 的自簽憑證（localhost:44345）
// 使用 NEXT_IGNORE_TLS=1 明確啟用，而非隱式依賴 NODE_ENV=development
// 避免 production build 在本機測試時意外停用 TLS 驗證
if (process.env.NEXT_IGNORE_TLS === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  // 前台部署在入口站台的 /app 子應用底下（IIS 反向代理到此 Next）。
  // basePath 在 build 時烤進 client bundle，改了必須重新 build。
  basePath: "/app",
  // 輸出自包含的 standalone 資料夾（.next/standalone），可搬到別處用 pm2 跑 server.js。
  // 注意：standalone 不會自動帶 public 與 .next/static，build 後要手動複製進去。
  output: "standalone",
};

export default nextConfig;
