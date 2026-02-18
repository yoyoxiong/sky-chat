// 必须加：标记为客户端组件
"use client";

// 1. 导入React核心（必须写，避免JSX解析异常）
import * as React from "react";
// 2. 导入主题控制Hook
import { useTheme } from "next-themes";
// 3. 导入你项目里的Button组件（路径和你项目完全匹配）
import { Button } from "@/components/ui/button";
// 4. 导入图标（你项目已经装了lucide-react，直接用）
import { Sun, Moon } from "lucide-react";

// 主题切换按钮组件
export function ThemeToggle() {
  // 从next-themes获取主题状态和切换方法
  const { theme, setTheme } = useTheme();
  // 解决Next.js水合报错：组件挂载后再渲染内容
  const [mounted, setMounted] = React.useState(false);

  // 组件挂载到浏览器后，标记为已挂载
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 未挂载时不渲染任何内容，避免水合错误
  if (!mounted) return null;

  // 切换主题的核心逻辑
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // 正确的JSX返回：用小括号包裹，注释写在标签外
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="切换深色/浅色模式"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
