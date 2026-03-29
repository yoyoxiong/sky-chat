// src/routes/conversations.ts (保持原名，只做补充)
import express from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
const router = express.Router();

// 🔧 保持你原有的获取所有对话接口不变
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const conversations = await prisma.conversation.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      include: { messages: true }, // 🔧 补充：顺便把消息也查出来，前端方便
    });
    res.json({ conversations });
  } catch (error) {
    console.error("获取对话失败:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 🔧 保持你原有的创建对话接口不变，微调返回格式
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;
    const newConversation = await prisma.conversation.create({
      data: {
        userId: userId,
        title: title,
      },
    });
    return res.status(201).json(newConversation);
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 🔧 保持你原有的删除对话接口不变
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const conversationId = parseInt(req.params.id as string);
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return res.status(404).json({ error: "会话不存在" });
    }
    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({ error: "无权操作该会话" });
    }
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

// 🆕 补充：重命名对话接口（你前端renameConversation需要）
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const conversationId = parseInt(req.params.id as string);
    const { title } = req.body;

    // 检查权限
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({ error: "无权操作该会话" });
    }

    // 更新标题
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim() },
    });
    res.json(updatedConversation);
  } catch (error) {
    console.error("重命名会话失败:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

export default router;
