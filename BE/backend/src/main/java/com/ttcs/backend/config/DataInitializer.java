package com.ttcs.backend.config;

import com.ttcs.backend.entity.Role;
import com.ttcs.backend.entity.User;
import com.ttcs.backend.repository.RoleRepository;
import com.ttcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.full-name}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").build()));

        roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("CUSTOMER").build()));

        String normalizedAdminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        if (!userRepository.existsByEmail(normalizedAdminEmail)) {
            User admin = User.builder()
                    .email(normalizedAdminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .phone("0000000000")
                    .role(adminRole)
                    .build();
            userRepository.save(admin);
        }
    }
}
