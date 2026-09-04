import type { Metadata } from "next";
import "./globals.css";
import "./daily-guide.css";

export const metadata: Metadata = {
  title: "AI 编译器学习日志｜30 周核对版",
  description: "30 周逐日学习、真实原文章节与配套代码验收；从栈与队列继续代码随想录，再完成 Hot 100。",
  openGraph: {
    title: "AI 编译器学习日志",
    description: "30 周 · 从基础到项目",
    images: ["https://ai-compiler-year-one.worldhuang2002.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 编译器学习日志",
    description: "30 周 · 从基础到项目",
    images: ["https://ai-compiler-year-one.worldhuang2002.chatgpt.site/og.png"],
  },
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
