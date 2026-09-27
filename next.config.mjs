/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.STANDALONE === "true" ? { output: "standalone" } : {}),
};

export default nextConfig;
