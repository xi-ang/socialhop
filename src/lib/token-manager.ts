/**
 * Token 管理工具类
 * 统一管理 localStorage 中的认证 token
 */

const TOKEN_KEY = 'auth-token';

export class TokenManager {
  /**
   * 获取存储的 token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * 设置 token
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  /**
   * 清除 token
   */
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  /**
   * 检查是否有 token
   */
  static hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * 检查 token 是否过期（简单检查，不验证签名）
   */
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * 获取 token 中的用户信息（不验证签名）
   */
  static getTokenPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error parsing token payload:', error);
      return null;
    }
  }
}
