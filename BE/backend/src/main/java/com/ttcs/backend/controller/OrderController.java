package com.ttcs.backend.controller;

import com.ttcs.backend.entity.Order;
import com.ttcs.backend.entity.OrderStatus;
import com.ttcs.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order API", description = "Quản lý đơn hàng (Order)")
public class OrderController {
    private final OrderService orderService;

    // 1. GET ALL (with filtering & pagination)
    @GetMapping
    @Operation(summary = "Lấy danh sách đơn hàng", description = "Trả về danh sách đơn hàng hỗ trợ lọc đa điều kiện và phân trang")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public ResponseEntity<Page<Order>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity
                .ok(orderService.getFilteredOrders(status, userId, phoneNumber, minAmount, maxAmount, pageable));
    }

    // 2. POST CREATE
    @PostMapping
    @Operation(summary = "Tạo mới đơn hàng", description = "Thêm một đơn đặt hàng mới vào hệ thống")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào")
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }

    // 3. GET BY ID
    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin đơn hàng theo ID", description = "Xem chi tiết thông tin của một đơn hàng thông qua ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // 4. PUT/PATCH UPDATE
    @PutMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng", description = "Thay đổi trạng thái của đơn hàng (ví dụ: Đang xử lý, Đã giao...) dựa trên ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa đơn hàng", description = "Xóa một đơn hàng khỏi hệ thống thông qua ID")
    @ApiResponse(responseCode = "204", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
