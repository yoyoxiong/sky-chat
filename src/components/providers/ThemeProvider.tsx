// 🔑 告诉Next.js这是一个客户端组件，能操作浏览器
"use client";

// 导入React核心
import * as React from "react";
// 导入主题核心Provider
import { ThemeProvider as NextThemesProvider } from "next-themes";
// ✅ 正确的类型导入：直接从根目录导入，不用深层dist路径
import type { ThemeProviderProps } from "next-themes";

// 封装我们自己的主题Provider，给整个项目用
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      // 告诉工具：用html标签的class来控制主题，和Tailwind配置对应
      attribute="class"
      // 默认主题：跟随用户电脑的系统主题
      defaultTheme="system"
      // 开启系统主题检测
      enableSystem
      // 切换主题时关闭过渡动画，避免页面闪烁
      disableTransitionOnChange
      // 透传外部传入的属性
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
