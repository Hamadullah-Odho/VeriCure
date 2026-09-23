package com.vericure.vericurebackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /*
     * Used by VerificationService to forward scan images
     * to the local FastAPI model service.
     *
     * Model inference can take a few seconds, so timeouts
     * are set generously (30s) to avoid failing on slower
     * hardware.
     */

    @Bean
    public RestTemplate restTemplate() {

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);

        return new RestTemplate(factory);
    }
}
