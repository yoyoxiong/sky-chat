"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/store/useChatStore";
import { ChevronDown } from "lucide-react";

export default function ChatPage() {
  const { conversations, activeConversationId, sendMessage, stopGenerating } =
    useChatStore();
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );
  const messages = activeConversation?.messages || [];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // 核心：初始化虚拟列表，开启动态高度
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: useCallback(() => 150, []),
    overscan: 5,
    // 开启测量
    measureElement: useCallback(
      (element) => element.getBoundingClientRect().height,
      [],
    ),
  });

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: "end",
        behavior: "smooth",
      });
    }
  }, [messages.length, virtualizer, messages[messages.length - 1]?.content]);

  // 滚动监听逻辑
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    setShowScrollToBottom(!isAtBottom);
  }, []);

  // 回到底部按钮逻辑
  const handleScrollToBottom = () => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: "end",
        behavior: "smooth",
      });
      setShowScrollToBottom(false);
    }
  };

  const isStreaming =
    activeConversation?.messages.some((msg) => msg.isStreaming) ?? false;

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

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden w-full relative"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            开始一段对话吧
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                // ✅ 修正：直接用 virtualizer.measureElement 绑定 ref
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ChatMessage message={messages[virtualItem.index]} />
              </div>
            ))}
          </div>
        )}

        {showScrollToBottom && (
          <button
            onClick={handleScrollToBottom}
            className="fixed bottom-32 right-43 md:right-135 bg-card border border-border rounded-full p-2.5 shadow-lg hover:bg-accent hover:shadow-xl transition-all duration-200 z-10"
            title="回到底部"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="shrink-0">
        <ChatInput
          disabled={isStreaming}
          isGenerating={isStreaming}
          onStopGenerating={stopGenerating}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  );
}
