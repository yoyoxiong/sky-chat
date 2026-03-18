import express from "express";

const router = express.Router();

// 把你原来 Next.js 的逻辑直接搬过来，稍微改一下 Express 的写法
router.post("/", async (req, res) => {
  try {
    console.log("收到前端发送的请求");

    // Express 用 req.body 获取请求体，不用 await req.json()
    const { userMessage } = req.body;
    console.log("用户发送的消息", userMessage);

    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;

    if (!apiUrl || !apiKey) {
      // Express 用 res.status().json() 返回
      return res.status(500).json({ error: "未配置AI API Key" });
    }

    // 下面的 fetch 逻辑和你原来的一模一样
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
              "你是一个会话标题生成助手，必须严格遵守规则：1. 用不超过8个汉字，总结用户的问题；2. 只输出标题本身，不要加标点、引号、多余的解释；3. 标题要精准概括用户的核心需求，简洁易懂。",
          },
          {
            role: "user",
            content: `请给下面的用户问题生成会话标题：${userMessage}`,
          },
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    const result = await aiResponse.json();
    const generatedTitle = result.choices?.[0]?.message?.content?.trim() || "";

    if (!generatedTitle || generatedTitle.length > 15) {
      return res.json({ title: null });
    }

    // 成功返回
    res.json({ title: generatedTitle });
  } catch (err) {
    console.error("生成标题失败：", err);
    res.status(500).json({ title: null });
  }
});

export default router;
