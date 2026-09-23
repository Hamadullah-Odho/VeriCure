package com.vericure.vericurebackend.repository;

import com.vericure.vericurebackend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface OtpVerificationRepository
        extends JpaRepository<OtpVerification, Long> {

    @Modifying
    @Transactional
    void deleteByEmail(String email);

    Optional<OtpVerification> findByEmailAndOtp(
            String email,
            String otp
    );

    // Explicit forced UPDATE so verification is guaranteed to persist,
    // instead of relying on save()-after-find dirty-checking.
    @Modifying
    @Transactional
    @Query(
            "UPDATE OtpVerification o " +
                    "SET o.verified = true " +
                    "WHERE o.email = :email AND o.otp = :otp"
    )
    int markAsVerified(
            @Param("email") String email,
            @Param("otp") String otp
    );
}