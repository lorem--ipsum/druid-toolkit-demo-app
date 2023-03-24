/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@druid-toolkit/visuals-core"],
  webpack: (config) => {
    config.snapshot = {
      ...(config.snapshot ?? {}),
      // Add all node_modules but @druid-toolkit module to managedPaths
      // Allows for hot refresh of changes to @druid-toolkit module
      managedPaths: [/^(.+?[\\/]node_modules[\\/])(?!@druid-toolkit)/],
    };
    return config;
  },
};

module.exports = nextConfig;
