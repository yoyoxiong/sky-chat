// src/components/chat/MessageActions.tsx
"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  Share2,
  Trash2,
  Loader2,
} from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  content: string;
  isStreaming?: boolean;
  hasStopFunction?: boolean;
  onRegenerate: (messageId: string) => void;
  onDelete: (messageId: string) => Promise<void>;
}

export function MessageActions({
  messageId,
  content,
  isStreaming = false,
  hasStopFunction = false,
  onRegenerate,
  onDelete,
}: MessageActionsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 复制消息内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 重新生成回复
  const handleRegenerate = () => {
    if (isStreaming || hasStopFunction) return;
    onRegenerate(messageId);
  };

  // 语音朗读/停止
  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("您的浏览器不支持语音朗读功能");
      return;
    }

    // 如果正在朗读，停止
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // 开始朗读
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "zh-CN";
    utterance.rate = 1.2;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // 分享消息
  const handleShare = async () => {
    const shareText = `AI：${content}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI聊天对话",
          text: shareText,
        });
        return;
      } catch (err) {
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

  // 删除消息
  const handleDelete = async () => {
    if (isStreaming || hasStopFunction) return;
    setIsDeleting(true);
    try {
      await onDelete(messageId);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
        disabled={!!hasStopFunction}
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
        disabled={isDeleting || !!hasStopFunction}
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
  );
}
