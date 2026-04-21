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
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String status;

    public static VoucherResponse from(Voucher v) {
        return VoucherResponse.builder()
            .id(v.getId())
            .code(v.getCode())
            .tierName(v.getTier().getName())
            .discountPct(v.getDiscountPct())
            .issuedAt(v.getIssuedAt())
            .expiresAt(v.getExpiresAt())
            .status(v.getStatus())
            .build();
    }
}