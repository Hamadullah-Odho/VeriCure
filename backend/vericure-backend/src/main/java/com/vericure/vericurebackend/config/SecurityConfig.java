package com.vericure.vericurebackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity // <-- Add this annotation here
public class SecurityConfig {

    private final AdminJwtAuthFilter adminJwtAuthFilter;

    public SecurityConfig(AdminJwtAuthFilter adminJwtAuthFilter) {
        this.adminJwtAuthFilter = adminJwtAuthFilter;
    }

    /*
     * The mobile app never needed CORS — React Native's fetch()
     * doesn't enforce it. The admin WEBSITE runs in an actual
     * browser, which blocks cross-origin responses by default
     * unless the server explicitly allows it. Without this, every
     * request from the website silently fails client-side even
     * though the backend itself handled it and responded fine —
     * exactly the "backend is running but nothing loads" symptom.
     *
     * setAllowedOriginPatterns("*") + allowCredentials(true) is
     * the correct combination for wildcard origins with the
     * Authorization header (setAllowedOrigins("*") is rejected by
     * Spring when credentials are allowed). This is permissive
     * for local development — narrow it to your actual deployed
     * website origin(s) before any real deployment.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(
                List.of("*")
        );

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()
                ))
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )
                /*
                 * Spring Security still permitAll()s every path
                 * above — actual admin auth enforcement happens
                 * inside AdminJwtAuthFilter, which only inspects
                 * /api/admin/** and rejects unauthenticated
                 * requests to protected admin paths itself. This
                 * keeps every existing mobile-app endpoint (auth,
                 * verification, etc.) completely untouched.
                 */
                .addFilterBefore(
                        adminJwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}