/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix: Cross-origin dev resource block from 192.168.x.x
  allowedDevOrigins: [
    "192.168.1.46",
    "192.168.1.*",
    "192.168.0.*",
    "localhost",
    "127.0.0.1",
    "10.*.*.*"
  ],
  experimental: {
    // support dot folder like link.gauravasdimn2007
  }
}
module.exports = nextConfig
