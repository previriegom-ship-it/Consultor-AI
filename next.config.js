/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",        // genera carpeta out/ con HTML estático
  images: {
    unoptimized: true,     // necesario con output: export (no hay servidor)
  },
};

module.exports = nextConfig;
