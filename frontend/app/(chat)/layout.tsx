"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleFadingPlus } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ConversationList } from "@/components/chat/conversation/ConversationList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore();
  // 控制移动端侧边栏显示/隐藏
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // 删除会话相关状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [convIdToDelete, setConvIdToDelete] = useState<string | null>(null);

  // 点击会话后，自动关闭移动端侧边栏
  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    setIsSidebarOpen(false); // 选完会话自动关闭侧边栏
  };
  const handleDeleteConversation = (id: string) => {
    setConvIdToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  // 监听窗口大小变化，自动关闭侧边栏（当从移动端切换到PC端时）
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* 移动端蒙层：打开侧边栏时显示，点击关闭 */}
      {isSidebarOpen && (
        //inset-0是铺满整个父容器的意思，z-40是层级关系，数越大层级越高，bg-black/50是背景色半透明
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* 侧边栏：PC端固定显示，移动端抽屉式 */}
      {/*inset-y-0是竖直方向铺满父容器*/}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-70 border-r border-border bg-sidebar flex flex-col
          transition-transform duration-300
          /* 移动端默认隐藏 */
          -translate-x-full
          /* PC端固定显示，脱离fixed定位，不盖住内容 */
          md:translate-x-0 md:static md:z-0
          /* 打开时滑入显示 */
          ${isSidebarOpen ? "translate-x-0" : ""}
        `}
      >
        {/* 侧边栏头部：标题、关闭按钮、主题切换、新建聊天 */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#3964fe]">Sky-Chat</h2>
            <div className="flex items-center gap-2">
              {/* 移动端关闭按钮：仅手机显示 */}
              <button
                type="button"
                className="md:hidden p-2 rounded hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* 新建聊天按钮 */}
          <Button
            className="text-base new-conversation-btn w-full h-12 justify-center gap-2 cursor-pointer rounded-4xl shadow-sm hover:shadow-lg transition-all duration-200 mb-4"
            onClick={() => {
              createNewConversation();
              setIsSidebarOpen(false);
            }}
          >
            <CircleFadingPlus className="size-5" />
            开启新对话
          </Button>
        </div>

        {/* 会话列表区域 */}
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </aside>
      {/* 聊天主内容区 */}
      <main className="flex-1 flex flex-col bg-background">
        {/* 移动端顶部导航：仅手机显示，显示当前会话标题 */}
        <nav className="h-14 md:hidden border-b border-border p-3 flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded hover:bg-accent"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h2 className="font-semibold truncate">
            {conversations.find((c) => c.id === activeConversationId)?.title ||
              "Sky-Chat"}
          </h2>
        </nav>
        {children}
      </main>
      {/* 删除会话确认对话框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          // 弹窗关闭时，自动重置要删除的会话ID
          if (!open) {
            setConvIdToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除会话？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该会话的所有聊天记录将无法恢复，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConvIdToDelete(null);
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (convIdToDelete) {
                  deleteConversation(convIdToDelete);
                }

                setIsDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
