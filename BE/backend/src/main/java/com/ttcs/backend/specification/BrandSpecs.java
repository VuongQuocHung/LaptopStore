package com.ttcs.backend.specification;

import com.ttcs.backend.entity.Brand;
import org.springframework.data.jpa.domain.Specification;

public class BrandSpecs {
    public static Specification<Brand> hasName(String name) {
        return (root, query, cb) -> name == null ? null : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
}
