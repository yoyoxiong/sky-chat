"use client";

import { useState, useRef, useEffect, useId } from "react";
import type { FileMeta } from "@/store/types";
import { useChatStore } from "@/store/useChatStore";

import { useFileUpload, ALLOWED_FILE_EXTENSIONS } from "@/hooks/useFileUpload";
import { InputMode } from "./input/InputMode";
import { InputFileList } from "./input/InputFileList";
import { InputButton } from "./input/InputButton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "lucide-react";

interface ChatInputProps {
  disabled?: boolean;
  onStopGenerating?: () => void;
  isGenerating?: boolean;
  onSendMessage?: (
    content: string,
    fileAttachments: FileMeta[],
  ) => Promise<void>;
}

export function ChatInput({
  disabled = false,
  onStopGenerating,
  isGenerating = false,
  onSendMessage,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const { handleFileSelect } = useFileUpload();

  const { generateImage } = useChatStore();
  const [mode, setMode] = useState<"chat" | "draw">("chat");
  const {
    selectedFiles,
    removeFile,
    clearFiles,
    getFileContentBlock,
    getFileMeta,
  } = useFileUpload();
  // textarea自动高度逻辑（输入内容自动撑开）
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    // 先重置高度，再计算滚动高度，实现自动撑开
    textarea.style.height = "auto";
    const maxHeight = 200; // 最大高度200px，超过后出现滚动条
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  // 输入内容变化时，自动调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const handleGenerateImage = () => {
    if (!input.trim()) return;
    generateImage(input);
    setInput("");
  };
  // 发送消息核心逻辑
  const handleSend = () => {
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating) return;

    // 拼接完整Prompt
    let finalContent = input.trim();
    const fileContentBlock = getFileContentBlock();
    if (fileContentBlock) {
      finalContent = `用户上传了${selectedFiles.length}个文件，文件内容如下：\n${fileContentBlock}\n\n用户的问题：${finalContent || "请总结上面的文件内容"}`;
    }

    // 调用发送方法
    if (mode === "draw") {
      handleGenerateImage();
    } else {
      onSendMessage?.(finalContent, getFileMeta());
    }
    // 清空状态
    setInput("");
    clearFiles();
    // 发送后重置输入框高度
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className=" bg-card p-3 md:p-4">
      <div className="mx-auto max-w-3xl w-full">
        {/* 文件列表：只有当有文件时才显示，显示在输入框上方 */}
        <InputFileList selectedFiles={selectedFiles} removeFile={removeFile} />

        <div
          className={cn(
            "relative w-full rounded-2xl border border-border bg-card shadow-sm transition-all duration-200",
            // 聚焦时的高亮效果
            "focus-within:border-blue-500/50 focus-within:shadow-md",
            // 禁用时的样式
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_FILE_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isGenerating}
          />
          {/* 输入框*/}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isGenerating ? "AI正在生成中..." : "给Sky-Chat发送消息"
            }
            disabled={disabled || isGenerating}
            rows={1} // 初始1行，自动撑开
            className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2">
            {/*输入模式切换按钮 */}
            <InputMode mode={mode} setMode={setMode} />
            <div className="flex items-center gap-2">
              {/* 附件上传按钮 */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0 hover:bg-accent"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isGenerating}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
              {/* 停止/发送按钮：固定宽高，永远在最右边，不会动 */}
              <InputButton
                isGenerating={isGenerating}
                onStopGenerating={onStopGenerating}
                handleSend={handleSend}
                input={input}
                selectedFiles={selectedFiles}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
