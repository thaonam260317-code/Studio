import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Render chạy bằng CLI HyperFrames ở tiến trình con, không bundle vào server.
  serverExternalPackages: ["hyperframes"],
};

export default nextConfig;
