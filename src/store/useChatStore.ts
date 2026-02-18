// src/store/useChatStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message } from "./types";
import { fetchStream } from "@/lib/stream"; // 导入我们封装的流式工具

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentStopFn: (() => void) | null; // 新增：保存当前的停止函数

  // 原有方法
  createNewConversation: () => void;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>; // 改成异步函数
  stopGenerating: () => void; // 新增：停止生成的方法
  renameConversation: (id: string, newTitle: string) => void; // 新增：重命名方法
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      currentStopFn: null, // 初始为null

      createNewConversation: () => {
        const newId = Date.now().toString();
        const newConversation: Conversation = {
          id: newId,
          title: "新的对话",
          messages: [],
          createdAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: newId,
        }));
      },

      setActiveConversation: (id: string) => {
        set({ activeConversationId: id });
      },

      deleteConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? null
              : state.activeConversationId,
        }));
      },

      renameConversation: (id: string, newTitle: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            // 只修改匹配id的会话标题
            if (conv.id === id) {
              return { ...conv, title: newTitle.trim() }; // trim() 去掉首尾空格
            }
            return conv;
          }),
        }));
      },

      // 新增：停止生成的方法
      stopGenerating: () => {
        const state = get();
        // 如果有停止函数，就调用它
        if (state.currentStopFn) {
          state.currentStopFn();
          // 调用后清空停止函数，避免重复调用
          set({ currentStopFn: null });
        }

        // 同时更新Store，把所有正在生成的消息标记为完成
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

      // 核心：发送消息 + 流式获取AI回复
      sendMessage: async (content: string) => {
        const state = get();

        // 发送新消息前，先停止上一次的生成（避免多个流同时运行）
        if (state.currentStopFn) {
          state.stopGenerating();
        }

        // 1. 没有选中会话时自动创建
        if (!state.activeConversationId) {
          state.createNewConversation();
          const newState = get();
          if (!newState.activeConversationId) return;
        }

        const currentState = get();
        const currentConv = currentState.conversations.find(
          (c) => c.id === currentState.activeConversationId,
        );

        if (!currentConv) return;

        // 2. 第一条消息自动更新会话标题
        // 2. 判断是不是第一句话（触发自动生成标题的条件）
        const isFirstMessage = currentConv.messages.length === 0;

        // 3. 创建用户消息
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: content,
          timestamp: new Date(),
        };

        // 4. 创建AI空消息占位，标记为正在生成
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: "", // 初始为空
          timestamp: new Date(),
          isStreaming: true,
        };

        // 5. 先把两条消息更新到Store，UI立刻渲染
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              return {
                ...conv,
                // 先保留原来的临时标题，等AI生成完再替换
                title: isFirstMessage
                  ? content.length > 10
                    ? content.substring(0, 10) + "..."
                    : content
                  : conv.title,
                messages: [...conv.messages, userMessage, aiMessage],
              };
            }
            return conv;
          }),
        }));

        // 👇 新增：如果是第一句话，异步生成标题，不阻塞主聊天流
        if (isFirstMessage) {
          (async () => {
            try {
              // 调用我们刚写的生成标题API
              const res = await fetch("/api/generate-title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userMessage: content }),
              });
              const { title } = await res.json();
              // 如果AI生成了有效标题，就更新会话标题
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
              // 生成失败的话，就保留原来的截取标题，不用额外处理
            } catch (err) {
              console.error("自动生成标题失败", err);
              // 出错不影响主功能，走兜底逻辑
            }
          })();
        }

        // 6. 调用流式请求，获取AI回复
        await fetchStream(
          "/api/stream", // 我们写的模拟接口地址
          {
            messages: currentConv.messages
              .map((m) => ({
                role: m.role,
                content: m.content,
              }))
              .concat({
                role: "user",
                content: content,
              }),
          }, // 把用户的问题和之前的消息传给后端
          // 每收到一段数据，就追加到AI消息里
          (chunk) => {
            set((state) => ({
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === aiMessageId) {
                        return {
                          ...msg,
                          content: msg.content + chunk,
                        };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
          },
          // 流结束时，标记生成完成,清空停止函数
          () => {
            set((state) => ({
              currentStopFn: null,
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === aiMessageId) {
                        return {
                          ...msg,
                          isStreaming: false,
                        };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
          },
          // 👉 关键：把停止函数保存到Store里
          (stopFn) => {
            set({ currentStopFn: stopFn });
          },
        );
      },
    }),
    {
      // 1. localStorage 的键名
      name: "ai-chat-conversations",

      // 👉 关键修改：把 Date 处理逻辑移到 createJSONStorage 里，类型安全！
      // 👉 只需要替换这一段 storage 配置
      storage: createJSONStorage(() => localStorage, {
        // 存的时候：把 Date 转成 ISO 字符串
        replacer: (key, value) => {
          // 加个类型检查，确保是 Date 类型再处理
          if ((key === "timestamp" || key === "createdAt") && value) {
            // 先转成 any，或者用类型断言，让 TypeScript 放心
            return new Date(value as string | number | Date).toISOString();
          }
          return value;
        },
        // 取的时候：把 ISO 字符串转回 Date 对象
        reviver: (key, value) => {
          if (
            (key === "timestamp" || key === "createdAt") &&
            typeof value === "string"
          ) {
            // 这里我们已经检查了 value 是 string，所以可以直接传
            return new Date(value);
          }
          return value;
        },
      }),

      // 只存需要的状态，排除临时的 currentStopFn
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);
