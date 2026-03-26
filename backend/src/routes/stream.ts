// src/routes/stream.ts
import express from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// ==============================================
// 🔧 1. 定义你的工具清单（告诉大模型你有哪些能力）
// 这里是核心！大模型会根据这个定义，自主判断调用哪个工具
// ==============================================
const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "当用户需要最新的实时信息、新闻、天气、价格、事件、数据等，调用这个工具进行联网搜索",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "用户的搜索关键词，要精准、简洁",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ai_draw",
      description:
        "当用户需要画图、绘画、生成图片、插画、设计图、照片等视觉内容时，调用这个工具生成图片",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              "用户的绘画需求，要描述清楚画面内容、风格、细节，比如“一只坐在樱花树上的猫咪，日系治愈风格，高清摄影”",
          },
        },
        required: ["prompt"],
      },
    },
  },
];

// ==============================================
// 🔧 2. 工具执行函数（对应上面的工具定义，实现具体逻辑）
// ==============================================
// 联网搜索工具
// 🔧 替换后的联网搜索工具（Tavily版，国内直连无需梯子）
async function webSearch(query: string) {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) {
    console.log("⚠️ 未配置 TAVILY_API_KEY，跳过搜索");
    return { error: "搜索功能未配置", content: null };
  }

  try {
    console.log(`🔍 Agent调用搜索工具: ${query}`);
    // 国内可直接访问的API接口，无需梯子
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic", // 基础搜索，速度快，免费额度够用
        include_answer: false, // 不用AI总结，我们自己给大模型处理
        max_results: 4, // 只取前4条，避免Prompt过长
      }),
    });

    if (!response.ok) throw new Error(`搜索请求失败: ${response.status}`);

    const data = await response.json();
    // console.log(data);

    // 格式化搜索结果，和之前的格式完全兼容，大模型直接能用
    const content = data.results
      .map((item: any) => `【标题】${item.title}\n【内容摘要】${item.content}`)
      .join("\n\n");

    return { error: null, content: content || "未找到相关信息" };
  } catch (e) {
    console.error("搜索工具执行失败:", e);
    return { error: "搜索工具执行失败", content: null };
  }
}

// AI绘画工具
// 🔧 替换后的AI绘画工具（阿里云万相wanx-v1版，完全复用你原本的逻辑）
async function aiDraw(prompt: string) {
  const apiKey = process.env.IMAGE_API_KEY;
  const apiUrl = process.env.IMAGE_API_URL;

  if (!apiKey || !apiUrl) {
    console.log("⚠️ 未配置 IMAGE_API_KEY 或 IMAGE_API_URL，跳过绘画");
    return { error: "绘画功能未配置", content: null };
  }

  try {
    console.log(`🎨 Agent调用绘画工具: ${prompt}`);

    // 1. 复用你原本的逻辑：发起异步生成请求，拿任务ID
    const taskRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: "wanx-v1",
        input: { prompt: prompt.trim() },
        parameters: {
          style: "<photography>",
          size: "720*1280",
          n: 1,
          steps: 15,
        },
      }),
    });

    if (!taskRes.ok) {
      const error = await taskRes.json();
      throw new Error(error.message || "生成请求失败");
    }

    const { output } = await taskRes.json();
    const taskId = output.task_id;
    if (!taskId) throw new Error("未获取到任务ID");

    // 2. 复用你原本的逻辑：极速轮询任务状态
    const maxRetry = 50;
    const pollInterval = 200;
    let retryCount = 0;

    while (retryCount < maxRetry) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      retryCount++;

      const statusRes = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      const statusResult = await statusRes.json();
      const taskStatus = statusResult.output.task_status;

      // 生成成功，返回图片URL
      if (taskStatus === "SUCCEEDED") {
        const imageUrl = statusResult.output.results[0].url;
        console.log(`✅ 图片生成成功: ${imageUrl}`);
        return { error: null, content: imageUrl };
      }

      // 生成失败
      if (taskStatus === "FAILED") {
        throw new Error(statusResult.output.message || "图片生成失败");
      }
    }

    // 超时兜底
    throw new Error("图片生成超时，请重试");
  } catch (e: any) {
    console.error("🎨 绘画工具执行失败:", e);
    return { error: e.message || "绘画工具执行失败", content: null };
  }
}

// 工具分发器：根据大模型返回的工具名，调用对应的执行函数
async function runTool(toolName: string, args: any) {
  switch (toolName) {
    case "web_search":
      return await webSearch(args.query);
    case "ai_draw":
      return await aiDraw(args.prompt);
    default:
      return { error: "未知工具", content: null };
  }
}

