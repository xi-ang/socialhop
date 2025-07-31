"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';

interface NotificationContextType {
  isConnected: boolean;
  unreadCount: number;
  notifications: any[];
  refreshUnreadCount: () => void;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationData = useNotificationWebSocket();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
