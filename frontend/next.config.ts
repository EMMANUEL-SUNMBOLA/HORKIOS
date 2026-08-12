import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 16's CLI parser currently rejects valid TypeScript 5.9 --showConfig
  // output in workspace builds. The compiler API performs the same full check.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
