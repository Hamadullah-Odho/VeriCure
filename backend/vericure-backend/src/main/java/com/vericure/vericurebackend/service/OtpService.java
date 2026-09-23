package com.vericure.vericurebackend.service;

import com.vericure.vericurebackend.entity.OtpVerification;
import com.vericure.vericurebackend.repository.OtpVerificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;

    public OtpService(
            OtpVerificationRepository otpRepository,
            EmailService emailService
    ) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    // =========================================================
    // GENERATE + SEND OTP
    // =========================================================

    public void generateAndSendOtp(String email) {

        String normalizedEmail =
                email.trim().toLowerCase();

        // Delete old OTP
        otpRepository.deleteByEmail(normalizedEmail);

        // Generate 4 digit OTP
        String otp =
                String.format(
                        "%04d",
                        new Random().nextInt(10000)
                );

        System.out.println("====================================");
        System.out.println("GENERATING OTP");
        System.out.println("Email: " + normalizedEmail);
        System.out.println("OTP: " + otp);

        // Create OTP entity
        OtpVerification otpVerification =
                new OtpVerification();

        otpVerification.setEmail(normalizedEmail);
        otpVerification.setOtp(otp);

        otpVerification.setExpiryTime(
                LocalDateTime.now().plusMinutes(5)
        );

        otpVerification.setVerified(false);

        // Save
        otpRepository.save(otpVerification);

        System.out.println("OTP saved to database");

        // Send email (styled HTML template, matches app branding)
        emailService.sendOtpEmail(
                normalizedEmail,
                otp
        );

        System.out.println(
                "OTP email sent successfully"
        );

        System.out.println("====================================");
    }


    // =========================================================
    // VERIFY OTP
    // =========================================================

    @Transactional
    public boolean verifyOtp(
            String email,
            String otp
    ) {

        if (email == null || otp == null) {
            return false;
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        String normalizedOtp =
                otp.trim();

        if (normalizedEmail.isEmpty()
                || normalizedOtp.isEmpty()) {

            return false;
        }

        // Find EXACT email + OTP
        Optional<OtpVerification> optionalOtp =
                otpRepository.findByEmailAndOtp(
                        normalizedEmail,
                        normalizedOtp
                );

        if (optionalOtp.isEmpty()) {

            System.out.println(
                    "OTP NOT FOUND"
            );

            return false;
        }

        OtpVerification otpVerification =
                optionalOtp.get();

        // Check expiry
        if (LocalDateTime.now().isAfter(
                otpVerification.getExpiryTime()
        )) {

            System.out.println(
                    "OTP EXPIRED"
            );

            return false;
        }

        // Mark verified with a forced UPDATE (guaranteed to persist,
        // instead of relying on save()-after-find dirty-checking).
        int rowsUpdated =
                otpRepository.markAsVerified(
                        normalizedEmail,
                        normalizedOtp
                );

        if (rowsUpdated == 0) {

            System.out.println(
                    "OTP VERIFY UPDATE AFFECTED 0 ROWS"
            );

            return false;
        }

        System.out.println(
                "OTP VERIFIED SUCCESSFULLY (rows updated: "
                        + rowsUpdated + ")"
        );

        return true;
    }


    // =========================================================
    // CHECK WHETHER EXACT OTP WAS VERIFIED
    // =========================================================

    @Transactional(readOnly = true)
    public boolean isOtpVerified(
            String email,
            String otp
    ) {

        if (email == null || otp == null) {
            return false;
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        String normalizedOtp =
                otp.trim();

        Optional<OtpVerification> optionalOtp =
                otpRepository.findByEmailAndOtp(
                        normalizedEmail,
                        normalizedOtp
                );

        if (optionalOtp.isEmpty()) {

            System.out.println(
                    "RESET CHECK: OTP NOT FOUND"
            );

            return false;
        }

        OtpVerification otpVerification =
                optionalOtp.get();

        System.out.println(
                "RESET CHECK - Email: "
                        + normalizedEmail
        );

        System.out.println(
                "RESET CHECK - OTP: "
                        + normalizedOtp
        );

        System.out.println(
                "RESET CHECK - Verified: "
                        + otpVerification.isVerified()
        );

        // Must have been verified
        if (!otpVerification.isVerified()) {

            System.out.println(
                    "RESET CHECK: OTP WAS NOT VERIFIED"
            );

            return false;
        }

        // Must not be expired
        if (LocalDateTime.now().isAfter(
                otpVerification.getExpiryTime()
        )) {

            System.out.println(
                    "RESET CHECK: OTP EXPIRED"
            );

            return false;
        }

        System.out.println(
                "RESET CHECK: OTP VERIFIED"
        );

        return true;
    }


    // =========================================================
    // DELETE OTP
    // =========================================================

    public void deleteOtp(String email) {

        if (email == null) {
            return;
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        otpRepository.deleteByEmail(
                normalizedEmail
        );

        System.out.println(
                "OTP deleted for: "
                        + normalizedEmail
        );
    }
}