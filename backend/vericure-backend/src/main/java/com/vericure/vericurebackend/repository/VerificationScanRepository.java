package com.vericure.vericurebackend.repository;

import com.vericure.vericurebackend.entity.VerificationScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VerificationScanRepository
        extends JpaRepository<VerificationScan, Long> {

    List<VerificationScan> findByUserIdOrderByScannedAtDesc(
            Long userId
    );

    // =========================================================
    // ADMIN QUERIES — across ALL users, not scoped to one.
    // Used by the admin web dashboard only.
    // =========================================================

    @Query(
            "SELECT s FROM VerificationScan s " +
            "WHERE (:result IS NULL OR s.result = :result) " +
            "AND (:from IS NULL OR s.scannedAt >= :from) " +
            "AND (:to IS NULL OR s.scannedAt <= :to) " +
            "AND (" +
            "  :query IS NULL OR " +
            "  LOWER(s.medicineName) LIKE %:query% OR " +
            "  LOWER(s.manufacturer) LIKE %:query% OR " +
            "  LOWER(s.batchNumber) LIKE %:query%" +
            ") " +
            "ORDER BY s.scannedAt DESC"
    )
    List<VerificationScan> searchForAdmin(
            @Param("result") String result,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("query") String query
    );

    long countByResult(String result);
}
