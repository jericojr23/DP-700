# DP-700

An independent, local-first reviewer for the Microsoft DP-700 exam, with original source-verified questions and a browser-based practice studio.

## Quiz API

The FastAPI backend lives in [`apps/api`](apps/api). It reads the Markdown question bank and stores learner attempts plus spaced repetition scheduling in SQLite.

From WSL Ubuntu:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

## Quiz application

The React application lives in [`apps/quiz`](apps/quiz). It reads public question metadata during the build and uses the API for sessions, answer grading, attempts, and spaced repetition state.

From WSL Ubuntu:

```bash
cd apps/quiz
nvm install
nvm use
npm install
npm run dev
```

Set `apps/quiz/.env.local` to the API URL, such as `VITE_API_BASE_URL=http://127.0.0.1:8001`, then open the Vite URL printed by the dev server. See [`apps/quiz/README.md`](apps/quiz/README.md) for first-time Node setup, validation, and production build commands.

## Question bank

- Standalone questions: `questions/DP700-XXX.md`
- Coverage and question index: `questions/tracker/question_bank.md`
- API-backed spaced repetition progress: `apps/api/data/progress.sqlite` (gitignored)
- Codex-run quiz progress notes: `docs/quiz_progress.md` (gitignored)
- Repository guardrails: `AGENTS.md`

This project is not an exam dump and does not contain recalled live-exam content.
