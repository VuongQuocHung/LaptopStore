package com.ttcs.backend.repository;

import com.ttcs.backend.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByUserId(Long userId);

    // Sử dụng EntityGraph để tối ưu truy vấn khi cần lấy chi tiết đơn hàng
    @EntityGraph(attributePaths = {
            "orderDetails",
            "orderDetails.product",
            "orderDetails.product.images",
            "orderDetails.product.brand",
            "orderDetails.product.category",
            "orderDetails.product.specification"
    })
    // tạo một phương thức tùy chỉnh để lấy đơn hàng kèm chi tiết
    Optional<Order> findWithDetailsById(Long id);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.user.id = :userId AND o.status = 'DELIVERED'")
    Number sumPaidAmountByUserId(@Param("userId") Long userId);
}
