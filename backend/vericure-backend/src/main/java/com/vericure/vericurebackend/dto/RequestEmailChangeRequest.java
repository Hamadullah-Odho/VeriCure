package com.vericure.vericurebackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RequestEmailChangeRequest {

    @NotBlank(message = "Current email is required")
    @Email(message = "Invalid current email address")
    private String currentEmail;

    @NotBlank(message = "New email is required")
    @Email(message = "Invalid new email address")
    private String newEmail;

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
}
