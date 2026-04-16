package com.ttcs.backend.controller;

import com.ttcs.backend.auth.dto.ReviewResponse;
import com.ttcs.backend.entity.Review;
import com.ttcs.backend.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Review API", description = "Quản lý đánh giá sản phẩm (Review)")
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "Lấy danh sách đánh giá")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(reviewService.getFilteredReviews(productId, userId, rating, pageable));
    }

    @PostMapping
    @Operation(summary = "Tạo mới đánh giá")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public ResponseEntity<ReviewResponse> createReview(@RequestBody Review review) {
        return ResponseEntity.ok(reviewService.createReview(review));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy đánh giá theo ID")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật đánh giá")
    @ApiResponse(responseCode = "200", description = "Thành công")
    public ResponseEntity<ReviewResponse> updateReview(@PathVariable Long id, @RequestBody Review review) {
        return ResponseEntity.ok(reviewService.updateReview(id, review));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa đánh giá")
    @ApiResponse(responseCode = "204", description = "Xóa thành công")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}