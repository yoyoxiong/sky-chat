// src/components/chat/MessageContent.tsx
"use client";

import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { MessageImage } from "./MessageImage";
import { MessageActions } from "./MessageActions";
import type { Message } from "@/store/types";
import { MessageAttachments } from "./MessageAttachments";

interface MessageContentProps {
  message: Message;
  onRegenerate: (messageId: string) => void;
  onDelete: (messageId: string) => Promise<void>;
  hasStopFunction: boolean;
}

export function MessageContent({
  message,
  onRegenerate,
  onDelete,
  hasStopFunction,
}: MessageContentProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const isGeneratingImage = message.isGeneratingImage;

  return (
    <div className="flex flex-col gap-1">
      {/* 用户消息的文件附件 */}
      {isUser && message.fileAttachments && (
        <MessageAttachments fileAttachments={message.fileAttachments} />
      )}

      {/* 图片生成相关 */}
      <MessageImage
        imageUrl={message.imageUrl}
        isGeneratingImage={isGeneratingImage}
        generateImageError={message.generateImageError}
        imageAlt={message.content}
      />

      {/* 消息气泡 */}
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "rounded-lg px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm shadow-sm",
            isUser
              ? "bg-blue-500 text-white"
              : "bg-card text-card-foreground border border-border",
            "prose prose-xs md:prose-sm dark:prose-invert max-w-none",
          )}
        >
          <MarkdownRenderer content={message.content} isUser={isUser} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle" />
          )}
        </div>

        {/* AI回复的操作栏 */}
        {!isUser && !isStreaming && !isGeneratingImage && (
          <MessageActions
            messageId={message.id}
            content={message.content}
            isStreaming={isStreaming}
            hasStopFunction={hasStopFunction}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
