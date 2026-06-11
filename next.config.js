/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",        // genera carpeta out/ con HTML estático
  basePath: "/Consultor-AI",   // necesario para GitHub Pages (repo subdirectory)
  assetPrefix: "/Consultor-AI/", // rutas de JS/CSS apuntan al subdirectorio correcto
  images: {
    unoptimized: true,     // necesario con output: export (no hay servidor)
  },
};

module.exports = nextConfig;
