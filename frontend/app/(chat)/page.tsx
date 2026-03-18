"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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

  // --- 核心：自动滚动到底部逻辑（简化版，不再依赖虚拟列表） ---
  useEffect(() => {
    // 如果用户正在手动浏览历史，不自动滚动
    if (isUserScrolling) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // 直接用原生 scrollTop 滚动到底部
    container.scrollTop = container.scrollHeight - container.clientHeight;
  }, [
    messages.length, // 消息数量变化时滚动
    messages[messages.length - 1]?.content, // 流式内容更新时滚动
    isUserScrolling,
  ]);

  // --- 滚动监听逻辑（完全保留） ---
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

    // 滚动条显示逻辑
    setIsScrollingBar(true);
    const timer = setTimeout(() => {
      setIsScrollingBar(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // --- 回到底部按钮逻辑（完全保留） ---
  const handleScrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsUserScrolling(false);
    setShowScrollToBottom(false);

    // 直接用原生 API 平滑滚动到底部
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  const isStreaming =
    activeConversation?.messages.some((msg) => msg.isStreaming) ?? false;

  // --- 无会话时的欢迎页面（完全保留） ---
  if (!activeConversation) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
          <div className="text-center space-y-4 px-4">
            <h1 className="text-3xl font-bold text-foreground">
              你好，我是 Sky-Chat
            </h1>
            <p className="text-muted-foreground">有什么我能帮您吗</p>
          </div>
        </div>
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

  // --- 主渲染逻辑（替换虚拟列表为普通 map） ---
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {/* 批量删除模式的顶部栏（完全保留） */}
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

      {/* 普通模式的会话标题栏（完全保留） */}
      {!isSelectionMode && (
        <div className="h-14 bg-card px-6 py-3">
          <h2 className="text-lg text-card-foreground text-center">
            {activeConversation?.title}
          </h2>
        </div>
      )}

      {/* 核心：消息列表滚动容器（简化版） */}
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
          // 【核心修改】直接 map 渲染所有消息，去掉虚拟列表的复杂结构
          <div className="mx-auto md:max-w-[70%] max-w-[90%] py-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 回到底部按钮和输入框（完全保留） */}
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
