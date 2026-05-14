/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hotel-booking/types'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
