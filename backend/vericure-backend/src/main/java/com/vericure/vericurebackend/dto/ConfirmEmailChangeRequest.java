package com.vericure.vericurebackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ConfirmEmailChangeRequest {

    @NotBlank(message = "Current email is required")
    @Email(message = "Invalid current email address")
    private String currentEmail;

    @NotBlank(message = "New email is required")
    @Email(message = "Invalid new email address")
    private String newEmail;

    @NotBlank(message = "OTP is required")
    @Pattern(
            regexp = "^\\d{4}$",
            message = "OTP must be 4 digits"
    )
    private String otp;

    public String getCurrentEmail() {
        return currentEmail;
    }

    public void setCurrentEmail(String currentEmail) {
        this.currentEmail = currentEmail;
    }

    public String getNewEmail() {
        return newEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
