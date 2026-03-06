import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kevät Flint 26 - Ilmoittautuminen",
  description:
    "Ilmoittaudu Järvenpään Jousiampujien Kevät Flint 26 -kilpailuun",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
