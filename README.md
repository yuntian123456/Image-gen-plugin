# LobeChat 图片生成插件

这是一个用于 LobeChat 的图片生成插件，支持通过文本提示词生成图片。

## 功能特点

- 🎨 支持自定义绘图模型
- 🔑 灵活的 API Key 配置
- 🔗 可配置的 API 地址
- 📏 支持自定义图片尺寸（512-1360像素）
- 🎯 支持调整生成精细度（0.1-1.0）
- 🚀 使用 Edge Runtime，性能更好
- 🐳 支持 Docker 本地部署

不想部署可直接使用 https://image-gen-plugin.vercel.app/manifest.json 

## 项目结构

```
src/
├── pages/          # Next.js 页面和 API 路由
│   ├── api/        # API 端点
│   │   ├── generate.ts      # 图片生成接口
│   │   ├── manifest.ts      # 插件清单接口
│   │   └── test-settings.ts # 设置测试接口
│   └── settings.tsx # 设置页面
├── components/     # React 组件
└── services/      # 服务层
```

## 部署步骤

### 方法一：Vercel 部署

1. **Fork 或克隆项目**
   ```bash
   git clone https://github.com/yourusername/image-gen-plugin.git
   cd image-gen-plugin
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **部署到 Vercel**
   - 使用 [Vercel CLI](https://vercel.com/cli) 部署：
     ```bash
     vercel
     ```
   - 或者通过 [Vercel 控制台](https://vercel.com/new) 导入项目

### 方法二：Docker 本地部署

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/image-gen-plugin.git
   cd image-gen-plugin
   ```
   修改.env.docker文件,配置相关变量

2. **使用 Docker Compose 构建和启动服务**
   ```bash
   docker-compose up -d
   ```

## 环境变量

- `NEXT_PUBLIC_BASE_URL`: 插件访问的基础 URL（必填）
- `DEBUG`: 是否启用调试日志（可选）
- `LOG_LEVEL`: 日志级别（可选）

更多部署和配置说明请参考 [README.docker.md](README.docker.md)。

## 配置插件

1. **在 LobeChat 中添加插件**
   - 打开 LobeChat 设置
   - 进入插件市场
   - 添加自定义插件，输入您的插件 manifest 地址：
     ```
     https://your-domain.vercel.app/manifest.json
     ```
     或者本地部署时：
     ```
     http://localhost:3000/manifest.json
     ```

2. **配置必要参数**
   - 点击插件设置图标（⚙️）
   - 配置以下必填项：
     - 🔑 图片生成服务 API Key
     - 🔗 图片生成服务 API 地址
     - 🎨 绘图模型

## 使用方法

1. **基本使用**
   ```
   生成一张猫咪的图片
   ```

2. **自定义尺寸**
   ```
   生成一张1024x768的猫咪图片
   ```

3. **自定义精细度**
   ```
   生成一张猫咪的图片，精细度0.8
   ```

4. **使用反向提示词**
   ```
   生成一张猫咪的图片，不要模糊，不要文字
   ```

5. **组合使用**
   ```
   生成一张1024x768的猫咪图片，精细度0.8，不要模糊
   ```

6. **也可直接在对话中指定所需模型信息**
   ```
   生成一张[描述]的图片，API Key为[您的API Key]，API URL为[您的API URL]，绘图模型为[模型名称]
   ```

## 参数说明

- **尺寸**：宽度和高度必须在512-1360像素之间，且必须是8的倍数
- **精细度**：取值范围0.1-1.0
  - 0.1：生成速度快，细节较少
  - 0.5：默认值，平衡速度和质量
  - 1.0：生成速度慢，细节丰富

## 技术说明

- 使用 Edge Runtime 部署
- 基于 Next.js API Routes
- 支持 CORS
- 响应超时设置为 60 秒
- 内存限制为 1024MB

## 环境要求

- Node.js 18+
- npm 或 yarn
- Docker（如果使用 Docker 部署）

## 开发说明

本插件使用了以下技术：
- [@lobehub/chat-plugin-sdk](https://github.com/lobehub/chat-plugin-sdk)
- Next.js Edge Runtime
- TypeScript
- Docker

## 许可证

MIT License 