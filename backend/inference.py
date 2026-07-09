"""
U-Net land-cover segmentation — inference core.

Loads the ForestFellow U-Net (3 in, 7 classes) and turns a PIL image into a
colour-coded land-cover mask plus a per-class percentage breakdown.

Quality passes on top of the raw model:
  * fixed input resolution   — resize the long side to INPUT_LONGSIDE so the
    model always sees a training-scale image (a fixed scale factor starved
    small uploads and produced wrong maps).
  * multi-scale + flip TTA   — average softmax over a few scales and a
    horizontal flip; stabilises the prediction and reduces speckle.
  * majority smoothing       — a mode filter cleans isolated mis-classified
    pixels for a crisper map.
None of these change the trained weights; they just get the most out of them.
"""

import os
import time
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageFilter

from unet import UNet

# --- weights ---------------------------------------------------------------
# Resolve the model from the first location that exists, so this works whether
# run from the Docker image (MODEL_PATH env), a standalone clone (weights bundled
# at the repo root via Git LFS), or inside the original FYP tree (dev).
_HERE = os.path.dirname(os.path.abspath(__file__))
_CANDIDATES = [
    os.environ.get("MODEL_PATH"),
    os.path.join(_HERE, "trained_model.pth"),           # backend/trained_model.pth
    os.path.join(_HERE, "..", "trained_model.pth"),     # repo-root/trained_model.pth
    os.path.join(_HERE, "..", "..", "..", "WebApp",
                 "Segmentation", "trained_model", "trained_model.pth"),  # FYP tree
]
MODEL_PATH = next((p for p in _CANDIDATES if p and os.path.exists(p)), _CANDIDATES[1])
DEVICE = torch.device("cpu")

# The model was trained on ~490px tiles (2448 * 0.2). We normalise every input's
# long side to this so results are correct regardless of upload size.
INPUT_LONGSIDE = int(os.environ.get("INPUT_LONGSIDE", "512"))
# Test-time augmentation: average predictions across these long-side scales
# (optionally plus a horizontal flip). Kept minimal by default — extra scales
# multiply CPU cost for a barely-changed map, so a single scale + smoothing is
# the sweet spot. Add scales via TTA_SCALES / set TTA_FLIP=1 if you have GPU.
SCALES = tuple(int(s) for s in os.environ.get("TTA_SCALES", "512").split(","))
TTA_FLIP = os.environ.get("TTA_FLIP", "0") != "0"
# Majority (mode) filter window on the class map; 0 disables smoothing.
SMOOTH = int(os.environ.get("SMOOTH", "5"))

# class index -> (display name, display colour). Index order is fixed by the
# model's training (see predict.py mapping); colours here are for the UI.
CLASSES = [
    ("Urban land",   "#38d6ec"),
    ("Agriculture",  "#ffd21e"),
    ("Rangeland",    "#e14bd0"),
    ("Forest land",  "#25d366"),
    ("Water",        "#2f6dff"),
    ("Barren land",  "#e8ecff"),
    ("Unknown",      "#1a2230"),
]
CLASS_NAMES = [c[0] for c in CLASSES]
_PALETTE = np.array(
    [[int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)] for _, h in CLASSES],
    dtype=np.uint8,
)

_net = None


def _load():
    global _net
    if _net is None:
        net = UNet(n_channels=3, n_classes=7)
        net.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        net.to(DEVICE).eval()
        _net = net
    return _net


def _prob_at(net, img, longside, base_hw, flip=False):
    """Softmax probabilities [1,7,H,W] at one scale, resampled to base_hw."""
    w, h = img.size
    s = longside / max(w, h)
    im = img.resize((max(1, round(w * s)), max(1, round(h * s))))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    arr = np.array(im.convert("RGB")).transpose((2, 0, 1)) / 255.0
    x = torch.from_numpy(arr).unsqueeze(0).to(DEVICE, torch.float32)
    with torch.no_grad():
        p = F.softmax(net(x), dim=1)
    p = F.interpolate(p, size=base_hw, mode="bilinear", align_corners=False)
    if flip:
        p = torch.flip(p, dims=[3])
    return p


def segment(pil_img):
    """Return (mask_pil, breakdown, elapsed_ms)."""
    net = _load()
    t0 = time.time()
    pil_img = pil_img.convert("RGB")

    # common grid (at INPUT_LONGSIDE) that every scale is averaged on
    w, h = pil_img.size
    s = INPUT_LONGSIDE / max(w, h)
    base_hw = (max(1, round(h * s)), max(1, round(w * s)))

    acc = None
    flips = (False, True) if TTA_FLIP else (False,)
    for ls in SCALES:
        for fl in flips:
            p = _prob_at(net, pil_img, ls, base_hw, fl)
            acc = p if acc is None else acc + p

    idx = torch.argmax(acc, dim=1)[0].cpu().numpy().astype(np.uint8)

    # majority smoothing on the class map (filter indices, not colours)
    if SMOOTH and SMOOTH >= 3:
        idx = np.array(Image.fromarray(idx, mode="P").filter(ImageFilter.ModeFilter(size=SMOOTH)))

    # colour mask, resized back to the input aspect (long side capped for the web)
    out_w, out_h = pil_img.size
    cap = 1024
    if max(out_w, out_h) > cap:
        k = cap / max(out_w, out_h)
        out_w, out_h = int(out_w * k), int(out_h * k)
    mask = Image.fromarray(_PALETTE[idx], mode="RGB").resize((out_w, out_h), Image.NEAREST)

    counts = np.bincount(idx.ravel(), minlength=len(CLASSES))
    total = int(counts.sum())
    breakdown = [
        {"name": CLASSES[i][0], "color": CLASSES[i][1],
         "pct": round(100.0 * counts[i] / total, 1)}
        for i in range(len(CLASSES)) if counts[i] > 0
    ]
    breakdown.sort(key=lambda d: d["pct"], reverse=True)

    return mask, breakdown, int((time.time() - t0) * 1000)
