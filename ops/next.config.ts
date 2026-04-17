import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myprox.app',
        pathname: '/img/**',
      },
    ],
  },
  // Proxy /proxy/* → backend (internal Docker URL at build/runtime, not exposed to browser)
  async rewrites() {
    return [
      {
        source: '/proxy/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/:path*`,
      },
    ]
  },
}

export default nextConfig
