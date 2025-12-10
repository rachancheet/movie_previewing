import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'cheerio-select'],
  },
};

export default nextConfig;
