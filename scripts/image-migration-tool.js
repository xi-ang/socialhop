const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 图片迁移分析工具 (JavaScript 版本)
 */

class ImageMigrationTool {
  constructor() {
    this.stats = {
      totalUsers: 0,
      totalPosts: 0,
      migratedUsers: 0,
      migratedPosts: 0,
      errors: []
    };
  }

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

    // 检查帖子图片 - 单图片字段
    const postsWithLocalImage = await prisma.post.findMany({
      where: {
        image: {
          startsWith: '/uploads/'
        }
      },
      select: { 
        id: true, 
        image: true, 
        images: true,
        author: { select: { username: true } } 
      }
    });

    // 检查帖子图片 - 多图片字段（需要特殊处理）
    const allPosts = await prisma.post.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: { 
        id: true, 
        image: true, 
        images: true,
        author: { select: { username: true } } 
      }
    });

    // 过滤包含本地图片的帖子
    const postsWithLocalImages = allPosts.filter(post => 
      post.images && post.images.some(img => img.startsWith('/uploads/'))
    );

    // 合并单图片和多图片的帖子，去重
    const allPostsWithLocalImages = [
      ...postsWithLocalImage,
      ...postsWithLocalImages.filter(post => 
        !postsWithLocalImage.some(p => p.id === post.id)
      )
    ];

    this.stats.totalUsers = usersWithLocalImages.length;
    this.stats.totalPosts = allPostsWithLocalImages.length;

    console.log(`📊 分析结果:`);
    console.log(`   👤 需要迁移头像的用户: ${this.stats.totalUsers} 个`);
    console.log(`   📝 需要迁移图片的帖子: ${this.stats.totalPosts} 个`);

    return {
      users: usersWithLocalImages,
      posts: allPostsWithLocalImages,
      stats: this.stats
    };
  }

  /**
   * 模拟迁移（不实际操作）
   */
  async dryRun() {
    console.log('🧪 开始模拟迁移（Dry Run）...');
    
    const analysis = await this.analyzeContent();
    
    console.log('\n📋 迁移计划:');
    
    // 用户头像迁移计划
    if (analysis.users.length > 0) {
      console.log('\n👤 用户头像迁移:');
      for (const user of analysis.users) {
        console.log(`   • ${user.username}: ${user.image} -> [将上传到云端]`);
      }
    } else {
      console.log('\n👤 用户头像: 无需迁移');
    }

    // 帖子图片迁移计划
    if (analysis.posts.length > 0) {
      console.log('\n📝 帖子图片迁移:');
      for (const post of analysis.posts) {
        console.log(`   • 帖子 ${post.id} (@${post.author.username}):`);
        
        if (post.image && post.image.startsWith('/uploads/')) {
          console.log(`     - 单图: ${post.image} -> [将上传到云端]`);
        }
        
        if (post.images && post.images.some(img => img.startsWith('/uploads/'))) {
          const localImages = post.images.filter(img => img.startsWith('/uploads/'));
          console.log(`     - 多图: ${localImages.join(', ')} -> [将上传到云端]`);
        }
      }
    } else {
      console.log('\n📝 帖子图片: 无需迁移');
    }

    console.log('\n✅ 模拟迁移完成');
    console.log('💡 提示: 当前所有图片上传已经配置为云端存储');
    console.log('💡 新上传的图片将自动保存到 UploadThing CDN');
    
    return analysis;
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
    console.log('\n📊 当前状态报告:');
    console.log(`📁 本地头像数量: ${this.stats.totalUsers}`);
    console.log(`🖼️ 本地图片帖子数量: ${this.stats.totalPosts}`);
    
    if (this.stats.totalUsers === 0 && this.stats.totalPosts === 0) {
      console.log('🎉 恭喜！所有图片都已经是云端存储');
    } else {
      console.log('📝 建议: 现有本地图片可以保持不变，新图片会自动上传到云端');
    }
  }
}

// 主函数
const main = async () => {
  const migrationTool = new ImageMigrationTool();
  
  try {
    console.log('🌩️ 云端图片迁移分析工具');
    console.log('================================\n');
    
    // 执行模拟迁移
    await migrationTool.dryRun();
    
    // 打印报告
    migrationTool.printReport();
    
    console.log('\n🔧 配置说明:');
    console.log('• 在 src/lib/upload-config.ts 中设置 USE_CLOUD_UPLOAD: true');
    console.log('• 使用 SmartImageUpload 和 SmartAvatarUpload 组件');
    console.log('• 查看完整指南: 云端图片上传迁移指南.md');
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  main();
}

module.exports = { ImageMigrationTool };
