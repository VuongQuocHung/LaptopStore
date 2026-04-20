"use client";

import React, { useEffect, useState } from "react";
import { voucherApi, Voucher } from "@/lib/api-endpoints";
import { Tag, Copy, Check, Clock } from "lucide-react";

const TIER_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SILVER:   { label: "Bạc",      bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200" },
  GOLD:     { label: "Vàng",     bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  PLATINUM: { label: "Bạch Kim", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"  },
  DIAMOND:  { label: "Kim Cương",bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200"},
};

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:  { label: "Có thể dùng", bg: "bg-green-50",  text: "text-green-700" },
  USED:    { label: "Đã sử dụng",  bg: "bg-slate-100", text: "text-slate-500" },
  EXPIRED: { label: "Hết hạn",     bg: "bg-red-50",    text: "text-red-500"   },
};

export default function MyVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    voucherApi.getMyVouchers()
      .then(setVouchers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Voucher của tôi</h1>
        <p className="text-slate-500 mt-1 font-medium">Voucher được cấp dựa trên mức chi tiêu tích lũy.</p>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse">
            <div className="h-5 bg-slate-100 rounded w-24 mb-4" />
            <div className="h-8 bg-slate-100 rounded w-36 mb-3" />
            <div className="h-4 bg-slate-100 rounded w-48" />
          </div>
        ))
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
          <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-bold text-slate-400">Bạn chưa có voucher nào</p>
          <p className="text-sm text-slate-400 mt-1">Mua sắm nhiều hơn để nhận voucher ưu đãi!</p>
        </div>
      ) : (
        vouchers.map((v) => {
          const tier = TIER_STYLES[v.tierName] || TIER_STYLES.SILVER;
          const status = STATUS_STYLES[v.status];
          const daysLeft = getDaysLeft(v.expiresAt);
          const isActive = v.status === "ACTIVE";

          return (
            <div
              key={v.id}
              className={`bg-white rounded-3xl border-2 p-6 transition ${
                isActive ? tier.border : "border-slate-100 opacity-60"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${tier.bg} ${tier.text}`}>
                  Hạng {tier.label}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>

              {/* Discount */}
              <p className={`text-5xl font-black mb-1 ${isActive ? tier.text : "text-slate-300"}`}>
                -{v.discountPct}%
              </p>
              <p className="text-sm text-slate-400 font-medium mb-4">
                Giảm {v.discountPct}% cho đơn hàng tiếp theo
              </p>

              {/* Code */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 font-mono font-bold text-slate-700 text-sm tracking-widest border border-slate-100">
                  {v.code}
                </div>
                {isActive && (
                  <button
                    onClick={() => handleCopy(v.id, v.code)}
                    className={`p-3 rounded-2xl border transition font-medium text-sm flex items-center gap-2 ${
                      copiedId === v.id
                        ? "bg-green-50 border-green-200 text-green-600"
                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {copiedId === v.id
                      ? <><Check className="w-4 h-4" /> Đã copy</>
                      : <><Copy className="w-4 h-4" /> Copy</>
                    }
                  </button>
                )}
              </div>

              {/* Expiry */}
              {isActive && (
                <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {daysLeft > 0
                    ? `Còn ${daysLeft} ngày — hết hạn ${new Date(v.expiresAt).toLocaleDateString("vi-VN")}`
                    : "Hết hạn hôm nay!"
                  }
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}