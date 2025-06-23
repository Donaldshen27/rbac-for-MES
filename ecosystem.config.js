module.exports = {
  apps: [
    {
      name: 'rbac-system',
      script: './dist/app.js',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 3000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};