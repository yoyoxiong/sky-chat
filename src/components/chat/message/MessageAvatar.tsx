// src/components/chat/MessageAvatar.tsx
"use client";

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface MessageAvatarProps {
  isUser: boolean;
}

export function MessageAvatar({ isUser }: MessageAvatarProps) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 md:h-8 md:w-8 shrink-0 select-none items-center justify-center rounded-md border",
        isUser
          ? "bg-blue-500 text-white border-blue-600"
          : "bg-card text-card-foreground border-border",
      )}
    >
      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </div>
  );
}
