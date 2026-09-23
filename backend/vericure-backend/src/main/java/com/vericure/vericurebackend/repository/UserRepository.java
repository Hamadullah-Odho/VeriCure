package com.vericure.vericurebackend.repository;

import com.vericure.vericurebackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /*
     * Explicit forced UPDATE so account verification is
     * guaranteed to persist, instead of relying on
     * save()-after-find dirty-checking (which was previously
     * found to be unreliable for this OTP-verification style
     * flow — see OtpVerificationRepository.markAsVerified()).
     * Returns the number of rows updated (0 if the email
     * didn't match any user).
     */
    @Modifying
    @Transactional
    @Query(
            "UPDATE User u " +
            "SET u.verified = true " +
            "WHERE u.email = :email"
    )
    int markAsVerified(
            @Param("email") String email
    );
}