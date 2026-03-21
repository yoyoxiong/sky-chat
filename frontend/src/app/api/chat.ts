// 统一管理所有聊天相关的API请求，不用在store里写请求逻辑
/**
 * 调用AI生成会话标题
 * @param userMessage 用户的第一条提问
 * @returns 生成的标题
 */
import { fetchWithAuth } from "@/lib/api"; // 导入
export const generateChatTitle = async (userMessage: string) => {
  const res = await fetch("http://localhost:3001/api/generate-title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userMessage }),
  });
  if (!res.ok) throw new Error("生成标题失败");
  return res;
};

/**
 * 发起AI聊天流式请求
 * @param messages 对话历史
 * @returns 流式响应对象
 */
export const fetchChatStream = async (
  body: Record<string, any>,
  options?: { signal?: AbortSignal },
) => {
  return fetchWithAuth("/api/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options?.signal, // 传递signal
  });
};
