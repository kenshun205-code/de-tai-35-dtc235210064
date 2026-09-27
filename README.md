# Đề Tài 35: Triển Khai Hệ Thống Docker, Nginx Reverse Proxy & Monitoring

Dự án triển khai ứng dụng trắc nghiệm kiến thức DevSecOps/System Administration theo mô hình Multi-tier Architecture sử dụng Docker Compose, Nginx Reverse Proxy, MySQL 8.0, phpMyAdmin, cùng hệ thống giám sát Prometheus + Grafana + cAdvisor.

---

## 1. Kiến Trúc Mạng & Dịch Vụ (Network Topology)

Hệ thống tuân thủ nghiêm ngặt tiêu chí bảo mật **Network Isolation** và **Container Hardening**:

```mermaid
graph TD
    Client[Client / Trình duyệt] -->|HTTP :80 Redirect 301| Nginx
    Client -->|HTTPS :443 SSL + Security Headers| Nginx
    Client -->|HTTP :3001| Grafana[Grafana Dashboard :3001]
    Client -->|HTTP :9090| Prometheus[Prometheus Server :9090]

    subgraph frontend-net [Mạng Frontend - frontend-net]
        Nginx[Nginx Reverse Proxy]
        Nginx -->|/ (Reverse Proxy :3000)| WebApp[web-app :3000\nNon-root user UID: 1001]
        Nginx -->|/pma/ (Reverse Proxy :80)| PMA[phpMyAdmin :80\nPMA_ABSOLUTE_URI]
        Grafana
    end

    subgraph backend-net [Mạng Backend Nội Bộ - backend-net]
        WebApp
        PMA
        DB[(MySQL 8.0\nVolume: db_data\nKhông public port)]
        Prometheus
        cAdvisor[cAdvisor :8080\nMetrics Container]
        Grafana
    end

    WebApp -.->|Internal: 3306| DB
    PMA -.->|Internal: 3306| DB
    Prometheus -->|Scrape metrics| cAdvisor
    Prometheus -->|Scrape metrics| Prometheus
    Grafana -->|Data source :9090| Prometheus
```

### Các Dịch Vụ:
1. **`nginx`** (Cổng `80:80`, `443:443`): Tiếp nhận request, tự động chuyển hướng HTTP sang HTTPS, đính kèm Security Headers, định tuyến lưu lượng tới `web-app` và `phpmyadmin`.
2. **`web-app`** (Cổng nội bộ `3000`): Phục vụ ứng dụng web tĩnh và API healthcheck. Chạy dưới quyền `appuser` (non-root UID: `1001`).
3. **`db`** (Cổng nội bộ `3306`): MySQL 8.0 lưu trữ bền vững với named volume `db_data`, mật khẩu mạnh, hoàn toàn cô lập trong `backend-net` (không mở port ra ngoài host).
4. **`phpmyadmin`** (Cổng nội bộ `80`): Quản trị cơ sở dữ liệu MySQL qua giao diện trực quan tại đường dẫn `https://localhost/pma/`.
5. **`prometheus`** (Cổng `9090:9090`): Hệ thống Time-Series Database thu thập chỉ số hiệu năng định kỳ từ cAdvisor và chính Prometheus.
6. **`cadvisor`** (Cổng nội bộ `8080`): Thu thập chỉ số tài nguyên thời gian thực của toàn bộ container (CPU, RAM, Network, Disk I/O).
7. **`grafana`** (Cổng `3001:3000`): Giao diện hiển thị Dashboard giám sát trực quan, lưu trữ cấu hình qua volume bền vững `grafana_data`.

---

## 2. Các Bước Đã Thực Hiện

### Bước 2: Thiết Lập SSL & Cấu Hình Nginx Reverse Proxy
- **Thư mục SSL**: [nginx/ssl](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/ssl)
- **Chứng chỉ tự ký**: Cặp khóa [nginx.key](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/ssl/nginx.key) và [nginx.crt](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/ssl/nginx.crt).
- **Cấu hình Nginx**: [nginx/nginx.conf](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/nginx/nginx.conf)
  - Chuyển hướng HTTP (80) sang HTTPS (443) bằng `301 Moved Permanently`.
  - Security Headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`.
  - Định tuyến `/` trỏ vào `web-app:3000`.
  - Định tuyến `/pma/` trỏ vào `phpmyadmin:80`.

### Bước 3: Triển Khai Docker Compose Đa Tầng & Bảo Mật
- File cấu hình: [docker-compose.yml](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/docker-compose.yml)
- Dockerfile ứng dụng: [Dockerfile](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/Dockerfile)
- Phân tách 2 mạng `frontend-net` và `backend-net` bảo vệ cơ sở dữ liệu tuyệt đối.

### Bước 4: Tích Hợp Hệ Thống Giám Sát (Commit 2)
- File cấu hình Prometheus: [prometheus/prometheus.yml](file:///d:/%C4%90%E1%BB%81%20t%C3%A0i%2035/prometheus/prometheus.yml)
- Dịch vụ cAdvisor đọc thông số phần cứng của Docker Engine qua các mount volumes: `/:/rootfs:ro`, `/var/run:/var/run:ro`, `/sys:/sys:ro`, `/var/lib/docker/:/var/lib/docker:ro`.
- Dịch vụ Grafana mở tại port `3001` (tránh xung đột với web-app) và kết nối với Prometheus để vẽ biểu đồ trực quan.

---

## 3. Hướng Dẫn Vận Hành & Kiểm Tra

### Khởi động toàn bộ cụm dịch vụ:
```bash
docker compose up -d
```

### Kiểm tra trạng thái toàn bộ 7 dịch vụ:
```bash
docker compose ps
```

### Kiểm tra web và reverse proxy:
- Web App (HTTPS): [https://localhost/](https://localhost/)
- phpMyAdmin (HTTPS): [https://localhost/pma/](https://localhost/pma/)
  - Tài khoản Root: `root` / `RootSecurePass_2026!#`
  - Tài khoản App: `app_user` / `SecureAppPass_2026!#`

### Kiểm tra hệ thống giám sát:
- **Prometheus UI**: [http://localhost:9090/targets](http://localhost:9090/targets) (Kiểm tra 2 targets `prometheus` và `cadvisor` đều ở trạng thái **UP**).
- **Grafana UI**: [http://localhost:3001/](http://localhost:3001/)
  - Tài khoản mặc định: `admin` / `admin`
  - Thêm Data Source: Chọn **Prometheus**, cấu hình URL: `http://prometheus:9090`.
  - Import Dashboard cAdvisor: Sử dụng Dashboard ID `14282` hoặc `893` để hiển thị trực quan thông số container.
