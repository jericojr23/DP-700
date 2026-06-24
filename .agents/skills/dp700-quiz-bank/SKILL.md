---
name: dp700-quiz-bank
description: Create, verify, review, and administer original Microsoft DP-700 practice questions stored as standalone questions/DP700-XXX.md files, with coverage indexed in questions/tracker/question_bank.md and personal performance tracked in docs/quiz_progress.md. Use when Codex is asked to build the DP-700 question bank, generate scenario-based questions, audit existing questions or answer keys, balance coverage by exam domain and difficulty, run an interactive quiz, record results, identify weak questions, or prioritize review topics.
---

# DP-700 Quiz Bank

Maintain each `questions/DP700-XXX.md` file as the source of truth for that question. Maintain coverage totals and links—but no duplicated question or answer content—in `questions/tracker/question_bank.md`. Produce original study material, not copied exam content.

## Choose the operation

- **Create:** Research, write, verify, and append new questions.
- **Audit:** Check existing questions for accuracy, ambiguity, duplicates, stale sources, and formatting.
- **Quiz:** Present stored questions without exposing answers, grade against the stored key, and track performance.
- **Review:** Prioritize questions marked `Needs review` and summarize weak topics.
- **Plan:** Inspect the coverage tracker and recommend the next topics and difficulty levels to add.

## Create questions

1. Read `questions/tracker/question_bank.md` and every existing `questions/DP700-*.md` file completely before editing them.
2. Determine the requested count, domain, topic, difficulty, and question type from the user's prompt. If unspecified, use the coverage tracker to choose the least-covered areas and create a balanced mix.
3. Check the current Microsoft DP-700 study guide so every topic remains in scope.
4. Research each answer using current, authoritative Microsoft documentation. Prefer Microsoft Learn product documentation and the official DP-700 study guide. Use primary sources only for technical claims.
5. Do not use exam dumps, recalled live-exam questions, unauthorized question collections, or copied commercial practice tests. Refuse requests to reproduce them, then offer original questions covering the same published objective.
6. Write a realistic scenario that tests choosing or applying a solution. Avoid trivia, trick wording, accidental clues, and unsupported absolutes such as “always” or “never.”
7. Make every choice plausible and parallel in style. Ensure exactly one best answer for single-choice questions. For multiple-choice questions, state the exact number of answers to select.
8. Explain why the correct answer satisfies the scenario and why every distractor fails a stated requirement. Do not merely define the choices.
9. Copy the repository's question template exactly. Assign the next unused sequential `DP700-XXX` ID, cite the most directly relevant documentation page, set `Last verified` to the current date, and use `Status: Verified` only after the cited source confirms the answer. Otherwise use `Draft` and identify what remains uncertain.
10. Create each question as `questions/DP700-XXX.md`, add or update its linked row in `questions/tracker/question_bank.md`, and update every affected coverage number.
11. Re-read the completed files; verify IDs, counts, tracker links and metadata, answer labels, explanations, Markdown structure, and absence of duplicates; then run `npm run validate:questions` from `apps/quiz`.

When a user asks only for drafts or examples, show the proposed questions without modifying the bank. Modify the file when the user asks to create, add, append, update, or build questions in the repository.

## Audit questions

Read the standalone question files, tracker, and current official sources. Report findings by question ID, prioritizing incorrect or ambiguous answers, stale product behavior, broken or indirect citations, weak distractors, duplicated concepts, malformed entries, and tracker mismatches. Change questions only when the user requests fixes.

## Run a quiz

1. Read `questions/tracker/question_bank.md`, the eligible `questions/DP700-*.md` files, and `docs/quiz_progress.md` before selecting questions.
2. Match the user's domain, topic, difficulty, and count constraints. When the user requests review or supplies no selection rule, prioritize `Needs review`, then `Learning`, then unattempted questions; use `Strong` questions occasionally for retention checks.
3. Never reveal `<details>` content, the answer key, source-derived hints, or choice ordering changes before the user answers.
4. Present one question at a time unless the user requests a full mock exam. Invite answers in the form `<choice>, <confidence>`, where confidence is `Low`, `Medium`, or `High`; accept a choice alone and record confidence as `Not recorded`.
5. Preserve answer choices unless randomization is requested. If choices are shuffled, retain an internal mapping to the stored answer.
6. Grade against `Correct answer`; do not silently replace it with an improvised answer. If the key appears wrong, pause grading for that item, verify it with the cited source, and explain the discrepancy.
7. Unless the user requests an untracked quiz, update `docs/quiz_progress.md` immediately after every answered question:
   - Create the question row if it does not exist.
   - Increment `Attempts`; increment `Correct` only for a correct answer.
   - Recalculate `Accuracy` as `Correct / Attempts × 100`, rounded to a whole percentage.
   - Record the latest result, confidence, current date, topic, and a short misconception note when useful.
   - Set `Status` by applying the status rules in `docs/quiz_progress.md` in their listed order.
   - Recalculate the status-summary counts. Do not count skipped or unanswered questions.
8. At the end of a completed session, append one session-log row and report the score, missed question IDs, explanations, status changes, and weak topics. Recommend focused study objectives rather than claiming the result predicts the certification exam score.

If the user stops a quiz early, preserve updates for questions already answered but do not append an incomplete session to the session log.

## Review weak areas

Use the progress tracker to group `Needs review` questions by topic and domain. Prefer questions with an incorrect latest result, then low confidence, then low cumulative accuracy. When the bank contains too few questions for a weak topic, recommend creating fresh questions that test the same published objective without repeating the original scenario.

## Quality gate

Before completing an authoring task, confirm:

- The topic is in the current DP-700 skills outline.
- The scenario has enough requirements to determine the answer.
- The correct answer and every distractor have source-grounded reasoning.
- The question is original and contains no live-exam or dump material.
- The ID is unique, the verification date is current, and the status is honest.
- The coverage tracker and index match the standalone question files, and every tracker link resolves to exactly one question.
- The automated question-bank validator passes.
- Any tracked results match answered questions, and the progress summary matches its rows.

Summarize which question IDs were added or changed, their coverage areas, and any entries left as `Draft`.
