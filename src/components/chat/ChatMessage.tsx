// src/components/chat/ChatMessage.tsx
import { cn } from "@/lib/utils"; // Shadcn 自带的工具函数，用来合并类名
import type { Message } from "@/store/types";
// 把FileTextIcon加到导入里
import { useState } from "react"; // 用来管理复制状态
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  User,
  Bot,
  Copy,
  Check,
  FileTextIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const [isCopied, setIsCopied] = useState(false);

  // src/components/chat/ChatMessage.tsx
  // 只需要修改用户消息的渲染部分，其他代码完全不动
  // 找到return里的消息气泡部分，替换成下面的代码：

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-3 md:p-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] md:max-w-[80%] gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* 头像部分完全不动 */}
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

        {/* 消息气泡 + 复制按钮的容器 */}
        <div className="flex flex-col gap-2">
          {/* 🔧 新增：用户消息里的文件卡片，在提问上方显示 */}
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

          {/* 原来的消息气泡 div，原封不动放这里 */}
          <div className="flex items-end gap-2">
            <div
              className={cn(
                "rounded-lg px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm shadow-sm",
                isUser
                  ? "bg-blue-500 text-white"
                  : "bg-card text-card-foreground border border-border",
                "prose prose-xs md:prose-sm dark:prose-invert max-w-none",
              )}
            >
              {/* 👇 新增：图片生成中，加载动画 */}
              {message.isGeneratingImage && (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span>正在生成图片，请稍候...</span>
                </div>
              )}

              {/* 👇 新增：图片生成失败，错误提示 */}
              {message.generateImageError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 mb-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{message.generateImageError}</span>
                </div>
              )}

              {/* 👇 新增：渲染生成的图片 */}
              {message.imageUrl && !message.isGeneratingImage && (
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
              {/* ReactMarkdown部分完全不动 */}
              <ReactMarkdown
                components={{
                  // 你原来的代码块、段落、列表等自定义组件完全不动
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
                // 新增：只允许渲染安全的标签，禁止script、iframe等危险标签
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
                // 不允许的标签，直接拆掉，只保留里面的文本
                unwrapDisallowed={true}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle" />
              )}
            </div>

            {/* 复制按钮完全不动 */}
            {!isUser && !isStreaming && (
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message.content);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 1000);
                  } catch (err) {
                    console.error("复制失败:", err);
                  }
                }}
                className="p-1.5 md:p-1 hover:bg-accent rounded transition-colors mb-1"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
