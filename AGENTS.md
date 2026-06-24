# Repository Agent Instructions

These instructions apply to the entire repository.

## Project Intent

This repository is an independent, local-first DP-700 learning project. Keep all practice material original and grounded in the published Microsoft DP-700 skills outline and authoritative Microsoft documentation. Never add exam dumps, recalled live-exam questions, or copied commercial practice-test content.

Read `DEVELOPMENT_GUIDE.md` before making structural changes. For question-bank work, also read `.agents/skills/dp700-quiz-bank/SKILL.md` completely and follow its workflow.

## Runtime Environment

- Treat this repository as a WSL Ubuntu project regardless of where the worktree is mounted.
- Run repository commands with Linux-native tools installed inside WSL. For Node.js work, `node`, `npm`, and `npx` must resolve to WSL binaries, not Windows executables or paths under `/mnt/c/Program Files/nodejs`.
- In `apps/quiz`, use the version in `.nvmrc` through `nvm use` (or `nvm install` when setup is required), and install dependencies from inside WSL.
- Never use Windows `node.exe`, `npm.exe`, or Windows-installed `node_modules` as a workaround from WSL. If the WSL-native runtime is unavailable, report the setup blocker instead of bypassing required validation.

## Question Bank Invariants

Treat these rules as non-negotiable unless the user explicitly requests a repository migration:

1. Each question lives in exactly one authoritative file named `questions/DP700-XXX.md`.
2. `questions/tracker/question_bank.md` contains only coverage totals, question metadata, links, and maintenance rules.
3. Do not duplicate full question text, choices, answers, or explanations in the tracker.
4. Do not recreate the obsolete paths `questions/question_bank.md` or `docs/question_bank.md`.
5. Every standalone question must have exactly one tracker row, and every tracker row must link to exactly one existing standalone question.
6. The ID, title, domain, topic, difficulty, status, and verification date in a tracker row must match its question file.
7. Coverage totals must be recalculated from the standalone question metadata whenever a question is added, removed, or reclassified.
8. Question IDs must be unique. Assign the next unused sequential `DP700-XXX` ID; do not silently renumber existing questions.

## Question Authoring Workflow

Before creating or editing questions:

- Read `questions/tracker/question_bank.md` and all relevant `questions/DP700-*.md` files.
- Confirm the topic remains in the current DP-700 skills outline.
- Verify technical claims with current primary Microsoft sources.
- Preserve the established Markdown structure and hidden answer section.

For every saved question:

- Include one domain, one topic, one supported difficulty, one question type, one authoritative source, a verification date, and an honest status.
- Ensure a single-choice question has exactly one best answer.
- State the exact number of required answers for a multiple-choice question.
- Explain why the correct answer fits and why every distractor fails a scenario requirement.
- Mark a question `Verified` only when its cited source confirms the answer; otherwise mark it `Draft` and state what remains uncertain.
- Update the tracker row and all affected coverage totals in the same change.

## Required Question-Bank Validation

Before completing any question-bank change, verify all of the following:

- Neither obsolete question-bank path exists.
- Standalone IDs and tracker IDs form an exact one-to-one set.
- All tracker links resolve.
- Tracker metadata matches the linked files.
- Computed domain and difficulty counts match the coverage table.
- Required question sections are present and Markdown structure is intact.
- No question is duplicated and no answer content appears in the tracker.
- `git diff --check` reports no whitespace errors.

Run the automated validator from `apps/quiz` with `npm run validate:questions` and treat any failure as blocking. The application build also runs this validator. Do not bypass or weaken validation to make a change pass.

## Quiz and Progress Rules

- Never reveal the stored answer or explanation before the learner submits an answer.
- Grade against the stored answer key. If the key appears wrong, stop and verify it rather than improvising a replacement.
- Keep personal attempts and confidence data in `docs/quiz_progress.md`; never write learner progress into question files or the coverage tracker.
- Recalculate progress summaries whenever tracked results change.

## Application Boundary

A future quiz application must consume the standalone Markdown questions without becoming a second authoring source of truth.

- Keep authored question content in `questions/DP700-XXX.md`.
- Generate application data from Markdown during the build; do not maintain a hand-edited duplicate JSON question bank.
- Keep generated application artifacts out of `questions/`.
- Store browser-only progress separately, such as in local storage, unless a deliberately designed persistence service is added.
- Do not expose answer and explanation content in the visible interface before submission.

## Change Discipline

- Preserve unrelated user changes and do not rewrite files outside the requested scope.
- Update documentation and repository references whenever a path or workflow changes.
- Prefer small, reviewable changes and run checks proportional to their risk.
