import { NextResponse } from "next/server";
import { AI_MODEL, MAX_TOKENS, TEMPERATURE } from "@/constants";

// 流式输出api，对接 DeepSeek 大模型（兼容 OpenAI 格式）
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 从环境变量读取配置
    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: "未配置 DeepSeek API Key" },
        { status: 500 },
      );
    }

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        // 可选模型：deepseek-coder（代码专用）、deepseek-chat（通用对话）
        messages: messages, // 对话历史（上下文）
        stream: true, // 开启流式输出
        temperature: TEMPERATURE, // 回答随机性（0-1，越小越严谨）
        max_tokens: MAX_TOKENS, // 最大回复长度
        top_p: 0.95, // 采样策略
      }),
    });

    // 处理流式响应（DeepSeek 返回标准 SSE 格式）
    const stream = new ReadableStream({
      async start(controller) {
        if (!aiResponse.body) {
          controller.close();
          return;
        }

        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder(); // 编码推送给前端
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解析二进制流 → 字符串
          buffer += decoder.decode(value, { stream: true }); //缓存区
          // 按行分割缓存区得到lines数组（SSE 数据以换行分隔）
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 删除最后一行（可能不完整）

          // 遍历解析每一行 SSE 数据
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
            //去掉data: 前缀
            const dataStr = trimmedLine.slice(6);
            if (dataStr === "[DONE]") continue; // 流结束标记

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content || "";

              if (content) {
                // 把单个字推给前端，实现打字机效果
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              console.log("解析流式数据失败：", e);
              continue;
            }
          }
        }

        controller.close();
      },
    });

    // 返回流式响应给前端
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("DeepSeek 接口调用失败：", err);
    return NextResponse.json(
      { error: "DeepSeek 服务暂时不可用：" + (err as Error).message },
      { status: 500 },
    );
  }
}
