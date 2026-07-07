/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // exceljs asume que corre en Node normal, no empaquetado por webpack.
    serverComponentsExternalPackages: ["exceljs"],
  },
};

export default nextConfig;
