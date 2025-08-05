import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from './storage';  // 使用我们的自定义存储
import authSlice from './slices/authSlice';
import postsSlice from './slices/postsSlice';
import notificationsSlice from './slices/notificationsSlice';

// Redux Persist 配置
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // 只持久化 auth state，posts 和 notifications 不需要持久化
};

// 组合所有 reducers
const rootReducer = combineReducers({
  auth: authSlice,
  posts: postsSlice,
  notifications: notificationsSlice,
});

// 创建持久化的 reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 配置 store - Redux 要求所有的 state 和 action 都是可序列化的（能转换为 JSON）
// 但 Redux Persist 会产生一些不可序列化的 action
// 需要忽略这些 action 的序列化检查
// 这可以通过配置中间件来实现，ignoredActions 指定了哪些 action 不需要序列化检查

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/FLUSH',  // 立即写入持久化存储
           'persist/REHYDRATE',  // 重新水合
           'persist/PAUSE',  // 暂停持久化
           'persist/PERSIST',  // 持久化
           'persist/PURGE',  // 清除持久化
           'persist/REGISTER'],  // 注册持久化
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// 创建 persistor
export const persistor = persistStore(store);

// 导出类型
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
