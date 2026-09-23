package com.vericure.vericurebackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;

    @NotBlank(message = "OTP is required")
    @Pattern(
            regexp = "^\\d{4}$",
            message = "OTP must be 4 digits"
    )
    private String otp;

    @NotBlank(message = "New password is required")
    @Size(
            min = 8,
            message = "Password must be at least 8 characters"
    )
    @Pattern(
            regexp = ".*[!@#$%^&*(),.?\\\":{}|<>].*",
            message = "Password must contain at least one special character"
    )
    private String newPassword;

    // ==========================================
    // GETTERS
    // ==========================================

    public String getEmail() {
        return email;
    }

    public String getOtp() {
        return otp;
    }

    public String getNewPassword() {
        return newPassword;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    public void setEmail(String email) {
        this.email = email;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}