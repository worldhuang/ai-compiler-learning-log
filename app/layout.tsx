import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 编译器学习日志｜50 周秋招计划",
  description: "面向 AI Infra 中 AI 编译器岗位的 50 周学习日志、每日任务、官方知识链接与硬核项目。",
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
