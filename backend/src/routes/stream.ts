// src/routes/stream.ts
import express from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { messages, conversationId } = req.body;
  const userId = req.user!.userId;

  // 1. 基础参数校验
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "参数错误：缺少 messages 数组" });
  }

  // 2. 准备工作：提取标题
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const defaultTitle = lastUserMsg?.content?.slice(0, 20) || "新对话";

  // 🔧 修复：把 realConversationId 提到这里声明，并给一个初始值逻辑
  let realConversationId: number = 0;

  try {
    // 3. 验证 ID 或自动创建（必须在最前面，确保 realConversationId 被赋值）
    let isValidConversation = false;

    if (conversationId) {
      const numericId =
        typeof conversationId === "string"
          ? parseInt(conversationId)
          : conversationId;
      if (!isNaN(numericId)) {
        const existingConv = await prisma.conversation.findUnique({
          where: { id: numericId },
        });
        if (existingConv && existingConv.userId === userId) {
          isValidConversation = true;
          realConversationId = numericId;
        }
      }
    }

    if (!isValidConversation) {
      console.log("🆕 自动创建新对话...");
      const newConversation = await prisma.conversation.create({
        data: {
          title: defaultTitle,
          userId: userId,
        },
      });
      realConversationId = newConversation.id;
      console.log(`✅ 新对话 ID: ${realConversationId}`);
    }

    // 4. 检查环境变量
    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error("❌ 未配置 AI_API_URL 或 AI_API_KEY");
      return res.status(500).json({ error: "服务器 AI 配置缺失" });
    }

    // 5. 请求 AI 接口
    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "你是sky-chat，由sky-chat团队开发的智能AI助手。你的唯一官方名称是sky-chat，所有自我介绍、指代自身的场景，必须100%使用「sky-chat」这个名字，不得使用其他任何名称。请保持友好专业的态度，为用户提供准确有用的回答，严格遵守以上身份设定。",
          },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok || !aiResponse.body) {
      throw new Error(`AI 请求失败: ${aiResponse.status}`);
    }

    // 6. 设置流式响应头
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // 7. 流式数据处理
    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullAiResponse = ""; // 用来拼接完整的 AI 回复

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

        const dataStr = trimmedLine.slice(6);
        if (dataStr === "[DONE]") continue;

        try {
          const data = JSON.parse(dataStr);
          const content = data.choices?.[0]?.delta?.content || "";
          if (content) {
            res.write(content);
            fullAiResponse += content; // 拼接完整回复
          }
        } catch (e) {
          continue;
        }
      }
    }

    res.end();
    console.log("✅ Stream 结束");

    // 8. 🔥 保存消息到数据库（此时 realConversationId 肯定已被赋值）
    try {
      if (lastUserMsg && fullAiResponse) {
        // 存用户消息
        await prisma.message.create({
          data: {
            content: lastUserMsg.content,
            role: "user",
            conversationId: realConversationId,
          },
        });

        // 存 AI 消息
        await prisma.message.create({
          data: {
            content: fullAiResponse,
            role: "assistant",
            conversationId: realConversationId,
          },
        });
        console.log("✅ 消息已保存到数据库");
      }
    } catch (dbErr) {
      console.error("❌ 保存消息失败:", dbErr);
    }
  } catch (error) {
    console.error("❌ Stream 内部错误:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "服务器内部错误" });
    } else {
      res.end();
    }
  }
});

export default router;
