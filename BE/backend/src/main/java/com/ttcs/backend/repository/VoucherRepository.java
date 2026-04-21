package com.ttcs.backend.repository;

import com.ttcs.backend.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    List<Voucher> findByUserIdOrderByIssuedAtDesc(Long userId);

    boolean existsByUserIdAndTierIdAndStatus(Long userId, Long tierId, String status);

    @Modifying
    @Query("UPDATE Voucher v SET v.status = 'EXPIRED' WHERE v.expiresAt < :now AND v.status = 'ACTIVE'")
    int expireByExpiresAtBefore(@Param("now") LocalDateTime now);

    Page<Voucher> findByStatusContainingIgnoreCase(String status, Pageable pageable);

    boolean existsByUserIdAndTierIdAndIssuedAtAfter(Long userId, Long tierId, LocalDateTime after);
}