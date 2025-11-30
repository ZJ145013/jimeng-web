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

### Deno Deploy 部署

本项目支持使用 Deno Deploy 进行快速部署，无需额外的 Docker 配置。

1. 登录 [Deno Deploy](https://dash.deno.com/)。
2. 创建一个新项目 (New Project)。
3. 连接您的 GitHub 仓库，并选择本项目。
4. 在构建设置中：
   - **Framework Preset**: 选择 `Vite`
   - **Root Directory**: 选择 `jimeng-web` (如果项目在子目录中)
   - **Build Command**: `npm run build` (或者 `deno task build` 如果你配置了 deno task)
   - **Output Directory**: `dist`
5. 点击 "Link" 或 "Deploy Project" 即可完成部署。

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
