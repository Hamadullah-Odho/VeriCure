package com.vericure.vericurebackend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/*
 * Replaces the old CallRequest entity/table. Users (or guests)
 * report a suspicious/counterfeit medicine instead of requesting
 * a phone call — see migration_report_medicine.sql for the
 * table rename + column changes this maps onto.
 */

@Entity
@Table(name = "medicine_reports")
public class MedicineReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nullable — guests can submit a report with no account,
    // same as guest scans never being tied to one.
    @Column(name = "reporter_email", length = 150)
    private String reporterEmail;

    @Column(name = "medicine_name", length = 200)
    private String medicineName;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Optional — unlike the old CallRequest, no call is being
    // requested, so a phone number is no longer required. Kept
    // as an optional way for the reporter to be reached back.
    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    // PENDING, IN_PROGRESS, or RESOLVED
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(
            name = "created_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime updatedAt;

    public MedicineReport() {
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReporterEmail() {
        return reporterEmail;
    }

    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
