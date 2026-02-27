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
  body: Record<string, any>,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onStop?: (stopFn: () => void) => void,
) {
  // 1. 创建一个「取消控制器」，用来中断流的读取
  let isStopped = false;
  // 定义停止函数：标记为已停止，并触发后续清理
  const stopStream = () => {
    isStopped = true;
    console.log("用户主动停止了流式生成");
  };

  // 2. 把停止函数传给外部
  if (onStop) {
    onStop(stopStream);
  }

  try {
    const response = await fetchChatStream(body);

    if (!response.ok || !response.body) {
      throw new Error("请求失败");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    // 3. 循环读取流，但增加「是否已停止」的判断
    while (true) {
      //如果用户点击了停止，直接退出循环，终止读取
      if (isStopped) {
        // 主动取消阅读器，释放资源
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (error) {
    console.error("流式请求出错：", error);
  } finally {
    // 不管是正常结束还是主动停止，都执行完成回调
    onComplete?.();
  }
}
