// src/components/chat/ChatInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, CircleStopIcon } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-3 md:p-4">
      <div className="mx-auto flex max-w-3xl gap-2 items-end">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={disabled}
          className="flex-1 min-h-[44px] md:min-h-[40px] text-sm"
        />

        {/* 🔧 修复：按钮高度和输入框统一，移动端适配 */}
        {isGenerating ? (
          <Button
            type="button"
            onClick={onStopGenerating}
            variant="destructive"
            className="gap-2 h-[44px] px-4"
          >
            <CircleStopIcon className="h-4 w-4" />
            <span className="hidden sm:inline">停止</span>
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={handleSend}
            disabled={!input.trim()}
            className="gap-2 h-[44px] px-4"
          >
            <SendIcon className="h-4 w-4" />
            <span className="hidden sm:inline">发送</span>
          </Button>
        )}
      </div>
    </div>
  );
}
