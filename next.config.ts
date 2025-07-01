import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'audius.co',
      'audius-content-14.cultur3stake.com',
      'audius-content-13.cultur3stake.com',
      'audius-content-11.figment.io',
      'audius-content-12.cultur3stake.com',
      'audius-creator-12.theblueprint.xyz',
      'cn3.shakespearetech.com',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
