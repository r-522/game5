import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "喧嘩番長7 ―最後の番長―",
  description:
    "番長が絶滅したと言われる令和に、最後の漢が拳を握る。メンチビーム・タンカバトル・男気はそのままに、ブラウザで甦る番長道。",
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
