import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CerekaAI",
  description: "Platform novel bersiri harian dalam Bahasa Melayu, dibina untuk cerita AI yang terasa seperti siri premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
