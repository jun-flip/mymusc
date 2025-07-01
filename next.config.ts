import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'audius.co',
      'audius-content-14.cultur3stake.com',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
