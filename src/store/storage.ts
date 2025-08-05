import { WebStorage } from 'redux-persist';

// 创建一个在服务端安全的存储 - SSR 环境：只做渲染，不做持久化。CSR 环境：做持久化。
const createNoopStorage = (): WebStorage => {
  return {
    getItem(_key: string): Promise<string | null> {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: string): Promise<void> {
      return Promise.resolve();
    },
    removeItem(_key: string): Promise<void> {
      return Promise.resolve();
    },
  };
};

// 检测是否在客户端环境
const isClient = typeof window !== 'undefined';

// 导出适合的存储
const storage = isClient ? 
  // 客户端默认使用浏览器的 localStorage 
  require('redux-persist/lib/storage').default : 
  createNoopStorage();

export default storage;
