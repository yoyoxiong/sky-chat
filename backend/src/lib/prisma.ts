// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// 创建一个全局的 PrismaClient 实例，避免重复连接数据库
const prisma = new PrismaClient({
  // 开发环境下打印 SQL 语句，方便调试
  log: ["query", "info", "warn", "error"],
});

export default prisma;
