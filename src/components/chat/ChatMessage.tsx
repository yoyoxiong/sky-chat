// src/components/chat/ChatMessage.tsx
"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/store/types";
import { MessageAvatar, MessageContent } from "./message";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { regenerateMessage, deleteMessage, currentStopFn } = useChatStore();
  const isUser = message.role === "user";

  // 组件卸载时停止朗读（在 MessageActions 中实现）
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-3 md:p-4 group",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] md:max-w-[80%] gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* 头像 */}
        <MessageAvatar isUser={isUser} />

        {/* 消息内容 */}
        <div className="flex flex-col gap-1 w-full">
          <MessageContent
            message={message}
            onRegenerate={regenerateMessage}
            onDelete={deleteMessage}
            hasStopFunction={!!currentStopFn}
          />
        </div>
      </div>
    </div>
  );
}
