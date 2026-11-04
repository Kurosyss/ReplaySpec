import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.REPLAYSPEC_NEXT_DIST_DIR ?? ".next",
  turbopack: {
    root: process.cwd(),
  },
  devIndicators: false,
};

export default nextConfig;
