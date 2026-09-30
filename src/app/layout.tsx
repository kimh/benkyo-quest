import type { Metadata, Viewport } from "next";
import { DotGothic16 } from "next/font/google";
import { BgmControl } from "@/components/BgmControl";
import "./globals.css";

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot",
});

export const metadata: Metadata = {
  title: "勉強クエスト",
  description: "ノックといっしょに毎日クエスト！",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#10102a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${dotGothic.variable} h-full`}>
      <body className="min-h-full flex flex-col pb-16">
        {children}
        <BgmControl />
      </body>
    </html>
  );
}
