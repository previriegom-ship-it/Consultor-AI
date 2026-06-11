import "./globals.css";

export const metadata = {
  title: "Consultor IA",
  description:
    "Asistente experto en financiamiento, grants e inversión para emprendedores.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
