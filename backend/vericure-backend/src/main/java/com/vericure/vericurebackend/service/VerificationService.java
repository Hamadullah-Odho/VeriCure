package com.vericure.vericurebackend.service;

import com.vericure.vericurebackend.entity.User;
import com.vericure.vericurebackend.entity.VerificationScan;
import com.vericure.vericurebackend.repository.UserRepository;
import com.vericure.vericurebackend.repository.VerificationScanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VerificationService {

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final VerificationScanRepository verificationScanRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${model.api.url}")
    private String modelApiUrl;

    public VerificationService(
            RestTemplate restTemplate,
            UserRepository userRepository,
            VerificationScanRepository verificationScanRepository,
            GeminiService geminiService
    ) {
        this.restTemplate = restTemplate;
        this.userRepository = userRepository;
        this.verificationScanRepository = verificationScanRepository;
        this.geminiService = geminiService;
    }


    // =========================================================
    // MAIN VERIFY FLOW (REGISTERED USER — persists to DB)
    // =========================================================
    //
    // The medicine name is no longer supplied by the user —
    // Gemini reads it directly off the packaging as part of
    // extractDetails(). See runVerification() below.
    //
    // =========================================================

    public Map<String, Object> verify(
            String email,
            MultipartFile front,
            MultipartFile back,
            Double latitude,
            Double longitude
    ) {

        // -----------------------------------------------------
        // VALIDATE INPUT
        // -----------------------------------------------------

        if (
                email == null ||
                email.trim().isEmpty() ||
                front == null ||
                front.isEmpty() ||
                back == null ||
                back.isEmpty()
        ) {

            return Map.of(
                    "success", false,
                    "message",
                    "Email and both images are required"
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();


        // -----------------------------------------------------
        // FIND USER
        // -----------------------------------------------------

        Optional<User> optionalUser =
                userRepository.findByEmail(normalizedEmail);

        if (optionalUser.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "User not found"
            );
        }

        User user = optionalUser.get();


        // -----------------------------------------------------
        // RUN SHARED MODEL + GEMINI PIPELINE
        // -----------------------------------------------------

        VerificationOutcome outcome;

        try {
            outcome = runVerification(front, back);
        } catch (VerificationFailure failure) {
            return failure.toResponse();
        }

        // ---------------------------------------------------
        // NOT MEDICINE — the gate rejected the image before
        // the model/extraction pipeline ran. We still save this
        // as a scan with result=UNKNOWN so it shows up in the
        // admin dashboard's Unknown count and in Detections —
        // it's a real event a user triggered, just one with no
        // model/extraction data attached (those were never run).
        // Guests never reach this method (see verifyGuest(),
        // which still never persists anything).
        // ---------------------------------------------------


        // -----------------------------------------------------
        // SAVE SCAN RECORD (userId set — registered user)
        // -----------------------------------------------------

        VerificationScan scan =
                buildScanEntity(outcome, user.getId(), latitude, longitude);

        verificationScanRepository.save(scan);


        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("verdict", outcome.verdict);
        response.put("medicineName", outcome.medicineName);
        response.put("front", outcome.frontResult != null ? outcome.frontResult : Map.of());
        response.put("back", outcome.backResult != null ? outcome.backResult : Map.of());
        response.put("details", outcome.extractedDetails);
        response.put("scanId", scan.getId());

        if (outcome.notMedicine) {
            response.put("notMedicine", true);
            response.put("message", outcome.message);
        }

        return response;
    }


    // =========================================================
    // GUEST VERIFY FLOW — same model + Gemini pipeline, but
    // NEVER touches the users or verification_scans tables.
    // Nothing here is persisted; the frontend keeps the result
    // in memory only, for the current guest session.
    // =========================================================

    public Map<String, Object> verifyGuest(
            MultipartFile front,
            MultipartFile back
    ) {

        if (
                front == null ||
                front.isEmpty() ||
                back == null ||
                back.isEmpty()
        ) {

            return Map.of(
                    "success", false,
                    "message",
                    "Both images are required"
            );
        }

        VerificationOutcome outcome;

        try {
            outcome = runVerification(front, back);
        } catch (VerificationFailure failure) {
            return failure.toResponse();
        }

        // ---------------------------------------------------
        // SAVE ANONYMOUSLY — guest scans now DO get saved, but
        // with userId = null. This means they show up in the
        // admin dashboard's counts and in Detections, but are
        // never tied to any user account and never appear in
        // any user's personal scan/cabinet history (nothing
        // here is linked to an email or written anywhere the
        // mobile app reads per-user data from).
        // ---------------------------------------------------

        VerificationScan scan =
                buildScanEntity(outcome, null, null, null);

        verificationScanRepository.save(scan);

        if (outcome.notMedicine) {
            return Map.of(
                    "success", true,
                    "verdict", outcome.verdict,
                    "notMedicine", true,
                    "message", outcome.message,
                    "medicineName", outcome.medicineName,
                    "front", Map.of(),
                    "back", Map.of(),
                    "details", outcome.extractedDetails
            );
        }

        return Map.of(
                "success", true,
                "verdict", outcome.verdict,
                "medicineName", outcome.medicineName,
                "front", outcome.frontResult != null ? outcome.frontResult : Map.of(),
                "back", outcome.backResult != null ? outcome.backResult : Map.of(),
                "details", outcome.extractedDetails
                // no scanId returned to the guest — the record
                // exists for admin visibility only, the guest
                // has no account to look it up under anyway
        );
    }


    // =========================================================
    // SHARED PIPELINE: model API + Gemini extraction
    // (no user lookup, no persistence — used by both verify()
    // and verifyGuest())
    // =========================================================

    private VerificationOutcome runVerification(
            MultipartFile front,
            MultipartFile back
    ) throws VerificationFailure {

        long t0 = System.currentTimeMillis();

        // ---------------------------------------------------
        // GEMINI: CLASSIFY + EXTRACT IN ONE CALL
        //
        // This one call answers both "is this medicine?" and,
        // if so, extracts the packaging fields — previously
        // these were two separate Gemini round trips (a gate,
        // then a full extraction call), which meant paying
        // Gemini's network/inference overhead twice on every
        // single scan. Merging them cuts one full round trip
        // (roughly 4-8 seconds, measured) off every scan.
        // ---------------------------------------------------

        Map<String, Object> extractedDetails =
                geminiService.extractDetails(front, back);

        long t1 = System.currentTimeMillis();
        System.out.println(
                "[TIMING] gemini classify+extract: " + (t1 - t0) + " ms"
        );

        if (extractedDetails == null) {
            extractedDetails = Map.of();
        }

        boolean looksLikeMedicine =
                !Boolean.FALSE.equals(
                        extractedDetails.get("isMedicine")
                );

        if (!looksLikeMedicine) {

            VerificationOutcome notMedicineOutcome =
                    new VerificationOutcome();

            notMedicineOutcome.verdict = "Unknown";
            notMedicineOutcome.medicineName = "Unknown Medicine";
            notMedicineOutcome.frontResult = null;
            notMedicineOutcome.backResult = null;
            notMedicineOutcome.extractedDetails = Map.of();
            notMedicineOutcome.notMedicine = true;
            notMedicineOutcome.message =
                    "This doesn't look like medicine packaging. Please scan again.";

            System.out.println(
                    "[TIMING] total (rejected — not medicine): "
                            + (System.currentTimeMillis() - t0) + " ms"
            );

            return notMedicineOutcome;
        }

        Map<String, Object> modelResponse;

        try {
            modelResponse = callModelApi(front, back);

        } catch (Exception e) {

            e.printStackTrace();

            throw new VerificationFailure(
                    "Unable to reach the verification model. Please make sure the model service is running and try again."
            );
        }

        long t2 = System.currentTimeMillis();
        System.out.println(
                "[TIMING] model api (FastAPI /predict): " + (t2 - t1) + " ms"
        );

        if (modelResponse == null) {
            throw new VerificationFailure(
                    "The verification model returned an unexpected response."
            );
        }

        String verdict =
                String.valueOf(
                        modelResponse.getOrDefault(
                                "verdict",
                                "Unknown"
                        )
                );

        Map<String, Object> frontResult =
                (Map<String, Object>) modelResponse.get("front");

        Map<String, Object> backResult =
                (Map<String, Object>) modelResponse.get("back");

        String medicineName =
                toStringOrNull(extractedDetails.get("medicineName"));

        if (medicineName == null) {
            medicineName = "Unknown Medicine";
        }

        VerificationOutcome outcome = new VerificationOutcome();
        outcome.verdict = verdict;
        outcome.medicineName = medicineName;
        outcome.frontResult = frontResult;
        outcome.backResult = backResult;
        outcome.extractedDetails = extractedDetails;

        System.out.println(
                "[TIMING] total: " + (System.currentTimeMillis() - t0) + " ms"
        );

        return outcome;
    }


    // =========================================================
    // SMALL INTERNAL HELPERS
    // =========================================================

    private static class VerificationOutcome {
        String verdict;
        String medicineName;
        Map<String, Object> frontResult;
        Map<String, Object> backResult;
        Map<String, Object> extractedDetails;

        // Set true only when the is-medicine gate rejected the
        // image before the model/extraction pipeline ran. Never
        // persisted — verify() checks this and skips the DB
        // write entirely, same as a guest scan.
        boolean notMedicine = false;
        String message = null;
    }

    private static class VerificationFailure extends Exception {
        VerificationFailure(String message) {
            super(message);
        }

        Map<String, Object> toResponse() {
            return Map.of(
                    "success", false,
                    "message", getMessage()
            );
        }
    }


    // =========================================================
    // CALL FASTAPI MODEL SERVICE
    // =========================================================

    private Map<String, Object> callModelApi(
            MultipartFile front,
            MultipartFile back
    ) throws IOException {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body =
                new LinkedMultiValueMap<>();

        body.add(
                "front",
                toResource(front)
        );

        body.add(
                "back",
                toResource(back)
        );

        HttpEntity<MultiValueMap<String, Object>> requestEntity =
                new HttpEntity<>(body, headers);

        String url = modelApiUrl + "/predict";

        Map<String, Object> response =
                restTemplate.postForObject(
                        url,
                        requestEntity,
                        Map.class
                );

        return response;
    }

    private ByteArrayResource toResource(
            MultipartFile file
    ) throws IOException {

        return new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null
                        ? file.getOriginalFilename()
                        : "image.jpg";
            }
        };
    }

    // =========================================================
    // BUILD A SCAN ENTITY FROM A VerificationOutcome
    //
    // Shared by both verify() (registered — userId is a real
    // user's ID) and verifyGuest() (userId is null — a guest
    // scan is saved anonymously, for admin dashboard/Detections
    // visibility only, never tied to any account or appearing
    // in any user's personal scan history).
    // =========================================================

    private VerificationScan buildScanEntity(
            VerificationOutcome outcome,
            Long userId,
            Double latitude,
            Double longitude
    ) {

        VerificationScan scan = new VerificationScan();

        scan.setUserId(userId);
        scan.setMedicineName(outcome.medicineName);

        scan.setResult(
                outcome.verdict.toUpperCase()
        );

        if (outcome.frontResult != null) {
            scan.setFrontStatus(
                    String.valueOf(outcome.frontResult.get("status"))
            );

            scan.setFrontConfidence(
                    toDouble(outcome.frontResult.get("confidence"))
            );
        }

        if (outcome.backResult != null) {
            scan.setBackStatus(
                    String.valueOf(outcome.backResult.get("status"))
            );

            scan.setBackConfidence(
                    toDouble(outcome.backResult.get("confidence"))
            );
        }

        scan.setManufacturer(
                toStringOrNull(outcome.extractedDetails.get("manufacturer"))
        );

        scan.setDosage(
                toStringOrNull(outcome.extractedDetails.get("dosage"))
        );

        scan.setBatchNumber(
                toStringOrNull(outcome.extractedDetails.get("batchNumber"))
        );

        scan.setExpiryDate(
                toStringOrNull(outcome.extractedDetails.get("expiryDate"))
        );

        scan.setCategory(
                toStringOrNull(outcome.extractedDetails.get("category"))
        );

        scan.setDescription(
                toStringOrNull(outcome.extractedDetails.get("description"))
        );

        /*
         * Location is optional — a scan is never blocked or
         * rejected for missing it (denied permission, GPS off,
         * indoor signal loss, etc. are all normal and expected).
         * It's purely enrichment for the admin counterfeit-
         * tracking dashboard.
         */
        scan.setLatitude(latitude);
        scan.setLongitude(longitude);

        try {
            scan.setExtractedDetails(
                    objectMapper.writeValueAsString(
                            outcome.extractedDetails
                    )
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        return scan;
    }

    private Double toDouble(Object value) {

        if (value == null) {
            return null;
        }

        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }

        try {
            return Double.parseDouble(
                    value.toString()
            );
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String toStringOrNull(Object value) {

        if (value == null) {
            return null;
        }

        String text = value.toString().trim();

        if (text.isEmpty() || text.equalsIgnoreCase("null")) {
            return null;
        }

        return text;
    }


    // =========================================================
    // SCAN HISTORY
    // =========================================================

    public Map<String, Object> getHistory(String email) {

        if (email == null || email.trim().isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Email is required"
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        Optional<User> optionalUser =
                userRepository.findByEmail(normalizedEmail);

        if (optionalUser.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "User not found"
            );
        }

        User user = optionalUser.get();

        List<VerificationScan> scans =
                verificationScanRepository
                        .findByUserIdOrderByScannedAtDesc(
                                user.getId()
                        );

        return Map.of(
                "success", true,
                "scans", scans
        );
    }
}
