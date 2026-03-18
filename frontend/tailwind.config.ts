// 导入Tailwind的类型定义，让代码有提示，不报错
import type { Config } from "tailwindcss";
import tailwindScrollbar from "tailwind-scrollbar";
// 整个配置对象，告诉Tailwind怎么工作
const config: Config = {
  // 🔑 核心：开启class模式的深色模式，和我们的.dark变量对应
  darkMode: "class",
  // 告诉Tailwind要扫描哪些文件里的class，你的项目所有组件都在这几个文件夹里
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // 把你globals.css里的CSS变量，映射成Tailwind的颜色class
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [tailwindScrollbar],
};

export default config;
