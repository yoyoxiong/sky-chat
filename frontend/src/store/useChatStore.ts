// src/store/useChatStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message, FileMeta } from "./types";
import { fetchStream } from "@/lib/stream";
import { generateChatTitle } from "@/app/api/chat";
import { fetchWithAuth } from "@/lib/api";

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: number | null;
  currentStopFn: (() => void) | null;
  isLatestMessage: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  fetchConversations: () => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
  setActiveConversation: (id: number | string) => void; // 🔧 兼容两种类型
  deleteConversation: (id: number) => Promise<void>;
  sendMessage: (content: string, fileAttachments: FileMeta[]) => Promise<void>;
  stopGenerating: () => void;
  renameConversation: (id: number | string, newTitle: string) => Promise<void>; // 🔧 改为异步，同步后端
  isSelectionMode: boolean;
  selectedMessageIds: string[];
  toggleSelectionMode: () => void;
  toggleMessageSelection: (messageId: string) => void;
  clearSelection: () => void;
  deleteSelectedMessages: () => Promise<void>;
  getOrCreateActiveConversation: () => Conversation | undefined;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      currentStopFn: null,
      isRecognizingIntent: false,
      isSelectionMode: false,
      selectedMessageIds: [],
      isLatestMessage: false,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),

      // 🔑 获取我的对话列表（保持你原有逻辑，适配后端返回格式）
      fetchConversations: async () => {
        try {
          const res = await fetchWithAuth("/api/conversations");
          const data = await res.json();
          // 🔧 补充：后端返回的是 ISO 字符串，前端转成 Date 对象
          const formattedConversations = data.conversations.map(
            (conv: any) => ({
              ...conv,
              createdAt: new Date(conv.createdAt),
              messages:
                conv.messages?.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.createdAt), // 🔧 注意：后端字段是 createdAt，前端映射为 timestamp
                  createdAt: undefined, // 清理一下
                })) || [],
            }),
          );
          set({ conversations: formattedConversations });
        } catch (err) {
          console.error("获取对话失败", err);
        }
      },

      createNewConversation: async () => {
        const state = get();
        if (!state.hasHydrated) {
          console.log("⏳ 还在加载中，禁止创建新对话");
          return;
        }
        try {
          const res = await fetchWithAuth(`/api/conversations`, {
            method: "POST",
            body: JSON.stringify({ title: "新的对话" }),
          });
          if (!res.ok) throw new Error("创建失败");
          const newConversation = await res.json();
          // 🔧 补充：初始化 messages 为空数组
          set((state) => ({
            conversations: [
              { ...newConversation, messages: [] },
              ...state.conversations,
            ],
            activeConversationId: newConversation.id,
          }));
        } catch (err) {
          console.error("创建会话失败", err);
          return;
        }
      },

      // 🔧 兼容 string 和 number 类型的 id
      setActiveConversation: (id: number | string) => {
        set({
          activeConversationId: typeof id === "string" ? parseInt(id) : id,
        });
      },

      deleteConversation: async (conversationId: number) => {
        const state = get();
        try {
          const res = await fetchWithAuth(
            `/api/conversations/${conversationId}`,
            { method: "DELETE" },
          );
          if (!res.ok) throw new Error("删除失败");
        } catch (err) {
          console.error("删除会话失败", err);
          return;
        }
        const newConversations = state.conversations.filter(
          (c) => c.id !== conversationId,
        );
        set({
          conversations: newConversations,
          activeConversationId:
            state.activeConversationId === conversationId
              ? null
              : state.activeConversationId,
        });
      },

      // 🔧 改为异步，同步到后端
      renameConversation: async (id: number | string, newTitle: string) => {
        const numericId = typeof id === "string" ? parseInt(id) : id;
        try {
          // 先更新本地，保证 UI 流畅
          set((state) => ({
            conversations: state.conversations.map((conv) => {
              if (conv.id === numericId) {
                return { ...conv, title: newTitle.trim() };
              }
              return conv;
            }),
          }));
          // 再同步到后端
          const res = await fetchWithAuth(`/api/conversations/${numericId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle.trim() }),
          });
          if (!res.ok) throw new Error("重命名失败");
        } catch (err) {
          console.error("重命名会话失败", err);
        }
      },

      stopGenerating: () => {
        const state = get();
        if (state.currentStopFn) {
          state.currentStopFn();
          set({ currentStopFn: null });
        }
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) => {
                  if (msg.isStreaming) {
                    return { ...msg, isStreaming: false };
                  }
                  return msg;
                }),
              };
            }
            return conv;
          }),
        }));
      },

      getOrCreateActiveConversation: () => {
        const state = get();
        if (!state.hasHydrated) return;
        if (state.activeConversationId) {
          return state.conversations.find(
            (c) => c.id === state.activeConversationId,
          );
        }
        state.createNewConversation();
        const newState = get();
        return newState.conversations.find(
          (c) => c.id === newState.activeConversationId,
        );
      },

      sendMessage: async (
        content: string,
        fileAttachments: FileMeta[] = [],
      ) => {
        const state = get();
        if (state.currentStopFn) state.stopGenerating();
        const currentConv = state.getOrCreateActiveConversation();
        if (!currentConv) return;

        const userPureInput = content.split("\n\n用户的问题：")[1] || content;
        const isFirstMessage = currentConv.messages.length === 0;
        const tempTitle = isFirstMessage
          ? userPureInput.length > 20
            ? userPureInput.substring(0, 20) + "..."
            : userPureInput
          : currentConv.title;

        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: userPureInput,
          timestamp: new Date(),
          fileAttachments:
            fileAttachments.length > 0 ? fileAttachments : undefined,
        };

        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
          isLatestMessage: true,
        };

        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              const UpdatedMessages = conv.messages.map((msg) => ({
                ...msg,
                isLatestMessage: false,
              }));
              return {
                ...conv,
                title: tempTitle,
                messages: [...UpdatedMessages, userMessage, aiMessage],
              };
            }
            return conv;
          }),
        }));

        if (isFirstMessage) {
          (async () => {
            try {
              const res = await generateChatTitle(userPureInput);
              const { title } = await res.json();
              if (title) {
                set((state) => ({
                  conversations: state.conversations.map((conv) => {
                    if (conv.id === state.activeConversationId) {
                      return { ...conv, title };
                    }
                    return conv;
                  }),
                }));
              }
            } catch (err) {
              console.error("自动生成标题失败", err);
            }
          })();
        }

        await fetchStream(
          "/api/stream",
          {
            messages: currentConv.messages
              .map((m) => ({ role: m.role, content: m.content }))
              .concat({ role: "user", content: content }),
            conversationId: currentConv.id,
          },
          (chunk) => {
            set((state) => ({
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === aiMessageId) {
                        return { ...msg, content: msg.content + chunk };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
          },
          (imageUrl) => {
            set((state) => ({
              currentStopFn: null,
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === aiMessageId) {
                        return { ...msg, isStreaming: false, imageUrl };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
          },
          (stopFn) => {
            set({ currentStopFn: stopFn });
          },
        );
      },

      regenerateMessage: async (messageId: string) => {
        const state = get();
        if (!state.activeConversationId || state.currentStopFn) return;
        const currentConv = state.conversations.find(
          (c) => c.id === state.activeConversationId,
        );
        if (!currentConv) return;

        const messageIndex = currentConv.messages.findIndex(
          (msg) => msg.id === messageId,
        );
        if (messageIndex < 1) return;
        const targetAiMessage = currentConv.messages[messageIndex];
        const targetUserMessage = currentConv.messages[messageIndex - 1];

        if (
          targetAiMessage.role !== "assistant" ||
          targetUserMessage.role !== "user"
        )
          return;

        const newAiMessageId = Date.now().toString();
        const newAiMessage: Message = {
          id: newAiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        };

        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              const newMessages = [...conv.messages];
              newMessages.splice(messageIndex, 1, newAiMessage);
              return { ...conv, messages: newMessages };
            }
            return conv;
          }),
        }));

        await fetchStream(
          "/api/stream",
          {
            messages: currentConv.messages
              .slice(0, messageIndex - 1)
              .map((m) => ({ role: m.role, content: m.content }))
              .concat({ role: "user", content: targetUserMessage.content }),
          },
          (chunk) => {
            set((state) => ({
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === newAiMessageId) {
                        return { ...msg, content: msg.content + chunk };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
          },
          () => {
            set((state) => ({
              currentStopFn: null,
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === newAiMessageId) {
                        return { ...msg, isStreaming: false };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
          },
          (stopFn) => set({ currentStopFn: stopFn }),
        );
      },

      toggleSelectionMode: () =>
        set((state) => ({
          isSelectionMode: !state.isSelectionMode,
          selectedMessageIds: !state.isSelectionMode
            ? []
            : state.selectedMessageIds,
        })),

      toggleMessageSelection: (messageId: string) =>
        set((state) => ({
          selectedMessageIds: state.selectedMessageIds.includes(messageId)
            ? state.selectedMessageIds.filter((id) => id !== messageId)
            : [...state.selectedMessageIds, messageId],
        })),

      clearSelection: () =>
        set({ selectedMessageIds: [], isSelectionMode: false }),

      deleteSelectedMessages: async () => {
        const state = get();
        if (
          !state.activeConversationId ||
          state.selectedMessageIds.length === 0
        )
          return;
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.filter(
                  (msg) => !state.selectedMessageIds.includes(msg.id),
                ),
              };
            }
            return conv;
          }),
          isSelectionMode: false,
          selectedMessageIds: [],
        }));
      },
    }),
    {
      name: "ai-chat-conversations",
      storage: createJSONStorage(() => localStorage, {
        replacer: (key, value) => {
          if ((key === "timestamp" || key === "createdAt") && value) {
            return new Date(value as string | number | Date).toISOString();
          }
          return value;
        },
        reviver: (key, value) => {
          if (
            (key === "timestamp" || key === "createdAt") &&
            typeof value === "string"
          ) {
            return new Date(value);
          }
          return value;
        },
      }),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.conversations.forEach((conv) => {
            conv.messages.forEach((msg) => {
              if (typeof msg.timestamp === "string")
                msg.timestamp = new Date(msg.timestamp);
            });
          });
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
