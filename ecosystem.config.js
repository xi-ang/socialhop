module.exports = {
  apps: [
    // 主应用
    {
      name: 'social-app',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/social',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/social-app-error.log',
      out_file: '/var/log/pm2/social-app-out.log',
      log_file: '/var/log/pm2/social-app.log',
      time: true,
      min_uptime: '10s',
      max_restarts: 10,
      max_memory_restart: '500M',
    },
    // WebSocket 服务器
    {
      name: 'websocket-server',
      script: 'scripts/start-websocket.js',
      cwd: '/var/www/social',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 8080,
      },
      env_production: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 8080,
      },
      error_file: '/var/log/pm2/websocket-error.log',
      out_file: '/var/log/pm2/websocket-out.log',
      log_file: '/var/log/pm2/websocket.log',
      time: true,
      min_uptime: '10s',
      max_restarts: 10,
      max_memory_restart: '200M',
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'root', // 或者你的用户名
      host: 'your-server-ip', // 替换为你的服务器IP
      ref: 'origin/master',
      repo: 'https://github.com/xi-ang/socialhop.git', // 替换为你的仓库
      path: '/var/www/social',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile && npx prisma generate && npx prisma migrate deploy && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
