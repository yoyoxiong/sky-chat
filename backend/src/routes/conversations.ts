// src/routes/conversations.ts (假设)
import express from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth"; // 🔑 必须加上鉴权

const router = express.Router();

// 🔑 获取当前登录用户的所有对话
router.get("/", authMiddleware, async (req, res) => {
  try {
    // 这里的 req.user 是中间件给的，绝对安全
    const userId = req.user!.userId;

    // 查数据库：只查 userId 等于当前登录用户的对话
    const conversations = await prisma.conversation.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" }, // 按时间倒序排
      include: { messages: true }, // 顺便把消息也查出来（可选）
    });

    res.json({ conversations });
  } catch (error) {
    console.error("获取对话失败:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 🔑 创建新对话
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { content, conversationId } = req.body;

    // 🔥 关键步骤：先确认这个 conversationId 是不是属于当前用户的！
    // 防止恶意用户随便填一个别人的 conversationId 来发消息
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId, // 🔑 必须同时满足 ID 匹配且属于当前用户
      },
    });

    if (!conversation) {
      // 找不到这个对话，或者不是你的
      return res.status(403).json({ error: "无权访问该对话" });
    }

    // 确认安全了，再创建消息
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        role: "user",
      },
    });

    res.json({ message });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});
// 🔥 新增：删除指定会话（必须是当前用户的）
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const conversationId = parseInt(req.params.id as string);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "无效的会话ID" });
    }

    // 先检查会话是否属于当前用户，防止越权
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({ error: "无权操作该会话" });
    }

    // 先删除会话下的所有消息，再删除会话
    await prisma.message.deleteMany({
      where: { conversationId: conversationId },
    });
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("删除会话失败:", error);
    res.status(500).json({ error: "删除失败" });
  }
});

export default router;
