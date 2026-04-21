package com.ttcs.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplyVoucherResult {
    private Long voucherId;
    private String code;
    private Integer discountPct;
    private Long discountAmount;
    private Long finalAmount;
}