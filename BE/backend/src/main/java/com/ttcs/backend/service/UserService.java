package com.ttcs.backend.service;

import com.ttcs.backend.auth.dto.UserResponse;
import com.ttcs.backend.entity.Order;
import com.ttcs.backend.entity.Review;
import com.ttcs.backend.entity.User;
import com.ttcs.backend.repository.OrderRepository;
import com.ttcs.backend.repository.ReviewRepository;
import com.ttcs.backend.repository.UserRepository;
import com.ttcs.backend.security.SecurityUtils;
import com.ttcs.backend.specification.UserSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // lấy danh sách người dùng với filter & pagination
    public Page<User> getFilteredUsers(String email, String fullName, String phone, Long roleId, Pageable pageable) {
        Specification<User> spec = Specification.where(UserSpecs.withFetchRole())
                .and(UserSpecs.hasEmail(email))
                .and(UserSpecs.hasFullName(fullName))
                .and(UserSpecs.hasPhone(phone))
                .and(UserSpecs.hasRoleId(roleId));
        return userRepository.findAll(spec, pageable);
    }

    public User getUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        // Authorization check
        if (!SecurityUtils.hasRole("ADMIN")) {
            Long currentUserId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập"));

            if (!user.getId().equals(currentUserId)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập thông tin này");
            }
        }
        return user;
    }

    public User createUser(User user) {
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống");
        }

        // Chuẩn hóa email lowercase + chống trùng
        String normalizedEmail = user.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email nay da duoc su dung");
        }

        // mã hóa mật khẩu trước khi lưu vào database
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // lưu user mới vào database
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);

        // Chỉ admin hoặc chính chủ mới được cập nhật thông tin người dùng
        if (!SecurityUtils.hasRole("ADMIN")) {
            Long currentUserId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập"));

            if (!user.getId().equals(currentUserId)) {
                throw new AccessDeniedException("Bạn không có quyền cập nhật thông tin này");
            }
        }

        String normalizedEmail = userDetails.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!user.getEmail().equals(normalizedEmail) && userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email nay da duoc su dung");
        }

        user.setEmail(normalizedEmail);
        user.setFullName(userDetails.getFullName());
        user.setPhone(userDetails.getPhone());
        user.setEnabled(userDetails.isEnabled());
        user.setRole(userDetails.getRole());

        // Nếu có mật khẩu mới thì mã hóa, nếu không thì giữ nguyên mật khẩu cũ
        if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id); 

        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        if (currentUserId != null && currentUserId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong the tu xoa tai khoan dang dang nhap");
        }

        // Xóa cascade các review và order liên quan đến user này trước khi xóa user
        List<Review> reviews = reviewRepository.findByUserId(id);
        if (!reviews.isEmpty()) {
            reviewRepository.deleteAll(reviews);
        }

        List<Order> orders = orderRepository.findByUserId(id);
        if (!orders.isEmpty()) {
            orderRepository.deleteAll(orders);
        }

        userRepository.delete(user);
    }

    public UserResponse getUserProfile(Long id) {
        User user = getUserById(id);
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .roleName(user.getRole().getName())
                .build();
    }
}
