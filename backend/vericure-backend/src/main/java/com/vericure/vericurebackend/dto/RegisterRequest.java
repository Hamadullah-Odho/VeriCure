package com.vericure.vericurebackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    // ==========================================
    // NAME
    // ==========================================

    @NotBlank(
            message = "Name is required"
    )
    private String name;


    // ==========================================
    // EMAIL
    // ==========================================

    @NotBlank(
            message = "Email is required"
    )
    @Email(
            message = "Please enter a valid email address"
    )
    @Pattern(
            regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "Please enter a valid email address"
    )
    private String email;


    // ==========================================
    // PASSWORD
    // ==========================================

    @NotBlank(
            message = "Password is required"
    )
    @Size(
            min = 8,
            message = "Password must be at least 8 characters"
    )
    @Pattern(
            regexp = ".*[!@#$%^&*(),.?\":{}|<>].*",
            message = "Password must contain at least one special character"
    )
    private String password;


    // ==========================================
    // DEFAULT CONSTRUCTOR
    // ==========================================

    public RegisterRequest() {
    }


    // ==========================================
    // GET NAME
    // ==========================================

    public String getName() {
        return name;
    }


    // ==========================================
    // SET NAME
    // ==========================================

    public void setName(String name) {
        this.name = name;
    }


    // ==========================================
    // GET EMAIL
    // ==========================================

    public String getEmail() {
        return email;
    }


    // ==========================================
    // SET EMAIL
    // ==========================================

    public void setEmail(String email) {
        this.email = email;
    }


    // ==========================================
    // GET PASSWORD
    // ==========================================

    public String getPassword() {
        return password;
    }


    // ==========================================
    // SET PASSWORD
    // ==========================================

    public void setPassword(String password) {
        this.password = password;
    }
}