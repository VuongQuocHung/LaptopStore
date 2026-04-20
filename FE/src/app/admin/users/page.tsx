"use client";

import React, { useEffect, useState } from "react";
import { roleApi, userApi } from "@/lib/api-endpoints";
import { Role, User } from "@/types/api";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X
} from "lucide-react";
import { ApiError } from "@/lib/api";

type FormMode = "create" | "edit";

type UserFormData = {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  roleId: string;
  enabled: "0" | "1";
};

const initialFormData: UserFormData = {
  email: "",
  fullName: "",
  phone: "",
  password: "",
  roleId: "",
  enabled: "0",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);

  const normalizeRoleLabel = (roleName?: string) => {
    const role = (roleName || "").toUpperCase();
    if (role === "ADMIN" || role === "ROLE_ADMIN") return "Quản trị";
    if (role === "CUSTOMER" || role === "ROLE_CUSTOMER") return "Khách hàng";
    return roleName || "Không rõ";
  };

  const isAdminRole = (roleName?: string) => {
    const role = (roleName || "").toUpperCase();
    return role === "ADMIN" || role === "ROLE_ADMIN";
  };

  const openCreateModal = () => {
    setFormMode("create");
    setEditingUserId(null);
    setFormData(initialFormData);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormMode("edit");
    setEditingUserId(user.id ?? null);
    setFormData({
      email: user.email || "",
      fullName: user.fullName || "",
      phone: user.phone || "",
      password: "",
      roleId: user.role?.id ? String(user.role.id) : "",
      enabled: user.enabled ? "1" : "0",
    });
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
    setFormData(initialFormData);
    setIsSubmitting(false);
  };

  const parseApiError = (err: unknown, fallback: string) => {
    const apiErr = err as ApiError;
    return apiErr?.message || fallback;
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getAll({ 
        page, 
        size: 10, 
        fullName: searchTerm || undefined 
      });
      setUsers(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      setError(parseApiError(err, "Không thể tải danh sách người dùng"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await roleApi.getAll();
      setRoles(res || []);
    } catch (err) {
      setError(parseApiError(err, "Không thể tải danh sách vai trò"));
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const email = formData.email.trim();
    const fullName = formData.fullName.trim();
    const phone = formData.phone.trim();
    const password = formData.password;
    const roleIdNum = Number(formData.roleId);
    const enabledValue = Number(formData.enabled);

    if (!email || !fullName || !phone || !formData.roleId) {
      setError("Vui lòng nhập đầy đủ email, họ tên, số điện thoại và vai trò");
      return;
    }

    if (formMode === "create" && !password.trim()) {
      setError("Vui lòng nhập mật khẩu khi tạo người dùng mới");
      return;
    }

    if (!Number.isInteger(roleIdNum) || roleIdNum <= 0) {
      setError("Vai trò không hợp lệ");
      return;
    }

    if (enabledValue !== 0 && enabledValue !== 1) {
      setError("Trạng thái enabled chỉ chấp nhận 0 hoặc 1");
      return;
    }

    const selectedRole = roles.find((r) => r.id === roleIdNum);
    if (!selectedRole) {
      setError("Không tìm thấy vai trò đã chọn");
      return;
    }

    const payload: User = {
      email,
      fullName,
      phone,
      enabled: enabledValue === 1,
      role: {
        id: selectedRole.id,
        name: selectedRole.name,
      },
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    setIsSubmitting(true);
    try {
      if (formMode === "create") {
        await userApi.create(payload);
        setSuccess("Đã thêm người dùng thành công");
      } else {
        if (!editingUserId) {
          setError("Không xác định được người dùng cần cập nhật");
          return;
        }
        await userApi.update(editingUserId, payload);
        setSuccess("Đã cập nhật người dùng thành công");
      }

      closeModal();
      await fetchUsers();
    } catch (err) {
      setError(parseApiError(err, "Không thể lưu người dùng"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!user.id) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.email}?`);
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    try {
      await userApi.delete(user.id);
      setSuccess("Đã xóa người dùng thành công");
      await fetchUsers();
    } catch (err) {
      setError(parseApiError(err, "Không thể xóa người dùng"));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Quản lý người dùng</h1>
          <p className="text-slate-500 mt-2 font-medium">Xem danh sách khách hàng và thành viên quản trị.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-blue-600 transition"
        >
          <Plus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-2xl px-4 py-3 text-sm font-semibold">
          {success}
        </div>
      ) : null}

      <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center shadow-sm">
        <Search className="ml-4 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên người dùng..." 
          className="flex-1 px-4 py-3 outline-none font-medium text-slate-600 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enabled</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="h-12 bg-slate-100 rounded-2xl w-48" /></td>
                    <td className="px-6 py-6"><div className="h-12 bg-slate-100 rounded-xl w-32" /></td>
                    <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-lg w-20" /></td>
                    <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-lg w-16" /></td>
                    <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-lg w-24" /></td>
                    <td className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl ml-auto w-10" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Không tìm thấy người dùng nào</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                          {u.fullName?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1 uppercase font-black tracking-widest">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="font-medium">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-medium">{u.phone || "---"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        isAdminRole(u.role?.name)
                          ? "bg-purple-50 text-purple-700 border-purple-100" 
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        <Shield className="w-3 h-3" />
                        {normalizeRoleLabel(u.role?.name)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        u.enabled
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {u.enabled ? "1" : "0"}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "---"}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition"
                          title="Sửa người dùng"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400 tracking-tight">
            Trang <span className="text-slate-900">{page + 1}</span> / {totalPages}
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tighter text-slate-900">
                {formMode === "create" ? "Thêm người dùng" : "Cập nhật người dùng"}
              </h2>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Họ và tên</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleFormChange("fullName", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="0900000000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  {formMode === "create" ? "Mật khẩu" : "Mật khẩu mới (không bắt buộc)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder={formMode === "create" ? "Nhập mật khẩu" : "Để trống nếu không đổi mật khẩu"}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Vai trò</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => handleFormChange("roleId", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                  required
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {normalizeRoleLabel(role.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Enabled</label>
                <select
                  value={formData.enabled}
                  onChange={(e) => handleFormChange("enabled", e.target.value as "0" | "1")}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                  required
                >
                  <option value="0">0 - Tắt</option>
                  <option value="1">1 - Bật</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-blue-600 disabled:opacity-60 transition"
                >
                  {isSubmitting ? "Đang lưu..." : formMode === "create" ? "Thêm" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
