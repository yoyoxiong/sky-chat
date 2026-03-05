"use client";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { MessageImage } from "./MessageImage";
import { MessageActions } from "./MessageActions";
import type { Message } from "@/store/types";
import { MessageAttachments } from "./MessageAttachments";

interface MessageContentProps {
  message: Message;
  hasStopFunction: boolean;
}

export function MessageContent({
  message,
  hasStopFunction,
}: MessageContentProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const isGeneratingImage = message.isGeneratingImage;
  const isLatestMessage = message.isLatestMessage;

  return (
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

      {/* 消息气泡 + 操作栏 外层容器 */}
      <div className="flex flex-col gap-1 w-full max-w-none group">
        {/* 消息气泡 */}
        <div
          className={cn(
            "rounded-2xl py-2.5 text-sm md:text-base leading-relaxed flex flex-col justify-center",
            "min-w-fit max-w-[80%] md:max-w-[70%] shrink-0",
            isUser ? "ml-auto" : "mr-auto",
            isUser
              ? "rounded-t-2xl rounded-l-2xl px-4 rounded-br-md bg-accent text-foreground shadow-sm"
              : "bg-transparent border-none text-foreground shadow-none prose prose-xs md:prose-sm dark:prose-invert max-w-none prose-p:my-0",
          )}
        >
          <MarkdownRenderer content={message.content} isUser={isUser} />
          {/* 流式打字光标 */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle" />
          )}
        </div>

        {/* 操作栏：用户/AI都显示，流式/生成图片时隐藏 */}
        {!isStreaming && !isGeneratingImage && (
          <div
            className={cn(
              "w-full flex",
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
                isLastestMessage={isLatestMessage}
                isUser={isUser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
