package com.vericure.vericurebackend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "verification_scans")
public class VerificationScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nullable: a null userId means this was a guest scan,
    // saved anonymously for admin dashboard/Detections
    // visibility only — never tied to any account.
    @Column(name = "user_id", nullable = true)
    private Long userId;

    @Column(name = "medicine_name", nullable = false, length = 200)
    private String medicineName;

    // GENUINE / COUNTERFEIT / UNKNOWN
    @Column(nullable = false, length = 20)
    private String result;

    @Column(name = "front_status", length = 20)
    private String frontStatus;

    @Column(name = "front_confidence")
    private Double frontConfidence;

    @Column(name = "back_status", length = 20)
    private String backStatus;

    @Column(name = "back_confidence")
    private Double backConfidence;

    /*
     * JSON string of Gemini-extracted details:
     * manufacturer, dosage, batchNumber, expiryDate,
     * category, description. Nullable — extraction is a
     * best-effort enrichment, not required for the verdict.
     */
    @Column(name = "extracted_details", columnDefinition = "TEXT")
    private String extractedDetails;

    // -------------------------------------------------
    // Individual Gemini-extracted fields (mirrors the
    // JSON above, kept as real columns so history/detail
    // screens can query and display them directly without
    // parsing JSON every time).
    // -------------------------------------------------

    private String manufacturer;

    private String dosage;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "expiry_date", length = 50)
    private String expiryDate;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double latitude;

    private Double longitude;

    @Column(name = "location_address", length = 500)
    private String locationAddress;

    @Column(
            name = "scanned_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime scannedAt;

    public VerificationScan() {
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getFrontStatus() {
        return frontStatus;
    }

    public void setFrontStatus(String frontStatus) {
        this.frontStatus = frontStatus;
    }

    public Double getFrontConfidence() {
        return frontConfidence;
    }

    public void setFrontConfidence(Double frontConfidence) {
        this.frontConfidence = frontConfidence;
    }

    public String getBackStatus() {
        return backStatus;
    }

    public void setBackStatus(String backStatus) {
        this.backStatus = backStatus;
    }

    public Double getBackConfidence() {
        return backConfidence;
    }

    public void setBackConfidence(Double backConfidence) {
        this.backConfidence = backConfidence;
    }

    public String getExtractedDetails() {
        return extractedDetails;
    }

    public void setExtractedDetails(String extractedDetails) {
        this.extractedDetails = extractedDetails;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public String getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(String expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getScannedAt() {
        return scannedAt;
    }

    public void setScannedAt(LocalDateTime scannedAt) {
        this.scannedAt = scannedAt;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationAddress() {
        return locationAddress;
    }

    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }
}
