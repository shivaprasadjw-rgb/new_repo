/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["date-fns", "fuse.js"]
  }
};

module.exports = nextConfig;
