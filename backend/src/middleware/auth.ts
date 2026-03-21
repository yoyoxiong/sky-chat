// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

// 扩展 Express 的 Request 类型定义
// 这样 TypeScript 才知道 req.user 是什么
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      };
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // 1. 从 Header 里取出 Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // 没有 Token，或者格式不对
      return res.status(401).json({ error: "未授权，请先登录" });
    }

    // 2. 把 "Bearer " 这几个字去掉，只留 Token 部分
    // "Bearer xxx" -> "xxx"
    const token = authHeader.split(" ")[1];

    // 3. 验证 Token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Token 无效或已过期" });
    }

    // 4. 验证通过！把用户信息挂载到 req 上
    req.user = decoded;

    // 5. 放行！去下一个中间件或路由处理函数
    next();
  } catch (error) {
    console.error("鉴权错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
}
