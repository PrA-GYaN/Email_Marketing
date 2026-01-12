module.exports = {
  apps: [
    {
      name: 'viozonx-backend',
      script: 'dist/main.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
