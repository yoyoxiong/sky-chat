// 前后端统一的类型，避免类型不一致
export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // 前端避免传密码，后端仅入库时用
  githubId?: string;
  avatarUrl?: string;
  createdAt: string; // DateTime转字符串（ISO格式）
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  userId: number;
  messages?: Message[]; // 可选：关联消息
}

export interface Message {
  id: number;
  content: string;
  role: "user" | "assistant"; // 限定role值，避免脏数据
  imageUrl?: string;
  createdAt: string;
  conversationId: number;
}

// 请求体类型（前端传参、后端接收）
export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateConversationRequest {
  title: string;
  userId: number;
}

export interface CreateMessageRequest {
  content: string;
  role: "user" | "assistant";
  imageUrl?: string;
  conversationId: number;
}
