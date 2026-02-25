// src/store/useChatStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message, FileMeta } from "./types";
import { fetchStream } from "@/lib/stream"; // 导入我们封装的流式工具
import { generateChatTitle } from "@/app/api/chat";

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentStopFn: (() => void) | null; // 新增：保存当前的停止函数

  regenerateMessage: (messageId: string) => Promise<void>; // 重新生成
  deleteMessage: (messageId: string) => Promise<void>; // 删除消息
  createNewConversation: () => void;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (content: string, fileAttachments: FileMeta[]) => Promise<void>; // 改成异步函数
  stopGenerating: () => void; // 新增：停止生成的方法
  renameConversation: (id: string, newTitle: string) => void; // 新增：重命名方法
  generateImage: (prompt: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      currentStopFn: null, // 初始为null
      isRecognizingIntent: false,

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
          ? userPureInput.length > 20
            ? userPureInput.substring(0, 20) + "..."
            : userPureInput
          : currentConv.title;

        // 3. 创建用户消息：content只存用户的纯提问，fileAttachments存文件元数据
        // 🔧 核心：把用户输入的提问从完整Prompt里提取出来，只存到消息里
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: userPureInput, // 只存用户的提问，不存文件内容
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
              const res = await generateChatTitle(userPureInput);
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
              //得到一个只包含{role,content}的消息数组
              .map((m) => ({
                role: m.role,
                content: m.content,
              }))
              //在消息数组末尾增加一条刚发送的用户信息
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
      // 👇 新增：文生图核心方法
      generateImage: async (prompt: string) => {
        //const state = get();
        //1. 没有选中会话时自动新建，和聊天逻辑一致
        // if (!state.activeConversationId) {
        //   state.createNewConversation();
        //   const newState = get();
        //   if (!newState.activeConversationId) return;
        // }
        const currentState = get();
        const currentConv = currentState.conversations.find(
          (c) => c.id === currentState.activeConversationId,
        );
        if (!currentConv) return;

        // 2. 第一条消息自动生成标题，和聊天逻辑一致
        const isFirstMessage = currentConv.messages.length === 0;
        const tempTitle = isFirstMessage
          ? prompt.length > 20
            ? prompt.substring(0, 20) + "..."
            : prompt
          : currentConv.title;

        // 3. 创建用户的提示词消息
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: prompt,
          timestamp: new Date(),
        };

        // 4. 创建AI的图片占位消息，标记正在生成
        const aiImageMessageId = (Date.now() + 1).toString();
        const aiImageMessage: Message = {
          id: aiImageMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isGeneratingImage: true, // 标记正在生成图片
        };

        // 5. 先把两条消息更新到store，UI立刻显示，给用户即时反馈
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              return {
                ...conv,
                title: tempTitle,
                messages: [...conv.messages, userMessage, aiImageMessage],
              };
            }
            return conv;
          }),
        }));
        if (isFirstMessage) {
          (async () => {
            try {
              // 调用你写好的生成标题API，只用用户的纯提问生成
              const res = await generateChatTitle(prompt);
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

        try {
          // 6. 调用我们自己写的后端文生图接口
          const res = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });

          const result = await res.json();

          // 7. 生成失败，更新错误状态
          if (!res.ok || !result.imageUrl) {
            set((state) => ({
              conversations: state.conversations.map((conv) => {
                if (conv.id === state.activeConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                      if (msg.id === aiImageMessageId) {
                        return {
                          ...msg,
                          isGeneratingImage: false,
                          generateImageError:
                            result.error || "图片生成失败，请重试",
                          content:
                            "抱歉，图片生成失败了，你可以换个提示词重试~",
                        };
                      }
                      return msg;
                    }),
                  };
                }
                return conv;
              }),
            }));
            return;
          }

          // 8. 生成成功，更新图片地址到消息里
          set((state) => ({
            conversations: state.conversations.map((conv) => {
              if (conv.id === state.activeConversationId) {
                return {
                  ...conv,
                  messages: conv.messages.map((msg) => {
                    if (msg.id === aiImageMessageId) {
                      return {
                        ...msg,
                        isGeneratingImage: false,
                        imageUrl: result.imageUrl,
                        content: "图片生成完成，你可以点击图片查看大图~",
                      };
                    }
                    return msg;
                  }),
                };
              }
              return conv;
            }),
          }));
        } catch (error: unknown) {
          // 先判断 error 是不是 Error 类型
  const errorMessage = error instanceof Error 
    ? error.message 
    : "网络错误，请重试";
          // 9. 网络错误兜底
          set((state) => ({
            conversations: state.conversations.map((conv) => {
              if (conv.id === state.activeConversationId) {
                return {
                  ...conv,
                  messages: conv.messages.map((msg) => {
                    if (msg.id === aiImageMessageId) {
                      return {
                        ...msg,
                        isGeneratingImage: false,
                        generateImageError: errorMessage,
                        content: "抱歉，网络出问题了，图片生成失败了~",
                      };
                    }
                    return msg;
                  }),
                };
              }
              return conv;
            }),
          }));
        }
      },
      // 👇 新增1：重新生成AI回复
      regenerateMessage: async (messageId: string) => {
        const state = get();
        // 边界判断
        if (!state.activeConversationId || state.currentStopFn) return;
        const currentConv = state.conversations.find(
          (c) => c.id === state.activeConversationId,
        );
        if (!currentConv) return;

        // 1. 找到要重新生成的AI消息，以及它对应的上一条用户提问
        const messageIndex = currentConv.messages.findIndex(
          (msg) => msg.id === messageId,
        );
        if (messageIndex < 1) return; // 第一条消息不可能是AI回复，直接返回
        const targetAiMessage = currentConv.messages[messageIndex];
        const targetUserMessage = currentConv.messages[messageIndex - 1];

        // 只允许重新生成AI的回复，用户消息不能重新生成
        if (
          targetAiMessage.role !== "assistant" ||
          targetUserMessage.role !== "user"
        )
          return;

        // 2. 先删除原来的AI消息，创建新的占位消息
        const newAiMessageId = Date.now().toString();
        const newAiMessage: Message = {
          id: newAiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        };

        // 3. 更新store：删掉旧的AI消息，加入新的占位消息
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              const newMessages = [...conv.messages];
              newMessages.splice(messageIndex, 1, newAiMessage); // 替换旧的AI消息
              return { ...conv, messages: newMessages };
            }
            return conv;
          }),
        }));

        // 4. 复用你现有的流式请求逻辑，重新发送用户的提问
        await fetchStream(
          "/api/stream",
          {
            messages: currentConv.messages
              .slice(0, messageIndex - 1) // 取这条消息之前的所有对话历史
              .map((m) => ({ role: m.role, content: m.content }))
              .concat({ role: "user", content: targetUserMessage.content }), // 重新发送用户的提问
          },
          // 流式更新内容
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
          // 流结束收尾
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
          // 保存停止函数
          (stopFn) => set({ currentStopFn: stopFn }),
        );
      },

      // 👇 新增2：删除单条消息（同时删除对应的问答对，符合主流交互）
      deleteMessage: async (messageId: string) => {
        const state = get();
        if (!state.activeConversationId) return;
        const currentConv = state.conversations.find(
          (c) => c.id === state.activeConversationId,
        );
        if (!currentConv) return;

        const messageIndex = currentConv.messages.findIndex(
          (msg) => msg.id === messageId,
        );
        if (messageIndex === -1) return;

        const targetMessage = currentConv.messages[messageIndex];
        const messagesToDelete = [messageIndex];

        // 如果是AI回复，同时删除它对应的上一条用户提问
        if (targetMessage.role === "assistant" && messageIndex > 0) {
          messagesToDelete.push(messageIndex - 1);
        }
        // 如果是用户提问，同时删除它对应的下一条AI回复
        if (
          targetMessage.role === "user" &&
          messageIndex < currentConv.messages.length - 1
        ) {
          messagesToDelete.push(messageIndex + 1);
        }

        // 去重+倒序删除，避免索引错乱
        const uniqueIndexes = [...new Set(messagesToDelete)].sort(
          (a, b) => b - a,
        );

        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              const newMessages = [...conv.messages];
              uniqueIndexes.forEach((index) => newMessages.splice(index, 1));
              return { ...conv, messages: newMessages };
            }
            return conv;
          }),
        }));
      },
      // 👇 核心：统一发送方法，自动判断意图，解决回车键尴尬
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
