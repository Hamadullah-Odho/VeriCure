package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.entity.Admin;
import com.vericure.vericurebackend.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }


    // =========================================================
    // BOOTSTRAP — one-time, only works while admins table is
    // empty. Two-step, OTP-verified. Not protected by the JWT
    // filter (both sub-paths are in OPEN_ADMIN_PATHS) since
    // there's no admin to authenticate as yet.
    // =========================================================

    @PostMapping("/bootstrap/send-otp")
    public ResponseEntity<Map<String, Object>> sendBootstrapOtp(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.sendBootstrapOtp(
                        body.get("name"),
                        body.get("email")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/bootstrap/verify")
    public ResponseEntity<Map<String, Object>> verifyBootstrap(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.verifyBootstrap(
                        body.get("name"),
                        body.get("email"),
                        body.get("password"),
                        body.get("otp")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }


    // =========================================================
    // SIGNUP — two-step, email-verified via OTP
    // =========================================================

    @PostMapping("/signup/send-otp")
    public ResponseEntity<Map<String, Object>> sendSignupOtp(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.sendSignupOtp(
                        body.get("name"),
                        body.get("email")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<Map<String, Object>> verifySignup(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.verifyAndSubmitSignup(
                        body.get("name"),
                        body.get("email"),
                        body.get("password"),
                        body.get("otp")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }


    // =========================================================
    // LOGIN
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.login(
                        body.get("email"),
                        body.get("password")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(401).body(result);
    }


    // =========================================================
    // CURRENT ADMIN — used by the web dashboard to restore a
    // session on page reload without re-sending credentials.
    // =========================================================

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            HttpServletRequest request
    ) {

        return ResponseEntity.ok(
                Map.of(
                        "id", request.getAttribute("adminId"),
                        "email", request.getAttribute("adminEmail"),
                        "role", request.getAttribute("adminRole")
                )
        );
    }


    // =========================================================
    // CHANGE OWN PASSWORD
    // =========================================================

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {

        Long adminId =
                (Long) request.getAttribute("adminId");

        Map<String, Object> result =
                adminService.changePassword(
                        adminId,
                        body.get("currentPassword"),
                        body.get("newPassword")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }


    // =========================================================
    // FORGOT PASSWORD — for an admin who doesn't know their
    // current password, so /change-password (which requires
    // it) isn't reachable. Both endpoints are public/open —
    // there's no logged-in session at this point.
    // =========================================================

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<Map<String, Object>> sendForgotPasswordOtp(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.sendForgotPasswordOtp(
                        body.get("email")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Map<String, Object>> resetPasswordWithOtp(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                adminService.resetPasswordWithOtp(
                        body.get("email"),
                        body.get("otp"),
                        body.get("newPassword")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }


    // =========================================================
    // ALL ADMINS — head admin only (full roster, not just
    // pending requests)
    // =========================================================

    @GetMapping("/all")
    public ResponseEntity<?> listAll(
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(
                adminService.listAll()
        );
    }


    // =========================================================
    // PENDING REQUESTS — head admin only
    // =========================================================

    @GetMapping("/pending")
    public ResponseEntity<?> listPending(
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return authError;
        }

        List<Admin> pending =
                adminService.listPending();

        return ResponseEntity.ok(pending);
    }



    // =========================================================
    // APPROVE / REJECT — head admin only
    // =========================================================

    @PostMapping("/approve/{id}")
    public ResponseEntity<Map<String, Object>> approve(
            @PathVariable Long id,
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return (ResponseEntity<Map<String, Object>>) authError;
        }

        Long approverId =
                (Long) request.getAttribute("adminId");

        return ResponseEntity.ok(
                adminService.approve(id, approverId)
        );
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<Map<String, Object>> reject(
            @PathVariable Long id,
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return (ResponseEntity<Map<String, Object>>) authError;
        }

        Long approverId =
                (Long) request.getAttribute("adminId");

        return ResponseEntity.ok(
                adminService.reject(id, approverId)
        );
    }


    // =========================================================
    // SUSPEND / REACTIVATE / REMOVE — head admin only
    // =========================================================

    @PostMapping("/suspend/{id}")
    public ResponseEntity<Map<String, Object>> suspend(
            @PathVariable Long id,
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return (ResponseEntity<Map<String, Object>>) authError;
        }

        Long callerId =
                (Long) request.getAttribute("adminId");

        Map<String, Object> result =
                adminService.suspend(id, callerId);

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/activate/{id}")
    public ResponseEntity<Map<String, Object>> activate(
            @PathVariable Long id,
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return (ResponseEntity<Map<String, Object>>) authError;
        }

        Long callerId =
                (Long) request.getAttribute("adminId");

        Map<String, Object> result =
                adminService.activate(id, callerId);

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> remove(
            @PathVariable Long id,
            HttpServletRequest request
    ) {

        ResponseEntity<?> authError =
                requireHeadAdmin(request);

        if (authError != null) {
            return (ResponseEntity<Map<String, Object>>) authError;
        }

        Long callerId =
                (Long) request.getAttribute("adminId");

        Map<String, Object> result =
                adminService.remove(id, callerId);

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }


    // =========================================================
    // HELPER — the JWT filter already confirms the token is
    // valid for any /api/admin/** path; this additionally
    // checks the role claim for endpoints only a HEAD_ADMIN
    // should reach.
    // =========================================================

    private ResponseEntity<?> requireHeadAdmin(
            HttpServletRequest request
    ) {

        String role =
                (String) request.getAttribute("adminRole");

        if (!"HEAD_ADMIN".equals(role)) {

            return ResponseEntity.status(403).body(
                    Map.of(
                            "success", false,
                            "message",
                            "Only a head admin can perform this action."
                    )
            );
        }

        return null;
    }
}