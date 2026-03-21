// src/lib/api.ts
import { useAuthStore } from "@/store/useAuthStore";

// 定义基础 URL，避免每次都写 localhost
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// 这是一个通用的请求函数
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // 1. 从 Zustand store 里获取 token
  // 注意：因为这是在 React 组件外，我们需要用 getState() 方法
  const token = useAuthStore.getState().token;

  // 2. 构造 headers
  const headers = new Headers(options.headers || {});

  // 如果有 token，就自动加上
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 如果不是 FormData，我们默认发 JSON
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // 3. 发送请求
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // 4. 特殊处理：如果是 401 (未授权)，说明 Token 过期了
  if (response.status === 401) {
    // 自动登出
    useAuthStore.getState().logout();
    // 跳转到登录页 (这里我们用 window.location，简单粗暴)
    window.location.href = "/login";
    throw new Error("登录已过期，请重新登录");
  }

  return response;
}
