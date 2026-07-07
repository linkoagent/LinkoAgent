/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // pdf-parse (via pdfjs-dist) y exceljs asumen que corren en Node normal, no empaquetados
    // por webpack — si Next los empaqueta, pdfjs-dist termina referenciando globals de
    // navegador (DOMMatrix, Path2D) que no existen en el runtime serverless y explota.
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist", "exceljs"],
  },
};

export default nextConfig;
