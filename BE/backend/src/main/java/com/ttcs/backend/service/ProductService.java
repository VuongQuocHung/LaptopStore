package com.ttcs.backend.service;

import com.ttcs.backend.entity.Product;
import com.ttcs.backend.entity.ProductImage;
import com.ttcs.backend.entity.ProductSpecification;
import com.ttcs.backend.repository.ProductRepository;
import com.ttcs.backend.specification.ProductSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll(ProductSpecs.withFetchSpecs());
    }

    public Page<Product> getFilteredProducts(
            String name, Long brandId, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
            List<String> cpu, List<String> ram, List<String> storage, List<String> vga, List<String> screen,
            Pageable pageable) {

        Specification<Product> spec = Specification.where(ProductSpecs.withFetchSpecs())
                .and(ProductSpecs.hasName(name))
                .and(ProductSpecs.hasBrand(brandId))
                .and(ProductSpecs.hasCategory(categoryId))
                .and(ProductSpecs.priceBetween(minPrice, maxPrice))
                .and(ProductSpecs.hasCpu(cpu))
                .and(ProductSpecs.hasRam(ram))
                .and(ProductSpecs.hasStorage(storage))
                .and(ProductSpecs.hasVga(vga))
                .and(ProductSpecs.hasScreen(screen));

        return productRepository.findAll(spec, pageable);
    }

    public Product getProductById(Long id) {
        return productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product createProduct(Product product) {
        bindChildReferences(product);
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setImportPrice(productDetails.getImportPrice());
        product.setStock(productDetails.getStock());
        product.setDescription(productDetails.getDescription());
        product.setBrand(productDetails.getBrand());
        product.setCategory(productDetails.getCategory());
        product.setImages(productDetails.getImages());

        mergeSpecification(product, productDetails.getSpecification());

        bindChildReferences(product);
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    private void bindChildReferences(Product product) {
        if (product.getSpecification() != null) {
            product.getSpecification().setProduct(product);
        }

        if (product.getImages() == null) {
            return;
        }

        List<ProductImage> normalizedImages = new ArrayList<>();
        for (ProductImage image : product.getImages()) {
            if (image == null) {
                continue;
            }
            if (image.getImageUrl() == null || image.getImageUrl().isBlank()) {
                continue;
            }
            image.setProduct(product);
            normalizedImages.add(image);
        }

        product.setImages(normalizedImages);
    }

    // Để tránh việc tạo mới một ProductSpecification khi cập nhật sản phẩm, chúng ta sẽ merge dữ liệu vào thực thể đã tồn tại nếu có.
    private void mergeSpecification(Product product, ProductSpecification incomingSpec) {
        if (incomingSpec == null) {
            product.setSpecification(null);
            return;
        }

        ProductSpecification currentSpec = product.getSpecification();
        if (currentSpec == null) {
            currentSpec = new ProductSpecification();
        }

        // Chỉ cập nhật các trường thông số kỹ thuật, không thay đổi liên kết với Product
        currentSpec.setCpu(incomingSpec.getCpu());
        currentSpec.setRam(incomingSpec.getRam());
        currentSpec.setStorage(incomingSpec.getStorage());
        currentSpec.setVga(incomingSpec.getVga());
        currentSpec.setScreen(incomingSpec.getScreen());
        currentSpec.setOs(incomingSpec.getOs());
        currentSpec.setBattery(incomingSpec.getBattery());
        currentSpec.setWeight(incomingSpec.getWeight());

        product.setSpecification(currentSpec);
    }
}
