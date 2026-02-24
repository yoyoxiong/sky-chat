// src/components/chat/MarkdownRenderer.tsx
"use client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
// 1. 导入需要的依赖
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  isUser: boolean;
}

// 2. 抽出来的独立 React 组件（首字母大写，符合 Hooks 规则）
function CodeBlock({
  language,
  children,
  isUser,
}: {
  language?: string;
  children: string;
  isUser: boolean;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, "");

  // 一键复制代码逻辑
  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-md overflow-hidden w-full relative group">
      {/* 代码语言标签 */}
      <div className="absolute top-2 left-3 text-xs text-slate-400 font-mono z-10">
        {language || "text"}
      </div>
      {/* 一键复制按钮 */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="复制代码"
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      <SyntaxHighlighter
        style={oneDark as any}
        language={language || "text"}
        PreTag="div"
        className="text-xs rounded-md w-full pt-10"
        wrapLongLines={true}
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownRenderer({ content, isUser }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        // 3. 在 components 里引用我们抽出来的 CodeBlock 组件
        code: ({ inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          // 区分行内代码和代码块
          if (!inline && match) {
            // 代码块：用我们抽出来的 CodeBlock 组件
            return (
              <CodeBlock language={match[1]} isUser={isUser} {...props}>
                {children}
              </CodeBlock>
            );
          } else {
            // 行内代码：还是用原来的 <code> 标签
            return (
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
          }
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
              isUser ? "text-blue-100" : "text-blue-600 dark:text-blue-400",
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
      {content}
    </ReactMarkdown>
  );
}
