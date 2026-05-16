/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@remotion/bundler", "@remotion/renderer"],
  },
  webpack: (config, { isServer }) => {
    // If it's a server build, tell webpack to ignore native .node modules 
    // from @rspack which are used internally by remotion
    if (isServer) {
        config.externals.push("@remotion/bundler");
        config.externals.push("@remotion/renderer");
    }
    return config;
  },
};

export default nextConfig;
