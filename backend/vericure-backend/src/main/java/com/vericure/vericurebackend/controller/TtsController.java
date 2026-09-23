package com.vericure.vericurebackend.controller;

import com.vericure.vericurebackend.service.UrduTtsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 * ============================================================
 * PUBLIC URDU TTS ENDPOINT
 * ============================================================
 *
 * The mobile application calls:
 *
 *     POST /api/tts/urdu
 *
 * Spring Boot then calls the internal FastAPI service.
 *
 * The mobile application never calls FastAPI or Piper
 * directly.
 *
 * ============================================================
 */

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private final UrduTtsService urduTtsService;

    public TtsController(
            UrduTtsService urduTtsService
    ) {

        this.urduTtsService =
                urduTtsService;
    }


    @PostMapping("/urdu")
    public ResponseEntity<?> speakUrdu(
            @RequestBody Map<String, String> body
    ) {

        String text =
                body.get("text");


        if (
                text == null
                        || text.trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success",
                                    false,

                                    "message",
                                    "text is required."
                            )
                    );
        }


        try {

            byte[] audio =
                    urduTtsService
                            .generateSpeechWav(text);


            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.parseMediaType(
                            "audio/wav"
                    )
            );

            headers.setContentLength(
                    audio.length
            );


            return new ResponseEntity<>(
                    audio,
                    headers,
                    HttpStatus.OK
            );


        } catch (Exception e) {

            e.printStackTrace();


            return ResponseEntity
                    .status(
                            HttpStatus.SERVICE_UNAVAILABLE
                    )
                    .body(
                            Map.of(
                                    "success",
                                    false,

                                    "message",
                                    "Urdu voice audio is temporarily unavailable."
                            )
                    );
        }
    }
}