# 构建阶段，使用你ACR上的node镜像
FROM crpi-s1v7k92yzt12ry6y.cn-hangzhou.personal.cr.aliyuncs.com/christsui1228/node:22-alpine AS builder

# ---- 新增：接收构建时参数 ----
ARG PROD_API_URL
ENV VITE_API_BASE_URL=$PROD_API_URL
# -----------------------------

# 安装 pnpm
RUN npm install -g pnpm@10.18.1

# 设置pnpm使用国内镜像源
RUN pnpm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制所有项目源代码到工作目录
COPY . ./

# 构建应用 (vue-tsc -b && vite build)
# Vite 会自动读取环境变量 VITE_API_BASE_URL
RUN echo "Building with VITE_API_BASE_URL=${VITE_API_BASE_URL}" && pnpm run build

# 生产阶段，使用你ACR上的nginx镜像
FROM crpi-s1v7k92yzt12ry6y.cn-hangzhou.personal.cr.aliyuncs.com/christsui1228/nginx:alpine

# Nginx 默认的静态文件目录是 /usr/share/nginx/html
# vite build 默认的输出目录是 dist
COPY --from=builder /app/dist /usr/share/nginx/html

# ---- 修改：取消注释并确保路径正确 ----
# 假设你的 nginx.conf 文件在 Dockerfile 的同级目录下
COPY nginx.conf /etc/nginx/conf.d/default.conf
# ------------------------------------

# 暴露 Nginx 的默认端口
EXPOSE 80

# 运行 Nginx 服务在前台
CMD ["nginx", "-g", "daemon off;"]
