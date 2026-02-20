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
import { cn } from "@/lib/utils";

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
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 解析选中的文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // 基础校验：5MB大小限制
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert(`文件${file.name}超过5MB限制，请选择更小的文件`);
        return;
      }

      // 解析文本文件
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setSelectedFiles((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            content: content,
            size: file.size,
          },
        ]);
      };
      reader.onerror = () => {
        alert(`文件${file.name}解析失败，请选择文本类文件`);
      };
      reader.readAsText(file, "utf-8");
    });

    // 清空文件选择器，允许重复选同一个文件
    e.target.value = "";
  };

  // 删除选中的文件
  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  // 发送消息核心逻辑
  const handleSend = () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    // 1. 提取要传给AI的文件内容，拼接成完整Prompt
    let finalPrompt = input.trim();
    if (selectedFiles.length > 0) {
      const fileContentBlock = selectedFiles
        .map((file) => {
          return `\n===== 文件名：${file.name} =====\n${file.content}\n===== 文件结束 =====`;
        })
        .join("\n");

      // 给AI加引导指令，让它基于文件内容回答
      finalPrompt = `用户上传了${selectedFiles.length}个文件，文件内容如下：\n${fileContentBlock}\n\n用户的问题：${finalPrompt || "请总结上面的文件内容"}`;
    }

    // 2. 传给store的文件元数据，只存id、name、size，不存content
    const fileMeta = selectedFiles.map(({ id, name, size }) => ({
      id,
      name,
      size,
    }));

    // 3. 调用发送方法，把「纯提问」和「文件元数据」分开传
    onSendMessage(finalPrompt, fileMeta);

    // 4. 发送后清空状态
    setInput("");
    setSelectedFiles([]);
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
            accept=".txt,.md,.c,.cpp,.js,.ts,.jsx,.tsx,.html,.css,.java,.py,.go,.rs,.json"
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
