package com.ttcs.backend.dto.request;

import lombok.Data;

@Data
public class ApplyVoucherRequest {
    private String code;
    private Long orderAmount;
}