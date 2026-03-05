"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/store/useChatStore";
import { ChevronDown } from "lucide-react";
import { Trash2, X } from "lucide-react";

export default function ChatPage() {
  const {
    conversations,
    activeConversationId,
    sendMessage,
    stopGenerating,
    isSelectionMode,
    selectedMessageIds,
    clearSelection,
    deleteSelectedMessages,
  } = useChatStore();
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );
  const messages = activeConversation?.messages || [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isScrollingBar, setIsScrollingBar] = useState(false);

  // 核心：初始化虚拟列表，开启动态高度
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: useCallback(() => 150, []),
    overscan: 5,
    measureElement: useCallback(
      (element) => element.getBoundingClientRect().height,
      [],
    ),
  });
  useEffect(() => {
    setIsUserScrolling(false);
    virtualizer.scrollToIndex(messages.length - 1, {
      align: "end",
      behavior: "smooth", // 这里可以保留 smooth，因为是用户主动点击
    });
    setShowScrollToBottom(false);
  }, [messages.length]);
  //自动滚动逻辑：区分生成中/生成结束
  useEffect(() => {
    if (messages.length === 0 || isUserScrolling) return;

    const lastMessage = messages[messages.length - 1];
    const isLastMessageStreaming = lastMessage?.isStreaming;

    if (isLastMessageStreaming) {
      // 【情况1】AI正在生成：轻量滚动，不频繁measure，减少颤动
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          // 直接用原生scrollTop，不用virtualizer.scrollToIndex，减少计算压力
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      });
    } else {
      // 【情况2】AI生成结束：一次性重测高度+精准滚动
      virtualizer.measure();
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(messages.length - 1, {
          align: "end",
          behavior: "auto",
        });
      });
    }
  }, [
    messages.length,
    virtualizer,
    isUserScrolling,
    messages[messages.length - 1]?.content,
    messages[messages.length - 1]?.isStreaming,
  ]);

  // 滚动监听逻辑
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // 离底部 100px 以内算“在底部”
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollToBottom(!isNearBottom);
    // 关键：如果不在底部，说明用户在手动翻历史
    if (!isNearBottom) {
      setIsUserScrolling(true);
    }

    setIsScrollingBar(true); // 一滚动就显示
    const timer = setTimeout(() => {
      setIsScrollingBar(false); // 停止滚动 150ms 后隐藏
    }, 400);

    // 清理定时器，防止内存泄漏
    return () => clearTimeout(timer);
  }, []);

  // 回到底部按钮逻辑
  const handleScrollToBottom = () => {
    if (messages.length > 0) {
      // 重置用户滚动状态
      setIsUserScrolling(false);
      setShowScrollToBottom(false);

      virtualizer.scrollToIndex(messages.length - 1, {
        align: "end",
        behavior: "smooth", // 这里可以保留 smooth，因为是用户主动点击
      });
    }
  };
  const isStreaming =
    activeConversation?.messages.some((msg) => msg.isStreaming) ?? false;

  if (!activeConversation) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* 欢迎语区域：占据剩余空间，垂直水平居中 */}
        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
          <div className="text-center space-y-4 px-4">
            <h1 className="text-3xl font-bold text-foreground">
              你好，我是 Sky-Chat
            </h1>
            <p className="text-muted-foreground">有什么我能帮您吗</p>
          </div>
        </div>

        {/* 输入框区域：固定在底部 */}
        <div>
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

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {isSelectionMode && (
        <div className="bg-card px-6 py-3 shrink-0 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="font-medium">
              已选择 {selectedMessageIds.length} 条消息
            </span>
          </div>
          <button
            onClick={deleteSelectedMessages}
            disabled={selectedMessageIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        </div>
      )}
      {!isSelectionMode && (
        <div className="h-14 bg-card px-6 py-3">
          <h2 className="text-lg text-card-foreground text-center">
            {activeConversation?.title}
          </h2>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto w-full relative scrollbar-chat ${isScrollingBar ? "is-scrolling" : ""}`}
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
            className="mx-auto md:max-w-[70%] max-w-[90%]"
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                // 直接用 virtualizer.measureElement 绑定 ref
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="min-h-[80px]"
              >
                <ChatMessage message={messages[virtualItem.index]} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-center">
        {showScrollToBottom && (
          <button
            onClick={handleScrollToBottom}
            className="fixed bottom-47 bg-card border border-border rounded-full p-2.5 shadow-lg hover:bg-accent hover:shadow-xl transition-all duration-200 z-10"
            title="回到底部"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
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
