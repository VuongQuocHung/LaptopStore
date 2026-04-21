package com.ttcs.backend.repository;

import com.ttcs.backend.entity.VoucherTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherTierRepository extends JpaRepository<VoucherTier, Long> {
    Optional<VoucherTier> findTopByMinSpendLessThanEqualOrderByMinSpendDesc(Long totalSpend);

    List<VoucherTier> findByMinSpendLessThanEqualOrderByMinSpendAsc(Long totalSpend);
}