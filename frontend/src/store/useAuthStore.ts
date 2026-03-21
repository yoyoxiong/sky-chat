// src/store/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 定义用户类型
interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // 🔑 新增：标记是否已经完成水合（从 localStorage 读取完成）
  hasHydrated: boolean;

  login: (user: User, token: string) => void;
  logout: () => void;
  // 🔑 新增：手动设置水合完成的方法
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false, // 初始是 false

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "sky-chat-auth",
      storage: createJSONStorage(() => localStorage),

      // 🔑 关键配置：水合完成后的回调
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
