// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 🔑 导入 Next.js 的链接组件
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();

  // 1. 表单状态：比登录页多了 email 和 confirmPassword
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 🔥 2. 前端校验：两次密码是否一致 (面试常问：为什么需要确认密码？)
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setIsLoading(false);
      return;
    }

    // 🔥 3. 前端校验：密码长度 (虽然后端也有，但前端先挡一层，提升体验)
    if (password.length < 6) {
      setError("密码长度至少需要6位");
      setIsLoading(false);
      return;
    }

    try {
      // 4. 调用注册接口
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "注册失败");
      }

      // 5. 注册成功！
      // 体验优化：很多网站注册成功后会让你再登录一次，但我们可以直接拿到 token 帮用户登录
      // 注意：这里取决于你的后端注册接口返回了什么。
      // 如果你的后端注册接口只返回了 "注册成功" 没返回 token，你需要让用户跳去登录页。
      // 为了体验好，我们假设后端注册成功后可以直接登录，或者我们这里先不自动登录，只跳转。

      // 保守做法：注册成功，跳转到登录页
      router.push("/login?registered=true"); // 带个参数，登录页可以显示个“注册成功，请登录”的提示
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>注册一个新的 Sky-Chat 账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="密码 (至少6位)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </form>

          {/* 🔑 底部链接：跳转到登录页 */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            已有账号？{" "}
            <Link href="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
