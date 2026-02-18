"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/store/useChatStore";

export default function ChatPage() {
  // 从 Store 取数据
  const { conversations, activeConversationId, sendMessage, stopGenerating } =
    useChatStore();

  // 找到当前选中的会话
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );

  // 消息列表容器的 Ref（用来自动滚动到底部）
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 每当消息变化时，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // 判断是否有消息正在生成
  const isStreaming =
    activeConversation?.messages.some((msg) => msg.isStreaming) ?? false;

  // 如果没有选中的会话，显示欢迎页
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full overflow-hidden">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-3xl font-bold text-foreground">
            你好，我是 Sky-Chat
          </h1>
          <p className="text-muted-foreground">点击左侧「新建聊天」开始对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="hidden md:block border-b bg-card border-border px-6 py-3 shrink-0">
        <h2 className="font-semibold text-card-foreground">
          {activeConversation.title}
        </h2>
      </div>

      {/* 🔧 核心：中间消息列表，只让这个区域滚动 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        {/* 如果没有消息，显示提示 */}
        {activeConversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            开始一段对话吧
          </div>
        ) : (
          // 遍历渲染消息，给外层加w-full，限制宽度
          <div className="w-full">
            {activeConversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部：输入框，shrink-0固定不收缩，永远在底部 */}
      <div className="shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          disabled={isStreaming}
          isGenerating={isStreaming}
          onStopGenerating={stopGenerating}
        />
      </div>
    </div>
  );
}
