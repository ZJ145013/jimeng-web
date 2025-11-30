# Jimeng Web

Jimeng Web 是一个基于 React + TypeScript + Vite 构建的现代化 Web 应用。

## 快速开始

### 开发环境

1. 安装依赖:
   ```bash
   npm install
   ```
2. 启动开发服务器:
   ```bash
   npm run dev
   ```

### Docker 部署

1. **构建并启动服务**:
   ```bash
   docker-compose up -d --build
   ```
   该命令会自动构建 Docker 镜像并在后台启动容器。

2. **访问应用**:
   访问 `http://localhost:8080` 即可查看应用。

3. **停止服务**:
   ```bash
   docker-compose down
   ```

### GitHub Actions 自动构建

本项目配置了 GitHub Actions 自动构建 Docker 镜像并推送到 GitHub Container Registry (GHCR)。

1. **触发条件**:
   - 推送到 `main` 分支。
   - 推送以 `v` 开头的 tag (例如 `v1.0.0`)。

2. **镜像地址**:
   - `ghcr.io/<your-username>/jimeng-web:latest`
   - `ghcr.io/<your-username>/jimeng-web:<tag>`
   - `ghcr.io/<your-username>/jimeng-web:main`

3. **使用方法**:
   可以直接拉取构建好的镜像：
   ```bash
   docker pull ghcr.io/<your-username>/jimeng-web:latest
   docker run -d -p 8080:80 ghcr.io/<your-username>/jimeng-web:latest
   ```

### Deno Deploy 部署

本项目支持使用 Deno Deploy 进行快速部署，无需额外的 Docker 配置。

1. 登录 [Deno Deploy](https://dash.deno.com/)。
2. 创建一个新项目 (New Project)。
3. 连接您的 GitHub 仓库，并选择本项目。
4. 在项目设置中，选择 `GitHub` 作为部署方式，并关联你的仓库。
5. 配置构建与启动命令：
   - **Root Directory**: `jimeng-web` (由于本项目在仓库的子目录中，**必须**设置此项)
   - **Build Command**: `npm install && npm run build`
   - **Entrypoint**: 请在下拉菜单的文件树中直接选择 `jimeng-web/server.ts` (避免手动输入路径出错)
6. 点击 "Link" 或 "Deploy" 完成部署。Deno Deploy 将会执行构建命令生成 `dist` 目录，然后使用 `server.ts` 脚本来托管静态文件。

## 项目结构

- `src/`: 源代码
- `deploy.dockerfile`: Docker 镜像构建文件
- `docker-compose.yml`: Docker Compose 配置文件
- `nginx.conf`: Nginx 配置文件

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Docker & Nginx
