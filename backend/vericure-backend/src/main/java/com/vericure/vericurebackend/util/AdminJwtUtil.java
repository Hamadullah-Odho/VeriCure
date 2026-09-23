package com.vericure.vericurebackend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/*
 * ============================================================
 * ADMIN JWT UTIL
 * ============================================================
 *
 * Issues and validates JWTs for the admin WEB dashboard only.
 * The mobile app is completely unaffected — it still uses
 * plain email lookups with no token at all, exactly as before.
 *
 * The signing secret is configurable via admin.jwt.secret in
 * application.properties. If left unset, a secret is generated
 * at startup — fine for development, but every restart
 * invalidates existing admin sessions, and it won't work across
 * multiple backend instances. Set a real, fixed secret before
 * any production deployment.
 * ============================================================
 */

@Component
public class AdminJwtUtil {

    private final SecretKey signingKey;

    private static final long EXPIRY_MILLIS =
            1000L * 60 * 60 * 12; // 12 hours

    public AdminJwtUtil(
            @Value("${admin.jwt.secret:}") String configuredSecret
    ) {

        if (
                configuredSecret != null &&
                configuredSecret.trim().length() >= 32
        ) {

            this.signingKey =
                    Keys.hmacShaKeyFor(
                            configuredSecret
                                    .trim()
                                    .getBytes()
                    );

        } else {

            System.out.println(
                    "[AdminJwtUtil] admin.jwt.secret not set (or too short) "
                            + "in application.properties — generating a "
                            + "random secret for this run. Admin sessions "
                            + "will NOT survive a backend restart until a "
                            + "real secret (32+ chars) is configured."
            );

            this.signingKey =
                    Keys.secretKeyFor(
                            io.jsonwebtoken.SignatureAlgorithm.HS256
                    );
        }
    }

    public String generateToken(
            Long adminId,
            String email,
            String role
    ) {

        Date now = new Date();

        Date expiry =
                new Date(
                        now.getTime() + EXPIRY_MILLIS
                );

        return Jwts.builder()
                .subject(String.valueOf(adminId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Returns the parsed claims if the token is valid and not
     * expired, or null if it's missing, malformed, expired, or
     * signed with a different key.
     */
    public Claims validateAndParse(String token) {

        try {

            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

        } catch (Exception e) {

            return null;
        }
    }
}
