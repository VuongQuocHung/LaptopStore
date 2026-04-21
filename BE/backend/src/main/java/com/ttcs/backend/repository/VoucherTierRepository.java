package com.ttcs.backend.repository;

import com.ttcs.backend.entity.VoucherTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherTierRepository extends JpaRepository<VoucherTier, Long> {

    @Query("SELECT t FROM VoucherTier t WHERE t.minSpend <= :totalSpend ORDER BY t.minSpend DESC LIMIT 1")
    Optional<VoucherTier> findHighestEligibleTier(@Param("totalSpend") Long totalSpend);
}