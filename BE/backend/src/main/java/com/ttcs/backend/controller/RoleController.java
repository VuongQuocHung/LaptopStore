package com.ttcs.backend.controller;

import com.ttcs.backend.entity.Role;
import com.ttcs.backend.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Role API", description = "Quản lý vai trò người dùng (Role)")
public class RoleController {
    private final RoleService roleService;

    // 1. GET ALL
    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả vai trò", description = "Trả về danh sách toàn bộ các vai trò (role) trong hệ thống")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public List<Role> getAllRoles() {
        return roleService.getAllRoles();
    }

    // 2. POST CREATE
    @PostMapping
    @Operation(summary = "Tạo mới vai trò", description = "Thêm một quyền/vai trò mới vào hệ thống")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào")
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        return ResponseEntity.ok(roleService.createRole(role));
    }

    // 3. GET BY ID
    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin vai trò theo ID", description = "Xem chi tiết thông tin của một quyền/vai trò thông qua ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy vai trò")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.getRoleById(id));
    }

    // 4. PUT/PATCH UPDATE
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật vai trò", description = "Cập nhật thông tin của một quyền/vai trò đã có sẵn dựa trên ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy vai trò")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody Role role) {
        return ResponseEntity.ok(roleService.updateRole(id, role));
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa vai trò", description = "Xóa một quyền/vai trò khỏi hệ thống thông qua ID")
    @ApiResponse(responseCode = "204", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy vai trò")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}
