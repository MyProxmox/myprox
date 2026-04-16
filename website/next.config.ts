import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // logos are local PNGs — no remote pattern needed
  },
};

export default nextConfig;
