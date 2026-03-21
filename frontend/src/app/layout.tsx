import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";

// 配置中文字体子集（"latin" 是英文，加上 "latin-ext" 支持更多符号，中文也能正常显示）
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});
export const metadata: Metadata = {
  title: "Sky-Chat AI 聊天助手",
  description: "全栈AI聊天应用，基于Next.js开发",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 把 lang="en" 改成 lang="zh-CN"，告诉浏览器这是中文网站
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        // 保留字体变量和 antialiased（字体抗锯齿，让字更好看）
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthGuard>{children}</AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
