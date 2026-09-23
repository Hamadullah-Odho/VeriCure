package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.service.MedicineReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 * Public endpoint — reachable by both registered users and
 * guests from the app's Report Medicine screen. NOT under
 * /api/admin, so it is NOT protected by the admin JWT filter.
 */

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final MedicineReportService medicineReportService;

    public SupportController(
            MedicineReportService medicineReportService
    ) {
        this.medicineReportService = medicineReportService;
    }

    @PostMapping("/report-medicine")
    public ResponseEntity<Map<String, Object>> reportMedicine(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> result =
                medicineReportService.submit(
                        body.get("email"),
                        body.get("medicineName"),
                        body.get("category"),
                        body.get("batchNumber"),
                        body.get("description"),
                        body.get("contactPhone")
                );

        boolean success =
                Boolean.TRUE.equals(result.get("success"));

        return success
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }
}
