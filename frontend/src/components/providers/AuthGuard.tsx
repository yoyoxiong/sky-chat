// src/components/providers/AuthGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  // 🔑 取出 hasHydrated
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    // 🔑 新增：如果还没水合完成，直接 return，什么都不做
    if (!hasHydrated) return;

    const publicPaths = ["/login,", "/register"];
    const isPublicPath = publicPaths.includes(pathname);

    if (isAuthenticated && isPublicPath) {
      router.push("/");
    } else if (!isAuthenticated && !isPublicPath) {
      router.push("/login");
    }
  }, [isAuthenticated, pathname, router, hasHydrated]); // 🔑 把 hasHydrated 加入依赖数组

  // 🔑 新增：如果还没水合完，显示一个全屏的 Loading 或者空白页
  // 这样就不会有闪烁了，因为在确认状态前，用户看不到任何东西
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* 这里可以放一个 Loading 图标，或者什么都不放，就是白屏 */}
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // 水合完成，正常渲染页面
  return <>{children}</>;
}
