import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalogador de Vídeos",
  description: "Organize e catalogue seus vídeos com metadados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
