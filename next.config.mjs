/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Matikan disk cache webpack di mode development Windows agar tidak corrupt vendor-chunks
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
