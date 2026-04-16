package com.ttcs.backend.service;

import com.ttcs.backend.auth.dto.ReviewResponse;
import com.ttcs.backend.entity.Review;
import com.ttcs.backend.entity.User;
import com.ttcs.backend.repository.ReviewRepository;
import com.ttcs.backend.security.SecurityUtils;
import com.ttcs.backend.specification.ReviewSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;

    public Page<ReviewResponse> getFilteredReviews(Long productId, Long userId, Integer rating, Pageable pageable) {
        Specification<Review> spec = Specification.where(ReviewSpecs.withFetchData())
                .and(ReviewSpecs.hasProductId(productId))
                .and(ReviewSpecs.hasUserId(userId))
                .and(ReviewSpecs.hasRating(rating));
        return reviewRepository.findAll(spec, pageable).map(ReviewResponse::from);
    }

    public ReviewResponse getReviewById(Long id) {
        return ReviewResponse.from(
                reviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Review not found"))
        );
    }

    public ReviewResponse createReview(Review review) {
        Long currentUserId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập"));

        User user = new User();
        user.setId(currentUserId);
        review.setUser(user);

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public ReviewResponse updateReview(Long id, Review reviewDetails) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        Long currentUserId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập"));

        if (!review.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền sửa đánh giá này");
        }

        review.setRating(reviewDetails.getRating());
        review.setComment(reviewDetails.getComment());
        return ReviewResponse.from(reviewRepository.save(review));
    }

    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!SecurityUtils.hasRole("ADMIN")) {
            Long currentUserId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập"));

            if (!review.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("Bạn không có quyền xóa đánh giá này");
            }
        }

        reviewRepository.delete(review);
    }
}