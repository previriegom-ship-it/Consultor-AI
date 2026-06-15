import "./globals.css";

export const metadata = {
  title: "Consultor IA",
  description:
    "Diagnóstico de automatización con IA para PyMEs.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
