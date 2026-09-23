"""
============================================================
VeriCure Model API
============================================================

FastAPI service for:

1. Medicine counterfeit detection
2. Urdu Text-to-Speech using Piper Aegis Female

Spring Boot automatically starts this FastAPI service.

The mobile application DOES NOT communicate with Piper
directly. It only communicates with Spring Boot.

Architecture:

    React Native
          |
          | /api/tts/urdu
          v
    Spring Boot
          |
          | /tts/urdu
          v
    FastAPI :8001
          |
          v
    Piper Aegis Female
          |
          v
        WAV

============================================================
"""

import io
import os
import wave

import numpy as np
import tensorflow as tf

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from pydantic import BaseModel

from piper import PiperVoice

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ------------------------------------------------------------
# VeriCure CNN model
# ------------------------------------------------------------

MODEL_PATH = os.path.join(
    BASE_DIR,
    "VeriCure_Model_v1.0.keras",
)

IMG_SIZE = (240, 240)

THRESHOLD_COUNTERFEIT_MAX = 50.0
THRESHOLD_REAL_MIN = 70.0


# ------------------------------------------------------------
# Piper Urdu TTS
# ------------------------------------------------------------

URDU_TTS_MODEL_PATH = os.path.join(
    BASE_DIR,
    "urdutts",
    "model",
    "ur_PK-aegis_female-medium.onnx",
)

URDU_TTS_CONFIG_PATH = os.path.join(
    BASE_DIR,
    "urdutts",
    "model",
    "ur_PK-aegis_female-medium.onnx.json",
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="VeriCure Model API",
)


# ============================================================
# GLOBAL MODELS
# ============================================================

model = None

urdu_tts_voice = None


# ============================================================
# REQUEST MODEL
# ============================================================

class UrduTtsRequest(BaseModel):
    text: str


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def load_models_on_startup():

    global model
    global urdu_tts_voice

    print("")
    print("============================================================")
    print("[VeriCure] Starting Model API")
    print("============================================================")


    # ========================================================
    # LOAD VERICURE CNN
    # ========================================================

    if not os.path.exists(MODEL_PATH):

        raise RuntimeError(
            f"VeriCure model file not found at: {MODEL_PATH}"
        )

    print("[VeriCure] Loading counterfeit detection model...")

    model = tf.keras.models.load_model(
        MODEL_PATH
    )

    print("[VeriCure] Counterfeit detection model loaded.")


    # ========================================================
    # WARM UP CNN
    # ========================================================

    print("[VeriCure] Warming up counterfeit detection model...")

    dummy_input = np.zeros(
        (
            1,
            IMG_SIZE[0],
            IMG_SIZE[1],
            3,
        ),
        dtype=np.float32,
    )

    model.predict(
        dummy_input,
        verbose=0,
    )

    print("[VeriCure] Counterfeit detection model warm-up complete.")


    # ========================================================
    # LOAD PIPER URDU VOICE
    # ========================================================

    if not os.path.exists(URDU_TTS_MODEL_PATH):

        raise RuntimeError(
            "Urdu TTS model not found at: "
            f"{URDU_TTS_MODEL_PATH}"
        )

    if not os.path.exists(URDU_TTS_CONFIG_PATH):

        raise RuntimeError(
            "Urdu TTS config not found at: "
            f"{URDU_TTS_CONFIG_PATH}"
        )

    print("[Urdu TTS] Loading Aegis Female voice...")

    urdu_tts_voice = PiperVoice.load(
        URDU_TTS_MODEL_PATH,
        config_path=URDU_TTS_CONFIG_PATH,
    )

    print("[Urdu TTS] Aegis Female voice loaded successfully.")

    print("")
    print("============================================================")
    print("[VeriCure] Model API READY")
    print("[VeriCure] CNN: READY")
    print("[Urdu TTS] Aegis Female: READY")
    print("============================================================")
    print("")


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image_bytes(
    image_bytes: bytes,
) -> np.ndarray:

    try:

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image.",
        )

    image = image.resize(
        IMG_SIZE
    )

    img_array = tf.keras.utils.img_to_array(
        image
    )

    img_array = np.expand_dims(
        img_array,
        0,
    )

    return img_array


