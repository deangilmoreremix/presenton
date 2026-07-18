# Deploying SmartSlides to Render

SmartSlides is a **single Docker container** (FastAPI + MCP + Next.js + nginx, launched by
`start.js`). It is NOT a static site, so it cannot go on Netlify. Render runs the Docker
image directly.

## TL;DR
- **Netlify:** ❌ not possible (static/serverless only; this needs a persistent Python server + LibreOffice + Chromium).
- **Render:** ✅ deploy the `Dockerfile` as a **Docker Web Service** with a **persistent disk** at `/app_data`.

---

## Option A — Blueprint (recommended, uses render.yaml)

1. Push this repo to GitHub/GitLab with `render.yaml` at the repo root.
2. Render Dashboard → **New +** → **Blueprint** → select the repo.
3. Render reads `render.yaml`, creates the web service + the 10 GB disk.
4. Open the service → **Environment** → fill in the secret vars (they show as blank
   because they are `sync: false`):
   - `OPENAI_API_KEY` (for the default OpenAI setup)
   - any others for the provider/image provider you use
5. **Save, rebuild, and deploy.**

## Option B — Manual (no render.yaml)

1. Render Dashboard → **New +** → **Web Service** → connect the repo.
2. **Runtime:** Docker. Render auto-detects the `Dockerfile`.
3. **Instance type:** Standard or higher (the image is heavy: PyTorch + docling +
   LibreOffice + Chromium).
4. **Advanced → Add Disk:** name `smartslides-data`, mount path `/app_data`, size 10 GB.
5. **Advanced → Environment Variables:** add the vars from the table below.
6. Create Web Service.

---

## Port
nginx inside the container listens on **port 80**. Render routes public traffic to the
value of the `PORT` env var, so this repo sets **`PORT=80`**. Do not remove it, or Render
may fail to detect the port.

## Health check
Set to `/docs` (the FastAPI Swagger page) — it returns 200 once the backend is up.
First boot is slow: it downloads a ChromaDB embedding model and indexes icons.

---

## Environment variables

| Variable | Required? | Example / default | Notes |
|---|---|---|---|
| `PORT` | yes | `80` | nginx listens on 80 |
| `APP_DATA_DIRECTORY` | yes | `/app_data` | must match the disk mount |
| `TEMP_DIRECTORY` | yes | `/tmp/presenton` | scratch space |
| `PUPPETEER_EXECUTABLE_PATH` | yes | `/usr/bin/chromium` | for PDF/template rendering |
| `CAN_CHANGE_KEYS` | no | `false` | `true` = manage keys in the app's Settings UI |
| `LLM` | yes | `openai` | `openai`/`google`/`anthropic`/`ollama`/`custom` |
| `OPENAI_API_KEY` | if LLM=openai | *(secret)* | set in dashboard |
| `OPENAI_MODEL` | no | `gpt-4.1` | |
| `GOOGLE_API_KEY` / `GOOGLE_MODEL` | if LLM=google | *(secret)* / `models/gemini-2.0-flash` | |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | if LLM=anthropic | *(secret)* / `claude-3-5-sonnet-20241022` | needs a separate image provider |
| `CUSTOM_LLM_URL` / `CUSTOM_LLM_API_KEY` / `CUSTOM_MODEL` | if LLM=custom | *(secret)* | any OpenAI-compatible endpoint |
| `IMAGE_PROVIDER` | no | `dall-e-3` | `dall-e-3`/`gemini_flash`/`pexels`/`pixabay` |
| `PEXELS_API_KEY` / `PIXABAY_API_KEY` | if using those | *(secret)* | |
| `WEB_GROUNDING` | no | `false` | enable web search |
| `DISABLE_ANONYMOUS_TELEMETRY` | no | `true` | |
| `DATABASE_URL` | no | *(unset)* | defaults to SQLite on the disk; set for external Postgres/MySQL |

---

## Important caveats

1. **Free tier won't work.** The image needs significant RAM/disk (PyTorch, LibreOffice,
   Chromium). Use at least the **Standard** instance; bump memory if builds/exports OOM.
2. **Persistent disk is mandatory.** Without a disk at `/app_data`, every deploy wipes all
   presentations, the SQLite DB, uploads, and generated images.
3. **Slow first build & boot.** The Docker build installs large dependencies; the first
   request also triggers a one-time embedding-model download + icon indexing.
4. **Ollama (local models) is impractical on Render** unless you attach a GPU/large
   instance. Prefer a hosted provider (OpenAI/Google/Anthropic) or a `custom` endpoint.
5. **Scaling:** run a single instance. State (SQLite + ChromaDB + files) lives on the
   disk; horizontal scaling would need an external DB (`DATABASE_URL`) and shared storage.
6. **`smartslides.ai` domain:** the app metadata now points at `smartslides.ai`. Add your
   real domain under Render → **Settings → Custom Domains**, and update DNS accordingly.
