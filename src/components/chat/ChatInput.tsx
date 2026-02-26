// src/components/chat/ChatInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { FileMeta } from "@/store/types";
import { useChatStore } from "@/store/useChatStore";

import { useFileUpload } from "@/hooks/useFileUpload";
import { InputMode } from "./input/InputMode";
import { InputFileList } from "./input/InputFileList";
import { InputFileSelector } from "./input/InputFileSelector";
import { InputButton } from "./input/InputButton";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const { generateImage } = useChatStore();
  const [mode, setMode] = useState<"chat" | "draw">("chat");
  const {
    selectedFiles,
    removeFile,
    clearFiles,
    getFileContentBlock,
    getFileMeta,
  } = useFileUpload();

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
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-3 md:p-4">
      {/* 🔧 核心：外层容器固定最大宽度，不会被内容撑开，布局完全锁死 */}
      <div className="mx-auto max-w-3xl w-full">
        {/* 选中的文件列表：和豆包一致，在输入框上方平铺，不会挤压输入框 */}
        <InputMode mode={mode} setMode={setMode} />
        <InputFileList selectedFiles={selectedFiles} removeFile={removeFile} />
        {/* 🔧 核心：输入框+按钮行，宽度100%固定，布局永远不会动 */}
        <div className="flex w-full gap-3 items-end">
          <InputFileSelector disabled={disabled} isGenerating={isGenerating} />
          {/* 输入框：flex-1占满剩余空间，不会被挤压 */}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isGenerating
                ? "AI正在生成中..."
                : "输入消息，或者输入画图需求，按回车发送..."
            }
            disabled={disabled || isGenerating}
            className="flex-1 min-h-[44px] md:min-h-[40px] text-sm w-full"
          />

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
  );
}
