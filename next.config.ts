import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
  remotePatterns: [
  {
    protocol: "https",
    hostname: "res.cloudinary.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "upload.wikimedia.org",
    pathname: "/**",
  },
],
  },

  experimental: {
    agentFeedback: true,
  },

  cacheComponents: false,
  partialPrefetching: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
