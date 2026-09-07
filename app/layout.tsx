import type { Metadata } from "next";
import "./globals.css";
import "./daily-guide.css";

export const metadata: Metadata = {
  title: "推理优化学习日志｜2027年4月前",
  description: "30 周推理部署与优化：对应 AIInfraGuide 真实小节、明确逐日代码验收，保留现有算法进度。",
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
