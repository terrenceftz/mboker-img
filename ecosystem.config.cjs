module.exports = {
  apps: [{
    name: 'mboker-img',
    script: './dist/server/entry.mjs',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: '4321',
      DATABASE_PATH: 'data/tink.sqlite',
      UPLOAD_ROOT: 'data/uploads',
      BACKUP_ROOT: 'backups',
      ADMIN_USERNAME: 'Terrence',
      ADMIN_PASSWORD_HASH: '$argon2id$v=19$m=65536,p=4,t=3$DXcvbBns29NVhsIGGi0NUQ$6AROnSCeAfVFqJ69YDiS1YHihrEHszj/vZ0pMltLhKg',
      PUBLIC_SITE_URL: 'https://img.mboker.cn',
    },
  }],
};
