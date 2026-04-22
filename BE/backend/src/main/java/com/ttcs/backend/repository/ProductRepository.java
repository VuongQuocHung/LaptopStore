package com.ttcs.backend.repository;

import com.ttcs.backend.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByBrandId(Long brandId);

    // Khóa bản ghi sản phẩm khi trừ kho để tránh race condition khi duyệt đơn đồng thời.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Product> findById(Long id);

    // Sử dụng EntityGraph để tối ưu truy vấn khi cần lấy chi tiết sản phẩm
    @EntityGraph(attributePaths = {"images", "specification", "brand", "category"})
    Optional<Product> findWithDetailsById(Long id);
}
