"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/store/useChatStore";
import { ChevronDown } from "lucide-react";
import { Trash2, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

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
    fetchConversations,
  } = useChatStore();

  // ==================== 改动1：新增authHydrated水合标记 ====================
  const { isAuthenticated, hasHydrated: authHydrated } = useAuthStore();

  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );
  const messages = activeConversation?.messages || [];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isScrollingBar, setIsScrollingBar] = useState(false);

  // ==================== 改动2：修复后的初始化逻辑，加水合锁 ====================
  useEffect(() => {
    // 关键锁：Auth还没加载完成，绝对不执行拉取，彻底解决竞态
    if (!authHydrated) return;

    if (isAuthenticated) {
      console.log("🔄 从后端同步对话列表");
      fetchConversations();
    }
  }, [isAuthenticated, authHydrated, fetchConversations]);

  // --- 自动滚动到底部逻辑 ---
  useEffect(() => {
    if (isUserScrolling) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight - container.clientHeight;
  }, [
    messages.length,
    messages[messages.length - 1]?.content,
    isUserScrolling,
  ]);

  // --- 滚动监听逻辑 ---
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollToBottom(!isNearBottom);

    if (!isNearBottom) {
      setIsUserScrolling(true);
    }

    setIsScrollingBar(true);
    const timer = setTimeout(() => {
      setIsScrollingBar(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // --- 回到底部按钮逻辑 ---
  const handleScrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsUserScrolling(false);
    setShowScrollToBottom(false);

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  const isStreaming =
    activeConversation?.messages.some((msg) => msg.isStreaming) ?? false;

  // --- 无会话时的欢迎页面 ---
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

  // --- 主渲染逻辑 ---
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {/* 批量删除模式的顶部栏 */}
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

      {/* 普通模式的会话标题栏 */}
      {!isSelectionMode && (
        <div className="h-14 bg-card px-6 py-3">
          <h2 className="text-lg text-card-foreground text-center">
            {activeConversation?.title}
          </h2>
        </div>
      )}

      {/* 消息列表滚动容器 */}
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
          <div className="mx-auto md:max-w-[70%] max-w-[90%] py-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 回到底部按钮和输入框 */}
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
