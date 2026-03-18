// src/routes/auth.ts
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = express.Router();

// 1. 登录路由：前端点击「GitHub 登录」就请求这个接口
router.get("/github", passport.authenticate("github", { session: false }));

// 2. 回调路由：GitHub 授权成功后会跳回这里
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "http://localhost:3000/login",
  }),
  (req, res) => {
    // 这里的 req.user 就是我们在 passport.ts 里传给 done 的 user
    const user = req.user as any;

    // 生成 JWT 令牌（有效期 7 天）
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // 关键：把令牌通过 URL 参数传给前端（或者你也可以存在 cookie 里）
    // 这里我们用最简单的方式：跳回前端首页，把 token 带在 URL 后面
    res.redirect(`http://localhost:3000?token=${token}`);
  },
);

// 3. 获取当前登录用户信息的路由（前端用来验证登录状态）
router.get("/me", async (req, res) => {
  try {
    // 从请求头里获取 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "未登录" });
    }

    const token = authHeader.slice(7); // 去掉 "Bearer " 前缀

    // 验证 token 并解析出用户信息
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // 从数据库里查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, avatarUrl: true, createdAt: true }, // 不返回敏感信息
    });

    if (!user) {
      return res.status(401).json({ error: "用户不存在" });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: "无效的令牌" });
  }
});

export default router;
