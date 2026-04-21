package com.ttcs.backend.dto.response;

import com.ttcs.backend.entity.Voucher;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class VoucherResponse {
    private Long id;
    private String code;
    private String tierName;
    private Integer discountPct;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String status;

    public static VoucherResponse from(Voucher v) {
        return VoucherResponse.builder()
            .id(v.getId())
            .code(v.getCode())
            .tierName(v.getTier().getName())
            .discountPct(v.getDiscountPct())
            .userId(v.getUser() != null ? v.getUser().getId() : null)
            .userEmail(v.getUser() != null ? v.getUser().getEmail() : null)
            .userFullName(v.getUser() != null ? v.getUser().getFullName() : null)
            .issuedAt(v.getIssuedAt())
            .expiresAt(v.getExpiresAt())
            .status(v.getStatus())
            .build();
    }
}