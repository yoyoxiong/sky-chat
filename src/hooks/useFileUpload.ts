// src/hooks/useFileUpload.ts
import { useState } from "react";
import type { SelectedFile, FileMeta } from "@/store/types";

// 常量配置，统一管理
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_EXTENSIONS =
  ".txt,.md,.c,.cpp,.js,.ts,.jsx,.tsx,.html,.css,.java,.py,.go,.rs,.json";

export function useFileUpload() {
  // 选中的文件列表
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // 文件大小校验
      if (file.size > MAX_FILE_SIZE) {
        alert(`文件${file.name}超过5MB限制，请选择更小的文件`);
        return;
      }

      // 读取文件内容
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // 生成随机唯一id
        const fileId = Math.random().toString(36).substring(2, 9);
        setSelectedFiles((prev) => [
          ...prev,
          {
            id: fileId,
            name: file.name,
            content: content,
            size: file.size,
          },
        ]);
      };
      reader.onerror = () => {
        alert(`文件${file.name}解析失败，请选择文本类文件`);
      };
      reader.readAsText(file, "utf-8");
    });

    // 清空文件选择器，允许重复选同一个文件
    e.target.value = "";
  };

  // 删除单个文件
  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  // 清空所有文件
  const clearFiles = () => {
    setSelectedFiles([]);
  };

  // 拼接给AI的文件内容块
  const getFileContentBlock = () => {
    return selectedFiles
      .map(
        (file) =>
          `\n===== 文件名：${file.name} =====\n${file.content}\n===== 文件结束 =====`,
      )
      .join("\n");
  };

  // 获取给消息列表的文件元数据
  const getFileMeta = (): FileMeta[] => {
    return selectedFiles.map(({ id, name, size }) => ({ id, name, size }));
  };

  return {
    selectedFiles,
    handleFileSelect,
    removeFile,
    clearFiles,
    getFileContentBlock,
    getFileMeta,
  };
}
