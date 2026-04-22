package com.ttcs.backend.specification;

import com.ttcs.backend.entity.User;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecs {
    public static Specification<User> hasEmail(String email) {
        return (root, query, cb) -> email == null ? null : cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%");
    }

    public static Specification<User> hasFullName(String fullName) {
        return (root, query, cb) -> fullName == null ? null : cb.like(cb.lower(root.get("fullName")), "%" + fullName.toLowerCase() + "%");
    }

    public static Specification<User> hasPhone(String phone) {
        return (root, query, cb) -> phone == null ? null : cb.like(root.get("phone"), "%" + phone + "%");
    }

    // Lọc theo roleId
    public static Specification<User> hasRoleId(Long roleId) {
        return (root, query, cb) -> roleId == null ? null : cb.equal(root.get("role").get("id"), roleId);
    }

    public static Specification<User> withFetchRole() {
        return (root, query, cb) -> {
            Class<?> resultType = query.getResultType();
            if (resultType != Long.class && resultType != long.class) {
                root.fetch("role", JoinType.LEFT);
            }
            return null;
        };
    }
}
