package com.ttcs.backend.controller;

import com.ttcs.backend.auth.dto.*;
import com.ttcs.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth API", description = "Quản lý đăng nhập & đăng ký")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản", description = "Tạo một tài khoản người dùng mới cho Laptop Shop")
    @ApiResponse(responseCode = "201", description = "Đăng ký thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào hoặc email đã tồn tại")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Xác thực người dùng và nhận JWT token")
    @ApiResponse(responseCode = "200", description = "Đăng nhập thành công")
    @ApiResponse(responseCode = "401", description = "Sai email hoặc mật khẩu")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất", description = "Đăng xuất khỏi hệ thống (Front-end sẽ xóa token)")
    @ApiResponse(responseCode = "200", description = "Đăng xuất thành công")
    public ResponseEntity<String> logout() {
        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Thay đổi mật khẩu cho người dùng hiện tại (Yêu cầu đăng nhập)")
    @ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công")
    @ApiResponse(responseCode = "400", description = "Mật khẩu cũ không chính xác hoặc mật khẩu mới không khớp")
    public ResponseEntity<String> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                 @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok("Password changed successfully");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Quên mật khẩu", description = "Gửi email chứa reset token")
    @ApiResponse(responseCode = "200", description = "Email đã được gửi (Check console log trong mock service)")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng với email này")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok("Reset password email sent successfully");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu", description = "Sử dụng token để đặt lại mật khẩu mới")
    @ApiResponse(responseCode = "200", description = "Đặt lại mật khẩu thành công")
    @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully");
    }
    @GetMapping("/verify-email")
    @Operation(summary = "Xác nhận email", description = "Xác thực tài khoản qua token trong email")
    @ApiResponse(responseCode = "200", description = "Xác thực thành công")
    @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok("Xác thực email thành công! Bạn có thể đăng nhập.");
    }
}
