// src/routes/auth.ts
import express from "express";
import prisma from "../lib/prisma";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth"; // 导入我们刚才写的加密函数
import { authMiddleware } from "../middleware/auth"; // 导入鉴权中间件
const router = express.Router();

// 注册接口
router.post("/register", async (req, res) => {
  try {
    // 1. 取出前端传来的数据
    const { username, email, password } = req.body;

    // 2. 【校验】基础校验：如果少传了东西，直接报错
    if (!username || !email || !password) {
      // 400 状态码：Bad Request (客户端错误)
      return res.status(400).json({ error: "用户名、邮箱和密码都是必填的" });
    }

    // 3. 【校验】密码长度校验（简单的安全措施）
    if (password.length < 6) {
      return res.status(400).json({ error: "密码长度至少需要6位" });
    }

    // 4. 【查重】检查数据库里是否已存在该邮箱或用户名
    // 这里用 findFirst 而不是 findUnique，是为了同时查 email 或 username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      // 409 状态码：Conflict (冲突)
      return res.status(409).json({ error: "该邮箱或用户名已被注册" });
    }

    // 5. 【加密】一切正常，开始加密密码
    const hashedPassword = await hashPassword(password);

    // 6. 【入库】创建新用户
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword, // 注意：存的是加密后的，不是明文！
        // avatarUrl 可以先为空，或者给个默认头像
      },
    });

    // 7. 【返回】成功！
    // 注意：永远不要把 password 返回给前端，哪怕是加密后的也不行！
    // 我们用 select 显式指定只返回哪些字段，或者手动删
    res.status(201).json({
      message: "注册成功",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    // 【错误处理】最后的兜底
    console.error("注册错误:", error);
    // 500 状态码：Internal Server Error (服务器内部错误)
    res.status(500).json({ error: "服务器内部错误，请稍后重试" });
  }
});
// 登录接口
router.post("/login", async (req, res) => {
  try {
    // 1. 获取前端数据
    // 这里我们允许用户用 邮箱 或者 用户名 登录，所以字段叫 loginId
    const { loginId, password } = req.body;

    // 2. 基础校验
    if (!loginId || !password) {
      return res.status(400).json({ error: "请提供账号和密码" });
    }

    // 3. 查找用户
    // 这里用 findFirst 而不是 findUnique，是为了同时查 email 或 username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginId }, { username: loginId }],
      },
    });

    // 4. 如果用户不存在
    if (!user) {
      // 🔥 安全重点：不要告诉攻击者“这个邮箱没注册”，只说“账号或密码错误”
      // 防止攻击者通过接口遍历哪些邮箱已注册
      return res.status(401).json({ error: "账号或密码错误" });
    }

    // 5. 验证密码 (核心步骤)
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "账号或密码错误" });
    }

    // 6. 生成 Token
    const token = generateToken(user.id, user.username);

    // 7. 返回成功
    res.json({
      message: "登录成功",
      token, // 把 Token 给前端
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    // 这里的 req.user 就是中间件帮我们挂载上去的！
    if (!req.user) {
      return res.status(401).json({ error: "未登录" });
    }

    // 去数据库查一下完整的用户信息（可选）
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        // 🔴 永远不要查 password 字段！
      },
    });

    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    res.json({ user });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

export default router;
