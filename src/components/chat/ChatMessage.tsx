// src/components/chat/ChatMessage.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
// 导入所有需要的图标
import {
  User,
  Bot,
  Copy,
  Check,
  FileTextIcon,
  Loader2,
  AlertCircle,
  RotateCw,
  Volume2,
  VolumeX,
  Share2,
  Trash2,
} from "lucide-react";
import type { Message } from "@/store/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // 朗读状态
  const [isDeleting, setIsDeleting] = useState(false); // 删除加载状态
  const { regenerateMessage, deleteMessage, currentStopFn } = useChatStore();
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null); // 朗读实例ref

  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const isGeneratingImage = message.isGeneratingImage;

  // 🔧 功能1：复制消息内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 🔧 功能2：重新生成回复
  const handleRegenerate = () => {
    if (isStreaming || currentStopFn) return;
    regenerateMessage(message.id);
  };

  // 🔧 功能3：语音朗读/停止
  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("您的浏览器不支持语音朗读功能");
      return;
    }

    // 如果正在朗读，停止
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      speechSynthRef.current = null;
      return;
    }

    // 开始朗读
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "zh-CN"; // 中文朗读
    utterance.rate = 1.2; // 语速
    utterance.pitch = 1; // 音调

    // 朗读结束回调
    utterance.onend = () => {
      setIsSpeaking(false);
      speechSynthRef.current = null;
    };

    // 朗读出错回调
    utterance.onerror = () => {
      setIsSpeaking(false);
      speechSynthRef.current = null;
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // 🔧 功能4：分享消息
  const handleShare = async () => {
    const shareText = `${isUser ? "我" : "AI"}：${message.content}`;
    // 优先用浏览器原生分享API（手机端支持）
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI聊天对话",
          text: shareText,
        });
        return;
      } catch (err) {
        // 用户取消分享，不报错
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("分享失败:", err);
        } else {
          return;
        }
      }
    }

    // 兜底：复制分享内容到剪贴板
    try {
      await navigator.clipboard.writeText(shareText);
      alert("对话内容已复制到剪贴板，快去分享吧~");
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 🔧 功能5：删除消息
  const handleDelete = async () => {
    if (isStreaming || currentStopFn) return;
    setIsDeleting(true);
    try {
      await deleteMessage(message.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // 组件卸载时停止朗读
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
        "flex w-full gap-4 p-3 md:p-4 group", // 加group，hover才显示操作栏
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

        {/* 消息内容+操作栏容器 */}
        <div className="flex flex-col gap-1 w-full">
          {/* 用户消息的文件附件 */}
          {isUser &&
            message.fileAttachments &&
            message.fileAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1 justify-end">
                {message.fileAttachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm w-fit max-w-[200px]"
                  >
                    <FileTextIcon className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="truncate flex-1 text-blue-700 dark:text-blue-300">
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

          {/* 图片生成加载状态 */}
          {isGeneratingImage && (
            <div className="flex flex-col gap-3 py-6 justify-center items-center w-full">
              <div className="relative w-full max-w-sm aspect-square rounded-lg bg-accent/50 animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-accent/10" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 animate-spin text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                正在生成图片，预计2-3秒...
              </p>
            </div>
          )}

          {/* 图片生成失败提示 */}
          {message.generateImageError && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 mb-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{message.generateImageError}</span>
            </div>
          )}

          {/* 生成的图片 */}
          {message.imageUrl && !isGeneratingImage && (
            <div className="my-3 w-full overflow-hidden rounded-md border border-border">
              <a
                href={message.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <img
                  src={message.imageUrl}
                  alt={message.content}
                  className="w-full h-auto object-cover rounded-md hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </a>
            </div>
          )}

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
              <ReactMarkdown
                components={{
                  code: ({ inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="my-3 rounded-md overflow-hidden w-full">
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          className="text-xs rounded-md w-full"
                          wrapLongLines={true}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-mono break-all",
                          isUser
                            ? "!bg-blue-700/50 !text-white"
                            : "!bg-slate-100 !dark:bg-slate-700 !text-slate-800 !dark:text-slate-100",
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed break-words w-full">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1 ml-1 break-words w-full">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1 ml-1 break-words w-full">
                      {children}
                    </ol>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "underline break-all",
                        isUser
                          ? "text-blue-100"
                          : "text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {children}
                    </a>
                  ),
                }}
                allowedElements={[
                  "p",
                  "h1",
                  "h2",
                  "h3",
                  "h4",
                  "ul",
                  "ol",
                  "li",
                  "code",
                  "pre",
                  "a",
                  "blockquote",
                  "strong",
                  "em",
                  "br",
                ]}
                unwrapDisallowed={true}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle" />
              )}
            </div>

            {/* 🔧 核心：AI回复的操作栏，hover才显示，和豆包完全一致 */}
            {!isUser && !isStreaming && !isGeneratingImage && (
              <div className="flex items-center gap-1 ml-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {/* 复制按钮 */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 md:hover:bg-accent rounded-md transition-colors"
                  title="复制内容"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground md:hover:text-foreground" />
                  )}
                </button>

                {/* 重新生成按钮 */}
                <button
                  onClick={handleRegenerate}
                  disabled={!!currentStopFn}
                  className="p-1.5 md:hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                  title="重新生成"
                >
                  <RotateCw className="w-3.5 h-3.5 text-muted-foreground md:hover:text-foreground" />
                </button>

                {/* 朗读按钮 */}
                <button
                  onClick={toggleSpeech}
                  className="p-1.5 md:hover:bg-accent rounded-md transition-colors"
                  title={isSpeaking ? "停止朗读" : "语音朗读"}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-muted-foreground md:hover:text-foreground" />
                  )}
                </button>

                {/* 分享按钮 */}
                <button
                  onClick={handleShare}
                  className="p-1.5 md:hover:bg-accent rounded-md transition-colors"
                  title="分享对话"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground md:hover:text-foreground" />
                </button>

                {/* 删除按钮 */}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || !!currentStopFn}
                  className="p-1.5 md:hover:bg-red-50 md:hover:text-red-500 rounded-md transition-colors disabled:opacity-50"
                  title="删除对话"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
