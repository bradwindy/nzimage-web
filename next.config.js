/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/nzimageresult",
        destination: "http://127.0.0.1:8080",
      },
    ];
  },
};

module.exports = nextConfig;
