// src/app/api/generate-image/route.ts
// 文生图后端接口，和你聊天接口的安全逻辑完全一致
import { NextResponse } from "next/server";

// 禁止前端缓存，保证每次都是最新的结果
export const dynamic = "force-dynamic";

// 处理前端发来的POST请求
export async function POST(req: Request) {
  try {
    // 1. 拿到前端传来的画图提示词
    const { prompt } = await req.json();

    // 2. 基础校验：提示词不能为空
    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "请输入画图提示词" }, { status: 400 });
    }

    // 3. 从环境变量拿到API配置，永远不会暴露给前端
    const apiKey = process.env.IMAGE_API_KEY;
    const apiUrl = process.env.IMAGE_API_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: "文生图服务配置错误，请检查环境变量" },
        { status: 500 },
      );
    }

    // 4. 调用阿里云通义万相文生图API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable", // 开启异步生成，避免超时
      },
      body: JSON.stringify({
        model: "wanx-v1", // 通义万相默认模型，画图效果好
        input: {
          prompt: prompt.trim(), // 用户的画图提示词
        },
        parameters: {
          style: "<photography>", // 图片风格：摄影风，可选动漫、手绘等
          size: "1024*1024", // 图片尺寸
          n: 1, // 生成1张图片
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "图片生成失败，请重试" },
        { status: response.status },
      );
    }

    // 5. 拿到生成结果，返回给前端
    const result = await response.json();
    // 通义万相会返回一个任务ID，我们需要轮询任务结果，拿到图片地址
    const taskId = result.output.task_id;

    // 6. 轮询任务结果，直到图片生成完成/失败
    let imageUrl = "";
    let retryCount = 0;
    const maxRetry = 30; // 最多轮询30次，避免死循环

    while (retryCount < maxRetry) {
      // 等待1秒再查询
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 查询任务状态
      const taskRes = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      const taskResult = await taskRes.json();

      // 任务完成，拿到图片地址
      if (taskResult.output.task_status === "SUCCEEDED") {
        imageUrl = taskResult.output.results[0].url;
        break;
      }

      // 任务失败，抛出错误
      if (taskResult.output.task_status === "FAILED") {
        throw new Error(taskResult.output.message || "图片生成失败");
      }

      retryCount++;
    }

    // 超时没生成完
    if (!imageUrl) {
      throw new Error("图片生成超时，请重试");
    }

    // 7. 把图片地址返回给前端
    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("文生图错误：", error);
    return NextResponse.json(
      { error: error.message || "图片生成失败，请稍后重试" },
      { status: 500 },
    );
  }
}
