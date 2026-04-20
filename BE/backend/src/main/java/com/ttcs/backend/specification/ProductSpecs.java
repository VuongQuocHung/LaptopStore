package com.ttcs.backend.specification;

import com.ttcs.backend.entity.Product;
import com.ttcs.backend.entity.ProductSpecification;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecs {

    public static Specification<Product> hasName(String name) {
        return (root, query, cb) -> name == null ? null : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Product> hasBrand(Long brandId) {
        return (root, query, cb) -> brandId == null ? null : cb.equal(root.get("brand").get("id"), brandId);
    }

    public static Specification<Product> hasCategory(Long categoryId) {
        return (root, query, cb) -> categoryId == null ? null : cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> priceBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min != null && max != null) return cb.between(root.get("price"), min, max);
            if (min != null) return cb.greaterThanOrEqualTo(root.get("price"), min);
            if (max != null) return cb.lessThanOrEqualTo(root.get("price"), max);
            return null;
        };
    }

    private static Specification<Product> hasSpec(String field, List<String> values) {
        return (root, query, cb) -> {
            if (values == null || values.isEmpty()) return null;
            // Join với ProductSpecification để lọc theo các trường thông số kỹ thuật
            Join<Product, ProductSpecification> specJoin = root.join("specification", JoinType.LEFT);
            List<Predicate> predicates = new ArrayList<>();
            for (String val : values) {
                predicates.add(cb.like(cb.lower(specJoin.get(field)), "%" + val.toLowerCase() + "%"));
            }
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> hasCpu(List<String> cpus) { return hasSpec("cpu", cpus); }
    public static Specification<Product> hasRam(List<String> rams) { return hasSpec("ram", rams); }
    public static Specification<Product> hasStorage(List<String> storages) { return hasSpec("storage", storages); }
    public static Specification<Product> hasVga(List<String> vgas) { return hasSpec("vga", vgas); }
    public static Specification<Product> hasScreen(List<String> screens) { return hasSpec("screen", screens); }

    public static Specification<Product> withFetchSpecs() {
        return (root, query, cb) -> {
            // Chỉ thêm fetch nếu kết quả không phải là count query để tránh lỗi khi đếm
            Class<?> resultType = query.getResultType();
            if (resultType != Long.class && resultType != long.class) {
                root.fetch("specification", JoinType.LEFT);
                root.fetch("brand", JoinType.LEFT);
                root.fetch("category", JoinType.LEFT);
                // Nếu cần thiết, có thể thêm fetch cho images nhưng chú ý đến hiệu suất
                root.fetch("images", JoinType.LEFT);
                query.distinct(true);
            }
            return null;
        };
    }
}
