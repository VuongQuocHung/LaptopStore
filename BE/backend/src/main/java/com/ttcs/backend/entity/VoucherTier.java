package com.ttcs.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "voucher_tiers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherTier {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;          // Bac, Vang, Bach Kim, Kim Cuong
    private Long minSpend;        // so tien chi tieu
    private Integer discountPct;  // % giam
    private Integer validityDays; // HSD
}