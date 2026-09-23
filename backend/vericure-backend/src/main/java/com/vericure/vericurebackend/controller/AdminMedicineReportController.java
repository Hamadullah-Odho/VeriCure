package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.entity.MedicineReport;
import com.vericure.vericurebackend.service.MedicineReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 * Under /api/admin — automatically protected by
 * AdminJwtAuthFilter (any APPROVED admin, not head-admin-only,
 * since reviewing medicine reports is routine admin work).
 */

@RestController
@RequestMapping("/api/admin/medicine-reports")
public class AdminMedicineReportController {

    private final MedicineReportService medicineReportService;

    public AdminMedicineReportController(
            MedicineReportService medicineReportService
    ) {
        this.medicineReportService = medicineReportService;
    }

    @GetMapping
    public ResponseEntity<List<MedicineReport>> list(
            @RequestParam(value = "status", required = false)
            String status
    ) {

        return ResponseEntity.ok(
                medicineReportService.listAll(status)
        );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                medicineReportService.updateStatus(
                        id,
                        body.get("status"),
                        body.get("adminNote")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }
}
