# LobeChat 图片生成插件 - Docker 部署指南

本文档提供了使用 Docker 在本地部署 LobeChat 图片生成插件的详细说明。

## 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)（通常随 Docker Desktop 一起安装）

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/image-gen-plugin.git
cd image-gen-plugin
```

### 2. 使用 Docker Compose 构建和启动服务

```bash
docker-compose up -d
```

这将在后台构建并启动服务。首次构建可能需要几分钟时间。

### 3. 访问服务

服务启动后，可以通过以下地址访问：

```
http://localhost:3000
```

插件的 manifest 地址为：

```
http://localhost:3000/manifest.json
```

## 推送到 DockerHub

如果您想将镜像推送到 DockerHub，请按照以下步骤操作：

### 1. 登录到 DockerHub

```bash
docker login
```

系统会提示您输入 DockerHub 的用户名和密码。

### 2. 构建镜像并添加标签

```bash
docker build -t yourusername/image-gen-plugin:latest .
```

将 `yourusername` 替换为您的 DockerHub 用户名。

### 3. 推送镜像到 DockerHub

```bash
docker push yourusername/image-gen-plugin:latest
```

### 4. 使用已推送的镜像

推送完成后，您可以在任何安装了 Docker 的机器上使用以下命令拉取并运行该镜像：

```bash
docker pull yourusername/image-gen-plugin:latest
docker run -p 3000:3000 yourusername/image-gen-plugin:latest
```

或者，您可以修改 `docker-compose.yml` 文件以使用已推送的镜像：

```yaml
version: '3'

services:
  image-gen-plugin:
    image: yourusername/image-gen-plugin:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

然后运行：

```bash
docker-compose up -d
```

## 在 LobeChat 中配置插件

1. 打开 LobeChat 设置
2. 进入插件市场
3. 添加自定义插件，输入您的插件 manifest 地址：
   ```
   http://localhost:3000/manifest.json
   ```
4. 配置必要参数：
   - 🔑 图片生成服务 API Key
   - 🔗 图片生成服务 API 地址
   - 🎨 绘图模型

## 高级配置

### 修改端口

如果需要修改默认端口（3000），可以编辑 `docker-compose.yml` 文件：

```yaml
services:
  image-gen-plugin:
    ports:
      - "你的端口:3000"
```

### 环境变量

您可以在 `docker-compose.yml` 文件中添加环境变量：

```yaml
services:
  image-gen-plugin:
    environment:
      - NODE_ENV=production
      # 添加其他环境变量
```

## 维护

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

### 更新服务

当有新版本时，可以按照以下步骤更新：

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## 故障排除

### 服务无法启动

检查 Docker 日志：

```bash
docker-compose logs
```

### 无法连接到服务

确保端口没有被其他应用占用：

```bash
netstat -tuln | grep 3000
```

### 容器内存不足

增加 Docker 可用内存，或在 `docker-compose.yml` 中添加内存限制：

```yaml
services:
  image-gen-plugin:
    deploy:
      resources:
        limits:
          memory: 2G
```

## 安全注意事项

- 默认配置将服务暴露在本地网络上。如果需要在公共网络上部署，请确保添加适当的安全措施。
- 考虑使用反向代理（如 Nginx）并启用 HTTPS。
- 不要在 Docker 镜像中包含敏感信息（如 API 密钥）。 