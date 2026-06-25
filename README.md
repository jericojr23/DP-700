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
uvicorn main:app --reload --host 127.0.0.1 --port 8000
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

Open <http://localhost:5173>. See [`apps/quiz/README.md`](apps/quiz/README.md) for first-time Node setup, validation, and production build commands.

## Question bank

- Standalone questions: `questions/DP700-XXX.md`
- Coverage and question index: `questions/tracker/question_bank.md`
- API-backed spaced repetition progress: `apps/api/data/progress.sqlite` (gitignored)
- Codex-run quiz progress notes: `docs/quiz_progress.md` (gitignored)
- Repository guardrails: `AGENTS.md`

This project is not an exam dump and does not contain recalled live-exam content.
