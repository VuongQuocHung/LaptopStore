package com.ttcs.backend.service;

import com.ttcs.backend.dto.request.GrantVoucherRequest;
import com.ttcs.backend.dto.response.ApplyVoucherResult;
import com.ttcs.backend.dto.response.VoucherResponse;
import com.ttcs.backend.entity.Voucher;
import com.ttcs.backend.entity.VoucherTier;
import com.ttcs.backend.repository.OrderRepository;
import com.ttcs.backend.repository.UserRepository;
import com.ttcs.backend.repository.VoucherRepository;
import com.ttcs.backend.repository.VoucherTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepo;
    private final VoucherTierRepository tierRepo;
    private final UserRepository userRepo;
    private final OrderRepository orderRepo;

    @Transactional(readOnly = true)
    public List<VoucherResponse> getMyVouchers(Long userId) {
        return voucherRepo.findByUserIdOrderByIssuedAtDesc(userId)
            .stream()
            .map(VoucherResponse::from)
            .toList();
    }

    public ApplyVoucherResult applyVoucher(String code, Long userId, Long orderAmount) {
        Voucher v = voucherRepo.findByCode(code)
            .orElseThrow(() -> new RuntimeException("Mã voucher không tồn tại"));

        if (!v.getUser().getId().equals(userId))
            throw new RuntimeException("Voucher không thuộc tài khoản này");
        if (!"ACTIVE".equals(v.getStatus()))
            throw new RuntimeException("Voucher đã được sử dụng hoặc hết hạn");
        if (v.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new RuntimeException("Voucher đã hết hạn");

        long discount = orderAmount * v.getDiscountPct() / 100;
        if (v.getMaxDiscount() != null)
            discount = Math.min(discount, v.getMaxDiscount());

        return ApplyVoucherResult.builder()
            .voucherId(v.getId())
            .code(code)
            .discountPct(v.getDiscountPct())
            .discountAmount(discount)
            .finalAmount(orderAmount - discount)
            .build();
    }

    @Transactional
    public void markVoucherUsed(Long voucherId, Long orderId) {
        Voucher v = voucherRepo.findById(voucherId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
        v.setStatus("USED");
        v.setUsedAt(LocalDateTime.now());
        v.setUsedOnOrder(orderRepo.getReferenceById(orderId));
        voucherRepo.save(v);
    }

    @Transactional(readOnly = true)
    public Page<VoucherResponse> getAllVouchers(String status, Pageable pageable) {
        return voucherRepo.findByStatusContainingIgnoreCase(status, pageable)
            .map(VoucherResponse::from);
    }

    @Transactional
    public void revokeVoucher(Long voucherId) {
        Voucher v = voucherRepo.findById(voucherId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
        if ("USED".equals(v.getStatus()))
            throw new RuntimeException("Không thể thu hồi voucher đã sử dụng");
        v.setStatus("EXPIRED");
        voucherRepo.save(v);
    }

    @Transactional
    public VoucherResponse grantManual(GrantVoucherRequest req) {
        VoucherTier tier = tierRepo.findById(req.getTierId())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tier"));

        String prefix = tier.getName().substring(0, 4).toUpperCase();
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Voucher voucher = Voucher.builder()
            .code("VPH-" + prefix + "-" + suffix)
            .user(userRepo.getReferenceById(req.getUserId()))
            .tier(tier)
            .discountPct(tier.getDiscountPct())
            .issuedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(tier.getValidityDays()))
            .status("ACTIVE")
            .build();

        return VoucherResponse.from(voucherRepo.save(voucher));
    }

    @Transactional
    public void deleteVoucher(Long voucherId) {
        Voucher v = voucherRepo.findById(voucherId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
        if ("USED".equals(v.getStatus()))
            throw new RuntimeException("Không thể xóa voucher đã sử dụng");
        voucherRepo.delete(v);
    }
}