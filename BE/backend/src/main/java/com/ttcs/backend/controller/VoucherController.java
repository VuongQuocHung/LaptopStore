package com.ttcs.backend.controller;

import com.ttcs.backend.security.SecurityUtils;
import com.ttcs.backend.dto.request.ApplyVoucherRequest;
import com.ttcs.backend.dto.request.GrantVoucherRequest;
import com.ttcs.backend.dto.response.ApplyVoucherResult;
import com.ttcs.backend.dto.response.VoucherResponse;
import com.ttcs.backend.entity.VoucherTier;
import com.ttcs.backend.service.VoucherService;
import com.ttcs.backend.service.VoucherTierService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final VoucherTierService voucherTierService;

    // CUSTOMER

    @GetMapping("/api/vouchers/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<VoucherResponse>> getMyVouchers(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(voucherService.getMyVouchers(userId));
    }

    @PostMapping("/api/vouchers/apply")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApplyVoucherResult> applyVoucher(
            @RequestBody ApplyVoucherRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(voucherService.applyVoucher(req.getCode(), userId, req.getOrderAmount()));
    }

    // ADMIN

    @GetMapping("/api/admin/vouchers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<VoucherResponse>> getAllVouchers(
            @RequestParam(defaultValue = "") String status,
            Pageable pageable) {
        return ResponseEntity.ok(voucherService.getAllVouchers(status, pageable));
    }

    @GetMapping("/api/admin/vouchers/tiers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VoucherTier>> getTiers() {
        return ResponseEntity.ok(voucherTierService.getAllTiers());
    }

    @PutMapping("/api/admin/vouchers/tiers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoucherTier> updateTier(
            @PathVariable Long id,
            @RequestBody VoucherTier request) {
        return ResponseEntity.ok(voucherTierService.updateTier(id, request));
    }

    @PostMapping("/api/admin/vouchers/grant")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoucherResponse> grantManual(
            @RequestBody GrantVoucherRequest req) {
        return ResponseEntity.ok(voucherService.grantManual(req));
    }

    @PatchMapping("/api/admin/vouchers/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> revokeVoucher(@PathVariable Long id) {
        voucherService.revokeVoucher(id);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(UserDetails userDetails) {
        return SecurityUtils.getCurrentUserId()
            .orElseThrow(() -> new RuntimeException("Vui lòng đăng nhập"));
    }

    @DeleteMapping("/api/admin/vouchers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }
}