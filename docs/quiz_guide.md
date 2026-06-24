# DP-700 Quiz Skill Guide

This guide explains how to use the repository's `$dp700-quiz-bank` skill to create practice questions, run quizzes, and track weak areas.

## Files Used by the Skill

| File | Purpose |
|---|---|
| `.agents/skills/dp700-quiz-bank/SKILL.md` | Defines how the skill creates, verifies, and administers questions. |
| `questions/DP700-XXX.md` | Stores each question, answer key, explanation, and source. |
| `questions/tracker/question_bank.md` | Stores coverage totals and links to the standalone questions. |
| `docs/quiz_progress.md` | Stores attempts, accuracy, confidence, review status, and session results. |

## Invoke the Skill

Start a request with the skill name:

```text
Use $dp700-quiz-bank to ...
```

If the skill is not recognized, reload the workspace or start a new Codex chat from this repository.

## First-Time Setup

The question bank must contain questions before a quiz can begin. Create a balanced starter set:

```text
Use $dp700-quiz-bank to create 15 verified DP-700 practice questions,
balanced across the three exam domains and difficulty levels. Add them to
questions/DP700-XXX.md files and update questions/tracker/question_bank.md.
```

The skill will create original questions, check their answers against current official Microsoft documentation, assign unique IDs, and update the question-bank coverage totals.

## Start a Tracked Quiz

```text
Use $dp700-quiz-bank to give me a tracked five-question quiz. Ask one
question at a time and update my progress after every answer.
```

Respond with your answer and confidence:

```text
B, medium confidence
```

Valid confidence levels are `Low`, `Medium`, and `High`. You may answer with only the choice, such as `B`; confidence will then be recorded as `Not recorded`.

After every answered question, the skill updates `docs/quiz_progress.md`. Skipped questions do not count as attempts.

## Review Weak Areas

Ask the skill to prioritize questions marked `Needs review`:

```text
Use $dp700-quiz-bank to review my progress, identify my weakest topics,
and quiz me with five questions that need review.
```

The progress statuses mean:

- **Needs review:** The latest answer was incorrect, confidence was low, or accuracy fell below 70% after at least two attempts.
- **Learning:** The question has been attempted but does not yet qualify as strong.
- **Strong:** At least three attempts, at least 85% accuracy, a correct latest answer, and medium or high confidence.

## Focus on a Specific Topic

```text
Use $dp700-quiz-bank to give me a tracked quiz about incremental loading
and prioritize questions where my confidence is low.
```

You can substitute topics such as:

- Data pipelines and orchestration
- Dataflows Gen2
- Lakehouse and Delta tables
- OneLake shortcuts
- PySpark, SQL, or KQL transformations
- Eventstreams and streaming data
- Security and governance
- Monitoring and performance optimization

## Practice Without Updating Progress

```text
Use $dp700-quiz-bank to give me an untracked five-question quiz. Do not
modify docs/quiz_progress.md.
```

## Create More Questions

Specify the number, topic, difficulty, question type, and whether the questions should be saved.

```text
Use $dp700-quiz-bank to create five advanced single-choice questions about
Spark performance optimization. Verify them and add them to the bank.
```

To preview questions without changing the repository:

```text
Use $dp700-quiz-bank to draft three questions about OneLake shortcuts.
Show them to me, but do not modify the question bank.
```

## Audit the Question Bank

Check existing questions without changing them:

```text
Use $dp700-quiz-bank to audit the questions/DP700-XXX.md files and
questions/tracker/question_bank.md for ambiguous answers,
duplicate concepts, stale sources, and incorrect coverage totals. Report the
findings without editing files.
```

Apply the recommended corrections afterward:

```text
Use $dp700-quiz-bank to fix the confirmed audit findings and update the
question bank and coverage tracker.
```

## Recommended Study Routine

1. Create a balanced initial bank of questions.
2. Take a tracked quiz and include your confidence with each answer.
3. Review the explanations for incorrect or low-confidence answers.
4. Run a `Needs review` quiz during the next session.
5. Add new questions when weak topics do not have enough coverage.
6. Periodically audit the bank against current Microsoft documentation.

The question bank is an independent study resource. Use original questions based on published DP-700 objectives; do not add exam dumps or recalled live-exam questions.
