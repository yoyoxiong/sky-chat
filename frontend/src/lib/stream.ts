/**
 * 流式请求工具函数（支持取消）
 * @param url 请求地址
 * @param body 请求体
 * @param onChunk 每收到一段数据时的回调
 * @param onComplete 流结束/取消时的回调
 * @param onStop 外部传入的「停止函数」的赋值回调（关键！）
 */
import { fetchChatStream } from "@/app/api/chat";
export async function fetchStream(
  url: string,
  body: any,
  onChunk: (chunk: string) => void,
  onComplete?: (imageUrl?: string) => void,
  onStop?: (stopFn: () => void) => void,
  onReceiveImage?: (imageUrl: string) => void,
) {
  const controller = new AbortController();
  const signal = controller.signal;

  let isStopped = false;
  const stopStream = () => {
    isStopped = true;
    controller.abort();
  };

  if (onStop) {
    onStop(stopStream);
  }

  try {
    const response = await fetchChatStream(body, { signal });
    if (!response.ok || !response.body) {
      throw new Error("请求失败");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let finalImageUrl: string | undefined = undefined;
    let foundSeparator = false;

    while (true) {
      if (isStopped) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 核心逻辑：只有在没找到分隔符时才处理
      if (!foundSeparator) {
        const sepIndex = buffer.indexOf("\n[SKY_CHAT_SEP]\n");

        if (sepIndex !== -1) {
          // 1. 找到了分隔符
          // 把分隔符前面的所有文字一次性推出去
          const textContent = buffer.slice(0, sepIndex);
          if (textContent) {
            onChunk(textContent);
          }

          // 2. 解析分隔符后面的 JSON 图片数据
          const jsonPart = buffer.slice(sepIndex + "\n[SKY_CHAT_SEP]\n".length);
          if (jsonPart.trim()) {
            try {
              const data = JSON.parse(jsonPart);
              if (data.type === "image" && data.url) {
                finalImageUrl = data.url;
              }
            } catch (e) {
              console.error("解析图片数据失败:", e);
            }
          }

          // 3. 标记已找到分隔符，清空 buffer
          foundSeparator = true;
          buffer = "";
        } else {
          // 2. 还没找到分隔符
          // 注意：这里我们不推 chunk，而是继续累积 buffer
          // 防止后面找到分隔符时重复推送
        }
      }
    }

    // 循环结束后的扫尾工作
    if (!foundSeparator && buffer) {
      // 如果直到结束都没找到分隔符，说明没有图片
      // 把剩下的 buffer 作为文字推出去
      onChunk(buffer);
    }

    // 流结束，统一回调，把图片链接带出去
    onComplete?.(finalImageUrl);
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("流式请求出错:", error);
    }
  }
}
