# Laptop Store — Backend Study Plan (7 ngày)

Mục tiêu: Giúp bạn hiểu toàn bộ luồng backend (request → controller → service → repository → DB), cơ chế JWT, cấu hình, và vai trò các file chính.

Yêu cầu trước khi bắt đầu
- Java 17+, Maven, MySQL (database `laptop_store`).
- Thiết lập biến môi trường hoặc cập nhật `application.properties`:
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  - `JWT_SECRET`, `JWT_EXPIRATION_MS`
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`
  - `FRONTEND_URL`, `UserName`, `Email_Password` (mail)

Khởi chạy nhanh (Windows PowerShell):
```powershell
cd BE\backend
.\mvnw.cmd spring-boot:run
```

Swagger UI: http://localhost:8080/docs

Tổng quan thư mục (chính)
- Entry: `BE/backend/src/main/java/com/ttcs/backend/BackendApplication.java`
- Config: `application.properties`, `config/OpenApiConfig.java`, `config/WebConfig.java`, `config/JacksonConfig.java`
- Entity (Model): `entity/*` (Product, User, Order, Role, Review,...)
- Repository (DAO): `repository/*` (Spring Data JPA interfaces)
- Service (Business): `service/*` (AuthService, ProductService, OrderService,...)
- Controller (API): `controller/*` (ProductController, AuthController,...)
- Security: `security/*` (JwtService, JwtAuthenticationFilter, SecurityConfig,...)
- Exception handler: `exception/GlobalExceptionHandler.java`

Day-by-day 7 ngày (mỗi ngày việc cần làm & file tham khảo)

Day 1 — Setup & Overview
- Mục tiêu: Chạy dự án, mở Swagger, nắm cấu trúc cao.
- Files: `BackendApplication.java`, `application.properties`, `OpenApiConfig.java`, `data.sql`.
- Tasks:
  - Chạy server, mở Swagger.
  - Dò các endpoint chính.
Checkpoint: Server chạy, Swagger hiển thị.

Day 2 — Entities & DB (Model)
- Mục tiêu: Hiểu các entity JPA và quan hệ giữa chúng.
- Files: `entity/Product.java`, `entity/ProductSpecification.java`, `entity/ProductImage.java`, `entity/User.java`, `entity/Order.java`, `entity/OrderDetail.java`, `entity/Category.java`, `entity/Brand.java`, `data.sql`.
- Tasks:
  - Đọc các entity, chú ý annotation: `@OneToMany`, `@ManyToOne`, `@OneToOne`.
  - Vẽ sơ đồ ER đơn giản (text hoặc giấy).
Checkpoint: Có thể giải thích 3 relation chính (Product↔Brand, Product↔Specification, Order↔OrderDetail).

Day 3 — Repositories & Specifications (DAO)
- Mục tiêu: Hiểu `JpaRepository` + `JpaSpecificationExecutor` và filtering động.
- Files: `repository/*`, `specification/*` (ví dụ `ProductSpecs.java`).
- Tasks:
  - Đọc `ProductSpecs` để thấy cách build dynamic queries.
  - Test /api/products với tham số lọc (curl/Postman).
Checkpoint: Biết cách Specification ghép điều kiện và phân trang.

Day 4 — Services & Business Logic
- Mục tiêu: Theo dõi luồng nghiệp vụ; hiểu cách service liên kết child entities trước khi lưu.
- Files: `service/ProductService.java`, `service/OrderService.java`, `service/UserService.java`, `service/AuthService.java`, `service/ReviewService.java`, `service/FileStorageService.java`, `service/MailService.java`.
- Tasks:
  - Xem `ProductService.bindChildReferences()` để hiểu cách gán trả về (images/specification).
  - Tạo order qua API, quan sát `createOrder()` gán `order.setUser(currentUser)`.
Checkpoint: Hiểu 3 luồng: tạo product, tạo order, upload file.

Day 5 — Controllers & API
- Mục tiêu: Hiểu HTTP routes → controller → gọi service → trả response.
- Files: `controller/ProductController.java`, `OrderController.java`, `AuthController.java`, `UserController.java`, `ReviewController.java`, `FileUploadController.java`.
- Tasks:
  - Thực hành 5 request mẫu: list, get, create, update, delete cho Product và Order.
  - Kiểm tra GlobalExceptionHandler để hiểu cách lỗi được chuẩn hóa.
Sample curl:
```bash
# Register
curl -X POST "http://localhost:8080/api/auth/register" -H "Content-Type: application/json" -d '{"fullName":"Test User","email":"test@example.com","phone":"0123456789","password":"password"}'

# Login
curl -X POST "http://localhost:8080/api/auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'

# List products
curl -X GET "http://localhost:8080/api/products?page=0&size=5"
```

Day 6 — Security & Auth (JWT + roles)
- Mục tiêu: Hiểu flow đăng ký → verify email → login → token → bảo vệ endpoint.
- Files: `security/JwtService.java`, `security/JwtAuthenticationFilter.java`, `security/CustomUserDetailsService.java`, `security/SecurityConfig.java`, `service/AuthService.java`.
- Points to inspect:
  - `JwtService.generateToken()` tạo token chứa claim role.
  - `JwtAuthenticationFilter` parse token từ header `Authorization: Bearer ...` và set `SecurityContext`.
  - `SecurityConfig` định nghĩa rule cho endpoints (public, authenticated, role-based).
- Important note (possible bug):
  - `SecurityUtils.getCurrentUserId()` phụ thuộc vào `Authentication.getPrincipal()` là `UserPrincipal` (có id).
  - Nhưng `CustomUserDetailsService` hiện trả `org.springframework.security.core.userdetails.User` (không có id). Vì vậy `getCurrentUserId()` có thể không trả id.
  - Suggested fix: trong `CustomUserDetailsService.loadUserByUsername()` trả `UserPrincipal.create(user)` thay vì `User.builder()...build()`.

Day 7 — Tích hợp, Kiểm thử & Next steps
- Mục tiêu: Viết checklist test, chạy smoke tests, đề xuất cải tiến.
- Smoke tests (ít nhất):
  1. Register → verify → login → get token
  2. GET `/api/products` (public)
  3. POST `/api/orders` (authenticated) — kiểm tra order.user được set
  4. POST `/api/files/upload` (authenticated)
  5. POST `/api/reviews` (authenticated customer)
  6. Admin-only endpoint: PUT `/api/orders/{id}/status` (role=ADMIN)

- Đề xuất cải tiến:
  - Dùng DTO cho request/response thay vì trả entity trực tiếp.
  - Viết unit tests cho Service layer.
  - Sửa `CustomUserDetailsService` để trả `UserPrincipal` (nếu cần).

Quiz / Checklist để tự kiểm tra
- Bạn có thể mô tả luồng khi một request GET `/api/products` được xử lý không?
- Làm thế nào `ProductSpecification` được join để lọc theo `cpu`?
- Tại sao `JwtService.getSigningKey()` lại hash secret nếu ngắn?
- `createOrder()` gán user như thế nào? Tại sao?
- Nêu 3 endpoint public và 3 endpoint yêu cầu role ADMIN.

Tài liệu này đã lưu ở: `BE/backend/docs/backend-study-plan.md`

Muốn tôi tiếp tục thực hiện smoke tests (chạy 5 request mẫu) không? Hoặc bạn muốn chỉnh nội dung trong file này?
