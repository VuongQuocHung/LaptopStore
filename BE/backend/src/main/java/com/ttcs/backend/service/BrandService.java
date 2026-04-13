package com.ttcs.backend.service;

import com.ttcs.backend.entity.Brand;
import com.ttcs.backend.repository.BrandRepository;
import com.ttcs.backend.specification.BrandSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandService {
    private final BrandRepository brandRepository;

    public List<Brand> getAllBrands() {
        return brandRepository.findAll();
    }

    public Page<Brand> getFilteredBrands(String name, Pageable pageable) {
        Specification<Brand> spec = Specification.where(BrandSpecs.hasName(name));
        return brandRepository.findAll(spec, pageable);
    }

    public Brand getBrandById(Long id) {
        return brandRepository.findById(id).orElseThrow(() -> new RuntimeException("Brand not found"));
    }

    public Brand createBrand(Brand brand) {
        return brandRepository.save(brand);
    }

    public Brand updateBrand(Long id, Brand brandDetails) {
        Brand brand = getBrandById(id);
        brand.setName(brandDetails.getName());
        brand.setLogoUrl(brandDetails.getLogoUrl());
        return brandRepository.save(brand);
    }

    public void deleteBrand(Long id) {
        Brand brand = getBrandById(id);
        brandRepository.delete(brand);
    }
}
