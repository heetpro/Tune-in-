import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'],
  },
};

export default nextConfig;
