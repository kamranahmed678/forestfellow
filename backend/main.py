"""
ForestFellow — Land-Cover Segmentation API (FastAPI).

POST /segment  (multipart image)  -> { mask_png, width, height, breakdown, time_ms }
GET  /health                      -> { status, model }
"""

import base64
import io
import os

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

from inference import segment, CLASS_NAMES, MODEL_PATH

app = FastAPI(title="ForestFellow Land-Cover Segmentation")

# Allow the React frontend (Vercel / localhost) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to the Vercel domain before going public
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MAX_BYTES = 12 * 1024 * 1024      # 12 MB upload ceiling


def _to_data_url(pil_img):
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


@app.get("/health")
def health():
    return {"status": "ok", "classes": CLASS_NAMES, "model": MODEL_PATH.split("/")[-1]}


@app.post("/segment")
async def segment_endpoint(image: UploadFile = File(...)):
    raw = await image.read()
    if not raw:
        raise HTTPException(400, "Empty upload.")
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "Image too large (max 12 MB).")
    try:
        pil = Image.open(io.BytesIO(raw))
        pil.load()
    except Exception:
        raise HTTPException(400, "Could not read that file as an image.")

    mask, breakdown, ms = segment(pil)
    return JSONResponse({
        "mask_png": _to_data_url(mask),
        "width": pil.size[0],
        "height": pil.size[1],
        "breakdown": breakdown,
        "classes": 7,
        "time_ms": ms,
    })


# Serve the built React site (present only in the Docker/production image, at
# ./static). Mounted LAST so the API routes above always take precedence. In
# local dev this directory doesn't exist, so Vite serves the frontend instead.
_STATIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.isdir(_STATIC):
    app.mount("/", StaticFiles(directory=_STATIC, html=True), name="site")
