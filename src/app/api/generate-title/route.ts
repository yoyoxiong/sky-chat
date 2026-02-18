// src/app/api/generate-title/route.ts
import { NextResponse } from "next/server";

// 专门用来生成会话标题的API
export async function POST(req: Request) {
  try {
    const { userMessage } = await req.json();
    // 复用你已经配置好的环境变量，不用额外修改
    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: "未配置AI API Key" }, { status: 500 });
    }

    // 调用AI生成标题，核心是这个Prompt，控制AI生成的标题格式
    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 复用你现有的模型
        messages: [
          {
            role: "system",
            content:
              "你是一个会话标题生成助手，必须严格遵守规则：1. 用不超过10个汉字，总结用户的问题；2. 只输出标题本身，不要加标点、引号、多余的解释；3. 标题要精准概括用户的核心需求，简洁易懂。",
          },
          {
            role: "user",
            content: `请给下面的用户问题生成会话标题：${userMessage}`,
          },
        ],
        stream: false, // 不用流式，直接获取完整结果
        temperature: 0.3, // 降低随机性，保证标题稳定
        max_tokens: 50, // 限制最大长度，避免生成太长的标题
      }),
    });

    const result = await aiResponse.json();
    // 提取AI生成的标题，去掉多余的空格和换行
    const generatedTitle = result.choices?.[0]?.message?.content?.trim() || "";

    // 校验生成的标题是否有效，无效就走兜底
    if (!generatedTitle || generatedTitle.length > 15) {
      return NextResponse.json({ title: null });
    }

    return NextResponse.json({ title: generatedTitle });
  } catch (err) {
    console.error("生成标题失败：", err);
    // 出错时返回null，前端走兜底逻辑
    return NextResponse.json({ title: null });
  }
}
