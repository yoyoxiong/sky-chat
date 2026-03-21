import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma"; // 导入我们的 prisma 实例

// 导入路由（我们后面再写）
import generateTitleRoute from "./routes/generate-title";
import streamRoute from "./routes/stream";
import generateImageRoute from "./routes/generate-image";
import authRoute from "./routes/auth";
import conversationsRoute from "./routes/conversations";

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors()); // 允许跨域请求（前端 Next.js 是 3000 端口，后端是 3001，必须要）
app.use(express.json()); // 解析 JSON 请求体

// 注册路由
app.use("/api/generate-title", generateTitleRoute);
app.use("/api/stream", streamRoute);
app.use("/api/generate-image", generateImageRoute);
app.use("/api/auth", authRoute);
app.use("/api/conversations", conversationsRoute);

// 启动服务器前先连接数据库
async function main() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log("✅ 数据库连接成功！");

    app.listen(PORT, () => {
      console.log(`🚀 后端服务器已启动: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ 启动失败：", error);
    process.exit(1);
  }
}

main();
