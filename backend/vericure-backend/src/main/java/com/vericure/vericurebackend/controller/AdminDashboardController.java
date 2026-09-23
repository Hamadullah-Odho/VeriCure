package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 * Under /api/admin — automatically protected by
 * AdminJwtAuthFilter (any APPROVED admin).
 */

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(
            AdminDashboardService adminDashboardService
    ) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/scans")
    public ResponseEntity<List<Map<String, Object>>> searchScans(
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String query
    ) {

        return ResponseEntity.ok(
                adminDashboardService.searchScans(
                        result,
                        from,
                        to,
                        query
                )
        );
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> dashboardStats() {

        return ResponseEntity.ok(
                adminDashboardService.getSummaryStats()
        );
    }
}
