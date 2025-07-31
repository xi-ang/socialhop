"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Eye, EyeOff, Save, Trash2, Bell, HeartIcon, MessageCircleIcon, UserPlusIcon, AtSignIcon } from "lucide-react";
import toast from "react-hot-toast";
import { changePassword, deleteAccount, updateUserSettings } from "@/actions/settings.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  
  // 基本信息状态
  const [basicInfo, setBasicInfo] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });
  
  // 通知设置状态
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
  });
  
  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState({
    basicInfo: false,
    password: false,
    notifications: false,
    deleteAccount: false,
  });

  // 加载通知设置
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await fetch('/api/user/notification-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 确保包含所有字段的默认值
            const settingsWithDefaults = {
              likes: true,
              comments: true,
              follows: true,
              mentions: true,
              ...data.settings,
            };
            setNotificationSettings(settingsWithDefaults);
          }
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };
    
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  // 更新基本信息
  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, basicInfo: true }));

    try {
      const result = await updateUserSettings(basicInfo);
      if (result.success) {
        toast.success("资料更新成功");
        updateUser(basicInfo);
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      toast.error("更新失败");
    } finally {
      setIsLoading(prev => ({ ...prev, basicInfo: false }));
    }
  };

  // 更新通知设置
  const handleUpdateNotificationSettings = async () => {
    setIsLoading(prev => ({ ...prev, notifications: true }));

    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: notificationSettings }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("通知设置已保存");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setIsLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("新密码和确认密码不匹配");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("新密码至少需要6位字符");
      return;
    }

    setIsLoading(prev => ({ ...prev, password: true }));

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        toast.success("密码修改成功");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.error || "密码修改失败");
      }
    } catch (error) {
      toast.error("密码修改失败");
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  };

  // 注销账号
  const handleDeleteAccount = async () => {
    setIsLoading(prev => ({ ...prev, deleteAccount: true }));

    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success("账号已注销");
        logout();
        router.push("/");
      } else {
        toast.error(result.error || "注销失败");
      }
    } catch (error) {
      toast.error("注销失败");
    } finally {
      setIsLoading(prev => ({ ...prev, deleteAccount: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">账户设置</h1>

      {/* 基本信息 */}
      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>
            更新您的个人资料信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateBasicInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">昵称</Label>
                <Input
                  id="name"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入您的昵称"
                />
              </div>
              <div>
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={basicInfo.username}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="输入用户名"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={basicInfo.bio}
                onChange={(e) => setBasicInfo(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="介绍一下自己..."
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">所在地</Label>
                <Input
                  id="location"
                  value={basicInfo.location}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="输入所在地"
                />
              </div>
              <div>
                <Label htmlFor="website">个人网站</Label>
                <Input
                  id="website"
                  value={basicInfo.website}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading.basicInfo}
              className="w-full"
            >
              {isLoading.basicInfo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存更改
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card> */}

      {/* 通知设置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            通知设置
          </CardTitle>
          <CardDescription>
            选择您希望接收的通知类型
          </CardDescription>
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
              checked={notificationSettings.likes}
              onCheckedChange={(checked: boolean) => 
                setNotificationSettings(prev => ({ ...prev, likes: checked }))
              }
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
              checked={notificationSettings.comments}
              onCheckedChange={(checked: boolean) => 
                setNotificationSettings(prev => ({ ...prev, comments: checked }))
              }
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
              checked={notificationSettings.follows}
              onCheckedChange={(checked: boolean) => 
                setNotificationSettings(prev => ({ ...prev, follows: checked }))
              }
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
              checked={notificationSettings.mentions}
              onCheckedChange={(checked: boolean) => 
                setNotificationSettings(prev => ({ ...prev, mentions: checked }))
              }
            />
          </div>
          
          <Button 
            onClick={handleUpdateNotificationSettings} 
            disabled={isLoading.notifications}
            className="w-full"
          >
            {isLoading.notifications ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存通知设置
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 修改密码 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>
            为了账户安全，建议定期更换密码
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">当前密码</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="输入当前密码"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="输入新密码（至少6位）"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="再次输入新密码"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading.password}
              className="w-full"
            >
              {isLoading.password ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  修改中...
                </>
              ) : (
                "修改密码"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 危险操作 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            危险操作
          </CardTitle>
          <CardDescription>
            以下操作是不可逆的，请谨慎操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={isLoading.deleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                注销账号
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认注销账号？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将永久删除您的账号和所有相关数据，包括：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>所有发布的帖子和评论</li>
                    <li>关注和粉丝关系</li>
                    <li>个人资料信息</li>
                  </ul>
                  <strong className="text-red-600 block mt-2">此操作无法撤销！</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isLoading.deleteAccount}
                >
                  {isLoading.deleteAccount ? "注销中..." : "确认注销"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
