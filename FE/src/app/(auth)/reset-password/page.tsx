"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Key, ChevronRight, Mail } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] -ml-96 -mb-96" />

      <div className="relative z-10 w-full flex flex-col items-center max-w-xl">
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-slate-400 font-bold text-sm mb-10 hover:text-blue-600 transition group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </Link>

        {!showForm ? (
          // --- Màn thông báo ---
          <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/10 border border-slate-200 w-full p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Kiểm tra email!</h1>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                Chúng tôi đã gửi token đặt lại mật khẩu vào email của bạn. Hãy copy token đó và bấm nút bên dưới để tiếp tục.
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-2 hover:bg-slate-900 transition shadow-2xl shadow-blue-100"
            >
              NHẬP TOKEN & ĐẶT LẠI MẬT KHẨU
              <ChevronRight className="w-5 h-5" />
            </button>

            <Link
              href="/forgot-password"
              className="block text-sm text-slate-400 font-bold hover:text-blue-600 transition"
            >
              Chưa nhận được email? Gửi lại
            </Link>
          </div>
        ) : (
          // --- Form 3 ô input ---
          <ResetPasswordFormInline onBack={() => setShowForm(false)} />
        )}

        <p className="mt-10 text-center text-slate-400 font-bold text-sm">
          © 2026 VPH STORE - Secure Authentication
        </p>
      </div>
    </div>
  );
}

// Import inline để tránh Suspense phức tạp
import { ResetPasswordForm as ResetPasswordFormInline } from "./ResetPasswordForm";