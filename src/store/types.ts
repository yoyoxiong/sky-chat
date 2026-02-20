// 定义单条消息的类型
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean; // 标记是否正在流式生成
  // 上传的文件附件元数据
  fileAttachments?: FileMeta[];
}

// 定义单个会话的类型
export interface Conversation {
  id: string;
  title: string;
  messages: Message[]; // 会话里的消息列表
  createdAt: Date;
}

// 👇 新增：文件元数据类型，全局通用
export interface FileMeta {
  id: string;
  name: string;
  size: number;
}

// 👇 新增：选中的文件类型，包含临时的文件内容
export interface SelectedFile extends FileMeta {
  content: string;
}
