"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productApi, reviewApi } from "@/lib/api-endpoints";
import { Product, Review, PageReview } from "@/types/api";
import {
  ShoppingCart, Cpu, HardDrive, Monitor, Smartphone, Box,
  ShieldCheck, Truck, Clock, ChevronRight, Star, MessageSquare, User, X
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewTotalElements, setReviewTotalElements] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");

  // Review form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const prod = await productApi.getById(Number(id));
        setProduct(prod);
        setActiveImage(prod.images?.[0]?.imageUrl || "/assets/images/loq.jpg");

        if (prod.category?.id) {
          const related = await productApi.getAll({ categoryId: prod.category.id, size: 5 });
          setRelatedProducts(related.content?.filter(p => p.id !== prod.id) || []);
        }

        await fetchReviews(Number(id), 0);
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const fetchReviews = async (productId: number, page: number) => {
    setIsReviewLoading(true);
    try {
      const data: PageReview = await reviewApi.getAll({
        productId, page, size: 5, sortBy: "createdAt", sortDir: "desc"
      });
      const content = data.content || [];
      setReviews(content);
      setReviewPage(page);
      setReviewTotalPages(data.totalPages || 0);
      setReviewTotalElements(data.totalElements || 0);

      // Check nếu user hiện tại đã review chưa (kiểm tra theo userId)
      if (user) {
        let allContent = content;
        if ((data.totalPages || 0) > 1) {
          const all: PageReview = await reviewApi.getAll({
            productId, page: 0, size: data.totalElements || 100
          });
          allContent = all.content || [];
        }
        const alreadyReviewed = allContent.some(r => r.userId === user.id || r.userFullName === user.fullName);
        setHasReviewed(alreadyReviewed);

        const avg = allContent.length > 0
          ? allContent.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) / allContent.length
          : 0;
        setAvgRating(avg);
      } else {
        if (data.totalPages === 1) {
          const avg = content.length > 0
            ? content.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) / content.length
            : 0;
          setAvgRating(avg);
        } else {
          const all: PageReview = await reviewApi.getAll({
            productId, page: 0, size: data.totalElements || 100
          });
          const allContent = all.content || [];
          const avg = allContent.length > 0
            ? allContent.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) / allContent.length
            : 0;
          setAvgRating(avg);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (selectedRating === 0) {
      setSubmitError("Vui lòng chọn số sao");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await reviewApi.create({
        product: { id: Number(id) },
        rating: selectedRating,
        comment,
      } as any);
      setShowReviewModal(false);
      setSelectedRating(0);
      setComment("");
      setHasReviewed(true);
      await fetchReviews(Number(id), 0);
    } catch (err: any) {
      setSubmitError(err?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: string = "w-4 h-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}`} />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 font-medium tracking-tight">Đang tải chi tiết sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Box className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-slate-500 mb-6">Sản phẩm có thể đã bị xóa hoặc không tồn tại.</p>
        <Link href="/product/list" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const specItems = [
    { label: "CPU", val: product.specification?.cpu, icon: <Cpu className="w-5 h-5 text-blue-600" /> },
    { label: "RAM", val: product.specification?.ram, icon: <Smartphone className="w-5 h-5 text-blue-600" /> },
    { label: "Ổ cứng", val: product.specification?.storage, icon: <HardDrive className="w-5 h-5 text-blue-600" /> },
    { label: "Màn hình", val: product.specification?.screen, icon: <Monitor className="w-5 h-5 text-blue-600" /> },
    { label: "VGA", val: product.specification?.vga, icon: <Gamepad2 className="w-5 h-5 text-blue-600" /> },
  ].filter(i => i.val);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 whitespace-nowrap overflow-x-auto pb-2 scrollbar-hide">
          <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link href="/product/list" className="hover:text-blue-600 transition">Sản phẩm</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* IMAGE SECTION */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 overflow-hidden shadow-sm group">
              <img src={resolveImageUrl(activeImage)} className="w-full h-[400px] object-contain group-hover:scale-105 transition-transform duration-500" alt={product.name} />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images?.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImage(img.imageUrl || "")}
                  className={`w-24 h-24 rounded-2xl border-2 shrink-0 transition-all overflow-hidden bg-white p-2 ${activeImage === img.imageUrl ? "border-blue-600" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                  <img src={resolveImageUrl(img.imageUrl)} className="w-full h-full object-contain" alt={`${product.name} ${idx}`} />
                </button>
              ))}
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-8">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tighter">
                <Box className="w-5 h-5 text-blue-600" />
                Mô tả sản phẩm
              </h3>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                {product.description || "Thông tin mô tả sản phẩm đang được cập nhật..."}
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Đánh giá sản phẩm
                </h3>

                {/* Nút viết đánh giá */}
                {!user ? (
                  <Link href="/auth/login"
                    className="text-sm font-bold text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition">
                    Đăng nhập để đánh giá
                  </Link>
                ) : hasReviewed ? (
                  <span className="text-sm font-bold text-slate-400 border border-slate-200 px-4 py-2 rounded-xl cursor-not-allowed">
                    Đã đánh giá
                  </span>
                ) : (
                  <button onClick={() => setShowReviewModal(true)}
                    className="text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-100">
                    Viết đánh giá
                  </button>
                )}
              </div>

              {/* Rating Summary */}
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl mb-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
                  <div className="flex items-center justify-center gap-0.5 my-2">
                    {renderStars(avgRating, "w-5 h-5")}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{reviewTotalElements} đánh giá</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct = reviewTotalElements > 0 ? (count / reviewTotalElements) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 w-4">{star}</span>
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review List */}
              {isReviewLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-5 border border-slate-100 rounded-2xl hover:border-slate-200 transition">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-bold text-slate-900 text-sm truncate">
                              {review.userFullName || "Người dùng ẩn danh"}
                            </p>
                            <span className="text-xs text-slate-400 shrink-0">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString("vi-VN") : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mb-2">
                            {renderStars(review.rating || 0)}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {reviewTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button onClick={() => fetchReviews(Number(id), reviewPage - 1)} disabled={reviewPage === 0}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Trước
                  </button>
                  <span className="text-sm text-slate-500 font-medium">{reviewPage + 1} / {reviewTotalPages}</span>
                  <button onClick={() => fetchReviews(Number(id), reviewPage + 1)} disabled={reviewPage >= reviewTotalPages - 1}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* BUY SECTION */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <span className="bg-blue-50 text-blue-600 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest mb-4 inline-block border border-blue-100">
                {product.brand?.name || "Premium Laptop"}
              </span>
              <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tighter">{product.name}</h1>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-0.5">{renderStars(avgRating)}</div>
                <span className="text-sm text-slate-400 font-medium">
                  {avgRating > 0 ? avgRating.toFixed(1) : "Chưa có"} ({reviewTotalElements} đánh giá)
                </span>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl mb-8 group overflow-hidden relative">
                <p className="text-4xl font-black text-blue-600 tracking-tighter relative z-10 transition-transform group-hover:scale-105 duration-300">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price || 0)}
                </p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full translate-x-12 translate-y-[-12px]" />
              </div>
              <div className="grid grid-cols-1 gap-3 mb-8">
                <button onClick={() => addToCart(product)}
                  className="bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 ring-4 ring-blue-50">
                  <ShoppingCart className="w-5 h-5" />
                  MUA NGAY
                </button>
                <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2">
                  Hỗ trợ trả góp 0% qua thẻ tín dụng
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>Bảo hành chính hãng 24 tháng</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <Truck className="w-5 h-5 text-blue-500" />
                  <span>Miễn phí giao hàng nội thành</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Giao hàng nhanh 2H Hà Nội & HCM</span>
                </div>
              </div>
            </div>

            {/* SPECS BOX */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200">
              <h3 className="font-black text-lg mb-6 flex items-center gap-3 tracking-tighter">
                <Box className="w-5 h-5 text-blue-500" />
                Thông số kỹ thuật
              </h3>
              <div className="space-y-4">
                {specItems.map((item, i) => (
                  <div key={i} className="flex flex-col p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition group">
                    <div className="flex items-center gap-3 mb-2">
                      {item.icon}
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed group-hover:text-white transition-colors uppercase">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Sản phẩm tương đương</h2>
              <Link href="/product/list" className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
                Xem thêm <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {relatedProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}
                  className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-square bg-slate-50 rounded-xl mb-4 overflow-hidden p-4">
                    <img src={resolveImageUrl(p.images?.[0]?.imageUrl)} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{p.name}</h3>
                  <p className="text-blue-600 font-black mt-2">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price || 0)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10">
            <button onClick={() => setShowReviewModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition">
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tighter">Viết đánh giá</h3>
            <p className="text-sm text-slate-400 mb-6 truncate">{product.name}</p>

            {/* Star selector */}
            <div className="mb-6">
              <p className="text-sm font-bold text-slate-700 mb-3">Số sao đánh giá <span className="text-red-500">*</span></p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setSelectedRating(star)}
                    className="transition-transform hover:scale-110">
                    <Star className={`w-9 h-9 transition-colors ${star <= (hoverRating || selectedRating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}`} />
                  </button>
                ))}
                {selectedRating > 0 && (
                  <span className="ml-2 text-sm font-bold text-slate-500">
                    {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][selectedRating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <p className="text-sm font-bold text-slate-700 mb-3">Nhận xét</p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                rows={4}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none transition"
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-500 font-medium mb-4">{submitError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Hủy
              </button>
              <button onClick={handleSubmitReview} disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-blue-100">
                {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Gamepad2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}