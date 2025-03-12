FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM node:18-alpine AS production
WORKDIR /app

# 复制依赖和构建文件
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.mjs ./next.config.mjs
COPY --from=base /app/.env.docker ./.env
COPY --from=base /app/src ./src

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"] 