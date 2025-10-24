import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "@browserbasehq/stagehand",
    "playwright",
    "playwright-core",
  ],
};

export default nextConfig;
