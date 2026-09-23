package com.vericure.vericurebackend.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.time.Instant;

@Component
public class FastApiProcessManager {

    @Value("${model.api.url:http://localhost:8001}")
    private String modelApiUrl;

    @Value("${model.api.python:python}")
    private String pythonCommand;

    @Value("${model.api.path:}")
    private String modelApiPath;

    @Value("${model.api.auto-start:true}")
    private boolean autoStart;

    private Process fastApiProcess;

    @PostConstruct
    public void startFastAPI() {

        if (!autoStart) {
            System.out.println("[FastAPI] Auto-start is disabled.");
            return;
        }

        System.out.println("==========================================");
        System.out.println("[FastAPI] Starting VeriCure Model API...");
        System.out.println("==========================================");

        // Check if FastAPI is already running
        if (isFastApiRunning()) {
            System.out.println("[FastAPI] Already running at " + modelApiUrl);
            return;
        }

        if (modelApiPath == null || modelApiPath.isBlank()) {
            System.err.println("[FastAPI] ERROR: model.api.path is not configured.");
            System.err.println("[FastAPI] Add the FastAPI folder path to application.properties.");
            return;
        }

        try {

            File workingDirectory = new File(modelApiPath);

            if (!workingDirectory.exists() || !workingDirectory.isDirectory()) {
                System.err.println(
                        "[FastAPI] ERROR: FastAPI directory does not exist: "
                                + workingDirectory.getAbsolutePath()
                );
                return;
            }

            ProcessBuilder processBuilder = new ProcessBuilder(
                    pythonCommand,
                    "-m",
                    "uvicorn",
                    "main:app",
                    "--host",
                    "0.0.0.0",
                    "--port",
                    "8001"
            );

            processBuilder.directory(workingDirectory);

            // Show FastAPI output inside Spring Boot console
            processBuilder.redirectErrorStream(true);
            processBuilder.inheritIO();

            fastApiProcess = processBuilder.start();

            System.out.println(
                    "[FastAPI] Process started. Waiting for API..."
            );

            waitForFastApi();

        } catch (IOException e) {

            System.err.println(
                    "[FastAPI] Failed to start FastAPI: "
                            + e.getMessage()
            );

        }
    }

    private void waitForFastApi() {

        Instant start = Instant.now();

        Duration timeout = Duration.ofSeconds(60);

        while (Duration.between(start, Instant.now()).compareTo(timeout) < 0) {

            if (isFastApiRunning()) {

                System.out.println("==========================================");
                System.out.println("[FastAPI] VeriCure Model API is READY");
                System.out.println("[FastAPI] URL: " + modelApiUrl);
                System.out.println("==========================================");

                return;
            }

            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }

        System.err.println(
                "[FastAPI] WARNING: API did not become ready within 60 seconds."
        );
    }

    private boolean isFastApiRunning() {

        try {

            URI uri = new URI(modelApiUrl + "/health");

            HttpURLConnection connection =
                    (HttpURLConnection) uri.toURL().openConnection();

            connection.setRequestMethod("GET");
            connection.setConnectTimeout(1000);
            connection.setReadTimeout(1000);

            int responseCode = connection.getResponseCode();

            return responseCode == 200;

        } catch (IOException | URISyntaxException e) {

            return false;
        }
    }

    @PreDestroy
    public void stopFastAPI() {

        if (fastApiProcess != null && fastApiProcess.isAlive()) {

            System.out.println("[FastAPI] Stopping VeriCure Model API...");

            fastApiProcess.destroy();

            try {

                if (!fastApiProcess.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)) {
                    fastApiProcess.destroyForcibly();
                }

            } catch (InterruptedException e) {

                Thread.currentThread().interrupt();
                fastApiProcess.destroyForcibly();
            }

            System.out.println("[FastAPI] Stopped.");
        }
    }
}