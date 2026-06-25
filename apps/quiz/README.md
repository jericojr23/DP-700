# DP-700 Practice Studio

A React and TypeScript quiz application backed by the local FastAPI spaced repetition service.

## First-time WSL Ubuntu setup

Vite requires a current Node.js release. This project includes `.nvmrc`, so `nvm` will select a compatible current LTS release.

If `command -v nvm` returns nothing, install `nvm` inside WSL:

```bash
sudo apt update
sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source ~/.bashrc
```

Then, from the repository root, install the project runtime and dependencies:

```bash
cd apps/quiz
nvm install
nvm use
npm install
```

Do not use the Windows `npm.exe` from this WSL directory. Keep Node, npm, `node_modules`, and the Vite process inside WSL.

## Run locally

Start the API first:

```bash
cd ../api
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Then start the quiz app:

```bash
cd ../quiz
npm run dev
```

Open <http://localhost:5173>. If Windows cannot reach the default WSL-bound address, use:

```bash
npm run dev -- --host 0.0.0.0
```

## Validate and build

```bash
npm run validate:questions
npm run build
npm run preview
```

The production output is written to `apps/quiz/dist`.

## Data flow

```text
questions/DP700-XXX.md
          +
questions/tracker/question_bank.md
          ↓
FastAPI Markdown loader
          ↓
React practice interface ← SQLite attempts and spaced repetition state
```

The parser fails when tracker links, metadata, coverage totals, required question sections, or answer mappings are inconsistent. The application never creates a second hand-maintained question bank.

Progress is stored by the API in `apps/api/data/progress.sqlite`, which is ignored by Git. Choosing **Clear history** deletes the API-backed attempts and scheduling state.

Practice sessions can be untimed or use a 30, 60, or 90 second countdown per question. An unanswered question is recorded as incorrect when its timer expires.

Question order is selected by spaced repetition priority. Correct answers are scheduled forward; missed or timed-out questions remain due immediately. The app no longer asks for Low, Medium, or High confidence.
