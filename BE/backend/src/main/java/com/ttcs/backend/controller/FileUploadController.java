package com.ttcs.backend.controller;

import com.ttcs.backend.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Upload API", description = "Quản lý tải tệp tin")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @Operation(summary = "Tải lên hình ảnh", description = "Tải một tệp tin hình ảnh lên máy chủ và nhận lại URL truy cập")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String fileName = fileStorageService.storeFile(file);

        // Construct the full URL
        // In a real scenario, this should be configurable
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        String fileUrl = baseUrl + "/uploads/" + fileName;

        return ResponseEntity.ok(Map.of(
                "fileName", fileName,
                "url", fileUrl,
                "imageUrl", fileUrl // For compatibility with frontend expectations if needed
        ));
    }
}
