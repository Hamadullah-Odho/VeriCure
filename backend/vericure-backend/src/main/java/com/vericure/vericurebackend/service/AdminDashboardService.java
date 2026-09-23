package com.vericure.vericurebackend.service;

import com.vericure.vericurebackend.entity.User;
import com.vericure.vericurebackend.entity.VerificationScan;
import com.vericure.vericurebackend.repository.UserRepository;
import com.vericure.vericurebackend.repository.VerificationScanRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final VerificationScanRepository verificationScanRepository;
    private final UserRepository userRepository;

    public AdminDashboardService(
            VerificationScanRepository verificationScanRepository,
            UserRepository userRepository
    ) {
        this.verificationScanRepository = verificationScanRepository;
        this.userRepository = userRepository;
    }


    // =========================================================
    // SEARCH / LIST SCANS — across every user, with optional
    // filters. Attaches the scanning user's name/email onto
    // each row since VerificationScan only stores a userId.
    // =========================================================

    public List<Map<String, Object>> searchScans(
            String result,
            String from,
            String to,
            String query
    ) {

        LocalDateTime fromDateTime =
                parseDateOrNull(from, false);

        LocalDateTime toDateTime =
                parseDateOrNull(to, true);

        String normalizedQuery =
                (query != null && !query.trim().isEmpty())
                        ? query.trim().toLowerCase()
                        : null;

        String normalizedResult =
                (result != null && !result.trim().isEmpty())
                        ? result.trim().toUpperCase()
                        : null;

        List<VerificationScan> scans =
                verificationScanRepository.searchForAdmin(
                        normalizedResult,
                        fromDateTime,
                        toDateTime,
                        normalizedQuery
                );

        // Batch-fetch the users behind these scans instead of
        // querying one at a time per row. Guest scans have a
        // null userId (see VerificationScan.userId) — filtered
        // out here since findAllById() can't be given a null.
        Set<Long> userIds =
                scans.stream()
                        .map(VerificationScan::getUserId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

        Map<Long, User> usersById =
                userRepository.findAllById(userIds)
                        .stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u
                        ));

        List<Map<String, Object>> response =
                new ArrayList<>();

        for (VerificationScan scan : scans) {

            boolean isGuestScan = scan.getUserId() == null;

            User user =
                    isGuestScan
                            ? null
                            : usersById.get(scan.getUserId());

            Map<String, Object> row = new HashMap<>();
            row.put("id", scan.getId());
            row.put("medicineName", scan.getMedicineName());
            row.put("result", scan.getResult());
            row.put("manufacturer", scan.getManufacturer());
            row.put("dosage", scan.getDosage());
            row.put("batchNumber", scan.getBatchNumber());
            row.put("expiryDate", scan.getExpiryDate());
            row.put("category", scan.getCategory());
            row.put("description", scan.getDescription());
            row.put("frontStatus", scan.getFrontStatus());
            row.put("frontConfidence", scan.getFrontConfidence());
            row.put("backStatus", scan.getBackStatus());
            row.put("backConfidence", scan.getBackConfidence());
            row.put("latitude", scan.getLatitude());
            row.put("longitude", scan.getLongitude());
            row.put("locationAddress", scan.getLocationAddress());
            row.put("scannedAt", scan.getScannedAt());
            row.put("isGuestScan", isGuestScan);
            row.put(
                    "reportedByName",
                    isGuestScan
                            ? "Guest"
                            : (user != null ? user.getName() : "Unknown")
            );
            row.put(
                    "reportedByEmail",
                    user != null ? user.getEmail() : null
            );

            response.add(row);
        }

        return response;
    }


    // =========================================================
    // DASHBOARD SUMMARY STATS
    // =========================================================

    public Map<String, Object> getSummaryStats() {

        long totalScans =
                verificationScanRepository.count();

        long genuineCount =
                verificationScanRepository.countByResult("GENUINE");

        long counterfeitCount =
                verificationScanRepository.countByResult("COUNTERFEIT");

        long unknownCount =
                verificationScanRepository.countByResult("UNKNOWN");

        LocalDateTime sevenDaysAgo =
                LocalDateTime.now().minusDays(7);

        LocalDateTime thirtyDaysAgo =
                LocalDateTime.now().minusDays(30);

        long lastSevenDaysCounterfeit =
                verificationScanRepository.searchForAdmin(
                        "COUNTERFEIT",
                        sevenDaysAgo,
                        null,
                        null
                ).size();

        long lastThirtyDaysCounterfeit =
                verificationScanRepository.searchForAdmin(
                        "COUNTERFEIT",
                        thirtyDaysAgo,
                        null,
                        null
                ).size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalScans", totalScans);
        stats.put("genuineCount", genuineCount);
        stats.put("counterfeitCount", counterfeitCount);
        stats.put("unknownCount", unknownCount);
        stats.put("counterfeitLast7Days", lastSevenDaysCounterfeit);
        stats.put("counterfeitLast30Days", lastThirtyDaysCounterfeit);

        return stats;
    }


    // =========================================================
    // HELPERS
    // =========================================================

    private LocalDateTime parseDateOrNull(
            String dateStr,
            boolean endOfDay
    ) {

        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        try {

            java.time.LocalDate date =
                    java.time.LocalDate.parse(
                            dateStr.trim(),
                            DateTimeFormatter.ISO_LOCAL_DATE
                    );

            return endOfDay
                    ? date.atTime(23, 59, 59)
                    : date.atStartOfDay();

        } catch (Exception e) {

            return null;
        }
    }
}
