# DP-700 Practice Studio

A static React and TypeScript quiz application generated directly from the repository's standalone Markdown questions.

## First-time WSL Ubuntu setup

Vite requires a current Node.js release. This project includes `.nvmrc`, so `nvm` will select a compatible current LTS release.

If `command -v nvm` returns nothing, install `nvm` inside WSL:

```bash
sudo apt update
sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source ~/.bashrc
```

Then install the project runtime and dependencies:

```bash
cd /mnt/c/Users/jeric/Documents/git_repositories/DP-700/apps/quiz
nvm install
nvm use
npm install
```

Do not use the Windows `npm.exe` from this WSL directory. Keep Node, npm, `node_modules`, and the Vite process inside WSL.

## Run locally

```bash
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
          ↓ build-time parser and validator
virtual:question-bank
          ↓
React practice interface
```

The parser fails when tracker links, metadata, coverage totals, required question sections, or answer mappings are inconsistent. The application never creates a second hand-maintained question bank.

Browser progress is stored locally under `dp700-practice-progress-v1`. Clearing site data or choosing **Clear history** resets it.
