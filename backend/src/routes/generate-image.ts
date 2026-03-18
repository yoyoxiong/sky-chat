import express from "express";

const router = express.Router();

export const dynamic = "force-dynamic";

router.post("/", async (req, res) => {
  try {
    const { prompt } = await req.body;
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "请输入画图提示词" });
    }

    const apiKey = process.env.IMAGE_API_KEY;
    const apiUrl = process.env.IMAGE_API_URL;
    if (!apiKey) {
      return res.status(500).json({ error: "文生图服务配置错误" });
    }
    if (!apiUrl) {
      return res.status(500).json({ error: "文生图服务配置错误" });
    }

    // 1. 发起异步生成请求，100ms内就能拿到任务ID，绝对不会超时
    const taskRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`, //身份验证
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable", // 保留异步模式
      },
      body: JSON.stringify({
        model: "wanx-v1",
        input: { prompt: prompt.trim() },
        parameters: {
          style: "<photography>", //图片风格
          size: "720*1280", //图片大小
          n: 1, //单次生成图片张数
          steps: 15, //迭代步数(图片打磨次数)次数越多越精致
        },
      }),
    });
    //未拿到任务ID，直接报错
    if (!taskRes.ok) {
      const error = await taskRes.json();
      return res.status(500).json({ error: error.message || "生成失败" });
    }

    const { output } = await taskRes.json();
    const taskId = output.task_id;
    if (!taskId) throw new Error("未获取到任务ID");
    // 2. 极速轮询：200ms查一次，最多查50次（10秒超时兜底），比之前快5倍
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
        return res.json({ imageUrl });
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
    return res.status(500).json({ error: error.message || "生成失败，请重试" });
  }
});
export default router;
