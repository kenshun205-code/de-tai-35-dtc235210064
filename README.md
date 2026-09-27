# Đề Tài 35: Triển Khai Hệ Thống Docker & Nginx Reverse Proxy

Dự án triển khai ứng dụng trắc nghiệm kiến thức DevSecOps/System Administration theo mô hình Multi-tier Architecture sử dụng Docker Compose, Nginx Reverse Proxy, MySQL 8.0 và phpMyAdmin.

---

## 1. Kiến Trúc Mạng & Dịch Vụ (Network Topology)

Hệ thống tuân thủ nghiêm ngặt tiêu chí bảo mật **Network Isolation** và **Container Hardening**:

```mermaid
graph TD
    Client[Client / Trình duyệt] -->|HTTP :80 Redirect 301| Nginx
    Client -->|HTTPS :443 SSL + Security Headers| Nginx

    subgraph frontend-net [Mạng Frontend - frontend-net]
        Nginx[Nginx Reverse Proxy]
        Nginx -->|/ (Reverse Proxy :3000)| WebApp[web-app :3000\nNon-root user UID: 1001]
        Nginx -->|/pma/ (Reverse Proxy :80)| PMA[phpMyAdmin :80\nPMA_ABSOLUTE_URI]
    end

    subgraph backend-net [Mạng Backend Nội Bộ - backend-net]
        WebApp
        PMA
        DB[(MySQL 8.0\nVolume: db_data\nKhông public port)]
    end

    WebApp -.->|Internal: 3306| DB
    PMA -.->|Internal: 3306| DB
```

### Các Dịch Vụ:
1. **`nginx`** (Cổng `80:80`, `443:443`): Tiếp nhận request, tự động chuyển hướng HTTP sang HTTPS, đính kèm Security Headers, định tuyến lưu lượng tới `web-app` và `phpmyadmin`.
2. **`web-app`** (Cổng nội bộ `3000`): Phục vụ ứng dụng web tĩnh và API healthcheck. Chạy dưới quyền `appuser` (non-root UID: `1001`).
3. **`db`** (Cổng nội bộ `3306`): MySQL 8.0 lưu trữ bền vững với named volume `db_data`, mật khẩu mạnh, hoàn toàn cô lập trong `backend-net` (không mở port ra ngoài host).
4. **`phpmyadmin`** (Cổng nội bộ `80`): Quản trị cơ sở dữ liệu MySQL qua giao diện trực quan tại đường dẫn `https://localhost/pma/`.

---

## 2. Các Bước Đã Thực Hiện

### Bước 2: Thiết Lập SSL & Cấu Hình Nginx Reverse Proxy
- **Tạo thư mục SSL**: [nginx/ssl](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/ssl)
- **Sinh chứng chỉ tự ký**: Dùng container Alpine chứa OpenSSL tạo ra 2 file [nginx.key](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/ssl/nginx.key) và [nginx.crt](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/ssl/nginx.crt).
- **Cấu hình Nginx**: [nginx/nginx.conf](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/nginx.conf)
  - Chuyển hướng HTTP (80) sang HTTPS (443) bằng mã phản hồi HTTP `301 Moved Permanently`.
  - Security Headers:
    - `X-Frame-Options: SAMEORIGIN`
    - `X-Content-Type-Options: nosniff`
    - `X-XSS-Protection: 1; mode=block`
    - `Referrer-Policy: strict-origin-when-cross-origin`
  - Định tuyến `/` trỏ vào container `web-app:3000`.
  - Định tuyến `/pma/` trỏ vào container `phpmyadmin:80`.

### Bước 3: Triển Khai Docker Compose Đa Tầng
- File cấu hình: [docker-compose.yml](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/docker-compose.yml)
- Dockerfile ứng dụng: [Dockerfile](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/Dockerfile)
- Phân tách 2 mạng `frontend-net` và `backend-net` bảo vệ cơ sở dữ liệu tuyệt đối khỏi internet.

---

## 3. Hướng Dẫn Vận Hành & Kiểm Tra

### Khởi động toàn bộ cụm dịch vụ:
```bash
docker compose up -d
```

### Kiểm tra trạng thái các container:
```bash
docker compose ps
```

### Kiểm tra chuyển hướng HTTP sang HTTPS:
```bash
curl -I http://localhost
```
*Kết quả mong đợi:* `HTTP/1.1 301 Moved Permanently`, `Location: https://localhost/`

### Kiểm tra HTTPS và Security Headers:
```bash
curl -k -I https://localhost/
```
*Kết quả mong đợi:* Trả về `HTTP/1.1 200 OK` cùng các Security Headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`).

### Kiểm tra truy cập phpMyAdmin:
- Mở trình duyệt truy cập: [https://localhost/pma/](https://localhost/pma/)
- Tài khoản:
  - **Server**: `db`
  - **Username**: `app_user` (hoặc `root`)
  - **Password**: `SecureAppPass_2026!#` (hoặc `RootSecurePass_2026!#`)
