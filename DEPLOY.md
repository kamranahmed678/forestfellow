# Deploying to Hugging Face Spaces

The whole app (React site + FastAPI + U-Net model) ships as **one Docker Space**.
It's free (CPU basic: 2 vCPU / 16 GB), and the `Dockerfile` here is already verified
to build and run. The model (`trained_model.pth`) rides along via **Git LFS**.

Final URL will look like: `https://<username>-forestfellow.hf.space`

---

## 1. Create a Hugging Face account
Sign up (free): https://huggingface.co/join

## 2. Create a Write access token
https://huggingface.co/settings/tokens → **New token** → type **Write** → copy it.
(You'll paste it as the password when pushing.)

## 3. Create the Space
https://huggingface.co/new-space
- **Owner:** your username
- **Space name:** `forestfellow`
- **License:** MIT
- **SDK:** **Docker** → **Blank** template
- **Hardware:** CPU basic (free)
- **Visibility:** Public

## 4. Push this repo to the Space
From the repo folder (`portfolio-apps/land-cover-segmentation`):

```bash
# add the Space as a second remote (replace <username>)
git remote add space https://huggingface.co/spaces/<username>/forestfellow

# push (the Space starts with its own README commit, so force the first push)
git push --force space main
```

When git asks for credentials:
- **Username:** your Hugging Face username
- **Password:** the **Write token** from step 2

Git LFS uploads the 66 MB model automatically.

## 5. Watch it build
Open `https://huggingface.co/spaces/<username>/forestfellow` → the **Logs** tab.
The Docker build takes ~4–8 min (installs PyTorch, builds React). When it flips to
**Running**, the app is live at `https://<username>-forestfellow.hf.space`.

---

## Notes
- **Cold start:** free Spaces sleep after inactivity. The first visit after a nap
  takes ~20–30 s to wake — the site already shows a "waking the model" message.
- **Updates:** just `git push space main` again; the Space rebuilds automatically.
- **Both remotes:** `git push origin main` → GitHub (source), `git push space main`
  → Hugging Face (live). You can push to both whenever you change something.

## Troubleshooting
- **Build fails on torch:** the Dockerfile already installs CPU-only torch and pins
  `numpy<2`; don't change those.
- **Model missing / 500 on segment:** confirm `trained_model.pth` shows up in the
  Space's **Files** tab as an LFS pointer (~66 MB). If not, ensure `git lfs` is
  installed locally and re-push.
- **Push rejected:** use `git push --force space main` for the very first push only.
