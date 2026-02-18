// src/app/(chat)/layout.tsx
"use client";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
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
import { PlusIcon, MessageSquareIcon, Trash2Icon } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/store/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 控制移动端侧边栏显示/隐藏
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 从store解构数据和方法
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    setActiveConversation,
    renameConversation,
    deleteConversation,
  } = useChatStore();

  // 会话重命名相关状态
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");

  // 删除会话相关状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [convIdToDelete, setConvIdToDelete] = useState<string | null>(null);

  // 重命名输入框的ref
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击会话后，自动关闭移动端侧边栏
  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    setIsSidebarOpen(false); // 选完会话自动关闭侧边栏
  };

  // 屏幕宽度变大到PC端时，自动关闭侧边栏
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 移动端蒙层：打开侧边栏时显示，点击关闭 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 侧边栏：PC端固定显示，移动端抽屉式 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card flex flex-col
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
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-card-foreground">Sky-Chat</h2>
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
            className="w-full justify-start gap-2"
            onClick={() => {
              createNewConversation();
              setIsSidebarOpen(false);
            }}
          >
            <PlusIcon className="w-4 h-4" />
            新建聊天
          </Button>
        </div>

        {/* 会话列表区域 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-4">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-4">
              暂无历史会话
            </p>
          ) : (
            <TooltipProvider>
              {conversations.map((conv: Conversation) => (
                <Tooltip key={conv.id}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handleSelectConversation(conv.id)}
                      onDoubleClick={() => {
                        setEditingConvId(conv.id);
                        setTempTitle(conv.title);
                        setTimeout(() => {
                          inputRef.current?.focus();
                        }, 0);
                      }}
                      className={`active:bg-accent cursor-pointer w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors group ${
                        activeConversationId === conv.id
                          ? "bg-blue-50 dark:bg-primary/20 text-blue-700 dark:text-primary font-medium"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <MessageSquareIcon className="w-4 h-4 flex-shrink-0" />
                      {editingConvId === conv.id ? (
                        <Input
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          className="h-7 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (tempTitle.trim() !== "") {
                                renameConversation(conv.id, tempTitle.trim());
                                setEditingConvId(null);
                              }
                            } else if (e.key === "Escape") {
                              setEditingConvId(null);
                            }
                          }}
                          onBlur={() => {
                            if (tempTitle.trim() !== "") {
                              renameConversation(conv.id, tempTitle.trim());
                              setEditingConvId(null);
                            }
                          }}
                          ref={inputRef}
                        />
                      ) : (
                        <span className="text-sm truncate flex-1">
                          {conv.title}
                        </span>
                      )}
                      {/* 删除按钮：hover显示 */}
                      {editingConvId !== conv.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConvIdToDelete(conv.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-all flex-shrink-0"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TooltipTrigger>
                  {/* Tooltip仅PC端显示，移动端隐藏 */}
                  <TooltipContent
                    side="right"
                    align="center"
                    className="hidden md:block"
                  >
                    {conv.title}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          )}
        </div>
      </aside>

      {/* 聊天主内容区 */}
      <main className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* 移动端顶部导航：仅手机显示，显示当前会话标题 */}
        <div className="md:hidden border-b border-border p-3 flex items-center gap-3 shrink-0">
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
        </div>
        {children}
      </main>

      {/* 删除会话确认对话框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
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
                setConvIdToDelete(null);
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
