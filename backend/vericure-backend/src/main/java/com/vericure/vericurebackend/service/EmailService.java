package com.vericure.vericurebackend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * ============================================================
 * EMAIL SERVICE
 * ============================================================
 *
 * Central place for every outgoing transactional email
 * (OTP codes, account-created confirmation, etc). Keeping the
 * HTML template + sending logic here means OtpService and
 * AuthService just ask for an email to be sent — they don't
 * each build their own HTML.
 *
 * All emails share one visual shell (buildEmailShell) so a
 * brand/color update only has to happen in one place.
 * ============================================================
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    private static final String BRAND_NAME = "VeriCure";
    private static final String BRAND_TAGLINE = "Scan. Verify. Trust.";

    // Matches the app's dark navy + cyan theme.
    private static final String COLOR_HEADER_BG = "#0B1220";
    private static final String COLOR_ACCENT = "#22D3EE";
    private static final String COLOR_TEXT = "#1F2937";
    private static final String COLOR_MUTED = "#6B7280";
    private static final String COLOR_PAGE_BG = "#F3F4F6";
    private static final String COLOR_CARD_BG = "#FFFFFF";
    private static final String COLOR_BORDER = "#E5E7EB";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }


    // =========================================================
    // OTP EMAIL
    // =========================================================

    public void sendOtpEmail(String toEmail, String otp) {

        String subject = BRAND_NAME + " Verification Code";

        String otpDigitsHtml = buildOtpDigitsHtml(otp);

        String bodyHtml =
                "<tr>"
                        + "<td style=\"padding: 36px 40px 8px 40px; text-align: center;\">"
                        + "<p style=\"margin: 0 0 4px 0; font-size: 15px; color: " + COLOR_MUTED + ";\">"
                        + "Your verification code is"
                        + "</p>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 8px 40px 8px 40px; text-align: center;\">"
                        + otpDigitsHtml
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 8px 40px 28px 40px; text-align: center;\">"
                        + "<p style=\"margin: 0; font-size: 13px; color: " + COLOR_MUTED + ";\">"
                        + "This code expires in <strong>5 minutes</strong>."
                        + "</p>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 0 40px 32px 40px;\">"
                        + "<div style=\"height: 1px; background-color: " + COLOR_BORDER + ";\"></div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 0 40px 36px 40px; text-align: center;\">"
                        + "<p style=\"margin: 0; font-size: 13px; line-height: 20px; color: " + COLOR_MUTED + ";\">"
                        + "If you didn't request this code, you can safely ignore this email — "
                        + "no changes will be made to your account."
                        + "</p>"
                        + "</td>"
                        + "</tr>";

        String html = buildEmailShell(bodyHtml);

        sendHtmlEmail(toEmail, subject, html);
    }


    // =========================================================
    // ACCOUNT CREATED EMAIL
    // =========================================================

    public void sendAccountCreatedEmail(
            String toEmail,
            String name
    ) {

        String subject =
                "Welcome to " + BRAND_NAME + " — Account Created";

        String displayName =
                (name != null && !name.trim().isEmpty())
                        ? name.trim()
                        : "there";

        String bodyHtml =
                "<tr>"
                        + "<td style=\"padding: 36px 40px 4px 40px; text-align: center;\">"
                        + "<div style=\"font-size: 40px; line-height: 1; margin-bottom: 8px;\">🎉</div>"
                        + "<h2 style=\"margin: 0; font-size: 20px; color: " + COLOR_TEXT + ";\">"
                        + "Welcome, " + escapeHtml(displayName) + "!"
                        + "</h2>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 14px 40px 28px 40px; text-align: center;\">"
                        + "<p style=\"margin: 0; font-size: 14px; line-height: 22px; color: " + COLOR_MUTED + ";\">"
                        + "Your " + BRAND_NAME + " account has been created successfully. "
                        + "You're all set to start verifying your medicines."
                        + "</p>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 0 40px 8px 40px;\">"
                        + "<div style=\"height: 1px; background-color: " + COLOR_BORDER + ";\"></div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 24px 40px 8px 40px;\">"
                        + buildFeatureRow("🔍", "Scan medicine packaging to check authenticity in seconds")
                        + buildFeatureRow("📊", "Track your scan history and view insights over time")
                        + buildFeatureRow("💊", "Keep a personal cabinet of your saved medicines")
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td style=\"padding: 20px 40px 36px 40px; text-align: center;\">"
                        + "<p style=\"margin: 0; font-size: 13px; line-height: 20px; color: " + COLOR_MUTED + ";\">"
                        + "If you didn't create this account, please ignore this email."
                        + "</p>"
                        + "</td>"
                        + "</tr>";

        String html = buildEmailShell(bodyHtml);

        sendHtmlEmail(toEmail, subject, html);
    }


    // =========================================================
    // SHARED TEMPLATE PIECES
    // =========================================================

    private String buildOtpDigitsHtml(String otp) {

        StringBuilder digitsHtml = new StringBuilder();

        digitsHtml.append(
                "<table role=\"presentation\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin: 0 auto;\"><tr>"
        );

        for (char digit : otp.toCharArray()) {

            digitsHtml.append(
                    "<td style=\""
                            + "width: 48px; height: 56px; "
                            + "background-color: " + COLOR_PAGE_BG + "; "
                            + "border: 1px solid " + COLOR_BORDER + "; "
                            + "border-radius: 10px; "
                            + "text-align: center; vertical-align: middle; "
                            + "font-size: 26px; font-weight: 700; "
                            + "color: " + COLOR_TEXT + "; "
                            + "font-family: 'Courier New', monospace;"
                            + "\">"
                            + digit
                            + "</td>"
                            + "<td style=\"width: 8px;\"></td>"
            );
        }

        digitsHtml.append("</tr></table>");

        return digitsHtml.toString();
    }

    private String buildFeatureRow(String emoji, String text) {

        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-bottom: 14px;\">"
                + "<tr>"
                + "<td style=\"width: 32px; font-size: 18px; vertical-align: top;\">" + emoji + "</td>"
                + "<td style=\"font-size: 13px; line-height: 20px; color: " + COLOR_TEXT + ";\">" + text + "</td>"
                + "</tr>"
                + "</table>";
    }

    /**
     * Wraps a body (a series of &lt;tr&gt; rows) in the shared
     * header/footer shell every VeriCure email uses.
     */
    private String buildEmailShell(String bodyRowsHtml) {

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset=\"utf-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                + "<title>" + BRAND_NAME + "</title>"
                + "</head>"
                + "<body style=\"margin: 0; padding: 0; background-color: " + COLOR_PAGE_BG + "; "
                + "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"background-color: " + COLOR_PAGE_BG + "; padding: 32px 16px;\">"
                + "<tr>"
                + "<td align=\"center\">"
                + "<table role=\"presentation\" width=\"480\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width: 480px; width: 100%; background-color: " + COLOR_CARD_BG + "; "
                + "border-radius: 16px; overflow: hidden; border: 1px solid " + COLOR_BORDER + ";\">"

                // ---- HEADER ----
                + "<tr>"
                + "<td style=\"background-color: " + COLOR_HEADER_BG + "; padding: 28px 40px; text-align: center;\">"
                + "<div style=\"font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;\">"
                + "🛡️ " + BRAND_NAME
                + "</div>"
                + "<div style=\"margin-top: 4px; font-size: 12px; color: " + COLOR_ACCENT + "; letter-spacing: 1px; text-transform: uppercase;\">"
                + BRAND_TAGLINE
                + "</div>"
                + "</td>"
                + "</tr>"

                // ---- BODY (caller-supplied rows) ----
                + bodyRowsHtml

                // ---- FOOTER ----
                + "<tr>"
                + "<td style=\"background-color: " + COLOR_PAGE_BG + "; padding: 18px 40px; text-align: center; "
                + "border-top: 1px solid " + COLOR_BORDER + ";\">"
                + "<p style=\"margin: 0; font-size: 11px; color: " + COLOR_MUTED + ";\">"
                + "© " + java.time.Year.now().getValue() + " " + BRAND_NAME + ". All rights reserved."
                + "</p>"
                + "</td>"
                + "</tr>"

                + "</table>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

    private String escapeHtml(String input) {

        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }


    // =========================================================
    // LOW-LEVEL SEND
    // =========================================================

    /**
     * Sends an HTML email. Failures are logged, not thrown —
     * callers (OTP generation, registration) already worked
     * before email HTML existed and shouldn't start throwing
     * 500s just because a mail server hiccup occurs.
     */
    private void sendHtmlEmail(
            String toEmail,
            String subject,
            String htmlBody
    ) {

        try {

            MimeMessage mimeMessage =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            mimeMessage,
                            false,
                            "UTF-8"
                    );

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);

            System.out.println(
                    "Email sent successfully to: " + toEmail
                            + " | Subject: " + subject
            );

        } catch (MessagingException e) {

            System.out.println(
                    "FAILED to send email to: " + toEmail
                            + " | Subject: " + subject
            );

            e.printStackTrace();
        }
    }
}
