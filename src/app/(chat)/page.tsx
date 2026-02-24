"use client";
import { useEffect, useRef, useState } from "react"; // 1. 新增导入 useState
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/store/useChatStore";
import { ChevronDown } from "lucide-react";

export default function ChatPage() {
  // 从 Store 取数据
  const { conversations, activeConversationId, sendMessage, stopGenerating } =
    useChatStore();
  // 找到当前选中的会话
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );

  // 2. 新增：消息列表容器的 Ref（用来监听滚动事件）
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 3. 新增：滚动锚点的 Ref（用来滚动到底部）
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 4. 新增：控制回到底部按钮显示/隐藏的状态
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  // 5. 新增：记录上一次滚动位置的 Ref（用来判断滚动方向）
  const lastScrollTopRef = useRef(0);

  // 每当消息变化时，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // 6. 新增：核心滚动监听逻辑
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // 判断是否滚动到底部（留 5px 的容错空间，避免因为小数精度问题判断不准）
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

    if (isAtBottom) {
      // 到底部了，自动隐藏按钮
      setShowScrollToBottom(false);
    } else {
      setShowScrollToBottom(true);
    }

    // 更新上一次的滚动位置
    lastScrollTopRef.current = scrollTop;
  };

  // 7. 新增：点击回到底部按钮的逻辑
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // 滚动后自动隐藏按钮
    setShowScrollToBottom(false);
  };

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
      <div
        ref={scrollContainerRef} // 8. 绑定容器 Ref
        onScroll={handleScroll} // 9. 绑定滚动监听事件
        className="flex-1 overflow-y-auto overflow-x-hidden w-full relative"
      >
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
        {/* 修复后的回到底部按钮 */}
        {/* 优化后的回到底部按钮：紧贴输入框上方 */}
        {showScrollToBottom && (
          <button
            onClick={handleScrollToBottom}
            // 只改这一个 className 里的 bottom 值
            className="fixed bottom-32 right-135 bg-card border border-border rounded-full p-2.5 shadow-lg hover:bg-accent hover:shadow-xl transition-all duration-200 z-10"
            title="回到底部"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}

        {/* 10. 优化后的回到底部按钮 */}
        {/* 优化后的回到底部按钮：紧贴输入框上方 */}
      </div>
      {/* 底部：输入框，shrink-0固定不收缩，永远在底部 */}
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
