import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, registerUser, logoutUser, updateUser, clearError } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

// 替代原来的 useAuth hook
export function useAuth() {
  const dispatch = useAppDispatch();
  
  // 安全地访问 Redux state，添加默认值
  const authState = useAppSelector((state) => state?.auth || {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false
  });
  
  const { user, loading, error, isAuthenticated } = authState;

  const login = useCallback(async (email: string, password: string) => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const register = useCallback(async (email: string, username: string, password: string, name?: string) => {
    try {
      await dispatch(registerUser({ email, username, password, name })).unwrap();
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('已安全登出');
    } catch (error) {
      toast.error('登出失败，请重试');
    }
  }, [dispatch]);

  const updateUserProfile = useCallback((data: any) => {
    dispatch(updateUser(data));
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser: updateUserProfile,
    clearError: clearAuthError,
  };
}
