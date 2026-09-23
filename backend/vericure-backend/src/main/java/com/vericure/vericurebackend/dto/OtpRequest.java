package com.vericure.vericurebackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;

    @Pattern(
            regexp = "^\\d{4}$",
            message = "OTP must be 4 digits"
    )
    private String otp;

    // ==========================================
    // GETTERS
    // ==========================================

    public String getEmail() {
        return email;
    }

    public String getOtp() {
        return otp;
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
}