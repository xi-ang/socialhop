import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 图片迁移工具
 * 将本地存储的图片迁移到云端存储
 */

interface MigrationStats {
  totalUsers: number;
  totalPosts: number;
  migratedUsers: number;
  migratedPosts: number;
  errors: string[];
}

export class ImageMigrationTool {
  private stats: MigrationStats = {
    totalUsers: 0,
    totalPosts: 0,
    migratedUsers: 0,
    migratedPosts: 0,
    errors: []
  };

  /**
   * 检查需要迁移的内容
   */
  async analyzeContent() {
    console.log('🔍 分析需要迁移的内容...');
    
    // 检查用户头像
    const usersWithLocalImages = await prisma.user.findMany({
      where: {
        image: {
          startsWith: '/uploads/'
        }
      },
      select: { id: true, username: true, image: true }
    });

    // 检查帖子图片
    const postsWithLocalImages = await prisma.post.findMany({
      where: {
        OR: [
          { image: { startsWith: '/uploads/' } },
          { images: { has: '/uploads/' } }
        ]
      },
      select: { id: true, image: true, images: true, author: { select: { username: true } } }
    });

    this.stats.totalUsers = usersWithLocalImages.length;
    this.stats.totalPosts = postsWithLocalImages.length;

    console.log(`📊 分析结果:`);
    console.log(`   👤 需要迁移头像的用户: ${this.stats.totalUsers} 个`);
    console.log(`   📝 需要迁移图片的帖子: ${this.stats.totalPosts} 个`);

    return {
      users: usersWithLocalImages,
      posts: postsWithLocalImages,
      stats: this.stats
    };
  }

  /**
   * 模拟迁移（不实际操作）
   * 用于测试迁移流程
   */
  async dryRun() {
    console.log('🧪 开始模拟迁移（Dry Run）...');
    
    const analysis = await this.analyzeContent();
    
    console.log('\n📋 迁移计划:');
    
    // 用户头像迁移计划
    for (const user of analysis.users) {
      console.log(`   👤 ${user.username}: ${user.image} -> [将上传到云端]`);
    }

    // 帖子图片迁移计划
    for (const post of analysis.posts) {
      console.log(`   📝 帖子 ${post.id} (@${post.author.username}):`);
      if (post.image?.startsWith('/uploads/')) {
        console.log(`      单图: ${post.image} -> [将上传到云端]`);
      }
      if (post.images?.some(img => img.startsWith('/uploads/'))) {
        const localImages = post.images.filter(img => img.startsWith('/uploads/'));
        console.log(`      多图: ${localImages.join(', ')} -> [将上传到云端]`);
      }
    }

    console.log('\n✅ 模拟迁移完成。使用 migrate() 方法执行实际迁移。');
    
    return analysis;
  }

  /**
   * 检查本地文件是否存在
   */
  private checkLocalFile(imagePath: string): boolean {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    return fs.existsSync(fullPath);
  }

  /**
   * 获取迁移统计信息
   */
  getStats() {
    return this.stats;
  }

  /**
   * 打印迁移报告
   */
  printReport() {
    console.log('\n📊 迁移报告:');
    console.log(`✅ 成功迁移用户头像: ${this.stats.migratedUsers}/${this.stats.totalUsers}`);
    console.log(`✅ 成功迁移帖子图片: ${this.stats.migratedPosts}/${this.stats.totalPosts}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`❌ 错误数量: ${this.stats.errors.length}`);
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
  }
}

// 使用示例脚本
if (require.main === module) {
  const main = async () => {
    const migrationTool = new ImageMigrationTool();
    
    try {
      // 分析内容
      await migrationTool.analyzeContent();
      
      // 执行模拟迁移
      await migrationTool.dryRun();
      
      // 打印报告
      migrationTool.printReport();
      
    } catch (error) {
      console.error('❌ 迁移过程中出错:', error);
    } finally {
      await prisma.$disconnect();
    }
  };

  main();
}
