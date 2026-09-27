# Sử dụng base image Node.js Alpine chính thức, tối ưu kích thước và bảo mật
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Tạo group và non-root user (appuser: UID 1001, GID 1001)
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy toàn bộ mã nguồn vào container
COPY . /app

# Phân quyền cho non-root user sở hữu toàn bộ thư mục /app
RUN chown -R appuser:appgroup /app

# Chuyển sang sử dụng non-root user theo tiêu chí bảo mật (Hardening)
USER appuser

# Khai báo cổng nội bộ 3000
EXPOSE 3000

# Khởi chạy server web
CMD ["node", "server.js"]
