# DP-700

An independent, local-first reviewer for the Microsoft DP-700 exam, with original source-verified questions and a browser-based practice studio.

## Quiz application

The React application lives in [`apps/quiz`](apps/quiz). It reads the standalone Markdown questions during the build, so the files under `questions/` remain the only authored source of question content.

From WSL Ubuntu:

```bash
cd /mnt/c/Users/jeric/Documents/git_repositories/DP-700/apps/quiz
nvm install
nvm use
npm install
npm run dev
```

Open <http://localhost:5173>. See [`apps/quiz/README.md`](apps/quiz/README.md) for first-time Node setup, validation, and production build commands.

## Question bank

- Standalone questions: `questions/DP700-XXX.md`
- Coverage and question index: `questions/tracker/question_bank.md`
- Personal quiz progress: `docs/quiz_progress.md`
- Repository guardrails: `AGENTS.md`

This project is not an exam dump and does not contain recalled live-exam content.
