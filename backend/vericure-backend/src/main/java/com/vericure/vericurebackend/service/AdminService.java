package com.vericure.vericurebackend.service;

import com.vericure.vericurebackend.entity.Admin;
import com.vericure.vericurebackend.repository.AdminRepository;
import com.vericure.vericurebackend.util.AdminJwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final AdminJwtUtil adminJwtUtil;
    private final OtpService otpService;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AdminService(
            AdminRepository adminRepository,
            AdminJwtUtil adminJwtUtil,
            OtpService otpService
    ) {
        this.adminRepository = adminRepository;
        this.adminJwtUtil = adminJwtUtil;
        this.otpService = otpService;
    }


    // =========================================================
    // BOOTSTRAP — creates the very first HEAD_ADMIN.
    // Only works while the admins table is completely empty,
    // so it can never be used to smuggle in a second head admin
    // or bypass the approval workflow later.
    // =========================================================

    public Map<String, Object> sendBootstrapOtp(
            String name,
            String email
    ) {

        if (adminRepository.count() > 0) {
            return Map.of(
                    "success", false,
                    "message",
                    "Setup already complete — an admin account already exists. Use the signup flow instead."
            );
        }

        if (
                name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty()
        ) {
            return Map.of(
                    "success", false,
                    "message",
                    "Name and email are required."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        if (!isValidEmailFormat(normalizedEmail)) {
            return Map.of(
                    "success", false,
                    "message",
                    "Please enter a valid email address."
            );
        }

        otpService.generateAndSendOtp(normalizedEmail);

        return Map.of(
                "success", true,
                "message",
                "A verification code has been sent to your email."
        );
    }

    public Map<String, Object> verifyBootstrap(
            String name,
            String email,
            String password,
            String otp
    ) {

        // Re-checked here too (not just in sendBootstrapOtp) —
        // this is the call that actually creates the row, so
        // it's the one that must never allow a second head
        // admin through, including a race between two people
        // both completing setup at nearly the same time.
        if (adminRepository.count() > 0) {
            return Map.of(
                    "success", false,
                    "message",
                    "Setup already complete — an admin account already exists. Use the signup flow instead."
            );
        }

        if (
                name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                password == null || password.length() < 8 ||
                otp == null || otp.trim().isEmpty()
        ) {
            return Map.of(
                    "success", false,
                    "message",
                    "Name, email, a password of at least 8 characters, and the verification code are required."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        boolean otpValid =
                otpService.verifyOtp(normalizedEmail, otp.trim());

        if (!otpValid) {
            return Map.of(
                    "success", false,
                    "message",
                    "That code is incorrect or has expired. Please request a new one."
            );
        }

        Admin headAdmin = new Admin();
        headAdmin.setName(name.trim());
        headAdmin.setEmail(normalizedEmail);
        headAdmin.setPassword(
                passwordEncoder.encode(password)
        );
        headAdmin.setRole("HEAD_ADMIN");
        headAdmin.setStatus("APPROVED");
        headAdmin.setApprovedAt(LocalDateTime.now());

        adminRepository.save(headAdmin);

        otpService.deleteOtp(normalizedEmail);

        return Map.of(
                "success", true,
                "message",
                "Head admin account created. You can now log in."
        );
    }


    // =========================================================
    // SIGNUP — two-step, email-verified before any admin
    // request row is created:
    //
    //   1. sendSignupOtp()      — sends a code to the email,
    //                             nothing is persisted yet
    //   2. verifyAndSubmitSignup() — checks the code, and only
    //                             on success creates the actual
    //                             PENDING admin request
    //
    // This is the same reason the main app requires OTP before
    // registration completes: without it, anyone could submit
    // a request under an email address they don't own, and a
    // head admin would have no way to know.
    // =========================================================

    public Map<String, Object> sendSignupOtp(
            String name,
            String email
    ) {

        if (
                name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty()
        ) {
            return Map.of(
                    "success", false,
                    "message",
                    "Name and email are required."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        if (!isValidEmailFormat(normalizedEmail)) {
            return Map.of(
                    "success", false,
                    "message",
                    "Please enter a valid email address."
            );
        }

        if (adminRepository.existsByEmail(normalizedEmail)) {
            return Map.of(
                    "success", false,
                    "message",
                    "An admin account with this email already exists."
            );
        }

        otpService.generateAndSendOtp(normalizedEmail);

        return Map.of(
                "success", true,
                "message",
                "A verification code has been sent to your email."
        );
    }

    public Map<String, Object> verifyAndSubmitSignup(
            String name,
            String email,
            String password,
            String otp
    ) {

        if (
                name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                password == null || password.length() < 8 ||
                otp == null || otp.trim().isEmpty()
        ) {
            return Map.of(
                    "success", false,
                    "message",
                    "Name, email, a password of at least 8 characters, and the verification code are required."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        if (adminRepository.existsByEmail(normalizedEmail)) {
            return Map.of(
                    "success", false,
                    "message",
                    "An admin account with this email already exists."
            );
        }

        boolean otpValid =
                otpService.verifyOtp(normalizedEmail, otp.trim());

        if (!otpValid) {
            return Map.of(
                    "success", false,
                    "message",
                    "That code is incorrect or has expired. Please request a new one."
            );
        }

        Admin admin = new Admin();
        admin.setName(name.trim());
        admin.setEmail(normalizedEmail);
        admin.setPassword(
                passwordEncoder.encode(password)
        );
        admin.setRole("ADMIN");
        admin.setStatus("PENDING");

        adminRepository.save(admin);

        otpService.deleteOtp(normalizedEmail);

        return Map.of(
                "success", true,
                "message",
                "Email verified — your signup request has been submitted. A head admin must approve your account before you can log in."
        );
    }

    private boolean isValidEmailFormat(String email) {
        return email.matches(
                "^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$"
        );
    }


    // =========================================================
    // LOGIN
    // =========================================================

    public Map<String, Object> login(
            String email,
            String password
    ) {

        if (
                email == null || email.trim().isEmpty() ||
                password == null || password.isEmpty()
        ) {
            return Map.of(
                    "success", false,
                    "message", "Email and password are required."
            );
        }

        Optional<Admin> optionalAdmin =
                adminRepository.findByEmail(
                        email.trim().toLowerCase()
                );

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Invalid email or password."
            );
        }

        Admin admin = optionalAdmin.get();

        if (
                !passwordEncoder.matches(
                        password,
                        admin.getPassword()
                )
        ) {
            return Map.of(
                    "success", false,
                    "message", "Invalid email or password."
            );
        }

        if ("PENDING".equals(admin.getStatus())) {
            return Map.of(
                    "success", false,
                    "message",
                    "Your admin account is still awaiting approval from a head admin."
            );
        }

        if ("REJECTED".equals(admin.getStatus())) {
            return Map.of(
                    "success", false,
                    "message",
                    "Your admin signup request was rejected. Contact a head admin for details."
            );
        }

        if ("SUSPENDED".equals(admin.getStatus())) {
            return Map.of(
                    "success", false,
                    "message",
                    "Your admin account has been suspended. Contact a head admin for details."
            );
        }

        String token =
                adminJwtUtil.generateToken(
                        admin.getId(),
                        admin.getEmail(),
                        admin.getRole()
                );

        return Map.of(
                "success", true,
                "token", token,
                "admin", Map.of(
                        "id", admin.getId(),
                        "name", admin.getName(),
                        "email", admin.getEmail(),
                        "role", admin.getRole()
                )
        );
    }


    // =========================================================
    // CHANGE PASSWORD — an admin changing their own password.
    // adminId comes from the JWT (set by AdminJwtAuthFilter),
    // never from the request body, so there's no way to target
    // another admin's account.
    // =========================================================

    public Map<String, Object> changePassword(
            Long adminId,
            String currentPassword,
            String newPassword
    ) {

        if (
                currentPassword == null || currentPassword.isEmpty() ||
                newPassword == null || newPassword.length() < 8
        ) {
            return Map.of(
                    "success", false,
                    "message",
                    "Current password and a new password of at least 8 characters are required."
            );
        }

        Optional<Admin> optionalAdmin =
                adminRepository.findById(adminId);

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Admin account not found."
            );
        }

        Admin admin = optionalAdmin.get();

        if (
                !passwordEncoder.matches(
                        currentPassword,
                        admin.getPassword()
                )
        ) {
            return Map.of(
                    "success", false,
                    "message", "Current password is incorrect."
            );
        }

        admin.setPassword(
                passwordEncoder.encode(newPassword)
        );

        adminRepository.save(admin);

        return Map.of(
                "success", true,
                "message", "Password changed successfully."
        );
    }


    // =========================================================
    // FORGOT PASSWORD — for an admin who is locked out (doesn't
    // know their current password, so changePassword() above
    // isn't reachable). Same OTP-verified pattern as signup.
    //
    // Deliberately gives the same success message whether or
    // not the email belongs to an admin account, so this can't
    // be used to probe which emails are registered as admins.
    // =========================================================

    public Map<String, Object> sendForgotPasswordOtp(
            String email
    ) {

        if (email == null || email.trim().isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Email is required."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        Optional<Admin> optionalAdmin =
                adminRepository.findByEmail(normalizedEmail);

        // Only actually send an email if this admin exists AND
        // is approved — but the response is identical either
        // way, so the caller can't tell which case happened.
        if (
                optionalAdmin.isPresent() &&
                "APPROVED".equals(optionalAdmin.get().getStatus())
        ) {
            otpService.generateAndSendOtp(normalizedEmail);
        }

        return Map.of(
                "success", true,
                "message",
                "If that email belongs to an approved admin account, a reset code has been sent."
        );
    }

    public Map<String, Object> resetPasswordWithOtp(
            String email,
            String otp,
            String newPassword
    ) {

        if (
                email == null || email.trim().isEmpty() ||
                otp == null || otp.trim().isEmpty() ||
                newPassword == null || newPassword.length() < 8
        ) {
            return Map.of(
                    "success", false,
                    "message",
                    "Email, verification code, and a new password of at least 8 characters are required."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        Optional<Admin> optionalAdmin =
                adminRepository.findByEmail(normalizedEmail);

        if (
                optionalAdmin.isEmpty() ||
                !"APPROVED".equals(optionalAdmin.get().getStatus())
        ) {
            return Map.of(
                    "success", false,
                    "message", "Invalid or expired verification code."
            );
        }

        boolean otpValid =
                otpService.verifyOtp(normalizedEmail, otp.trim());

        if (!otpValid) {
            return Map.of(
                    "success", false,
                    "message",
                    "That code is incorrect or has expired. Please request a new one."
            );
        }

        Admin admin = optionalAdmin.get();

        admin.setPassword(
                passwordEncoder.encode(newPassword)
        );

        adminRepository.save(admin);

        otpService.deleteOtp(normalizedEmail);

        return Map.of(
                "success", true,
                "message",
                "Password reset successfully. You can now log in."
        );
    }


    // =========================================================
    // PENDING REQUESTS — head admin only. Authorization (is the
    // caller actually a HEAD_ADMIN) is enforced by the JWT
    // filter/controller layer, not here.
    // =========================================================

    public List<Admin> listPending() {
        return adminRepository.findByStatus("PENDING");
    }

    public List<Admin> listAll() {
        return adminRepository.findAll();
    }




    // =========================================================
    // APPROVE / REJECT
    // =========================================================

    public Map<String, Object> approve(
            Long adminId,
            Long approverId
    ) {

        Optional<Admin> optionalAdmin =
                adminRepository.findById(adminId);

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Admin request not found."
            );
        }

        Admin admin = optionalAdmin.get();
        admin.setStatus("APPROVED");
        admin.setApprovedBy(approverId);
        admin.setApprovedAt(LocalDateTime.now());

        adminRepository.save(admin);

        return Map.of(
                "success", true,
                "message", "Admin approved."
        );
    }

    public Map<String, Object> reject(
            Long adminId,
            Long approverId
    ) {

        Optional<Admin> optionalAdmin =
                adminRepository.findById(adminId);

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Admin request not found."
            );
        }

        Admin admin = optionalAdmin.get();
        admin.setStatus("REJECTED");
        admin.setApprovedBy(approverId);
        admin.setApprovedAt(LocalDateTime.now());

        adminRepository.save(admin);

        return Map.of(
                "success", true,
                "message", "Admin request rejected."
        );
    }


    // =========================================================
    // SUSPEND / REACTIVATE / REMOVE — head admin only.
    // A head admin can never suspend, reactivate, or remove
    // themselves, and can never suspend or remove another
    // HEAD_ADMIN account (there should only ever be one, but
    // this guards against any future multi-head-admin setup).
    // =========================================================

    public Map<String, Object> suspend(
            Long adminId,
            Long callerId
    ) {

        if (adminId.equals(callerId)) {
            return Map.of(
                    "success", false,
                    "message", "You cannot suspend your own account."
            );
        }

        Optional<Admin> optionalAdmin =
                adminRepository.findById(adminId);

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Admin not found."
            );
        }

        Admin admin = optionalAdmin.get();

        if ("HEAD_ADMIN".equals(admin.getRole())) {
            return Map.of(
                    "success", false,
                    "message", "A head admin account cannot be suspended."
            );
        }

        admin.setStatus("SUSPENDED");

        adminRepository.save(admin);

        return Map.of(
                "success", true,
                "message", "Admin account suspended."
        );
    }

    public Map<String, Object> activate(
            Long adminId,
            Long callerId
    ) {

        Optional<Admin> optionalAdmin =
                adminRepository.findById(adminId);

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Admin not found."
            );
        }

        Admin admin = optionalAdmin.get();
        admin.setStatus("APPROVED");

        adminRepository.save(admin);

        return Map.of(
                "success", true,
                "message", "Admin account reactivated."
        );
    }

    public Map<String, Object> remove(
            Long adminId,
            Long callerId
    ) {

        if (adminId.equals(callerId)) {
            return Map.of(
                    "success", false,
                    "message", "You cannot remove your own account."
            );
        }

        Optional<Admin> optionalAdmin =
                adminRepository.findById(adminId);

        if (optionalAdmin.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Admin not found."
            );
        }

        Admin admin = optionalAdmin.get();

        if ("HEAD_ADMIN".equals(admin.getRole())) {
            return Map.of(
                    "success", false,
                    "message", "A head admin account cannot be removed."
            );
        }

        adminRepository.delete(admin);

        return Map.of(
                "success", true,
                "message", "Admin removed."
        );
    }
}
