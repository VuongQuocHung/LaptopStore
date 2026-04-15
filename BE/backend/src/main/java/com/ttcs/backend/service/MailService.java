package com.ttcs.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendVerificationEmail(String email, String token) {
        try {
            String verifyLink = "http://localhost:8080/api/auth/verify-email?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Xác nhận tài khoản Laptop Shop");
            helper.setText("""
                    <h2>Xác nhận tài khoản của bạn</h2>
                    <p>Cảm ơn bạn đã đăng ký! Vui lòng click vào link bên dưới để kích hoạt tài khoản:</p>
                    <a href="%s">Xác nhận tài khoản</a>
                    <p>Link có hiệu lực trong 24 giờ.</p>
                    <p>Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>
                    """.formatted(verifyLink), true);

            mailSender.send(message);
            System.out.println("Verification email sent to: " + email);

        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
        }
    }

    @Async
    public void sendResetPasswordEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Đặt lại mật khẩu Laptop Shop");
            helper.setText("""
                    <h2>Đặt lại mật khẩu</h2>
                    <p>Token của bạn: <strong>%s</strong></p>
                    <p>Token có hiệu lực trong 15 phút.</p>
                    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                    """.formatted(token), true);

            mailSender.send(message);
            System.out.println("Reset password email sent to: " + email);

        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
        }
    }
}