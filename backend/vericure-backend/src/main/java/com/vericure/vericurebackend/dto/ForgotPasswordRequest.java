package com.vericure.vericurebackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    // ==========================================
    // GETTER
    // ==========================================

    public String getEmail() {
        return email;
    }

    // ==========================================
    // SETTER
    // ==========================================

    public void setEmail(String email) {
        this.email = email;
    }
}