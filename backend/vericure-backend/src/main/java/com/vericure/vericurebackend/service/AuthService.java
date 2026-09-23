
        package com.vericure.vericurebackend.service;

import com.vericure.vericurebackend.dto.LoginRequest;
import com.vericure.vericurebackend.dto.RegisterRequest;
import com.vericure.vericurebackend.dto.ResetPasswordRequest;
import com.vericure.vericurebackend.dto.ChangePasswordRequest;
import com.vericure.vericurebackend.dto.UpdateNameRequest;
import com.vericure.vericurebackend.dto.RequestEmailChangeRequest;
import com.vericure.vericurebackend.dto.ConfirmEmailChangeRequest;
import com.vericure.vericurebackend.entity.User;
import com.vericure.vericurebackend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public AuthService(
            UserRepository userRepository,
            OtpService otpService,
            EmailService emailService
    ) {

        this.userRepository = userRepository;

        this.passwordEncoder =
                new BCryptPasswordEncoder();

        this.otpService = otpService;

        this.emailService = emailService;
    }


    // =========================================================
    // REGISTER
    // =========================================================

    public String register(
            RegisterRequest request
    ) {

        String name =
                request.getName()
                        .trim();

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        String domain =
                email.substring(
                        email.indexOf("@") + 1
                );

        if (
                domain.equals("example.com")
                        ||
                        domain.equals("example.org")
                        ||
                        domain.equals("example.net")
                        ||
                        domain.equals("test.com")
                        ||
                        domain.equals("fake.com")
                        ||
                        domain.equals("localhost")
        ) {

            return "Please use a real email address";
        }

        if (userRepository.existsByEmail(email)) {

            return "Email already registered";
        }

        User user =
                new User();

        user.setName(name);
        user.setEmail(email);

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setVerified(false);

        userRepository.save(user);

        // Send registration OTP
        otpService.generateAndSendOtp(email);

        return "Registration successful";
    }


    // =========================================================
    // VERIFY REGISTRATION OTP
    // =========================================================

    public String verifyUserOtp(
            String email,
            String otp
    ) {

        String normalizedEmail =
                email.trim().toLowerCase();

        String normalizedOtp =
                otp.trim();

        Optional<User> optionalUser =
                userRepository.findByEmail(
                        normalizedEmail
                );

        if (optionalUser.isEmpty()) {

            return "User not found";
        }

        User user =
                optionalUser.get();

        if (Boolean.TRUE.equals(
                user.getVerified()
        )) {

            return "Account already verified";
        }

        boolean valid =
                otpService.verifyOtp(
                        normalizedEmail,
                        normalizedOtp
                );

        if (!valid) {

            return "Invalid or expired OTP";
        }

        int rowsUpdated =
                userRepository.markAsVerified(
                        normalizedEmail
                );

        if (rowsUpdated == 0) {

            System.out.println(
                    "USER VERIFY UPDATE AFFECTED 0 ROWS for: "
                            + normalizedEmail
            );

            return "Unable to verify account. Please try again.";
        }

        System.out.println(
                "USER VERIFIED SUCCESSFULLY (rows updated: "
                        + rowsUpdated + ") for: "
                        + normalizedEmail
        );

        // Account is only truly "created" once OTP verification
        // completes — send the welcome email here, not at the
        // initial /register call, so it never lands before the
        // account is actually usable.
        emailService.sendAccountCreatedEmail(
                normalizedEmail,
                user.getName()
        );

        return "Account verified successfully";
    }


    // =========================================================
    // LOGIN
    // =========================================================

    public String login(
            LoginRequest request
    ) {

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        String password =
                request.getPassword();

        Optional<User> optionalUser =
                userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {

            return "Invalid email or password";
        }

        User user =
                optionalUser.get();

        boolean passwordMatches =
                passwordEncoder.matches(
                        password,
                        user.getPassword()
                );

        if (!passwordMatches) {

            return "Invalid email or password";
        }

        if (!Boolean.TRUE.equals(
                user.getVerified()
        )) {

            otpService.generateAndSendOtp(email);

            return "Account not verified. A new OTP has been sent to your email";
        }

        return "Login successful";
    }


    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    public String forgotPassword(
            String email
    ) {

        if (email == null ||
                email.trim().isEmpty()) {

            return "Email is required";
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        Optional<User> optionalUser =
                userRepository.findByEmail(
                        normalizedEmail
                );

        if (optionalUser.isEmpty()) {

            return "User not found";
        }

        // Generate and send NEW OTP
        otpService.generateAndSendOtp(
                normalizedEmail
        );

        return "Password reset OTP sent successfully";
    }

// =========================================================
// VERIFY FORGOT PASSWORD OTP
// =========================================================

    public boolean verifyResetOtp(
            String email,
            String otp
    ) {

        if (email == null || otp == null) {

            return false;
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        String normalizedOtp =
                otp.trim();

        if (normalizedEmail.isEmpty() ||
                normalizedOtp.isEmpty()) {

            return false;
        }

        return otpService.verifyOtp(
                normalizedEmail,
                normalizedOtp
        );
    }


    // =========================================================
    // RESET PASSWORD
    // =========================================================

    public String resetPassword(
            ResetPasswordRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getOtp() == null ||
                request.getNewPassword() == null) {

            return "All fields are required";
        }

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        String otp =
                request.getOtp()
                        .trim();

        String newPassword =
                request.getNewPassword();

        if (email.isEmpty() ||
                otp.isEmpty() ||
                newPassword.trim().isEmpty()) {

            return "All fields are required";
        }


        // =====================================================
        // FIND USER
        // =====================================================

        Optional<User> optionalUser =
                userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {

            return "User not found";
        }

        User user =
                optionalUser.get();


        // =====================================================
        // CHECK THAT OTP WAS VERIFIED
        // =====================================================

        boolean verified =
                otpService.isOtpVerified(
                        email,
                        otp
                );

        if (!verified) {

            return "Please verify the OTP first";
        }


        // =====================================================
        // HASH NEW PASSWORD
        // =====================================================

        String hashedPassword =
                passwordEncoder.encode(
                        newPassword
                );


        // =====================================================
        // UPDATE PASSWORD
        // =====================================================

        user.setPassword(
                hashedPassword
        );

        userRepository.save(user);


        // =====================================================
        // DELETE USED OTP
        // =====================================================

        otpService.deleteOtp(email);


        // =====================================================
        // SUCCESS
        // =====================================================

        return "Password reset successfully";
    }


    // =========================================================
    // CHANGE PASSWORD (LOGGED-IN USER)
    // =========================================================

    public String changePassword(
            ChangePasswordRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getCurrentPassword() == null ||
                request.getNewPassword() == null) {

            return "All fields are required";
        }

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        String currentPassword =
                request.getCurrentPassword();

        String newPassword =
                request.getNewPassword();

        if (email.isEmpty() ||
                currentPassword.isEmpty() ||
                newPassword.trim().isEmpty()) {

            return "All fields are required";
        }


        // =====================================================
        // FIND USER
        // =====================================================

        Optional<User> optionalUser =
                userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return "User not found";
        }

        User user =
                optionalUser.get();


        // =====================================================
        // VERIFY CURRENT PASSWORD
        // =====================================================

        boolean currentPasswordMatches =
                passwordEncoder.matches(
                        currentPassword,
                        user.getPassword()
                );

        if (!currentPasswordMatches) {
            return "Current password is incorrect";
        }


        // =====================================================
        // PREVENT REUSING THE SAME PASSWORD
        // =====================================================

        boolean newPasswordSameAsOld =
                passwordEncoder.matches(
                        newPassword,
                        user.getPassword()
                );

        if (newPasswordSameAsOld) {
            return "New password must be different from the current password";
        }


        // =====================================================
        // HASH + UPDATE PASSWORD
        // =====================================================

        String hashedPassword =
                passwordEncoder.encode(
                        newPassword
                );

        user.setPassword(
                hashedPassword
        );

        userRepository.save(user);


        // =====================================================
        // SUCCESS
        // =====================================================

        return "Password changed successfully";
    }


    // =========================================================
    // GET PROFILE
    // =========================================================

    public Optional<User> getProfile(
            String email
    ) {

        if (email == null ||
                email.trim().isEmpty()) {

            return Optional.empty();
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        return userRepository.findByEmail(
                normalizedEmail
        );
    }


    // =========================================================
    // UPDATE NAME
    // =========================================================

    public String updateName(
            UpdateNameRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getName() == null) {

            return "All fields are required";
        }

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        String name =
                request.getName()
                        .trim();

        if (email.isEmpty() ||
                name.isEmpty()) {

            return "All fields are required";
        }

        Optional<User> optionalUser =
                userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return "User not found";
        }

        User user =
                optionalUser.get();

        user.setName(name);

        userRepository.save(user);

        return "Name updated successfully";
    }


    // =========================================================
    // REQUEST EMAIL CHANGE
    // =========================================================
    //
    // Sends an OTP to the NEW email address.
    // The user's actual email is NOT changed yet —
    // that only happens after confirmEmailChange()
    // verifies the OTP.
    // =========================================================

    public String requestEmailChange(
            RequestEmailChangeRequest request
    ) {

        if (request == null ||
                request.getCurrentEmail() == null ||
                request.getNewEmail() == null) {

            return "All fields are required";
        }

        String currentEmail =
                request.getCurrentEmail()
                        .trim()
                        .toLowerCase();

        String newEmail =
                request.getNewEmail()
                        .trim()
                        .toLowerCase();

        if (currentEmail.isEmpty() ||
                newEmail.isEmpty()) {

            return "All fields are required";
        }

        // Make sure the logged-in user actually exists.

        Optional<User> optionalUser =
                userRepository.findByEmail(
                        currentEmail
                );

        if (optionalUser.isEmpty()) {
            return "User not found";
        }

        // New email must be different from the current one.

        if (newEmail.equals(currentEmail)) {
            return "New email must be different from your current email";
        }

        // New email must not already belong to another account.

        if (userRepository.existsByEmail(
                newEmail
        )) {

            return "This email is already registered to another account";
        }

        // Send OTP to the NEW email address.

        otpService.generateAndSendOtp(
                newEmail
        );

        return "Verification code sent to new email";
    }


    // =========================================================
    // CONFIRM EMAIL CHANGE
    // =========================================================
    //
    // Verifies the OTP sent to the new email, then actually
    // updates the user's email address in the database.
    // =========================================================

    public String confirmEmailChange(
            ConfirmEmailChangeRequest request
    ) {

        if (request == null ||
                request.getCurrentEmail() == null ||
                request.getNewEmail() == null ||
                request.getOtp() == null) {

            return "All fields are required";
        }

        String currentEmail =
                request.getCurrentEmail()
                        .trim()
                        .toLowerCase();

        String newEmail =
                request.getNewEmail()
                        .trim()
                        .toLowerCase();

        String otp =
                request.getOtp()
                        .trim();

        if (currentEmail.isEmpty() ||
                newEmail.isEmpty() ||
                otp.isEmpty()) {

            return "All fields are required";
        }

        Optional<User> optionalUser =
                userRepository.findByEmail(
                        currentEmail
                );

        if (optionalUser.isEmpty()) {
            return "User not found";
        }

        User user =
                optionalUser.get();

        // Re-check the new email hasn't been taken
        // in the meantime (race condition safety).

        if (userRepository.existsByEmail(
                newEmail
        )) {

            return "This email is already registered to another account";
        }

        // Verify the OTP that was sent to the NEW email.

        boolean otpValid =
                otpService.verifyOtp(
                        newEmail,
                        otp
                );

        if (!otpValid) {
            return "Invalid or expired OTP";
        }

        // Update the user's email.

        user.setEmail(newEmail);

        userRepository.save(user);

        // Clean up the OTP record.

        otpService.deleteOtp(newEmail);

        return "Email updated successfully";
    }

}
