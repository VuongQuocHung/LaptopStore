"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api-endpoints";
import { type ApiError } from "@/lib/api";
import {
  Lock, CheckCircle2, ChevronRight,
  Key, ShieldCheck, AlertCircle, ArrowLeft
} from "lucide-react";

interface Props {
  onBack: () => void;
}

export function ResetPasswordForm({ onBack }: Props) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError("Vui lòng nhập token từ email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({ token: token.trim(), newPassword, confirmPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Token không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/10 border border-slate-200 w-full p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-100 ring-8 ring-green-50">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Thành công!</h1>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            Mật khẩu đã được thay đổi. Bạn có thể đăng nhập ngay bây giờ.
          </p>
        </div>
        <button
          onClick={() => router.push("/user/login")}
          className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black hover:bg-slate-900 transition shadow-2xl shadow-blue-100"
        >
          ĐĂNG NHẬP NGAY
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/10 border border-slate-200 w-full p-12 space-y-8">
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-blue-600 transition group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </button>
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
          <Key className="w-7 h-7" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Đặt lại mật khẩu</h1>
        <p className="text-slate-500 font-medium">Nhập token từ email và mật khẩu mới của bạn.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Token */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Token từ email</label>
          <div className="relative">
            <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              required
              placeholder="Dán token từ email vào đây"
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-100 transition font-bold"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Mật khẩu mới */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Mật khẩu mới</label>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-100 transition font-bold"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-100 transition font-bold"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-3xl text-sm font-bold text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-blue-100 ring-8 ring-blue-50 group disabled:opacity-70"
        >
          {isLoading ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
          {!isLoading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="flex items-center justify-center gap-3 grayscale opacity-30">
        <ShieldCheck className="w-6 h-6 text-blue-600" />
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-tight">
          Bảo mật thông tin <br /> Tuyệt đối 100%
        </p>
      </div>
    </div>
  );
}