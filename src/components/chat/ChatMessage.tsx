"use client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/store/types";
import { MessageContent } from "./message/MessageContent";
import { CheckCircle2, Circle } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const {
    currentStopFn,
    isSelectionMode,
    selectedMessageIds,
    toggleMessageSelection,
  } = useChatStore();

  const isUser = message.role === "user";
  const isSelected = selectedMessageIds.includes(message.id);

  // 组件卸载时停止语音朗读
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="w-full px-4 md:px-0 pb-3">
      <div
        className={cn(
          "flex w-full items-start gap-3",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {/*选择模式下显示复选框 */}
        {isSelectionMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMessageSelection(message.id);
            }}
            className={cn(
              "mt-2.5 shrink-0 transition-all duration-200",
              isUser ? "order-2" : "order-1",
            )}
          >
            {isSelected ? (
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            ) : (
              <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}

        {/* 消息内容 */}
        <div
          className={cn(
            "flex flex-col gap-1 w-full",
            isSelectionMode ? "flex-1 cursor-pointer" : "w-full",
            isUser ? "order-1" : "order-2",
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleMessageSelection(message.id);
          }}
        >
          <MessageContent message={message} hasStopFunction={!!currentStopFn} />
        </div>
      </div>
    </div>
  );
}
