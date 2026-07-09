# ForestFellow — Land-Cover Segmentation
# Single container: builds the React site, then runs the FastAPI model server
# which serves BOTH the site (at /) and the API (/segment). Hugging Face Spaces
# run this on port 7860.

# ---------- stage 1: build the React frontend ----------
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
# same-origin API in production (FastAPI serves the site + /segment together)
ENV VITE_API_BASE=""
RUN npm run build

# ---------- stage 2: python backend + model ----------
FROM python:3.10-slim
WORKDIR /app

# CPU-only PyTorch first (keeps the image small — no CUDA wheels)
RUN pip install --no-cache-dir torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir \
      fastapi==0.115.* "uvicorn[standard]==0.30.*" python-multipart==0.0.* \
      pillow "numpy<2"

# backend code
COPY backend/ ./
# built site -> served by FastAPI at /
COPY --from=frontend /fe/dist ./static
# model weights (bundled at repo root, tracked with Git LFS)
COPY trained_model.pth ./trained_model.pth
ENV MODEL_PATH=/app/trained_model.pth

# Listen on $PORT if provided (Cloud Run sets it, default 8080), else 7860 (HF).
ENV PORT=7860
EXPOSE 7860
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
