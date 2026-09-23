from pathlib import Path
import logging
import subprocess
import tempfile
import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = MODEL_DIR / "ur_PK-aegis_female-medium.onnx"
CONFIG_PATH = MODEL_DIR / "ur_PK-aegis_female-medium.onnx.json"

HOST = "0.0.0.0"
PORT = 5001

# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("vericure-urdu-tts")

# ---------------------------------------------------------
# FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="VeriCure Urdu TTS",
    version="1.0.0",
)

# ---------------------------------------------------------
# Request model
# ---------------------------------------------------------

class TTSRequest(BaseModel):
    text: str

# ---------------------------------------------------------
# Validate model files
# ---------------------------------------------------------

logger.info("Initializing VeriCure Urdu TTS...")
logger.info("Model directory: %s", MODEL_DIR)
logger.info("Model: %s", MODEL_PATH)
logger.info("Config: %s", CONFIG_PATH)

if not MODEL_DIR.exists():
    raise RuntimeError(
        f"Model directory does not exist: {MODEL_DIR}"
    )

if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Urdu TTS model not found: {MODEL_PATH}"
    )

if not CONFIG_PATH.exists():
    raise RuntimeError(
        f"Urdu TTS config not found: {CONFIG_PATH}"
    )

# ---------------------------------------------------------
# Piper executable
#
# We intentionally use:
#     python -m piper
# because this is the exact command that worked during
# testing on this computer.
# ---------------------------------------------------------

PIPER_COMMAND = [
    sys.executable,
    "-m",
    "piper",
]

# ---------------------------------------------------------
# Health endpoints
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "success": True,
        "service": "VeriCure Urdu TTS",
        "voice": "Aegis Female",
        "language": "ur-PK",
        "format": "wav",
        "status": "running",
    }

@app.get("/health")
def health():
    return {
        "success": True,
        "modelLoaded": True,
        "voice": "Aegis Female",
        "language": "ur-PK",
        "model": MODEL_PATH.name,
    }

# ---------------------------------------------------------
# Urdu TTS
# ---------------------------------------------------------

@app.post("/tts/urdu")
def generate_urdu_speech(request: TTSRequest):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text is required.",
        )

    logger.info("Urdu TTS request: %s", text)

    output_path = None

    try:
        # -------------------------------------------------
        # Create temporary WAV file
        # -------------------------------------------------

        with tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False,
        ) as temp_file:
            output_path = Path(temp_file.name)

        # -------------------------------------------------
        # Piper command
        # -------------------------------------------------

        command = [
            *PIPER_COMMAND,
            "--model",
            str(MODEL_PATH),
            "--config",
            str(CONFIG_PATH),
            "--output_file",
            str(output_path),
        ]

        logger.info(
            "Running Piper: %s",
            " ".join(command),
        )

        # -------------------------------------------------
        # Run Piper
        # -------------------------------------------------

        result = subprocess.run(
            command,
            input=text,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )

        # -------------------------------------------------
        # Check Piper result
        # -------------------------------------------------

        if result.returncode != 0:
            logger.error(
                "Piper returned exit code %s",
                result.returncode,
            )

            if result.stdout:
                logger.error(
                    "Piper stdout: %s",
                    result.stdout,
                )

            if result.stderr:
                logger.error(
                    "Piper stderr: %s",
                    result.stderr,
                )

            raise RuntimeError(
                result.stderr.strip()
                or "Piper TTS failed."
            )

        # -------------------------------------------------
        # Verify generated file
        # -------------------------------------------------

        if not output_path.exists():
            raise RuntimeError(
                "Piper did not generate an audio file."
            )

        file_size = output_path.stat().st_size

        logger.info(
            "Generated Urdu WAV: %d bytes",
            file_size,
        )

        if file_size <= 44:
            raise RuntimeError(
                "Piper generated an invalid or empty WAV file."
            )

        # -------------------------------------------------
        # Return WAV audio
        # -------------------------------------------------

        return FileResponse(
            path=str(output_path),
            media_type="audio/wav",
            filename="urdu_speech.wav",
            background=None,
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(
            "Urdu TTS generation failed."
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Urdu TTS generation failed: {str(e)}"
            ),
        )

    finally:
        # -------------------------------------------------
        # Do not delete the file here.
        #
        # FileResponse needs the file to remain available
        # while FastAPI sends it to the client.
        #
        # The operating system will handle the temporary
        # file later.
        # -------------------------------------------------
        pass

# ---------------------------------------------------------
# Run server
# ---------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    logger.info(
        "Starting VeriCure Urdu TTS server..."
    )

    logger.info(
        "Voice: Aegis Female"
    )

    logger.info(
        "Language: Urdu (Pakistan)"
    )

    logger.info(
        "Server: http://localhost:%d",
        PORT,
    )

    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
    )
