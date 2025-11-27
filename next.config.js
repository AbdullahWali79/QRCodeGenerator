/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverComponentsExternalPackages: ['@napi-rs/canvas'],
  webpack: (config, { isServer }) => {
    // Ignore native binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })
    
    return config
  },
}

module.exports = nextConfig

