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
    // 外层容器：用户消息整体右对齐，AI左对齐
    <div
      className={cn(
        "flex flex-col w-full",
        isUser ? "items-end" : "items-start",
      )}
    >
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

      {/* 消息气泡 + 操作栏 */}
      <div
        className={cn(
          "flex flex-col gap-1 w-full max-w-none",
          !isUser && "group",
        )}
      >
        {/* 消息气泡 */}
        <div
          className={cn(
            // 通用基础样式
            "rounded-2xl px-4 py-2.5 text-sm md:text-base leading-relaxed",
            // 宽度控制：最小宽度适配内容，最大宽度限制，防止被压缩
            "min-w-fit max-w-[80%] md:max-w-[70%] shrink-0",
            // 对齐控制：用户气泡靠右，AI靠左
            isUser ? "ml-auto" : "mr-auto",
            isUser
              ? "rounded-t-2xl rounded-l-2xl rounded-br-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
              : "bg-transparent border-none text-foreground shadow-none",
            // Markdown样式
            "prose prose-xs md:prose-sm dark:prose-invert max-w-none",
          )}
        >
          <MarkdownRenderer content={message.content} isUser={isUser} />
          {/* 流式打字光标 */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle" />
          )}
        </div>

        {/*操作栏*/}
        {!isUser && !isStreaming && !isGeneratingImage && (
          <div
            className={cn(
              "w-full flex group",
              isUser ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={
                isUser ? "ml-auto" : "mr-auto max-w-[80%] md:max-w-[70%]"
              }
            >
              <MessageActions
                messageId={message.id}
                content={message.content}
                isStreaming={isStreaming}
                hasStopFunction={hasStopFunction}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