// ==============================================
// 🔧 3. 核心接口逻辑（Agent闭环）
// ==============================================
router.post("/", authMiddleware, async (req, res) => {
  const { messages, conversationId } = req.body;
  const userId = req.user!.userId;

  // 基础参数校验
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "参数错误：缺少 messages 数组" });
  }

  // 提取用户最后一条消息，用于标题和工具调用
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const defaultTitle = lastUserMsg?.content?.slice(0, 20) || "新对话";
  let realConversationId: number = 0;

  try {
    // ==============================================
    // 原有逻辑：会话管理（完全保留，不破坏你之前的功能）
    // ==============================================
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

    //如果会话不存在就创建新对话
    if (!isValidConversation) {
      const newConversation = await prisma.conversation.create({
        data: { title: defaultTitle, userId: userId },
      });
      realConversationId = newConversation.id;
    }

    // 环境变量校验
    const aiApiUrl = process.env.AI_API_URL;
    const aiApiKey = process.env.AI_API_KEY;
    if (!aiApiUrl || !aiApiKey) {
      return res.status(500).json({ error: "服务器 AI 配置缺失" });
    }

    // ==============================================
    // 🔴 Agent核心第一步：让大模型做决策，判断要不要调用工具
    // ==============================================
    console.log("🤖 Agent正在分析用户需求...");
    const decisionResponse = await fetch(aiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是sky-chat，一个智能AI助手。你可以根据用户的需求，自主选择调用工具来完成任务。
            规则：
            1. 如果用户的需求需要最新信息、实时数据，必须调用web_search工具
            2. 如果用户的需求是生成图片、绘画，必须调用ai_draw工具
            3. 如果是普通聊天、不需要工具就能回答的问题，不要调用任何工具，直接回答
            4. 严格按照工具的参数要求调用，不要编造参数`,
          },
          ...messages,
        ],
        tools: TOOLS, // 把我们定义的工具清单传给大模型
        tool_choice: "auto", // 让大模型自动决定要不要用工具
        stream: false, // 决策阶段不用流式，快速拿到结果
        temperature: 0.3, // 决策阶段降低随机性，保证稳定
      }),
    });

    if (!decisionResponse.ok)
      throw new Error(`Agent决策失败: ${decisionResponse.status}`);
    const decisionResult = await decisionResponse.json();
    const decisionMessage = decisionResult.choices[0].message;

    // ==============================================
    // 🔴 Agent核心第二步：执行工具调用
    // ==============================================
    let finalMessages = [...messages];
    let generatedImageUrl: string | null = null;
    // 如果大模型决定调用工具
    if (decisionMessage.tool_calls && decisionMessage.tool_calls.length > 0) {
      finalMessages.push(decisionMessage);
      for (const toolCall of decisionMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolResult = await runTool(toolName, toolArgs);

        // 🔧 关键：如果是绘画工具，把图片链接单独存起来
        if (toolName === "ai_draw" && toolResult.content) {
          generatedImageUrl = toolResult.content;
        }

        finalMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: toolResult.error ? toolResult.error : toolResult.content,
        });
      }
    }

    // ==============================================
    // 🔴 Agent核心第三步：生成最终回答，流式返回给用户
    // ==============================================
    console.log("🤖 正在生成最终回答...");
    const finalResponse = await fetch(aiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是sky-chat，由sky-chat团队开发的智能AI助手。你的唯一官方名称是sky-chat。
            1. 如果有工具返回的结果，请优先基于工具结果回答，不要编造信息
            2. 如果是绘画工具返回的图片链接，请忽略，不要直接展示链接
            3. 回答要友好、专业、简洁，符合用户需求
            4. 如果图片生成失败，或者超时，不要返回DSML格式，直接告诉用户图片生成失败了`,
          },
          ...finalMessages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });
    console.log(finalResponse.body);

    if (!finalResponse.ok || !finalResponse.body) {
      throw new Error(`AI 最终回答请求失败: ${finalResponse.status}`);
    }

    // 设置流式响应头（和你之前的逻辑完全一致）
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // 流式数据处理（完全保留你之前的逻辑）
    const reader = finalResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullAiResponse = "";

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
            fullAiResponse += content;
          }
        } catch (e) {
          continue;
        }
      }
    }
    if (generatedImageUrl) {
      // 1. 先发一个分隔符，告诉前端：“注意，后面是结构化数据了”
      res.write("\n[SKY_CHAT_SEP]\n");
      // 2. 再发一个 JSON，包含图片链接
      res.write(JSON.stringify({ type: "image", url: generatedImageUrl }));
    }

    res.end();
    console.log("✅ 流式响应结束");

    // ==============================================
    // 原有逻辑：保存消息到数据库（完全保留）
    // ==============================================
    try {
      if (lastUserMsg && fullAiResponse) {
        await prisma.message.create({
          data: {
            content: lastUserMsg.content,
            role: "user",
            conversationId: realConversationId,
          },
        });
        await prisma.message.create({
          data: {
            content: fullAiResponse,
            role: "assistant",
            conversationId: realConversationId,
          },
        });
      }
    } catch (dbErr) {
      console.error("❌ 保存消息失败:", dbErr);
    }
  } catch (error) {
    console.error("❌ Agent接口内部错误:", error);
    if (!res.headersSent) res.status(500).json({ error: "服务器内部错误" });
    else res.end();
  }
});

export default router;
