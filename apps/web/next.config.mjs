/**
 * `API_BACKEND_ORIGIN` (no `/v1`) is read when the Node server starts. Client
 * Browser calls same-origin `/v1/...`; these rewrites proxy to the
 * real API so production deploys do not depend on NEXT_PUBLIC at build time.
 */
const apiBackendOrigin = (process.env.API_BACKEND_ORIGIN ?? '').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hotel-booking/types'],
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (!apiBackendOrigin) return [];
    return [
      {
        source: '/v1/:path*',
        /** Nest serves versioned routes under `/v1/...`; keep prefix on the upstream URL. */
        destination: `${apiBackendOrigin}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
