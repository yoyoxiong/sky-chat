import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("成功调用stream接口");

    const { messages } = req.body;
    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;

    if (!apiUrl || !apiKey) {
      return res.status(500).json({ error: "未配置 DeepSeek API Key" });
    }

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
          // 【对话历史：展开前端传来的对话数组，放在system之后】
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
      }),
    });

    if (!aiResponse.ok || !aiResponse.body) {
      throw new Error("请求失败");
    }

    // --- 关键：Express 设置 SSE 响应头 ---
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

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
            // --- 关键：Express 用 res.write() 推送流式数据 ---
            res.write(content);
          }
        } catch (e) {
          console.log("解析流式数据失败：", e);
          continue;
        }
      }
    }

    // --- 关键：流式结束，用 res.end() 关闭连接 ---
    res.end();
  } catch (err) {
    console.error("DeepSeek 接口调用失败：", err);
    // 如果还没发送响应头，返回错误 JSON
    if (!res.headersSent) {
      res.status(500).json({ error: "DeepSeek 服务暂时不可用" });
    } else {
      // 如果已经开始流式输出，直接结束
      res.end();
    }
  }
});

export default router;