# ============================================================
# PREDICTION FOR ONE SIDE
# ============================================================

def predict_side(
    img_array: np.ndarray,
):

    pred_prob = float(
        model.predict(
            img_array,
            verbose=0,
        )[0][0]
    )

    genuine_score = (
        1.0 - pred_prob
    ) * 100.0


    if genuine_score < THRESHOLD_COUNTERFEIT_MAX:

        status = "Counterfeit"
        confidence = pred_prob * 100.0


    elif genuine_score > THRESHOLD_REAL_MIN:

        status = "Genuine"
        confidence = genuine_score


    else:

        status = "Unknown"
        confidence = genuine_score


    return {
        "status": status,
        "confidence": round(
            confidence,
            2,
        ),
        "rawScore": round(
            pred_prob,
            4,
        ),
        "genuineScore": round(
            genuine_score,
            2,
        ),
    }


# ============================================================
# FINAL VERDICT
# ============================================================

def compute_verdict(
    front_status: str,
    back_status: str,
) -> str:

    if (
        front_status == "Genuine"
        and back_status == "Genuine"
    ):

        return "Genuine"


    if "Counterfeit" in [
        front_status,
        back_status,
    ]:

        return "Counterfeit"


    return "Unknown"


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "ok",
        "modelLoaded": model is not None,
        "urduTtsLoaded": urdu_tts_voice is not None,
    }


# ============================================================
# PREDICT ENDPOINT
# ============================================================

@app.post("/predict")
async def predict(
    front: UploadFile = File(...),
    back: UploadFile = File(...),
):

    if model is None:

        raise HTTPException(
            status_code=503,
            detail=(
                "VeriCure model is not loaded yet. "
                "Please try again shortly."
            ),
        )


    front_bytes = await front.read()
    back_bytes = await back.read()


    if not front_bytes or not back_bytes:

        raise HTTPException(
            status_code=400,
            detail=(
                "Both front and back images are required."
            ),
        )


    front_array = preprocess_image_bytes(
        front_bytes
    )

    back_array = preprocess_image_bytes(
        back_bytes
    )


    front_result = predict_side(
        front_array
    )

    back_result = predict_side(
        back_array
    )


    verdict = compute_verdict(
        front_result["status"],
        back_result["status"],
    )


    return {
        "verdict": verdict,
        "front": front_result,
        "back": back_result,
    }


# ============================================================
# URDU TEXT-TO-SPEECH
# ============================================================

@app.post("/tts/urdu")
def generate_urdu_speech(
    request: UrduTtsRequest,
):

    global urdu_tts_voice


    if urdu_tts_voice is None:

        raise HTTPException(
            status_code=503,
            detail=(
                "Urdu TTS voice is not loaded yet. "
                "Please try again shortly."
            ),
        )


    text = request.text.strip()


    if not text:

        raise HTTPException(
            status_code=400,
            detail="Text is required.",
        )


    print(
    f"[Urdu TTS] Generating speech for {len(text)} characters." 
    )   

    try:

        # ----------------------------------------------------
        # Generate WAV entirely in memory.
        # No temporary audio file is required.
        # ----------------------------------------------------

        audio_buffer = io.BytesIO()


        with wave.open(
            audio_buffer,
            "wb",
        ) as wav_file:

            urdu_tts_voice.synthesize_wav(
                text,
                wav_file,
            )


        audio_bytes = audio_buffer.getvalue()


        if not audio_bytes:

            raise RuntimeError(
                "Piper generated empty audio."
            )


        print(
            "[Urdu TTS] Generated WAV: "
            f"{len(audio_bytes)} bytes"
        )


        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": (
                    'inline; filename="urdu_speech.wav"'
                )
            },
        )


    except Exception as e:

        print(
            "[Urdu TTS] Generation failed:"
        )

        print(
            str(e)
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Urdu TTS generation failed: "
                f"{str(e)}"
            ),
        )