// src/components/chat/ChatMessage.tsx
"use client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/store/types";
import { MessageContent } from "./message/MessageContent";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { regenerateMessage, deleteMessage, currentStopFn } = useChatStore();
  const isUser = message.role === "user";

  // 组件卸载时停止语音朗读
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    // ✅ 核心：外层容器固定宽度居中，和豆包一样两边留白
    <div className="w-full px-4 md:px-0 mx-auto max-w-3xl mb-6">
      {/* ✅ 核心Flex布局：用户消息右对齐，AI左对齐 */}
      <MessageContent
        message={message}
        onRegenerate={regenerateMessage}
        onDelete={deleteMessage}
        hasStopFunction={!!currentStopFn}
      />
    </div>
  );
}
