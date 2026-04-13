package com.ttcs.backend.service;

import com.ttcs.backend.entity.Order;
import com.ttcs.backend.entity.OrderStatus;
import com.ttcs.backend.entity.User;
import com.ttcs.backend.repository.OrderRepository;
import com.ttcs.backend.repository.UserRepository;
import com.ttcs.backend.specification.OrderSpecs;
import com.ttcs.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Page<Order> getFilteredOrders(OrderStatus status, Long userId, String phoneNumber, BigDecimal minAmount, BigDecimal maxAmount, Pageable pageable) {
        // Authorization check: if user is not an Admin, they can only see their own orders
        if (!SecurityUtils.hasRole("ADMIN")) {
            userId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để xem đơn hàng"));
        }

        Specification<Order> spec = Specification.where(OrderSpecs.withFetchUser())
                .and(OrderSpecs.hasStatus(status))
                .and(OrderSpecs.hasUserId(userId))
                .and(OrderSpecs.hasPhoneNumber(phoneNumber))
                .and(OrderSpecs.totalAmountBetween(minAmount, maxAmount));
        return orderRepository.findAll(spec, pageable);
    }

    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));

        // Authorization check: User can only see their own order unless they are an Admin
        if (!SecurityUtils.hasRole("ADMIN")) {
            Long currentUserId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để xem đơn hàng"));

            if (!order.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập đơn hàng này");
            }
        }

        return order;
    }

    public Order createOrder(Order order) {
        // 1. Set default status
        order.setStatus(OrderStatus.PENDING);

        // 2. Set current user automatically for security
        User currentUser = SecurityUtils.getCurrentUserId()
                .map(id -> userRepository.findById(id).orElse(null))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đặt hàng"));
        
        order.setUser(currentUser);

        // 3. Link order details back to this order if they exist
        if (order.getOrderDetails() != null) {
            order.getOrderDetails().forEach(detail -> detail.setOrder(order));
        }

        return orderRepository.save(order);
    }

    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }
}
