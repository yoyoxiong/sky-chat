// src/lib/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 1. 定义盐值轮数（面试重点）
// 什么是 Salt (盐)？就是往密码里加点“佐料”，防止两个用户密码一样导致哈希值也一样
// 10 是指计算 2^10 次，数值越高越安全，但也越慢，10 是工业标准
const SALT_ROUNDS = 10;

/**
 * 给密码加密
 * @param plainPassword - 用户注册时输入的明文密码 (e.g. "123456")
 * @returns 加密后的哈希值
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  // bcrypt.hash 会自动生成一个随机的 Salt，然后把 Salt 和 Hash 拼在一起返回
  // 所以你不需要单独存 Salt，数据库里存这一长串就行了
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hashedPassword;
}

/**
 * 验证密码
 * @param plainPassword - 用户登录时输入的明文密码
 * @param hashedPassword - 数据库里存的哈希值
 * @returns boolean (密码对不对)
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  // bcrypt 会自动从 hashedPassword 里提取出当年用的 Salt，然后用同样的算法算一遍，对比结果
  const isValid = await bcrypt.compare(plainPassword, hashedPassword);
  return isValid;
}

// 从环境变量中获取 JWT 秘钥
// 🔥 面试重点：这个秘钥绝对不能泄露，也不能写死在代码里，必须放在环境变量中
const JWT_SECRET =
  process.env.JWT_SECRET || "your-fallback-secret-change-this-in-prod";
const JWT_EXPIRES_IN = "7d"; // Token 有效期：7天

/**
 * 生成 JWT Token
 * @param userId - 用户ID
 * @param username - 用户名
 * @returns Token 字符串
 */
export function generateToken(userId: number, username: string): string {
  // sign 方法：payload (载荷) + secret (秘钥) + options (配置)
  const token = jwt.sign(
    { userId, username }, // 载荷：这里放你想存的信息，不要放密码！
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
  return token;
}

/**
 * 验证 JWT Token (后面的课程会用到，先写好)
 * @param token - 前端传来的 Token
 * @returns 解析后的用户信息 或 null
 */
export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { userId: number; username: string };
  } catch (error) {
    return null; // Token 无效或过期
  }
}
