package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.service.GeminiService;
import com.vericure.vericurebackend.service.VerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/verification")
public class VerificationController {

    private final VerificationService verificationService;
    private final GeminiService geminiService;

    public VerificationController(
            VerificationService verificationService,
            GeminiService geminiService
    ) {
        this.verificationService = verificationService;
        this.geminiService = geminiService;
    }


    // =========================================================
    // EXTRACT DETAILS ONLY — no counterfeit check, nothing
    // saved. Used by the Medicine Cabinet's "Add Medicine"
    // flow, where the user just wants Gemini to read a
    // medicine's packaging (name, manufacturer, dosage, batch,
    // expiry, category) so they don't have to type it all in
    // by hand — NOT to authenticity-check it.
    // =========================================================

    @PostMapping(
            value = "/extract-details",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<Map<String, Object>> extractDetails(
            @RequestParam("front") MultipartFile front,
            @RequestParam("back") MultipartFile back
    ) {

        try {

            Map<String, Object> details =
                    geminiService.extractDetails(front, back);

            if (details == null) {
                details = Map.of();
            }

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "details", details
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Unable to read details from these images. Please try again."
                            )
                    );
        }
    }


    // =========================================================
    // SCAN + VERIFY (REGISTERED USER — saved to history)
    // =========================================================
    //
    // multipart/form-data with fields:
    //   email          (text)
    //   front          (file)
    //   back           (file)
    //
    // Medicine name is no longer a client-supplied field —
    // Gemini reads it off the packaging as part of the
    // extraction step.
    //
    // =========================================================

    @PostMapping(
            value = "/scan",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<Map<String, Object>> scan(
            @RequestParam("email") String email,
            @RequestParam("front") MultipartFile front,
            @RequestParam("back") MultipartFile back,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude
    ) {

        try {

            Map<String, Object> result =
                    verificationService.verify(
                            email,
                            front,
                            back,
                            latitude,
                            longitude
                    );

            boolean success =
                    Boolean.TRUE.equals(
                            result.get("success")
                    );

            if (success) {
                return ResponseEntity.ok(result);
            }

            return ResponseEntity.badRequest().body(result);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Unable to process verification. Please try again."
                            )
                    );
        }
    }


    // =========================================================
    // SCAN + VERIFY (GUEST — NOT saved, no user required)
    // =========================================================
    //
    // multipart/form-data with fields:
    //   front          (file)
    //   back           (file)
    //
    // Runs the exact same model + Gemini pipeline as /scan,
    // but never touches the users or verification_scans
    // tables. The result lives only in the app's in-memory
    // guest session and is discarded when Guest Mode ends.
    //
    // =========================================================

    @PostMapping(
            value = "/scan-guest",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<Map<String, Object>> scanGuest(
            @RequestParam("front") MultipartFile front,
            @RequestParam("back") MultipartFile back
    ) {

        try {

            Map<String, Object> result =
                    verificationService.verifyGuest(
                            front,
                            back
                    );

            boolean success =
                    Boolean.TRUE.equals(
                            result.get("success")
                    );

            if (success) {
                return ResponseEntity.ok(result);
            }

            return ResponseEntity.badRequest().body(result);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Unable to process verification. Please try again."
                            )
                    );
        }
    }


    // =========================================================
    // SCAN HISTORY
    // =========================================================

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> history(
            @RequestParam("email") String email
    ) {

        try {

            Map<String, Object> result =
                    verificationService.getHistory(email);

            boolean success =
                    Boolean.TRUE.equals(
                            result.get("success")
                    );

            if (success) {
                return ResponseEntity.ok(result);
            }

            return ResponseEntity.badRequest().body(result);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Unable to load scan history."
                            )
                    );
        }
    }
}
