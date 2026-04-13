package com.ttcs.backend.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Async
    public void sendResetPasswordEmail(String email, String token) {
        try {
            // Simulate time-consuming task
            Thread.sleep(2000);
            
            System.out.println("=================================================");
            System.out.println("MOCK MAIL SERVICE - SENDING EMAIL");
            System.out.println("To: " + email);
            System.out.println("Subject: Reset Password");
            System.out.println("Message: Your reset token is: " + token);
            System.out.println("This email was sent by thread: " + Thread.currentThread().getName());
            System.out.println("=================================================");
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Error while sending email: " + e.getMessage());
        }
    }
}
