// src/components/chat/ChatInput.tsx
"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SelectedFile, FileMeta } from "@/store/types";
import {
  SendIcon,
  CircleStopIcon,
  PaperclipIcon,
  XIcon,
  FileTextIcon,
} from "lucide-react";
import { useFileUpload, ALLOWED_FILE_EXTENSIONS } from "@/hooks/useFileUpload";

interface ChatInputProps {
  onSendMessage: (content: string, files: FileMeta[]) => void;
  disabled?: boolean;
  onStopGenerating?: () => void;
  isGenerating?: boolean;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  onStopGenerating,
  isGenerating = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  // 组件里只需要这一行，所有文件逻辑都封装好了
  const {
    selectedFiles,
    handleFileSelect,
    removeFile,
    clearFiles,
    getFileContentBlock,
    getFileMeta,
  } = useFileUpload();

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 发送消息核心逻辑
  const handleSend = () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    // 拼接完整Prompt
    let finalContent = input.trim();
    const fileContentBlock = getFileContentBlock();
    if (fileContentBlock) {
      finalContent = `用户上传了${selectedFiles.length}个文件，文件内容如下：\n${fileContentBlock}\n\n用户的问题：${finalContent || "请总结上面的文件内容"}`;
    }

    // 调用发送方法
    onSendMessage(finalContent, getFileMeta());
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
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 w-full overflow-hidden">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-accent/30 px-3 py-2 text-sm w-fit max-w-[200px] shrink-0"
              >
                <FileTextIcon className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="ml-1 rounded-full hover:bg-background p-0.5 shrink-0"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 🔧 核心：输入框+按钮行，宽度100%固定，布局永远不会动 */}
        <div className="flex w-full gap-2 items-end">
          {/* 隐藏的文件选择器 */}
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

          {/* 上传按钮：固定宽高，永远在最左边，不会动 */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isGenerating}
          >
            <PaperclipIcon className="h-5 w-5" />
          </Button>

          {/* 输入框：flex-1占满剩余空间，不会被挤压 */}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFiles.length > 0
                ? "输入你的问题，AI会基于文件内容回答..."
                : "输入消息..."
            }
            disabled={disabled}
            className="flex-1 min-h-[44px] md:min-h-[40px] text-sm w-full"
          />

          {/* 停止/发送按钮：固定宽高，永远在最右边，不会动 */}
          {isGenerating ? (
            <Button
              type="button"
              onClick={onStopGenerating}
              variant="destructive"
              className="gap-2 h-[44px] px-4 shrink-0"
            >
              <CircleStopIcon className="h-4 w-4" />
              <span className="hidden sm:inline">停止</span>
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSend}
              disabled={!input.trim() && selectedFiles.length === 0}
              className="gap-2 h-[44px] px-4 shrink-0"
            >
              <SendIcon className="h-4 w-4" />
              <span className="hidden sm:inline">发送</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
