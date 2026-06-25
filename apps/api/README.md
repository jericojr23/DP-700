# DP-700 Quiz API

FastAPI service for persistent quiz progress and spaced repetition scheduling.

The API reads question content from the repository Markdown files. It stores only learner attempts and scheduling state in SQLite, so `questions/DP700-XXX.md` remains the authored source of truth.

## Run locally

From WSL Ubuntu:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The quiz app expects the API at `http://127.0.0.1:8000` by default.

## Data

SQLite progress is stored at `apps/api/data/progress.sqlite` unless `DP700_API_DB` is set.

Question content is loaded from:

```text
questions/DP700-XXX.md
questions/tracker/question_bank.md
```

## Spaced Repetition

The backend no longer asks for confidence. It schedules the next review from answer outcomes:

- A correct first answer is due again in 1 day.
- A second consecutive correct answer is due in 3 days.
- Later consecutive correct answers grow by the card's ease factor.
- An incorrect or timed-out answer stays due immediately.

