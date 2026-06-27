# DP-700 Startup Guide

Use this guide to run the local quiz stack from WSL Ubuntu.

## 1. Start the API

The FastAPI backend reads the Markdown question bank and stores spaced repetition progress in SQLite.

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Health check:

```bash
curl http://127.0.0.1:8001/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 2. Start the Quiz App

Open a second WSL terminal.

```bash
cd apps/quiz
nvm install
nvm use
npm install
npm run dev
```

The quiz app reads the API URL from `apps/quiz/.env.local`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8001
```

If you run the API on another port, update that file before starting Vite.

Open the Vite URL shown in the terminal, usually:

```text
http://127.0.0.1:5173/
```

If that port is already in use, Vite will choose the next available port, such as `5174`.

## 3. Validate Before Committing

From `apps/quiz`:

```bash
nvm use
npm run validate:questions
npm run build
```

From the repository root:

```bash
python3 -m py_compile apps/api/main.py
git diff --check
```

## Runtime Notes

- Run Node, npm, npx, Python, and pip inside WSL, not through Windows executables.
- Authored question content remains in `questions/DP700-XXX.md`.
- The API stores local progress in `apps/api/data/progress.sqlite`, which is ignored by Git.
- The browser app no longer uses confidence prompts; spaced repetition is based on answer outcomes.
