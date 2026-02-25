// src/components/chat/MessageAvatar.tsx

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface MessageAvatarProps {
  isUser: boolean;
  size?: "sm" | "md" | "lg";
}

export function MessageAvatar({ isUser, size = "md" }: MessageAvatarProps) {
  // 根据size Prop动态设置样式
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-7 w-7 md:h-8 md:w-8",
    lg: "h-10 w-10",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-md border",
        sizeClasses[size],
        isUser
          ? "bg-blue-500 text-white border-blue-600"
          : "bg-card text-card-foreground border-border",
      )}
    >
      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </div>
  );
}
