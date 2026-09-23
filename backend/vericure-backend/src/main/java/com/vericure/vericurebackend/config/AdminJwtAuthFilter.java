package com.vericure.vericurebackend.config;

import com.vericure.vericurebackend.util.AdminJwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/*
 * ============================================================
 * ADMIN JWT AUTH FILTER
 * ============================================================
 *
 * Applies ONLY to /api/admin/** paths, and only the ones that
 * require a logged-in admin. /api/admin/bootstrap, /signup,
 * and /login are intentionally left open — everything else
 * under /api/admin/ requires a valid Bearer token.
 *
 * On success, the admin's id/email/role are attached to the
 * request as attributes so controllers can read them without
 * re-parsing the token.
 *
 * This does NOT touch any other endpoint in the app — the
 * mobile app's /api/auth/**, /api/verification/**, etc. are
 * completely unaffected and remain exactly as before.
 * ============================================================
 */

@Component
public class AdminJwtAuthFilter extends OncePerRequestFilter {

    private final AdminJwtUtil adminJwtUtil;

    private static final String[] OPEN_ADMIN_PATHS = {
            "/api/admin/bootstrap/send-otp",
            "/api/admin/bootstrap/verify",
            "/api/admin/signup/send-otp",
            "/api/admin/signup/verify",
            "/api/admin/login",
            "/api/admin/forgot-password/send-otp",
            "/api/admin/forgot-password/reset",
    };

    public AdminJwtAuthFilter(AdminJwtUtil adminJwtUtil) {
        this.adminJwtUtil = adminJwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        /*
         * Browsers send a CORS preflight OPTIONS request (with
         * no Authorization header) before the real request on
         * any call that carries a custom header like ours. That
         * preflight must always be allowed through untouched —
         * rejecting it here as "unauthorized" blocks the real
         * request too, since the browser never proceeds past a
         * failed preflight. The mobile app never hit this since
         * React Native's fetch doesn't do CORS preflighting.
         */
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        boolean isProtectedAdminPath =
                path.startsWith("/api/admin/") &&
                !isOpenPath(path);

        if (!isProtectedAdminPath) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader =
                request.getHeader("Authorization");

        if (
                authHeader == null ||
                !authHeader.startsWith("Bearer ")
        ) {
            respondUnauthorized(
                    response,
                    "Missing or malformed Authorization header."
            );
            return;
        }

        String token =
                authHeader.substring("Bearer ".length());

        Claims claims =
                adminJwtUtil.validateAndParse(token);

        if (claims == null) {
            respondUnauthorized(
                    response,
                    "Invalid or expired admin session. Please log in again."
            );
            return;
        }

        request.setAttribute(
                "adminId",
                Long.valueOf(claims.getSubject())
        );

        request.setAttribute(
                "adminEmail",
                claims.get("email", String.class)
        );

        request.setAttribute(
                "adminRole",
                claims.get("role", String.class)
        );

        filterChain.doFilter(request, response);
    }

    private boolean isOpenPath(String path) {

        for (String openPath : OPEN_ADMIN_PATHS) {
            if (path.equals(openPath)) {
                return true;
            }
        }

        return false;
    }

    private void respondUnauthorized(
            HttpServletResponse response,
            String message
    ) throws IOException {

        response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
        );

        response.setContentType("application/json");

        response.getWriter().write(
                "{\"success\":false,\"message\":\"" +
                        message +
                        "\"}"
        );
    }
}
