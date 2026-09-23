package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.dto.OtpRequest;
import com.vericure.vericurebackend.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    // ==========================================
    // SEND OTP
    // ==========================================

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(
            @Valid @RequestBody OtpRequest request
    ) {

        try {

            String email =
                    request.getEmail()
                            .trim()
                            .toLowerCase();

            otpService.generateAndSendOtp(email);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "OTP sent successfully",
                            "email", email
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Unable to send OTP"
                            )
                    );
        }
    }


}