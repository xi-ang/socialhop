import prisma from '@/lib/prisma';

async function checkUserPasswords() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
      take: 5 // 只查看前5个用户
    });

    console.log('=== 数据库中的用户密码检查 ===');
    users.forEach(user => {
      console.log(`用户: ${user.username}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`密码哈希: ${user.password}`);
      console.log(`是否加密: ${user.password.startsWith('$2b$') ? '✅ 是' : '❌ 否'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkUserPasswords();
