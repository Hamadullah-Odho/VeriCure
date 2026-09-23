package com.vericure.vericurebackend.service;

import com.vericure.vericurebackend.entity.MedicineReport;
import com.vericure.vericurebackend.repository.MedicineReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MedicineReportService {

    private final MedicineReportRepository medicineReportRepository;

    public MedicineReportService(
            MedicineReportRepository medicineReportRepository
    ) {
        this.medicineReportRepository = medicineReportRepository;
    }


    // =========================================================
    // SUBMIT — from the app's Report Medicine screen. email is
    // optional (null for guests, whose scans/reports are never
    // tied to an account). Unlike the old call-request flow, no
    // phone number is required — this is reporting a medicine,
    // not asking for a callback.
    // =========================================================

    public Map<String, Object> submit(
            String email,
            String medicineName,
            String category,
            String batchNumber,
            String description,
            String contactPhone
    ) {

        if (
                medicineName == null ||
                medicineName.trim().isEmpty()
        ) {
            return Map.of(
                    "success", false,
                    "message", "Medicine name is required."
            );
        }

        MedicineReport report = new MedicineReport();

        report.setReporterEmail(
                (email != null && !email.trim().isEmpty())
                        ? email.trim().toLowerCase()
                        : null
        );

        report.setMedicineName(medicineName.trim());
        report.setCategory(category);
        report.setBatchNumber(batchNumber);
        report.setDescription(description);

        report.setContactPhone(
                (contactPhone != null && !contactPhone.trim().isEmpty())
                        ? contactPhone.trim()
                        : null
        );

        report.setStatus("PENDING");

        medicineReportRepository.save(report);

        return Map.of(
                "success", true,
                "message",
                "Your report has been submitted successfully."
        );
    }


    // =========================================================
    // ADMIN — list / update
    // =========================================================

    public List<MedicineReport> listAll(String statusFilter) {

        if (
                statusFilter != null &&
                !statusFilter.trim().isEmpty()
        ) {
            return medicineReportRepository
                    .findByStatusOrderByCreatedAtDesc(
                            statusFilter.trim().toUpperCase()
                    );
        }

        return medicineReportRepository.findAllByOrderByCreatedAtDesc();
    }

    public Map<String, Object> updateStatus(
            Long id,
            String status,
            String adminNote
    ) {

        Optional<MedicineReport> optionalReport =
                medicineReportRepository.findById(id);

        if (optionalReport.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Report not found."
            );
        }

        MedicineReport report = optionalReport.get();

        if (
                status != null &&
                !status.trim().isEmpty()
        ) {
            report.setStatus(status.trim().toUpperCase());
        }

        if (adminNote != null) {
            report.setAdminNote(adminNote);
        }

        medicineReportRepository.save(report);

        return Map.of(
                "success", true,
                "message", "Report updated."
        );
    }
}
