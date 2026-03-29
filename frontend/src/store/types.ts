// src/types.ts
// 保持你原有字段风格，只做微调确保前后端匹配

// 定义单条消息的类型
export interface Message {
  id: string; // 🔧 修正：你前端代码里用的是 Date.now().toString()，所以是 string
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  fileAttachments?: FileMeta[];
  imageUrl?: string;
  isGeneratingImage?: boolean;
  generateImageError?: string;
  isLatestMessage?: boolean;
}

// 定义单个会话的类型
export interface Conversation {
  id: number; // 🔧 修正：后端数据库是自增 number
  title: string;
  messages: Message[];
  createdAt: Date; // 🔧 修正：前端水合后会转成 Date 对象
  userId?: number; // 补充：后端有这个字段，前端可选
}

// 文件元数据类型，全局通用
export interface FileMeta {
  id: string;
  name: string;
  size: number;
}

// 选中的文件类型，包含临时的文件内容
export interface SelectedFile extends FileMeta {
  content: string;
}
