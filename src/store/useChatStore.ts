// src/store/useChatStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message, FileMeta } from "./types";
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
      // 只需要修改sendMessage函数的定义和实现，其他代码完全不动
      sendMessage: async (
        content: string,
        fileAttachments: FileMeta[] = [],
      ) => {
        const state = get();
        // 发送新消息前，先停止上一次的生成
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

        // 从完整Prompt里提取用户的纯提问，只用这个生成标题
        const userPureInput = content.split("\n\n用户的问题：")[1] || content;
        // 判断是不是第一句话（触发自动生成标题的条件）
        const isFirstMessage = currentConv.messages.length === 0;

        // 先给临时标题，保证UI立刻有反馈，兜底逻辑保留
        const tempTitle = isFirstMessage
          ? userPureInput.length > 10
            ? userPureInput.substring(0, 10) + "..."
            : userPureInput
          : currentConv.title;

        // 3. 创建用户消息：content只存用户的纯提问，fileAttachments存文件元数据
        // 🔧 核心：把用户输入的提问从完整Prompt里提取出来，只存到消息里
        const userInput = content.split("\n\n用户的问题：")[1] || content;
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: userInput, // 只存用户的提问，不存文件内容
          timestamp: new Date(),
          fileAttachments:
            fileAttachments.length > 0 ? fileAttachments : undefined, // 存文件元数据
        };

        // 4. 创建AI空消息占位，标记为正在生成
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        };

        // 5. 先把两条消息更新到Store，UI立刻渲染
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              return {
                ...conv,
                title: tempTitle,
                messages: [...conv.messages, userMessage, aiMessage],
              };
            }
            return conv;
          }),
        }));
        if (isFirstMessage) {
          (async () => {
            try {
              // 调用你写好的生成标题API，只用用户的纯提问生成
              const res = await fetch("/api/generate-title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userMessage: userPureInput }),
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
              // 生成失败的话，就保留之前的临时截取标题，兜底逻辑生效
            } catch (err) {
              console.error("自动生成标题失败", err);
              // 出错不影响主功能，自动走兜底的临时标题
            }
          })();
        }

        // 6. 原来的流式请求逻辑完全不动，用完整的content（带文件内容）调用AI
        await fetchStream(
          "/api/stream",
          {
            messages: currentConv.messages
              .map((m) => ({
                role: m.role,
                content: m.content,
              }))
              .concat({
                role: "user",
                content: content, // 给AI发完整的带文件内容的Prompt
              }),
          },
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
          // 把停止函数保存到Store里
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
