"use client";

import { Trash2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/store/types";
import { useRef, useState } from "react";
import { useChatStore } from "@/store/useChatStore";

interface ConversationItemProps {
  conv: Conversation;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export function ConversationItem({
  conv,
  onSelectConversation,
  onDeleteConversation,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { renameConversation, activeConversationId } = useChatStore();
  const isActive = conv.id === activeConversationId;
  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempTitle(conv.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    if (tempTitle.trim()) {
      renameConversation(conv.id, tempTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <div
      onClick={() => onSelectConversation?.(conv.id)}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-pointer w-full p-3 rounded-xl flex items-center gap-3 transition-colors group",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent",
      )}
    >
      {isEditing ? (
        <Input
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          className="h-7 text-sm"
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          ref={inputRef}
          // 阻止点击输入框时触发外层的 onClick (选择会话)
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="text-base truncate flex-1">{conv.title}</span>
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            双击修改标题
          </span>
        </>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // 阻止冒泡触发选择会话
            onDeleteConversation?.(conv.id);
          }}
          className="opacity-100 md:opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
