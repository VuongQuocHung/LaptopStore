package com.ttcs.backend.service;

import com.ttcs.backend.entity.Order;
import com.ttcs.backend.entity.OrderDetail;
import com.ttcs.backend.entity.OrderStatus;
import com.ttcs.backend.entity.Product;
import com.ttcs.backend.entity.User;
import com.ttcs.backend.repository.OrderRepository;
import com.ttcs.backend.repository.ProductRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Page<Order> getFilteredOrders(OrderStatus status, Long userId, String phoneNumber, BigDecimal minAmount, BigDecimal maxAmount, Pageable pageable) {
        // Nếu không phải ADMIN, chỉ được xem đơn hàng của chính mình
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

        // Kiểm tra quyền truy cập: ADMIN xem được tất cả, USER chỉ xem được đơn của mình
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
        // 1. Mặc định trạng thái là PENDING khi tạo mới
        order.setStatus(OrderStatus.PENDING);

        // 2. Gán user hiện tại làm người tạo đơn
        User currentUser = SecurityUtils.getCurrentUserId()
                .map(id -> userRepository.findById(id).orElse(null))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đặt hàng"));
        
        order.setUser(currentUser);

        // 3. Thiết lập quan hệ 2 chiều giữa Order và OrderDetail
        if (order.getOrderDetails() != null) {
            order.getOrderDetails().forEach(detail -> detail.setOrder(order));
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = getOrderById(id);

        // Khi chuyển sang APPROVED, trừ tồn kho (chỉ khi trước đó chưa APPROVED)
        if (status == OrderStatus.APPROVED && order.getStatus() != OrderStatus.APPROVED) {
            if (order.getOrderDetails() != null) {
                System.out.println(order.getOrderDetails());
                for (OrderDetail detail : order.getOrderDetails()) {
                    Product product = detail.getProduct();
                    if (product == null) continue;

                    Integer currentStock = product.getStock() == null ? 0 : product.getStock();
                    if (currentStock < detail.getQuantity()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Không đủ tồn kho cho sản phẩm " + (product.getName() == null ? product.getId() : product.getName()));
                    }

                    product.setStock(currentStock - detail.getQuantity());
                    productRepository.save(product);
                }
            }
        }

        order.setStatus(status);
        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }
}
