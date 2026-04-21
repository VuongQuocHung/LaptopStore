package com.ttcs.backend.dto.request;

import lombok.Data;

@Data
public class GrantVoucherRequest {
    private Long userId;
    private Long tierId;
}