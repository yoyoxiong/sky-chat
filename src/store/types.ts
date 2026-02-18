// 定义单条消息的类型
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean; // 新增：标记是否正在流式生成
}

// 定义单个会话的类型
export interface Conversation {
  id: string;
  title: string;
  messages: Message[]; // 会话里的消息列表
  createdAt: Date;
}
