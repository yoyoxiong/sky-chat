// src/components/chat/ChatMessage.tsx
import { cn } from "@/lib/utils"; // Shadcn 自带的工具函数，用来合并类名
import { User, Bot } from "lucide-react";
import type { Message } from "@/store/types";
import { Copy, Check } from "lucide-react"; // 顺便把 Check 也导入，稍后做复制成功的反馈用
import { useState } from "react"; // 用来管理复制状态
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-3 md:p-4",
        // 用户消息靠右，AI消息靠左
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] md:max-w-[80%] gap-3",
          // 用户消息：头像在右边；AI消息：头像在左边
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* 头像 */}
        <div
          className={cn(
            "flex h-7 w-7 md:h-8 md:w-8 shrink-0 select-none items-center justify-center rounded-md border",
            isUser
              ? "bg-blue-500 text-white border-blue-600"
              : // AI头像：和气泡用一样的语义化类名，风格统一
                "bg-card text-card-foreground border-border",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* 消息气泡 */}
        {/* 消息气泡 + 复制按钮的容器 */}
        <div className="flex items-end gap-2">
          {/* 原来的消息气泡 div，原封不动放这里 */}
          <div
            className={cn(
              "rounded-lg px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm shadow-sm",
              // 用户消息样式不变，还是品牌蓝色
              isUser
                ? "bg-blue-500 text-white"
                : // AI消息：用全局语义化类名，自动随主题切换
                  "bg-card text-card-foreground border border-border",
              // 保留这个！dark:prose-invert会自动适配Markdown的文字颜色
              "prose prose-xs md:prose-sm dark:prose-invert max-w-none",
            )}
          >
            {/* 👇 核心：用 ReactMarkdown 替换原来的纯文本 */}
            <ReactMarkdown
              components={{
                // 1. 自定义代码块（带高亮）
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="my-3 rounded-md overflow-hidden">
                      <SyntaxHighlighter
                        // 🔧 给 style 加 as any，绕开 syntax-highlighter 类型检查
                        style={oneDark as any}
                        language={match[1]}
                        PreTag="div"
                        className="text-xs rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-mono",
                        isUser
                          ? // 用户消息里的代码块，加!提升优先级，保证在蓝色气泡里正常显示
                            "!bg-blue-700/50 !text-white"
                          : // AI消息里的代码块：加!提升优先级，覆盖prose的默认样式，调整深色背景的深度，保证文字可见
                            "!bg-slate-100 !dark:bg-slate-700 !text-slate-800 !dark:text-slate-100",
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // 2. 自定义段落（调整间距）
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                // 3. 自定义列表
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1 ml-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1 ml-1">
                    {children}
                  </ol>
                ),
                // 4. 自定义链接
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "underline",
                      isUser
                        ? "text-blue-100"
                        : "text-blue-600 dark:text-blue-400",
                    )}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* 👇 保留你的流式输出光标 */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle" />
            )}
          </div>

          {/* 复制按钮：只在 AI 消息且不在流式输出时显示 */}
          {!isUser && !isStreaming && (
            <button
              onClick={async () => {
                try {
                  // 1. 复制消息内容
                  await navigator.clipboard.writeText(message.content);
                  // 2. 显示成功状态
                  setIsCopied(true);
                  // 3. 1秒后恢复
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
  );
}
