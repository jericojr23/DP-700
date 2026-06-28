# DP-700 Anki Progress

This file tracks weak areas detected from an Anki `.apkg` export with scheduling information. It is separate from `docs/quiz_progress.md`, the browser app database, and the generated Anki import TSV.

## How To Refresh

Export the DP-700 deck from Anki as an `.apkg` with scheduling information included, then run:

```bash
python3 .agents/skills/dp700-anki-weak-points/scripts/analyze_apkg.py \
  "files/DP-700 Consolidated Review.apkg" \
  --output docs/quiz_progress_anki.md \
  --deck DP-700
```

If the export uses Anki's compressed `collection.anki21b` format, install Zstandard support in WSL first:

```bash
python3 -m pip install zstandard
```

## Latest Import

- Source APKG: Not analyzed yet
- Analyzed at: Not analyzed yet
- Recent review window: 31 days
- Cards analyzed: 0

## Status Summary

| Status | Cards |
|---|---:|
| Needs review | 0 |
| Learning | 0 |
| Strong | 0 |
| Unreviewed | 0 |
| **Total tracked** | **0** |

## Weak Domains

| Domain | Cards | Needs review | Weak score |
|---|---:|---:|---:|

## Weak Topics

| Topic | Cards | Needs review | Weak score |
|---|---:|---:|---:|

## Cards To Review First

| Card | Domain | Topic | Reviews | Again | Recent Again | Lapses | Success | Latest | Status | Weak score |
|---|---|---|---:|---:|---:|---:|---:|---|---|---:|

## Follow-Up Plan

- Review the highest-scoring cards in Anki first.
- Run a `$dp700-quiz-bank` tracked quiz for the top weak topic.
- Add new source-verified questions only when a weak topic has thin question-bank coverage.

## Notes

- `Again` is treated as incorrect for weak-area scoring.
- The weak score is a prioritization signal, not an exam-score estimate.
- Re-export the deck from Anki with scheduling information whenever you want to refresh this report.
