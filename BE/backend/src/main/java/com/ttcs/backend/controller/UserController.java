package com.ttcs.backend.controller;

import com.ttcs.backend.auth.dto.UserResponse;
import com.ttcs.backend.entity.User;
import com.ttcs.backend.security.SecurityUtils;
import com.ttcs.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User API", description = "Quản lý người dùng (User)")
public class UserController {
    private final UserService userService;

    // 1. GET ALL (with filtering & pagination)
    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng", description = "Trả về danh sách người dùng hỗ trợ lọc theo email, tên, số điện thoại, vai trò và phân trang")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Long roleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(userService.getFilteredUsers(email, fullName, phone, roleId, pageable));
    }

    // 2. POST CREATE
    @PostMapping
    @Operation(summary = "Tạo mới người dùng", description = "Đăng ký hoặc tạo một tài khoản người dùng mới")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // mật khẩu sẽ được mã hóa trong service, nên có thể nhận thẳng từ request
        return ResponseEntity.ok(userService.createUser(user));
    }

    // 3. GET BY ID
    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin người dùng theo ID", description = "Xem chi tiết thông tin của người dùng thông qua ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // 4. PUT/PATCH UPDATE
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật người dùng", description = "Cập nhật thông tin của người dùng hiện tại dựa trên ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa người dùng", description = "Xóa một tài khoản người dùng khỏi hệ thống thông qua ID")
    @ApiResponse(responseCode = "204", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy thông tin cá nhân", description = "Trả về thông tin chi tiết của người dùng đang đăng nhập")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", description = "Chưa xác thực")
    public ResponseEntity<UserResponse> getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập"));
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }
}
