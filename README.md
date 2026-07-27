# Tink Photography CMS

保留原 Tink 摄影站前端和动画，并增加单管理员内容后台。后台可管理图集分类、图集、图片、文章、关于页和站点设置；图片支持本地上传与 HTTPS 外链。

## 本地运行

需要 Node.js 22.12+ 和 pnpm。

```bash
pnpm install
pnpm db:migrate
pnpm content:import
pnpm dev
```

访问站点 `http://localhost:4321/`，后台入口为 `http://localhost:4321/admin`。

本地环境变量可以使用：

```dotenv
DATABASE_PATH=data/tink.sqlite
UPLOAD_ROOT=data/uploads
BACKUP_ROOT=backups
ADMIN_USERNAME=owner
ADMIN_PASSWORD_HASH=
```

生成管理员密码哈希：

```bash
pnpm admin:hash "请替换为至少12位的强密码"
```

将输出完整填写到 `ADMIN_PASSWORD_HASH`。首次导入旧图集使用 `pnpm content:import`；数据库已有图集时该命令会拒绝覆盖。

## 后台功能

- 分类和图集：新建、编辑、发布、排序、删除。
- 图片：批量上传、外链添加、编辑说明与版式、设置封面、替换、排序和删除。
- 导入的原有分类和图片与新内容一样，可直接编辑、替换和删除。
- 文章：Markdown 编辑、草稿/发布、编辑和删除。
- 关于页：头像上传或外链、个人资料、社交链接、排序和 SEO。
- 站点设置：站名、首页文字、默认 SEO、Google/百度统计 ID。

## Docker/VPS 部署

```bash
cp .env.example .env
mkdir -p data/uploads backups
docker compose up -d --build
docker compose exec tink pnpm db:migrate
docker compose exec tink pnpm content:import
```

部署前必须在 `.env` 中设置 `ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH` 和实际的 `PUBLIC_SITE_URL`。反向代理应启用 HTTPS，并把请求转发到 `127.0.0.1:4321`。

`data` 和 `backups` 必须允许容器内 `tink` 用户读写。升级容器前不要删除这两个挂载目录。

## 备份与恢复

运行在线一致性备份：

```bash
docker compose exec tink pnpm backup
```

压缩包写入 `backups/tink-时间.zip`，包含 `tink.sqlite`、`uploads/` 和 `manifest.json`。

恢复时先停止服务，解压备份，然后用压缩包中的 `tink.sqlite` 替换 `data/tink.sqlite`，用 `uploads/` 替换 `data/uploads/`，最后重新启动：

```bash
docker compose stop tink
# 完成文件恢复并确认目录权限
docker compose start tink
```

## 验证命令

```bash
pnpm test
pnpm check
pnpm build
```
