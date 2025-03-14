# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 只复制依赖相关文件
COPY package.json package-lock.json ./

# 安装依赖，使用 npm ci 而不是 npm install
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build \
    && npm prune --production \
    && rm -rf .git \
    && rm -rf src/*.test.* \
    && rm -rf src/**/*.test.* \
    && rm -rf .next/cache

# 生产阶段
FROM node:18-alpine AS production

# 安装 tini 作为 init 系统
RUN apk add --no-cache tini

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动应用
CMD ["npm", "start"] 