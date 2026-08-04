import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 编译器学习日志｜52 周年度计划",
  description: "AI 编译器与计算加速的 52 周学习日志、每日任务与官方知识链接。",
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
