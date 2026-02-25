// src/app/api/generate-image/route.ts
// 🔧 优化版异步模式：200ms极速轮询，和同步一样快，同时彻底规避超时风险
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "请输入画图提示词" }, { status: 400 });
    }

    const apiKey = process.env.IMAGE_API_KEY;
    const apiUrl =
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
    if (!apiKey) {
      return NextResponse.json(
        { error: "文生图服务配置错误" },
        { status: 500 },
      );
    }

    // 1. 发起异步生成请求，100ms内就能拿到任务ID，绝对不会超时
    const taskRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,//身份验证
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable", // 保留异步模式
      },
      body: JSON.stringify({
        model: "wanx-v1",
        input: { prompt: prompt.trim() },
        parameters: {
          style: "<photography>",//图片风格
          size: "720*1280",//图片大小
          n: 1,//单次生成图片张数
          steps: 15,//迭代步数(图片打磨次数)次数越多越精致
        },
      }),
    });

    if (!taskRes.ok) {
      const error = await taskRes.json();
      return NextResponse.json(
        { error: error.message || "生成失败" },
        { status: taskRes.status },
      );
    }

    const { output } = await taskRes.json();
    const taskId = output.task_id;
    if (!taskId) throw new Error("未获取到任务ID");

    // 2. 🔧 极速轮询：200ms查一次，最多查50次（10秒超时兜底），比之前快5倍
    const maxRetry = 50;
    const pollInterval = 200; // 200毫秒轮询，生成完立刻拿到结果
    let retryCount = 0;

    while (retryCount < maxRetry) {
      // 等待轮询间隔
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      retryCount++;

      // 查询任务状态
      const statusRes = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      const statusResult = await statusRes.json();
      const taskStatus = statusResult.output.task_status;

      // 生成成功，返回图片
      if (taskStatus === "SUCCEEDED") {
        const imageUrl = statusResult.output.results[0].url;
        return NextResponse.json({ imageUrl });
      }

      // 生成失败，抛出错误
      if (taskStatus === "FAILED") {
        throw new Error(statusResult.output.message || "图片生成失败");
      }
    }

    // 超时兜底
    throw new Error("图片生成超时，请重试");
  } catch (error: any) {
    console.error("文生图错误：", error);
    return NextResponse.json(
      { error: error.message || "生成失败，请重试" },
      { status: 500 },
    );
  }
}
