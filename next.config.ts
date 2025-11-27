import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET
  },
  // Replace the deprecated property with the new one
  serverExternalPackages: ["mongoose"]
};

// Log environment status at build time
console.log('Next.js build environment:', {
  nodeEnv: process.env.NODE_ENV,
  mongoDbConfigured: !!process.env.MONGODB_URI,
  jwtConfigured: !!process.env.JWT_SECRET
});

export default nextConfig;
