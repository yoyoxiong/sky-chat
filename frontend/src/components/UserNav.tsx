// src/components/UserNav.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, User } from "lucide-react"; // 图标库，你项目里应该有

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout(); // 清空 Zustand 和 LocalStorage
    router.push("/login"); // 跳转到登录页
  };

  // 获取头像的首字母作为 Fallback
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="p-4 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* 点击区域：头像 + 用户名 */}
          <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl || ""} alt={user?.username} />
              <AvatarFallback>
                {user?.username ? getInitials(user.username) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm">
              <span className="font-medium">{user?.username}</span>
              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        {/* 弹出的菜单 */}
        <DropdownMenuContent className="w-56" align="start" side="right">
          <DropdownMenuLabel>我的账户</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 h-4 w-4" />
            <span>个人设置</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
