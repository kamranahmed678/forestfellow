# Deploying to Google Cloud Run

The whole app (React site + FastAPI + U-Net) ships as **one Docker container**.
Cloud Run runs that container, **scales to zero** when idle (so it costs ~$0 for
portfolio traffic), and fits PyTorch. The container is already verified to build
and run, and it listens on Cloud Run's `$PORT`.

Final URL looks like: `https://forestfellow-xxxxxxxx-uc.a.run.app`

> Cloud Run's free tier (2M requests + generous CPU/memory-seconds per month) and
> scale-to-zero mean a low-traffic demo stays within $0. A billing account (card)
> must be enabled on the Google project, but you won't be charged for this usage.

---

## 1. Create a Google Cloud project with billing
- Go to https://console.cloud.google.com
- Create a new project (e.g. **forestfellow**).
- Enable **billing** on it (Billing → link a billing account; needs a card).

## 2. Open Cloud Shell (no local install needed)
Click the **terminal icon** (top-right of the console) to open Cloud Shell —
`gcloud`, `git`, and `git-lfs` are preinstalled.

## 3. Clone the repo and fetch the model
Cloud Shell has **no git-lfs**, so a plain clone only gets the 133-byte LFS
pointer. Download the real weights straight from GitHub's LFS media URL instead:

```bash
git clone https://github.com/kamranahmed678/forestfellow
cd forestfellow
wget -O trained_model.pth \
  "https://media.githubusercontent.com/media/kamranahmed678/forestfellow/main/trained_model.pth"
ls -lh trained_model.pth          # must be ~66M, NOT ~130 bytes
```
> Re-run that `wget` any time you re-clone or `git pull` in Cloud Shell — the repo
> only stores the LFS pointer, not the bytes.

## 4. Deploy
```bash
gcloud run deploy forestfellow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300
```
- On first run it asks to enable the **Cloud Run / Cloud Build / Artifact Registry**
  APIs — answer **Y**.
- It uploads the source, builds the `Dockerfile` (Cloud Build), and deploys.
  Takes ~5–10 min the first time.
- At the end it prints a **Service URL** — that's your live app. 🎉

---

## Notes
- **Cold start:** with scale-to-zero, the first request after idle spins the
  container up and loads the model (~15–30 s). The site shows a "waking the model"
  message during that wait. (To avoid it you could set `--min-instances 1`, but
  that keeps one instance always on and leaves the free tier — don't, for a demo.)
- **Memory:** `2Gi` is comfortable for the U-Net. If you ever see it crash on big
  images, bump to `--memory 4Gi`.
- **Updates:** re-run the same `gcloud run deploy --source .` after `git pull`.
- **Region:** `us-central1` is a safe free-tier region; any Cloud Run region works.

## Troubleshooting
- **500 on /segment, model missing:** you skipped `git lfs pull` — `trained_model.pth`
  was a 130-byte pointer. Pull it and redeploy.
- **Build fails on torch/numpy:** the Dockerfile pins CPU torch + `numpy<2`; leave those.
- **"Billing required":** enable billing on the project (step 1). Free-tier usage is $0.

---

### Alternative: Hugging Face
HF now requires **PRO ($9/mo)** for Docker/Gradio (compute) Spaces; only Static
Spaces are free. The repo is HF-ready (`README.md` has the Space config) if you
ever take PRO — but Cloud Run above is the free path.
