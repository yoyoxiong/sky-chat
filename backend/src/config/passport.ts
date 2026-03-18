// src/config/passport.ts
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

// 配置 GitHub 策略
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "http://localhost:3001/auth/github/callback",
      scope: ["user:email"], // 我们需要获取用户的邮箱和基本信息
    },
    // 这个函数会在用户授权成功后调用
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile 是 GitHub 返回的用户信息
        const githubId = profile.id;
        const username = profile.username!;
        const avatarUrl = profile.photos?.[0]?.value || "";

        // 先在数据库里找，这个 GitHub 用户之前有没有登录过
        let user = await prisma.user.findUnique({
          where: { githubId },
        });

        if (!user) {
          // 如果没找到，说明是新用户，我们在数据库里创建一个
          user = await prisma.user.create({
            data: {
              githubId,
              username,
              avatarUrl,
            },
          });
          console.log("🆕 新用户注册：", username);
        } else {
          console.log("👋 老用户登录：", username);
        }

        // 把 user 传给 done，后续路由里可以通过 req.user 获取
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
