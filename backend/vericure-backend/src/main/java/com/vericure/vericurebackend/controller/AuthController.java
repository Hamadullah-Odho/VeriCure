
package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.dto.LoginRequest;
import com.vericure.vericurebackend.dto.OtpRequest;
import com.vericure.vericurebackend.dto.RegisterRequest;
import com.vericure.vericurebackend.dto.ResetPasswordRequest;
import com.vericure.vericurebackend.dto.ChangePasswordRequest;
import com.vericure.vericurebackend.dto.UpdateNameRequest;
import com.vericure.vericurebackend.dto.RequestEmailChangeRequest;
import com.vericure.vericurebackend.dto.ConfirmEmailChangeRequest;
import com.vericure.vericurebackend.entity.User;
import com.vericure.vericurebackend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {

        this.authService =
                authService;
    }


    // =========================================================
    // REGISTER
    // =========================================================

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        try {

            String result =
                    authService.register(request);

            if (result.equals(
                    "Registration successful"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to process registration"
                            )
                    );
        }
    }


    // =========================================================
    // VERIFY REGISTRATION OTP
    // =========================================================

    @PostMapping("/verify-user-otp")
    public ResponseEntity<Map<String, Object>>
    verifyUserOtp(
            @Valid @RequestBody OtpRequest request
    ) {

        try {

            String result =
                    authService.verifyUserOtp(
                            request.getEmail(),
                            request.getOtp()
                    );

            if (result.equals(
                    "Account verified successfully"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to verify account"
                            )
                    );
        }
    }


    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>>
    forgotPassword(
            @RequestBody Map<String, String> request
    ) {

        try {

            String email =
                    request.get("email");

            if (email == null ||
                    email.trim().isEmpty()) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message",
                                "Email is required"
                        )
                );
            }

            String result =
                    authService.forgotPassword(email);

            if (result.equals(
                    "Password reset OTP sent successfully"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result,
                                "email",
                                email.trim().toLowerCase()
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to process forgot password"
                            )
                    );
        }
    }


    // =========================================================
    // VERIFY FORGOT PASSWORD OTP
    // =========================================================

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>>
    verifyOtp(
            @Valid @RequestBody OtpRequest request
    ) {

        try {

            boolean verified =
                    authService.verifyResetOtp(
                            request.getEmail(),
                            request.getOtp()
                    );

            if (verified) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message",
                                "OTP verified successfully",
                                "email",
                                request.getEmail()
                                        .trim()
                                        .toLowerCase()
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message",
                            "Invalid or expired OTP"
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
                                    "Unable to verify OTP"
                            )
                    );
        }
    }


    // =========================================================
    // RESET PASSWORD
    // =========================================================

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>>
    resetPassword(
            @Valid @RequestBody
            ResetPasswordRequest request
    ) {

        try {

            String result =
                    authService.resetPassword(
                            request
                    );

            if (result.equals(
                    "Password reset successfully"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to reset password"
                            )
                    );
        }
    }


    // =========================================================
    // LOGIN
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>>
    login(
            @Valid @RequestBody LoginRequest request
    ) {

        try {

            String result =
                    authService.login(request);

            if (result.equals(
                    "Login successful"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            /*
             * When the account is unverified, login() sends a
             * fresh OTP and returns a message starting with
             * "Account not verified". The frontend needs a
             * structured signal (not just a message string) to
             * know it should auto-navigate to the OTP screen.
             */

            if (result.startsWith(
                    "Account not verified"
            )) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", result,
                                "requiresOtp", true
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to process login"
                            )
                    );
        }
    }


    // =========================================================
    // CHANGE PASSWORD (LOGGED-IN USER)
    // =========================================================

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>>
    changePassword(
            @Valid @RequestBody
            ChangePasswordRequest request
    ) {

        try {

            String result =
                    authService.changePassword(
                            request
                    );

            if (result.equals(
                    "Password changed successfully"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to change password"
                            )
                    );
        }
    }


    // =========================================================
    // GET PROFILE
    // =========================================================

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>>
    getProfile(
            @RequestParam String email
    ) {

        try {

            Optional<User> optionalUser =
                    authService.getProfile(
                            email
                    );

            if (optionalUser.isEmpty()) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message",
                                "User not found"
                        )
                );
            }

            User user =
                    optionalUser.get();

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "name",
                            user.getName(),
                            "email",
                            user.getEmail()
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
                                    "Unable to load profile"
                            )
                    );
        }
    }


    // =========================================================
    // UPDATE NAME
    // =========================================================

    @PostMapping("/update-name")
    public ResponseEntity<Map<String, Object>>
    updateName(
            @Valid @RequestBody
            UpdateNameRequest request
    ) {

        try {

            String result =
                    authService.updateName(
                            request
                    );

            if (result.equals(
                    "Name updated successfully"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to update name"
                            )
                    );
        }
    }


    // =========================================================
    // REQUEST EMAIL CHANGE
    // =========================================================

    @PostMapping("/request-email-change")
    public ResponseEntity<Map<String, Object>>
    requestEmailChange(
            @Valid @RequestBody
            RequestEmailChangeRequest request
    ) {

        try {

            String result =
                    authService.requestEmailChange(
                            request
                    );

            if (result.equals(
                    "Verification code sent to new email"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to request email change"
                            )
                    );
        }
    }


    // =========================================================
    // CONFIRM EMAIL CHANGE
    // =========================================================

    @PostMapping("/confirm-email-change")
    public ResponseEntity<Map<String, Object>>
    confirmEmailChange(
            @Valid @RequestBody
            ConfirmEmailChangeRequest request
    ) {

        try {

            String result =
                    authService.confirmEmailChange(
                            request
                    );

            if (result.equals(
                    "Email updated successfully"
            )) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message", result,
                                "email",
                                request.getNewEmail()
                                        .trim()
                                        .toLowerCase()
                        )
                );
            }

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", result
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
                                    "Unable to confirm email change"
                            )
                    );
        }
    }
}

