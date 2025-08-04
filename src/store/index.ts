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

// 配置 store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/FLUSH', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PERSIST', 'persist/PURGE', 'persist/REGISTER'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// 创建 persistor
export const persistor = persistStore(store);

// 导出类型
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
