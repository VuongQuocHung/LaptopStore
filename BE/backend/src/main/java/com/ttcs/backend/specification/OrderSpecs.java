package com.ttcs.backend.specification;

import com.ttcs.backend.entity.Order;
import com.ttcs.backend.entity.OrderStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class OrderSpecs {
    public static Specification<Order> hasStatus(OrderStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Order> hasUserId(Long userId) {
        return (root, query, cb) -> userId == null ? null : cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Order> hasPhoneNumber(String phone) {
        return (root, query, cb) -> phone == null ? null : cb.like(root.get("phoneNumber"), "%" + phone + "%");
    }

    public static Specification<Order> totalAmountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min != null && max != null) return cb.between(root.get("totalAmount"), min, max);
            if (min != null) return cb.greaterThanOrEqualTo(root.get("totalAmount"), min);
            if (max != null) return cb.lessThanOrEqualTo(root.get("totalAmount"), max);
            return null;
        };
    }

    public static Specification<Order> withFetchUser() {
        return (root, query, cb) -> {
            Class<?> resultType = query.getResultType();
            if (resultType != Long.class && resultType != long.class) {
                root.fetch("user", JoinType.LEFT);
            }
            return null;
        };
    }
}
