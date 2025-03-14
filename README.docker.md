# LobeChat 图片生成插件 - Docker 部署指南

本文档提供了使用 Docker 在本地或服务器上部署 LobeChat 图片生成插件的详细说明。

## 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)（通常随 Docker Desktop 一起安装）
- 确保有可用的图片生成服务 API（如 Stable Diffusion API）

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/image-gen-plugin.git
cd image-gen-plugin
```

### 2. 配置环境变量

复制环境变量示例文件并修改：

```bash
cp .env.example .env.docker
```

编辑 `.env.docker` 文件，设置必要的环境变量：

```env
# 基础配置
NODE_ENV=production
PORT=3000

# 插件访问URL配置（必填）
# 如果使用反向代理，这里填写反向代理的地址
# 如果直接访问，填写服务器IP或域名
# 例如：
# - 本地测试：http://localhost:3000
# - 直接访问：http://your-server-ip:3000
# - 反向代理：https://your-domain.com/image-plugin
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 调试配置（可选）
DEBUG=false
LOG_LEVEL=info
```

### 3. 使用 Docker Compose 构建和启动服务

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

首次构建可能需要几分钟时间。确保日志中没有错误信息。

### 4. 验证服务

服务启动后，可以通过以下方式验证：

1. 访问插件主页：
   ```
   http://your-base-url
   ```

2. 访问插件 manifest：
   ```
   http://your-base-url/manifest.json
   ```

3. 测试设置（可选）：
   ```
   http://your-base-url/api/test-settings
   ```

## 在 LobeChat 中配置插件

1. 打开 LobeChat 设置
2. 进入插件市场
3. 添加自定义插件，输入您的插件 manifest 地址：
   ```
   http://your-base-url/manifest.json
   ```
4. 配置必要参数：
   - 🔑 图片生成服务 API Key
   - 🔗 图片生成服务 API 地址（完整的 API 端点地址）
   - 🎨 绘图模型名称

## 高级配置

### 使用反向代理

如果您想通过 HTTPS 访问插件，建议使用 Nginx 反向代理。示例配置：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 如果插件部署在子路径下
    location /image-plugin/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 自定义 Docker 配置

您可以根据需要修改 `docker-compose.yml`：

```yaml
version: '3'

networks:
  plugin_network:
    name: plugin_network
    driver: bridge
    internal: false

services:
  image-gen-plugin:
    container_name: Lobe-image-gen-plugin
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${PORT:-3000}:3000"
    env_file:
      - .env.docker
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BASE_URL
      - DEBUG=false
      - LOG_LEVEL=info
    networks:
      - plugin_network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 使用 DockerHub 镜像

如果您不想自己构建镜像，可以直接使用我们发布在 DockerHub 上的镜像：

### 方法一：使用 docker-compose（推荐）

1. 创建 `docker-compose.yml`：
```yaml
version: '3'

services:
  image-gen-plugin:
    image: yourusername/image-gen-plugin:latest
    container_name: Lobe-image-gen-plugin
    ports:
      - "3000:3000"
    env_file:
      - .env.docker
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

2. 创建并配置 `.env.docker` 文件（参考上文环境变量配置）

3. 启动服务：
```bash
docker-compose up -d
```

### 方法二：使用 docker 命令

```bash
# 拉取镜像
docker pull yourusername/image-gen-plugin:latest

# 运行容器
docker run -d \
  --name image-gen-plugin \
  -p 3000:3000 \
  -v $(pwd)/.env.docker:/app/.env \
  yourusername/image-gen-plugin:latest
```

## 发布到 DockerHub

如果您修改了代码并想发布自己的镜像版本，请按照以下步骤操作：

### 1. 登录到 DockerHub

```bash
docker login
```

### 2. 构建优化后的镜像

```bash
# 构建镜像
docker build -t yourusername/image-gen-plugin:latest .

# 查看镜像大小
docker images | grep image-gen-plugin
```

### 3. 推送到 DockerHub

```bash
# 推送最新版本
docker push yourusername/image-gen-plugin:latest

# 如果要发布特定版本（推荐）
docker tag yourusername/image-gen-plugin:latest yourusername/image-gen-plugin:v1.0.0
docker push yourusername/image-gen-plugin:v1.0.0
```

### 4. 自动构建（使用 GitHub Actions）

1. **设置 DockerHub 访问令牌**：
   - 登录 [DockerHub](https://hub.docker.com)
   - 进入 Account Settings > Security
   - 创建新的访问令牌（Access Token）

2. **配置 GitHub Secrets**：
   - 进入 GitHub 仓库的 Settings > Secrets and variables > Actions
   - 添加以下 secrets：
     - `DOCKERHUB_USERNAME`: 你的 DockerHub 用户名
     - `DOCKERHUB_TOKEN`: 上一步创建的访问令牌

3. **推送代码触发自动构建**：
   ```bash
   # 推送代码到主分支
   git push origin main

   # 或创建新的版本标签
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **构建结果**：
   - 代码推送后，GitHub Actions 会自动运行
   - 可以在仓库的 Actions 标签页查看构建状态
   - 构建成功后，镜像会自动推送到 DockerHub

5. **镜像标签说明**：
   - `latest`: 最新的主分支构建
   - `v1.0.0`: 指定版本的构建
   - `sha-xxxxxx`: 提交哈希的构建

6. **使用自动构建的镜像**：
   ```yaml
   version: '3'
   
   services:
     image-gen-plugin:
       image: your-dockerhub-username/image-gen-plugin:latest  # 或使用特定版本标签
       container_name: Lobe-image-gen-plugin
       ports:
         - "3000:3000"
       env_file:
         - .env.docker
       restart: unless-stopped
   ```

## 维护指南

### 日常维护

```