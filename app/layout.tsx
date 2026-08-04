import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Compiler Year One｜一年学习作战地图",
  description: "AI 编译器与计算加速的 52 周、每日可勾选学习计划。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
