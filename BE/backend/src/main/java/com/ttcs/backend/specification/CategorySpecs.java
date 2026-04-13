package com.ttcs.backend.specification;

import com.ttcs.backend.entity.Category;
import org.springframework.data.jpa.domain.Specification;

public class CategorySpecs {
    public static Specification<Category> hasName(String name) {
        return (root, query, cb) -> name == null ? null : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
}
