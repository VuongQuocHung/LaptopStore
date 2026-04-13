# Laptop Store API (Backend)

Hệ thống Backend mạnh mẽ và có khả năng mở rộng cho ứng dụng Cửa hàng Laptop, được xây dựng bằng **Spring Boot 3**, **MySQL** và **Xác thực JWT**. Dự án này cung cấp đầy đủ các RESTful API để quản lý sản phẩm, danh mục, thương hiệu, đơn hàng và đánh giá của người dùng.

---

## 🛠️ Công nghệ sử dụng

-   **Framework**: Spring Boot 3.4.4
-   **Cơ sở dữ liệu**: MySQL
-   **Bảo mật**: Spring Security 6 + JJWT (JSON Web Token)
-   **Truy cập dữ liệu**: Spring Data JPA + Hibernate
-   **Xác thực dữ liệu**: Jakarta Bean Validation
-   **Tài liệu API**: SpringDoc OpenAPI (Swagger)
-   **Công cụ hỗ trợ**: Lombok

---

## 📋 Yêu cầu hệ thống

Để chạy dự án này, hãy đảm bảo bạn đã cài đặt:
-   **Java Development Kit (JDK) 17** trở lên.
-   **Maven** 3.x.
-   **MySQL Server** (Phiên bản 8.0 hoặc tương đương).

---

## ⚙️ Cài đặt & Cấu hình

### 1. Thiết lập Cơ sở dữ liệu
1.  Mở terminal MySQL hoặc trình quản lý (ví dụ: MySQL Workbench).
2.  Tạo một cơ sở dữ liệu mới có tên `laptop_store`:
    ```sql
    CREATE DATABASE laptop_store;
    ```
    *(Hệ thống Hibernate sẽ tự động tạo các bảng vì cấu hình `spring.jpa.hibernate.ddl-auto=update` đã được bật)*.

### 2. Cấu hình ứng dụng
Kiểm tra file `backend/src/main/resources/application.properties` để biết các thiết lập sau:
-   **Cổng (Port)**: `8080` (mặc định)
-   **Kết nối MySQL**: Cập nhật `spring.datasource.username` và `spring.datasource.password` để phù hợp với máy của bạn.
-   **JWT Secret**: Đối với môi trường phát triển, một khóa mặc định đã được cung cấp, nhưng nên thay đổi khi triển khai thực tế.

### 3. Thông tin Admin mặc định
Theo cấu hình mặc định, hệ thống có sẵn tài khoản quản trị:
-   **Email**: `admin@gmail.com`
-   **Mật khẩu**: `admin`

---

## 🏃 Hướng dẫn khởi chạy

1.  Di chuyển vào thư mục `backend`:
    ```bash
    cd backend
    ```
2.  Khởi động server Spring Boot bằng Maven wrapper:
    ```bash
    # Đối với Windows:
    .\mvnw.cmd spring-boot:run
    
    # Đối với MacOS/Linux:
    ./mvnw spring-boot:run
    ```

---

## 📖 Tài liệu API (Swagger)

Sau khi ứng dụng đã chạy, bạn có thể kiểm thử các API qua Swagger UI:
-   **Đường dẫn**: [http://localhost:8080/docs](http://localhost:8080/docs)

### Quy trình xác thực (Cách dùng JWT):
1.  **Đăng nhập**: Gửi request `POST` đến `/api/auth/login` với thông tin tài khoản.
2.  **Nhận Token**: Bạn sẽ nhận được chuỗi `token` trong phản hồi JSON.
3.  **Sử dụng**: Trong Swagger hoặc Postman, thêm header: `Authorization: Bearer <your_token>`.

---

## 📂 Cấu trúc thư mục

```text
backend/
 ├── src/main/java/com/ttcs/backend
 │    ├── auth/          # Các DTO cho xác thực
 │    ├── config/        # Cấu hình ứng dụng/CORS
 │    ├── controller/    # Các đầu nối API (User, Product, Order, v.v.)
 │    ├── entity/        # Các thực thể JPA (Bảng cơ sở dữ liệu)
 │    ├── exception/     # Logic xử lý lỗi toàn cục
 │    ├── repository/    # Lớp truy xuất dữ liệu
 │    ├── security/      # Cấu hình bảo mật, xử lý JWT
 │    ├── service/       # Lớp xử lý nghiệp vụ
 │    └── specification/ # JPA Specification cho tìm kiếm nâng cao
 └── src/main/resources/
      └── application.properties # File cấu hình chính
```