"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 用来跳转页面
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore(); // 从 store 里取出 login 方法

  // 1. 表单状态管理 (React 基础/面试必问：受控组件)
  // 什么是受控组件？就是表单的值完全由 React state 控制
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // 2. UI 状态管理
  const [isLoading, setIsLoading] = useState(false); // 加载中状态，防止重复点击
  const [error, setError] = useState(""); // 错误信息展示

  // 3. 处理登录提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认的刷新页面行为
    setIsLoading(true);
    setError(""); // 提交前先清空旧错误

    try {
      // 调用后端接口
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 后端返回了错误（比如 401）
        throw new Error(data.error || "登录失败");
      }

      // 4. 登录成功！
      // 把后端返回的 user 和 token 存入 Zustand (Zustand 会自动存 localStorage)
      login(data.user, data.token);

      // 跳转到首页
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      // 无论成功失败，最后都要关闭 loading
      setIsLoading(false);
    }
  };

  // 渲染 UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>登录你的 Sky-Chat 账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 账号输入框 */}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="用户名或邮箱"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 密码输入框 */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            {/* 登录按钮 */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              还没有账号？{" "}
              <Link href="/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
