package com.vericure.vericurebackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }



    // =========================================================
    // EXTRACT MEDICINE DETAILS FROM FRONT + BACK IMAGES
    // =========================================================
    //
    // Returns a Map with keys:
    //   isMedicine, medicineName, manufacturer, dosage,
    //   batchNumber, expiryDate, category, description
    //
    // isMedicine is a boolean (Boolean.TRUE / Boolean.FALSE).
    // When Gemini can't be reached or its response can't be
    // parsed, isMedicine defaults to TRUE (fail open) so a
    // Gemini hiccup never blocks a legitimate scan — the
    // counterfeit model still runs and the user still gets a
    // real result, just without the extracted fields.
    //
    // This single call does what used to be two separate Gemini
    // calls (a yes/no "is this medicine" gate, then a second
    // full-field extraction call) — merging them cuts one full
    // Gemini round trip (roughly 4-8 seconds) off every scan.
    //
    // Any field Gemini could not read from the images will
    // be null. If the whole call fails, an empty map plus
    // isMedicine=true is returned (verification still proceeds
    // to the model — this is a "nice to have" enrichment, not
    // a blocker).
    //
    // =========================================================

    public Map<String, Object> extractDetails(
            MultipartFile front,
            MultipartFile back
    ) {

        try {

            String frontBase64 =
                    Base64.getEncoder().encodeToString(
                            front.getBytes()
                    );

            String backBase64 =
                    Base64.getEncoder().encodeToString(
                            back.getBytes()
                    );

            String prompt =
                    "You are analyzing two images (front side and back "
                    + "side) that a user submitted to a medicine "
                    + "authenticity scanner. Respond with ONLY a valid "
                    + "JSON object, no markdown formatting, no extra "
                    + "text, no code fences. Use this exact shape:\n"
                    + "{\n"
                    + "  \"isMedicine\": true or false,\n"
                    + "  \"medicineName\": string or null,\n"
                    + "  \"manufacturer\": string or null,\n"
                    + "  \"dosage\": string or null,\n"
                    + "  \"batchNumber\": string or null,\n"
                    + "  \"expiryDate\": string or null,\n"
                    + "  \"category\": string or null,\n"
                    + "  \"description\": string or null\n"
                    + "}\n"
                    + "First decide \"isMedicine\": true only if EITHER "
                    + "image is a photograph of medicine/pharmaceutical "
                    + "packaging — a medicine box, bottle, blister pack, "
                    + "strip, or vial, with its label or printing "
                    + "visible. Set it to false for anything else (a "
                    + "charger, phone, random object, blank surface, "
                    + "person, food, etc). If \"isMedicine\" is false, "
                    + "set every other field to null and do not guess. "
                    + "If \"isMedicine\" is true, extract the remaining "
                    + "fields from the packaging. \"medicineName\" is "
                    + "the brand/product name printed on the packaging "
                    + "(e.g. \"Panadol Extra\"), not the manufacturer. "
                    + "If a field is not clearly visible in either "
                    + "image, use null for that field. Do not guess or "
                    + "invent values that are not visible in the "
                    + "images.";

            Map<String, Object> textPart =
                    Map.of("text", prompt);

            Map<String, Object> frontImagePart =
                    Map.of(
                            "inline_data",
                            Map.of(
                                    "mime_type", "image/jpeg",
                                    "data", frontBase64
                            )
                    );

            Map<String, Object> backImagePart =
                    Map.of(
                            "inline_data",
                            Map.of(
                                    "mime_type", "image/jpeg",
                                    "data", backBase64
                            )
                    );

            Map<String, Object> content =
                    Map.of(
                            "parts",
                            List.of(
                                    textPart,
                                    frontImagePart,
                                    backImagePart
                            )
                    );

            Map<String, Object> requestBody =
                    Map.of(
                            "contents",
                            List.of(content)
                    );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity =
                    new HttpEntity<>(requestBody, headers);

            String url =
                    geminiApiUrl + "?key=" + geminiApiKey;

            String rawResponse =
                    restTemplate.postForObject(
                            url,
                            requestEntity,
                            String.class
                    );

            return parseGeminiResponse(rawResponse);

        } catch (Exception e) {

            e.printStackTrace();

            // Extraction failed — fail OPEN. isMedicine defaults
            // to true so a Gemini hiccup never blocks a real
            // scan; the model still runs, just without the
            // extracted fields.
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("isMedicine", Boolean.TRUE);
            return fallback;
        }
    }


    // =========================================================
    // PARSE GEMINI RESPONSE -> DETAILS MAP
    // =========================================================

    private Map<String, Object> parseGeminiResponse(
            String rawResponse
    ) throws Exception {

        JsonNode root =
                objectMapper.readTree(rawResponse);

        JsonNode textNode =
                root
                        .path("candidates")
                        .path(0)
                        .path("content")
                        .path("parts")
                        .path(0)
                        .path("text");

        if (textNode.isMissingNode()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("isMedicine", Boolean.TRUE);
            return fallback;
        }

        String text = textNode.asText();

        // Strip markdown code fences if Gemini added them
        // despite being asked not to (```json ... ```)
        String cleaned =
                text
                        .replaceAll("(?s)```json", "")
                        .replaceAll("(?s)```", "")
                        .trim();

        JsonNode detailsNode =
                objectMapper.readTree(cleaned);

        Map<String, Object> details = new HashMap<>();

        // isMedicine: default to true (fail open) ONLY when the
        // field is genuinely missing/unreadable. Gemini won't
        // always return a strict JSON boolean literal — it may
        // return "false" as a string, or 0/1 — so we use
        // asBoolean(true), which correctly coerces those forms,
        // instead of only trusting isBoolean(). The previous
        // version treated ANY non-strict-boolean value (including
        // an explicit textual "false") as "couldn't parse" and
        // defaulted to true — meaning a real "this is not
        // medicine" answer from Gemini could silently get flipped
        // to "is medicine" and let a non-medicine image reach the
        // counterfeit model, which is the bug this fixes.
        JsonNode isMedicineNode = detailsNode.get("isMedicine");

        boolean isMedicine = true;

        if (isMedicineNode != null && !isMedicineNode.isNull()) {
            isMedicine = isMedicineNode.asBoolean(true);
        }

        details.put("isMedicine", isMedicine);

        System.out.println(
                "[GEMINI] isMedicine raw node: " + isMedicineNode
                        + " -> parsed: " + isMedicine
        );

        String[] fields = {
                "medicineName",
                "manufacturer",
                "dosage",
                "batchNumber",
                "expiryDate",
                "category",
                "description"
        };

        for (String field : fields) {

            JsonNode fieldNode = detailsNode.get(field);

            if (
                    fieldNode != null &&
                    !fieldNode.isNull()
            ) {
                details.put(
                        field,
                        fieldNode.asText()
                );
            } else {
                details.put(field, null);
            }
        }

        return details;
    }
}
