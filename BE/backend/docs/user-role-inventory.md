# Quản lý User & Role và Tồn kho tự động sau IPN

Tài liệu này mô tả chi tiết hai chức năng trong backend:

- Phần A — Quản lý User & Role (CRUD, seeding admin, tìm kiếm/lọc/phân trang).
- Phần B — Tồn kho tự động sau thanh toán (IPN): design, code snippets, concurrency, test.

---

## A. Quản lý User & Role (CRUD) — từ đầu đến cuối

### Mục tiêu
- Cung cấp API CRUD cho `Role` và `User`.
- Hỗ trợ tìm kiếm, lọc, phân trang cho `User`.
- Seed sẵn `ADMIN`/`CUSTOMER` role và tài khoản admin khi ứng dụng khởi động.

### Các file chính (tham khảo)
- Seeder (startup): [BE/backend/src/main/java/com/ttcs/backend/config/DataInitializer.java](BE/backend/src/main/java/com/ttcs/backend/config/DataInitializer.java#L1)
- Role: entity/repo/service/controller
  - [BE/backend/src/main/java/com/ttcs/backend/entity/Role.java](BE/backend/src/main/java/com/ttcs/backend/entity/Role.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/repository/RoleRepository.java](BE/backend/src/main/java/com/ttcs/backend/repository/RoleRepository.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/service/RoleService.java](BE/backend/src/main/java/com/ttcs/backend/service/RoleService.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/controller/RoleController.java](BE/backend/src/main/java/com/ttcs/backend/controller/RoleController.java#L1)
- User: entity/repo/service/controller + specs
  - [BE/backend/src/main/java/com/ttcs/backend/entity/User.java](BE/backend/src/main/java/com/ttcs/backend/entity/User.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/repository/UserRepository.java](BE/backend/src/main/java/com/ttcs/backend/repository/UserRepository.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/service/UserService.java](BE/backend/src/main/java/com/ttcs/backend/service/UserService.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/controller/UserController.java](BE/backend/src/main/java/com/ttcs/backend/controller/UserController.java#L1)
  - [BE/backend/src/main/java/com/ttcs/backend/specification/UserSpecs.java](BE/backend/src/main/java/com/ttcs/backend/specification/UserSpecs.java#L1)

### Luồng xử lý chi tiết
1. Khi ứng dụng khởi động, `DataInitializer` (implements `CommandLineRunner`) chạy và đảm nhiệm:
   - Tạo `Role` `ADMIN` và `CUSTOMER` nếu chưa tồn tại.
   - Tạo user admin với email/mật khẩu từ cấu hình (`app.admin.email`, `app.admin.password`, `app.admin.full-name`) nếu chưa có.
   - File: [BE/backend/src/main/java/com/ttcs/backend/config/DataInitializer.java](BE/backend/src/main/java/com/ttcs/backend/config/DataInitializer.java#L1)

2. CRUD Role:
   - `RoleController` expose endpoint `/api/roles` cho CRUD.
   - `RoleService` thực hiện logic đơn giản: `findAll`, `findById`, `save`, `delete`.
   - Quyền: các route quản trị được bảo vệ bởi `SecurityConfig` (chỉ `ROLE_ADMIN` được phép gọi các endpoint quản trị).

3. CRUD/User list + tìm kiếm/lọc + phân trang:
   - `UserController.getUsers(...)` nhận các query params (email, fullName, phone, roleId, page, size, sortBy, sortDir) và xây `Pageable`.
   - `UserService.getFilteredUsers` dùng `UserSpecs` (JPA `Specification`) để build dynamic filters, kết hợp với `userRepository.findAll(spec, pageable)` để lấy `Page<User>`.
   - `UserSpecs.withFetchRole()` đảm bảo `role` được fetch để tránh N+1 problem.

4. Bảo mật & quyền:
   - `SecurityConfig` cấu hình rule cho `/api/users/**` và `/api/roles/**` (yêu cầu role admin cho các route quản trị).
   - `UserService` có thêm kiểm tra authorization: nếu không phải admin, user chỉ có thể xem/cập nhật chính mình (sử dụng `SecurityUtils.getCurrentUserId()`).

### Gợi ý cải tiến (ngắn)
- Trả DTO cho responses để tránh lộ trường nhạy cảm (ví dụ `password`).
- Thêm validation DTO cho create/update (hiện controllers dùng entity trực tiếp). 
- Thêm audit logs khi admin thay đổi user/role.

### Ví dụ request nhanh
```bash
# List users (filter by email, page 0 size 10)
curl -X GET "http://localhost:8080/api/users?email=example&page=0&size=10" -H "Authorization: Bearer <token>"

# Create role (admin)
curl -X POST "http://localhost:8080/api/roles" -H "Authorization: Bearer <admin-token>" -H "Content-Type: application/json" -d '{"name":"MANAGER"}'
```

---

## B. Tồn kho tự động sau thanh toán (IPN) — thiết kế & cài đặt chi tiết

### Yêu cầu chức năng (như bạn mô tả)
- Khi nhận IPN (payment gateway báo thanh toán thành công) cho `Order`:
  - Trừ tồn kho theo từng `OrderDetail`.
  - Khóa bản ghi sản phẩm khi trừ kho để tránh race condition.
  - Chặn tồn kho âm: nếu một sản phẩm không đủ hàng — toàn bộ thao tác trừ kho KHÔNG thực hiện và đơn KHÔNG auto-approve.
  - Đảm bảo idempotency: re-tried IPN không trừ kho lần 2.

### Hiện trạng project
- `Order` entity & `OrderService` hiện có, `OrderStatus` enum: `PENDING`, `APPROVED`, `CANCELLED`, `DELIVERED`.
- Chưa thấy IPN/payment handler trong codebase — cần thêm endpoint để nhận notification từ payment gateway.

### Thiết kế an toàn (đề xuất)
Nguyên tắc:
- Xử lý trừ kho phải nằm trong một transaction duy nhất.
- Kiểm stock nên dùng phép cập nhật nguyên tử trên DB (UPDATE ... WHERE stock >= qty) hoặc đọc với PESSIMISTIC_WRITE và cập nhật.
- Lock order trước khi xử lý để tránh concurrent IPN xử lý cùng order.
- Đánh dấu order khi đã xử lý inventory để hỗ trợ idempotency.

Các thay đổi/đầu mục cần thực hiện
1. Repository
   - Thêm method atomic trong `ProductRepository`:
   ```java
   @Modifying
   @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
   int decrementStockIfAvailable(@Param("id") Long id, @Param("qty") Integer qty);
   ```
   - Thêm method lock trong `OrderRepository`:
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT o FROM Order o WHERE o.id = :id")
   Optional<Order> findByIdForUpdate(@Param("id") Long id);
   ```

2. Service — `OrderService.handlePaymentSuccess(orderId)` (transactional)
   - Steps:
     1. `@Transactional` bắt đầu.
     2. `order = orderRepository.findByIdForUpdate(orderId)` để lock order.
     3. Kiểm tra trạng thái order: nếu không phải `PENDING` (hoặc đã `APPROVED`) -> trả về (idempotent).
     4. Duyệt `order.getOrderDetails()` và cho mỗi detail gọi `productRepository.decrementStockIfAvailable(productId, qty)`.
        - Nếu bất kỳ call nào trả `0` (không đủ stock) → throw exception để rollback transaction.
     5. Nếu tất cả thành công → `order.setStatus(OrderStatus.APPROVED)`; save order.

   - Ví dụ method (tóm tắt):
   ```java
   @Transactional
   public void handlePaymentSuccess(Long orderId) {
       Order order = orderRepository.findByIdForUpdate(orderId)
           .orElseThrow(...);

       if (order.getStatus() != OrderStatus.PENDING) return; // idempotent

       for (OrderDetail d : order.getOrderDetails()) {
           int updated = productRepo.decrementStockIfAvailable(d.getProduct().getId(), d.getQuantity());
           if (updated == 0) {
               throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock for product " + d.getProduct().getId());
           }
       }

       order.setStatus(OrderStatus.APPROVED);
       orderRepository.save(order);
   }
   ```

3. IPN endpoint — `PaymentController`
   - Phân tích & verify signature của gateway.
   - Nếu `status == SUCCESS` → gọi `orderService.handlePaymentSuccess(orderId)`.

4. Schema updates (tuỳ chọn nhưng khuyến nghị)
   - `Order.inventoryAdjusted` (boolean) để biểu thị đã xử lý inventory; giúp idempotency và audit.
   - Hoặc rely on `order.status` (APPROVED) như cờ đã xử lý.

### Concurrency & an toàn
- Sử dụng `UPDATE ... WHERE stock >= :qty` là cách đơn giản, atomic và tránh khóa hàng loạt.
- Nếu dùng `PESSIMISTIC_WRITE` (khoá hàng), hãy đảm bảo ordering (ví dụ sắp xếp danh sách sản phẩm theo id trước khi lock) để giảm deadlock.
- Luôn thực hiện trong transaction và rollback toàn bộ nếu thiếu hàng để tránh trạng thái bán một phần.

### Idempotency
- Kiểm `order.status` trước khi xử lý: nếu đã `APPROVED` thì không làm gì nữa.
- IPN trùng lặp sẽ bị short-circuit.

### Thông báo & xử lý khi thiếu hàng
- Nếu không đủ hàng: rollback, ghi log, gửi thông báo cho admin hoặc user (tùy yêu cầu), đặt trạng thái order `PENDING` hoặc `PENDING_STOCK` (nếu thêm enum).

### Tests & QA
- Unit tests cho `OrderService.handlePaymentSuccess` (mock `ProductRepository`): trường hợp thành công và trường hợp thất bại do thiếu hàng.
- Integration test: simulate full flow -> create order (PENDING) -> call IPN (success) -> assert stock giảm và order APPROVED.
- Concurrency test: simulate nhiều IPN cùng order / nhiều orders cùng product.

### Ví dụ API IPN (sơ)
```http
POST /api/payments/ipn
Content-Type: application/json

{
  "orderId": 123,
  "status": "SUCCESS",
  "signature": "..."
}
```

Controller xác thực `signature` rồi gọi service.

---

## Acceptance criteria (cho phần B)
1. Khi IPN thành công và tất cả sản phẩm đủ hàng → stock giảm đúng số lượng, `Order.status` chuyển sang `APPROVED`.
2. Khi có ít nhất 1 sản phẩm thiếu hàng → không có stock nào bị trừ, order không auto-approve.
3. IPN retry không gây trừ kho lần 2 (idempotent).
4. Logs/notifications cho các trường hợp lỗi (thiếu hàng, verify signature thất bại).

---

## Next steps (gợi ý triển khai nhanh)
1. Tôi có thể tạo PR patch skeleton với các file thay đổi sau:
   - `ProductRepository` (method `decrementStockIfAvailable`)
   - `OrderRepository` (method `findByIdForUpdate`)
   - `OrderService.handlePaymentSuccess` (transactional)
   - `PaymentController` (IPN endpoint)
2. Viết tests (unit + integration) cho flow xử lý payment → inventory.

File này đã lưu: `BE/backend/docs/user-role-inventory.md`

---

## C. Giải thích cho người mới (dành cho bạn đã học Java cơ bản)

Mục tiêu: giải thích các khái niệm và luồng hoạt động theo ngôn ngữ đơn giản nhất, để bạn nắm rõ cách Spring Boot vận hành và cách hai chức năng (User/Role và Inventory/IPN) chạy trong hệ thống.

1) Spring Boot & các khái niệm cơ bản
- Spring Boot là framework giúp bạn chạy ứng dụng web Java nhanh mà không phải cấu hình thủ công nhiều. Bạn chỉ cần một class `main` có `SpringApplication.run(...)` để khởi server.
- Các thành phần cơ bản:
   - `@RestController`: nơi định nghĩa API (URL) — khi trình duyệt hoặc client gọi URL, controller nhận request và trả JSON.
   - `@Service`: chứa logic nghiệp vụ (business logic) — ví dụ: tính tổng đơn, kiểm tra tồn kho.
   - `@Repository` / Spring Data JPA: giao tiếp với cơ sở dữ liệu; bạn thường không viết SQL thủ công mà gọi phương thức repository.
   - `@Entity`: class Java được chuyển thành bảng trong database (mỗi instance = một record).
   - `application.properties`: file cấu hình (DB connection, port, JWT secret...).
   - `@Transactional`: đảm bảo một nhóm thao tác DB chạy thành một khối — nếu một phần lỗi thì rollback toàn bộ.

2) Luồng xử lý một HTTP request (đơn giản)
- Client (Postman/frontend) gửi HTTP → Spring Boot nhận → `DispatcherServlet` chọn controller tương ứng → controller gọi service → service gọi repository → DB thực hiện truy vấn → kết quả trả về controller → controller trả JSON cho client.

3) Cụ thể cho User/Role (nhìn từ góc độ người mới)
- Khi bạn mở Swagger và gọi `POST /api/users`:
   1. Controller nhận JSON request và ánh xạ vào object `User`.
   2. Controller gọi `UserService.createUser()` để thực hiện các bước nghiệp vụ: normalize email, mã hóa mật khẩu, kiểm trùng email.
   3. `UserService` gọi `userRepository.save(user)` → Spring Data sẽ chuyển thành SQL `INSERT` và lưu vào DB.
   4. Response trả về xác nhận đã tạo user.
- Tìm kiếm/lọc/phân trang: controller chỉ cần chuyển các tham số truy vấn (email, page, size) vào `UserService`. Service dùng `Specification` để xây điều kiện WHERE động và `Pageable` để request DB trả page.

4) Cụ thể cho IPN & trừ kho (nhìn từ góc độ người mới)
- IPN là lời nhắn từ cổng thanh toán báo "đã thanh toán".
- Vì IPN có thể gửi lại (retry), nên server phải xử lý sao cho "an toàn khi gọi lại" (idempotent).
- Mục tiêu: khi IPN báo thành công cho order X, ta muốn:
   - trừ stock của từng product theo số lượng trong order;
   - nếu bất kỳ sản phẩm nào thiếu, KHÔNG trừ cho sản phẩm nào cả (rollback);
   - nếu đã xử lý rồi (order đã APPROVED), không trừ lần nữa.
- Cách đơn giản, an toàn:
   1. Tạo endpoint `/api/payments/ipn` để nhận IPN.
   2. Xác thực IPN (chữ ký) để đảm bảo là gửi từ payment gateway.
   3. Trong service xử lý, bắt đầu `@Transactional` và lấy order với khóa (hoặc check `order.status`).
   4. Dùng câu lệnh SQL nguyên tử để trừ stock:
       `UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty` — câu lệnh này sẽ chỉ cập nhật khi đủ stock.
   5. Nếu bất kỳ update nào trả 0 (không cập nhật) → rollback (không trừ cho sản phẩm nào) và báo lỗi/đừng approve.
   6. Nếu tất cả ok → set `order.status = APPROVED` và commit transaction.

5) Cách debug khi bạn mới bắt đầu
- Kiểm log: Spring Boot in log lúc app chạy; nếu có lỗi exception, đọc stack trace để biết class/method gây lỗi.
- Dùng Postman + Swagger để gọi API từng bước: tạo user → login → tạo order → simulate IPN.
- Nếu thấy stock âm: kiểm tra xem code có dùng `@Transactional` hay dùng phép update có điều kiện hay không.

6) Tài nguyên học nhanh (gợi ý ngắn)
- Spring Boot guide: https://spring.io/guides
- Spring Data JPA: tìm hiểu `JpaRepository`, `@Entity`, `@OneToMany`, `@ManyToOne`.
- Transactions: đọc `@Transactional` và cách rollback hoạt động.

---

Nếu bạn muốn, tôi sẽ ngay lập tức:
- A) Thêm phần ví dụ cấu trúc database (ER diagram text) vào file này; hoặc
- B) Tạo PR code skeleton để triển khai IPN + trừ kho (thực tế); hoặc
- C) Viết tập hợp lệnh curl/Postman step‑by‑step để bạn thực hành (kèm dữ liệu mẫu).

