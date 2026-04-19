package com.ttcs.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter // Tự sinh getter
@Setter // Tự sinh setter
@NoArgsConstructor // Tạo constructor không tham số 
@AllArgsConstructor // Tạo constructor đầy đủ tham số
@Builder // Tạo builder
public class User {

    @Id // khóa chính
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto increment
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    @JsonIgnore // không trả password về fe
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @ManyToOne(fetch = FetchType.EAGER) // EAGER vì thường cần thông tin role khi lấy user
    // VD : User user = userRepository.findById(1) tương đương với :
    // SELECT * FROM users
    // JOIN roles ON ...
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    // Thêm vào User.java
    private boolean enabled = false;          // Mặc định chưa xác thực

    // Reset password token
    @Column(unique = true)
    private String verificationToken;

    private LocalDateTime verificationTokenExpiry;

    // Đăng ký
    //     ↓
    // Tạo verificationToken
    //     ↓
    // Gửi email link
    //     ↓
    // User click
    //     ↓
    // enabled = true
}

// Luồng hoạt động trong thực tế : 
// Đăng ký:
// POST /register
//    ↓
// tạo user (enabled = false)
//    ↓
// tạo verificationToken
//    ↓
// gửi email

// Xác thực email:
// GET /verify?token=abc
//    ↓
// check token
//    ↓
// enabled = true

// POST /login
//    ↓
// check email + password
//    ↓
// check enabled == true
