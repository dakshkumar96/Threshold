/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["framer-motion", "@phosphor-icons/react"],
  },
  async redirects() {
    return [
      {
        source: "/benchmarks",
        destination: "/insights",
        permanent: false,
      },
      {
        source: "/benchmarks/:path*",
        destination: "/insights",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
