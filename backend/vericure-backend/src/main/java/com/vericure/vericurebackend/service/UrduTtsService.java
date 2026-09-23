package com.vericure.vericurebackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/*
 * ============================================================
 * URDU TEXT-TO-SPEECH
 * ============================================================
 *
 * Spring Boot acts as the public TTS gateway.
 *
 * Mobile application:
 *
 *     POST /api/tts/urdu
 *
 * Spring Boot:
 *
 *     POST http://localhost:8001/tts/urdu
 *
 * FastAPI:
 *
 *     Piper Aegis Female
 *
 * The generated WAV audio is returned to the mobile
 * application.
 *
 * The mobile application never communicates with Piper
 * or FastAPI directly.
 *
 * ============================================================
 */

@Service
public class UrduTtsService {

    private final RestTemplate restTemplate;

    @Value("${model.api.url:http://localhost:8001}")
    private String modelApiUrl;

    public UrduTtsService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Generates Urdu WAV audio through the local FastAPI
     * Piper service.
     */
    public byte[] generateSpeechWav(String text) {

        if (text == null || text.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Text to speak must not be empty."
            );
        }

        String cleanedText = text.trim();

        String url =
                modelApiUrl
                        + "/tts/urdu";

        System.out.println(
                "[Urdu TTS] Sending request to FastAPI: "
                        + url
        );

        try {

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.APPLICATION_JSON
            );

            headers.setAccept(
                    java.util.List.of(
                            MediaType.parseMediaType(
                                    "audio/wav"
                            )
                    )
            );

            Map<String, String> requestBody =
                    Map.of(
                            "text",
                            cleanedText
                    );

            HttpEntity<Map<String, String>> requestEntity =
                    new HttpEntity<>(
                            requestBody,
                            headers
                    );

            var response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            requestEntity,
                            byte[].class
                    );

            byte[] audio =
                    response.getBody();

            if (
                    audio == null
                            || audio.length == 0
            ) {

                throw new RuntimeException(
                        "FastAPI returned empty Urdu audio."
                );
            }

            System.out.println(
                    "[Urdu TTS] WAV received from FastAPI: "
                            + audio.length
                            + " bytes"
            );

            return audio;

        } catch (RestClientException e) {

            System.err.println(
                    "[Urdu TTS] FastAPI request failed."
            );

            System.err.println(
                    "[Urdu TTS] URL: "
                            + url
            );

            System.err.println(
                    "[Urdu TTS] Error: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Urdu TTS service is unavailable: "
                            + e.getMessage(),
                    e
            );

        } catch (Exception e) {

            System.err.println(
                    "[Urdu TTS] Unexpected error: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Failed to generate Urdu speech: "
                            + e.getMessage(),
                    e
            );
        }
    }
}