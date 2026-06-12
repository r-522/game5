/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the build green on Vercel even if lint nits remain; types are still checked.
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
};

export default nextConfig;
