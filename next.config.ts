import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/profile",
        destination: "/admin/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
