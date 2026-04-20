package com.ttcs.backend.service;

import com.ttcs.backend.entity.Voucher;
import com.ttcs.backend.entity.VoucherTier;
import com.ttcs.backend.repository.OrderRepository;
import com.ttcs.backend.repository.UserRepository;
import com.ttcs.backend.repository.VoucherRepository;
import com.ttcs.backend.repository.VoucherTierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherTierService {

    private final VoucherRepository voucherRepo;
    private final VoucherTierRepository tierRepo;
    private final OrderRepository orderRepo;
    private final UserRepository userRepo;
    private final MailService mailService;

    @Transactional
    public void evaluateAndGrantVoucher(Long userId) {
        Number totalSpendRaw = orderRepo.sumPaidAmountByUserId(userId);
        Long totalSpend = totalSpendRaw != null ? totalSpendRaw.longValue() : 0L;

        VoucherTier tier = tierRepo.findHighestEligibleTier(totalSpend).orElse(null);
        if (tier == null) return;

        boolean alreadyHasActive = voucherRepo
            .existsByUserIdAndTierIdAndStatus(userId, tier.getId(), "ACTIVE");
        if (alreadyHasActive) return;

        String prefix = tier.getName().substring(0, Math.min(4, tier.getName().length())).toUpperCase();
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String code = "VPH-" + prefix + "-" + suffix;

        Voucher voucher = Voucher.builder()
            .code(code)
            .user(userRepo.getReferenceById(userId))
            .tier(tier)
            .discountPct(tier.getDiscountPct())
            .issuedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(tier.getValidityDays()))
            .status("ACTIVE")
            .build();

        voucherRepo.save(voucher);

        // Tạm log, sau này thêm method sendVoucherGranted vào MailService
        log.info("Granted voucher {} to user {}", code, userId);
    }

    public List<VoucherTier> getAllTiers() {
        return tierRepo.findAll();
    }

    @Transactional
    public VoucherTier updateTier(Long id, VoucherTier request) {
        VoucherTier tier = tierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tier"));
        tier.setMinSpend(request.getMinSpend());
        tier.setDiscountPct(request.getDiscountPct());
        tier.setValidityDays(request.getValidityDays());
        return tierRepo.save(tier);
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void expireOutdatedVouchers() {
        int count = voucherRepo.expireByExpiresAtBefore(LocalDateTime.now());
        log.info("Auto-expired {} vouchers", count);
    }
}