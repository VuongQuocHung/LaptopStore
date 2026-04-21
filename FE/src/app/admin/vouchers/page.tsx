"use client";

import React, { useEffect, useMemo, useState } from "react";
import { voucherApi, Voucher, VoucherTier } from "@/lib/api-endpoints";
import {
  Tag, Search, Star, ChevronLeft, ChevronRight, X, Plus, Trash2,
} from "lucide-react";

const TIER_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SILVER:   { label: "Bạc",       bg: "bg-slate-100", text: "text-slate-600",  border: "border-slate-200" },
  GOLD:     { label: "Vàng",      bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-100" },
  PLATINUM: { label: "Bạch Kim",  bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100"  },
  DIAMOND:  { label: "Kim Cương", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100"},
};

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:  { label: "Hoạt động", bg: "bg-green-50",  text: "text-green-700" },
  USED:    { label: "Đã dùng",   bg: "bg-slate-100", text: "text-slate-500" },
  EXPIRED: { label: "Hết hạn",   bg: "bg-red-50",    text: "text-red-600"   },
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [tiers, setTiers] = useState<VoucherTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal cấp voucher thủ công
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantTierId, setGrantTierId] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState("");

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await voucherApi.getAllVouchers({ status: filterStatus, page, size: 10 });
      setVouchers(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error("Vouchers error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await voucherApi.getTiers();
      console.log("Tiers response:", res);
      setTiers(res);
    } catch (err) {
      console.error("Tiers error:", err);
    }
  };

  useEffect(() => { fetchVouchers(); }, [page, filterStatus]);
  useEffect(() => { fetchTiers(); }, []);

  const handleRevoke = async (id: number) => {
    if (!confirm("Thu hồi voucher này?")) return;
    try {
      await voucherApi.revokeVoucher(id);
      fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa voucher này?")) return;
    try {
      await voucherApi.deleteVoucher(id);
      fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGrant = async () => {
    if (!grantUserId || !grantTierId) {
      setGrantError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setGrantLoading(true);
    setGrantError("");
    try {
      await voucherApi.grantManual({
        userId: Number(grantUserId),
        tierId: Number(grantTierId),
      });
      setShowGrantModal(false);
      setGrantUserId("");
      setGrantTierId("");
      fetchVouchers();
    } catch (err: any) {
      setGrantError(err?.message || "Có lỗi xảy ra");
    } finally {
      setGrantLoading(false);
    }
  };

  const filtered = vouchers.filter((v) => {
    const keyword = searchTerm.toLowerCase();
    return (
      v.code.toLowerCase().includes(keyword)
      || (v.userFullName || "").toLowerCase().includes(keyword)
      || (v.userEmail || "").toLowerCase().includes(keyword)
    );
  });

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "₫";

  const uniqueTiers = useMemo(() => {
    const byName = new Map<string, VoucherTier>();

    for (const tier of tiers) {
      const key = (tier.name || "").toUpperCase();
      const current = byName.get(key);

      // Keep the most up-to-date tier config for each name.
      if (!current || tier.minSpend > current.minSpend || (tier.minSpend === current.minSpend && tier.id > current.id)) {
        byName.set(key, { ...tier, name: key });
      }
    }

    return Array.from(byName.values()).sort((a, b) => a.minSpend - b.minSpend);
  }, [tiers]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Quản lý voucher</h1>
          <p className="text-slate-500 mt-2 font-medium">Voucher tự động cấp theo mức chi tiêu tích lũy.</p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl transition text-sm uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Cấp voucher thủ công
        </button>
      </div>

      {/* Modal cấp voucher */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Cấp voucher thủ công</h2>
              <button onClick={() => setShowGrantModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  ID người dùng
                </label>
                <input
                  type="number"
                  placeholder="Nhập ID user..."
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Hạng voucher
                </label>
                <select
                  value={grantTierId}
                  onChange={(e) => setGrantTierId(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-400"
                >
                  <option value="">Chọn hạng...</option>
                  {uniqueTiers.map(t => (
                    <option key={t.id} value={t.id}>
                      {TIER_STYLES[t.name]?.label || t.name} — giảm {t.discountPct}%
                    </option>
                  ))}
                </select>
              </div>

              {grantError && (
                <p className="text-red-500 text-sm font-medium">{grantError}</p>
              )}

              <button
                onClick={handleGrant}
                disabled={grantLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition text-sm uppercase tracking-wider"
              >
                {grantLoading ? "Đang cấp..." : "Cấp voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {uniqueTiers.length === 0
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-16 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-12 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
            ))
          : uniqueTiers.map((tier) => {
              const s = TIER_STYLES[tier.name] || TIER_STYLES.SILVER;
              return (
                <div key={tier.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className={`w-4 h-4 ${s.text}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{tier.discountPct}%</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Chi tiêu ≥ {formatMoney(tier.minSpend)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hiệu lực {tier.validityDays} ngày
                  </p>
                </div>
              );
            })}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex items-center shadow-sm min-w-48">
          <Search className="ml-4 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, họ tên hoặc email..."
            className="flex-1 px-3 py-3 outline-none font-medium text-slate-600 bg-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 outline-none shadow-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="USED">Đã dùng</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Voucher</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giảm giá</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày cấp</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạn dùng</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-xl w-36" /></td>
                    <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-xl w-52" /></td>
                    <td className="px-6 py-6"><div className="h-6 bg-slate-100 rounded-lg w-20" /></td>
                    <td className="px-6 py-6"><div className="h-6 bg-slate-100 rounded-lg w-12" /></td>
                    <td className="px-6 py-6"><div className="h-6 bg-slate-100 rounded-lg w-24" /></td>
                    <td className="px-6 py-6"><div className="h-6 bg-slate-100 rounded-lg w-24" /></td>
                    <td className="px-6 py-6"><div className="h-6 bg-slate-100 rounded-lg w-20" /></td>
                    <td className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-xl ml-auto w-16" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Không có voucher nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const tier = TIER_STYLES[v.tierName] || TIER_STYLES.SILVER;
                  const status = STATUS_STYLES[v.status] || STATUS_STYLES.ACTIVE;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
                          {v.code}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="min-w-0 max-w-[260px]">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {v.userFullName || "Chưa có tên"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {v.userEmail || "Không có email"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${tier.bg} ${tier.text} ${tier.border}`}>
                          <Star className="w-3 h-3" />
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-blue-600 font-black text-sm">{v.discountPct}%</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                        {new Date(v.issuedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                        {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-1">
                        {v.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevoke(v.id)}
                            className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition"
                            title="Thu hồi"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {v.status !== "USED" && (
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">
            Trang <span className="text-slate-900">{page + 1}</span> / {totalPages || 1}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}