'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BellIcon, HeartIcon, MessageCircleIcon, UserPlusIcon, AtSignIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import PageControls from '@/components/common/PageControls';

interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  browserNotifications: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    browserNotifications: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 检查浏览器通知权限
  useEffect(() => {
    if ('Notification' in window) {
      setSettings(prev => ({
        ...prev,
        browserNotifications: Notification.permission === 'granted',
      }));
    }
  }, []);

  const handleSettingChange = (setting: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleBrowserNotificationToggle = async (enabled: boolean) => {
    if (!('Notification' in window)) {
      toast.error('此浏览器不支持通知功能');
      return;
    }

    if (enabled) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          handleSettingChange('browserNotifications', true);
          toast.success('浏览器通知已启用');
        } else {
          toast.error('浏览器通知权限被拒绝');
        }
      } catch (error) {
        toast.error('启用浏览器通知失败');
      }
    } else {
      handleSettingChange('browserNotifications', false);
      toast.success('浏览器通知已禁用');
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 同时保存到localStorage作为备份
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
        toast.success('设置已保存');
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 加载保存的设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 首先尝试从服务器获取设置
        const response = await fetch('/api/user/notification-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const settingsWithDefaults = {
              likes: true,
              comments: true,
              follows: true,
              mentions: true,
              browserNotifications: false,
              ...data.settings,
            };
            setSettings(settingsWithDefaults);
            return;
          }
        }
        
        // 如果服务器获取失败，从localStorage获取
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
          const savedSettings = JSON.parse(saved);
          const settingsWithDefaults = {
            likes: true,
            comments: true,
            follows: true,
            mentions: true,
            browserNotifications: false,
            ...savedSettings,
          };
          setSettings(settingsWithDefaults);
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const testNotification = () => {
    if (!('Notification' in window)) {
      toast.error('此浏览器不支持通知功能');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('测试通知', {
        body: '这是一条测试通知',
        icon: '/avatar.png',
      });
      toast.success('测试通知已发送');
    } else {
      toast.error('请先启用浏览器通知权限');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* 页面控制按钮 */}
      <PageControls onRefresh={() => window.location.reload()} />

      <div className="flex items-center space-x-3 mb-6">
        <BellIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">通知设置</h1>
      </div>

      {/* 通知类型设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircleIcon className="w-5 h-5" />
            <span>通知类型</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HeartIcon className="w-5 h-5 text-red-500" />
              <div>
                <Label className="text-base font-medium">点赞通知</Label>
                <p className="text-sm text-muted-foreground">当有人点赞你的帖子时接收通知</p>
              </div>
            </div>
            <Switch
              checked={settings.likes}
              onCheckedChange={(checked: boolean) => handleSettingChange('likes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircleIcon className="w-5 h-5 text-blue-500" />
              <div>
                <Label className="text-base font-medium">评论通知</Label>
                <p className="text-sm text-muted-foreground">当有人评论你的帖子时接收通知</p>
              </div>
            </div>
            <Switch
              checked={settings.comments}
              onCheckedChange={(checked: boolean) => handleSettingChange('comments', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserPlusIcon className="w-5 h-5 text-green-500" />
              <div>
                <Label className="text-base font-medium">关注通知</Label>
                <p className="text-sm text-muted-foreground">当有人关注你时接收通知</p>
              </div>
            </div>
            <Switch
              checked={settings.follows}
              onCheckedChange={(checked: boolean) => handleSettingChange('follows', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AtSignIcon className="w-5 h-5 text-purple-500" />
              <div>
                <Label className="text-base font-medium">@提及通知</Label>
                <p className="text-sm text-muted-foreground">当有人在帖子中@你时接收通知</p>
              </div>
            </div>
            <Switch
              checked={settings.mentions}
              onCheckedChange={(checked: boolean) => handleSettingChange('mentions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 浏览器通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5" />
            <span>浏览器通知</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">启用浏览器通知</Label>
              <p className="text-sm text-muted-foreground">
                即使没有打开网站也能接收到通知
              </p>
            </div>
            <Switch
              checked={settings.browserNotifications}
              onCheckedChange={handleBrowserNotificationToggle}
            />
          </div>

          {settings.browserNotifications && (
            <Button
              variant="outline"
              onClick={testNotification}
              className="w-full"
            >
              发送测试通知
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="px-8"
        >
          {isSaving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}
