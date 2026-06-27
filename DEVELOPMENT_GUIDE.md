# DP-700 Local Lakehouse Lab: Development Guide

This is the single source of truth for building this project. Every decision about scope, structure, sequencing, and contribution lives here. When in doubt, refer to this file first.

---

## What This Project Is

A free, open-source, local-first data engineering lab for learners reviewing for the Microsoft DP-700 Fabric Data Engineer Associate exam.

It simulates Microsoft Fabric-style lakehouse workflows using PySpark, Delta Lake, T-SQL, and KQL-style analytics patterns — without requiring a Fabric workspace.

**It is not:** an exam dump, a guaranteed pass resource, or an official Microsoft lab.

**It is:** a hands-on companion that connects DP-700 theory to real data engineering code.

---

## Core Problem This Solves

> DP-700 has plenty of study material, but not enough beginner-friendly, open-source, local-first, end-to-end practice projects that connect Microsoft Fabric concepts to real data engineering code.

Most learners can find theory, Microsoft Learn modules, and scattered tutorials. What they cannot find is a repeatable local project where they can build a complete lakehouse pipeline, query it across multiple languages, and see how everything maps to Microsoft Fabric.

---

## Project Principles

These apply to every decision made during development.

1. **Lab and questions live together.** The question bank stays in the same repository as the lab code. A learner should be able to read a question about medallion architecture and immediately run the corresponding lab module. Never separate them into different branches or repositories.

2. **main is always presentable.** Every merge to main must leave the repository in a working, readable state. Visitors only check main.

3. **MVP ships before extras.** Do not add KQL, Docker Compose, or CI until the core PySpark pipeline is working end to end.

4. **Questions are grounded in code.** Every question in the question bank should connect to a concept demonstrated by a lab module. Write questions that real mistakes in the lab would help answer.

5. **No exam dumps, ever.** All questions are original, scenario-based, and grounded in the published DP-700 skills outline and Microsoft Learn documentation.

6. **Observability is part of the lab.** Validation checks and run history logging are not optional extras. They are core to the MVP because real data engineering requires knowing whether your pipeline worked.

---

## Repository Structure

```text
dp700-local-lakehouse-lab/
│
├── apps/
│   └── quiz/                       # React/Vite practice application
│       ├── scripts/                # Markdown parser and bank validator
│       └── src/                    # Quiz interface and local progress UI
│
├── configs/
│   └── taxi.yml                    # Dataset and pipeline config
│
├── data/
│   └── raw/                        # Downloaded source files (gitignored)
│
├── lakehouse/
│   ├── bronze/                     # Delta tables: raw ingested data
│   ├── silver/                     # Delta tables: cleaned and validated data
│   └── gold/                       # Delta tables: business-ready aggregates
│
├── exports/
│   ├── sql/                        # Parquet or CSV exports for SQL Server
│   └── kql/                        # Exports for Kusto emulator
│
├── src/
│   └── lakehouse/
│       ├── spark_session.py        # Shared SparkSession builder
│       ├── io.py                   # Read/write helpers
│       ├── bronze.py               # Bronze ingestion logic
│       ├── silver.py               # Silver cleaning logic
│       ├── gold.py                 # Gold aggregation logic
│       ├── validations.py          # Validation check functions
│       └── run_history.py          # Run history logging
│
├── pipelines/
│   └── taxi_pipeline.py            # Entry point: runs full pipeline
│
├── sql/
│   └── taxi_queries.sql            # T-SQL practice queries
│
├── kql/
│   └── taxi_queries.kql            # KQL practice queries
│
├── questions/
│   ├── DP700-XXX.md                # One standalone DP-700 practice question
│   └── tracker/
│       └── question_bank.md        # Coverage totals and question index
│
├── docs/
│   ├── 01-setup.md                 # Environment setup guide
│   ├── 02-bronze-silver-gold.md    # Medallion architecture walkthrough
│   ├── 03-pyspark-practice.md      # PySpark query exercises
│   ├── 04-tsql-practice.md         # T-SQL query exercises
│   └── 05-kql-practice.md          # KQL query exercises (v2)
│
├── docker-compose.yml              # SQL Server container (v1), full env (v3)
├── requirements.txt
├── README.md
├── DEVELOPMENT_GUIDE.md            # This file
└── LICENSE
```

---

## Branch Strategy

Branches represent development stages. They are not permanent separations by language or topic.

```text
main                              ← always complete and presentable
feature/pyspark-lakehouse         ← Bronze/Silver/Gold + validation
feature/tsql-sqlserver            ← SQL Server export + T-SQL queries
feature/kql-emulator              ← Kusto export + KQL queries
feature/config-driven-pipeline    ← YAML-driven pipeline support
```

For YouTube tutorial checkpoints, use episode branches that freeze each stage:

```text
episode-01-local-spark-delta
episode-02-bronze-silver-gold
episode-03-tsql-sqlserver
episode-04-kql-emulator
episode-05-validation-run-history
```

Do not create long-lived branches named after languages (e.g., `tsql-only`, `kql-branch`). These hide completed work from visitors who only check main.

---

## Development Phases

### Phase 1 — MVP (Build This First)

**Goal:** A working end-to-end pipeline with validation, run history, and T-SQL export. Everything a learner needs to understand the core DP-700 engineering concepts.

| # | Deliverable | File(s) |
|---|---|---|
| 1 | Environment setup guide | `docs/01-setup.md` |
| 2 | Dataset download script | `pipelines/taxi_pipeline.py` or standalone script |
| 3 | Bronze ingestion module | `src/lakehouse/bronze.py` |
| 4 | Silver cleaning module | `src/lakehouse/silver.py` |
| 5 | Gold aggregation module | `src/lakehouse/gold.py` |
| 6 | Validation checks | `src/lakehouse/validations.py` |
| 7 | Run history logging | `src/lakehouse/run_history.py` |
| 8 | Gold export to SQL Server | `exports/sql/` + Docker SQL Server container |
| 9 | T-SQL practice queries | `sql/taxi_queries.sql` |
| 10 | PySpark practice queries | `docs/03-pyspark-practice.md` |
| 11 | Question bank (15 questions) | `questions/DP700-XXX.md` and `questions/tracker/question_bank.md` |
| 12 | README with DP-700 skill map | `README.md` |

**MVP is done when:** A learner can clone the repo, follow `docs/01-setup.md`, run `pipelines/taxi_pipeline.py`, and produce validated Gold Delta tables and T-SQL query results — and answer 15 practice questions that map to those lab modules.

---

### Phase 2 — KQL and Advanced Queries

**Goal:** Add Kusto emulator support and cross-language query comparison exercises.

| # | Deliverable | File(s) |
|---|---|---|
| 1 | Kusto emulator setup guide | `docs/05-kql-practice.md` |
| 2 | KQL practice queries | `kql/taxi_queries.kql` |
| 3 | KQL vs T-SQL vs PySpark comparison exercises | `docs/05-kql-practice.md` |
| 4 | Incremental load simulation | `src/lakehouse/bronze.py` update |
| 5 | Config-driven pipeline | `configs/taxi.yml` + pipeline update |
| 6 | Question bank expanded (30 questions total) | `questions/DP700-XXX.md` and `questions/tracker/question_bank.md` |

---

### Phase 3 — Polish and Community

**Goal:** Make the project production-quality for open-source sharing and portfolio use.

| # | Deliverable | File(s) |
|---|---|---|
| 1 | Docker Compose full environment | `docker-compose.yml` |
| 2 | MinIO object storage option | `docker-compose.yml` + docs |
| 3 | CI checks (formatting, tests) | `.github/workflows/` |
| 4 | Additional datasets | `data/` + new pipeline |
| 5 | Practice exercises with answer keys | `docs/` exercises section |
| 6 | Question bank at 45 questions (5 per domain per difficulty) | `questions/DP700-XXX.md` and `questions/tracker/question_bank.md` |

---

## Medallion Architecture Rules

These are the definitions this project uses consistently. They should not change between modules.

### Bronze Layer

**Purpose:** Raw ingested data with minimal transformation. Preserves source-level detail.

Required metadata columns added at ingestion:

```text
source_file          ← original filename
ingestion_timestamp  ← when the record was loaded
run_id               ← links to the run history table
```

Allowed operations: read CSV or Parquet, add metadata columns, write as Delta table. No cleaning, no deduplication, no type casting beyond what is needed to write the file.

### Silver Layer

**Purpose:** Cleaned, typed, and validated data. Safe to query.

Required operations:

```text
Remove duplicates
Cast columns to correct data types
Handle nulls (drop or fill based on business rules)
Remove invalid records (negative fares, negative distances)
Add cleaned date columns (e.g., pickup_date extracted from pickup_datetime)
Log row count differences vs. Bronze
```

### Gold Layer

**Purpose:** Business-ready data for reporting and analytics. The layer that gets exported to SQL Server and Kusto.

Required operations:

```text
Aggregate metrics (e.g., daily revenue, trip counts)
Create one table per business question
Prepare data for PySpark queries
Prepare data for SQL Server export
```

---

## Validation and Run History Requirements

These are not optional. Every pipeline run must produce a validation result and a run history record.

### Run History Schema

Every pipeline run must write one record to the run history table with these fields:

```text
run_id               ← UUID generated at pipeline start
pipeline_name        ← e.g., "taxi_pipeline"
source_path          ← path to the input file
target_table         ← e.g., "bronze", "silver", "gold"
load_type            ← "full" or "incremental"
rows_read            ← count before transformation
rows_written         ← count after transformation
rows_failed          ← count of dropped or invalid records
status               ← "success" or "failed"
start_time           ← pipeline start timestamp
end_time             ← pipeline end timestamp
duration_seconds     ← calculated from start and end
error_message        ← null on success, exception message on failure
```

### Minimum Validation Checks (MVP)

These checks must run during the Silver transformation step and their results must be logged:

```text
Required columns exist
No negative fares
No negative trip distances
pickup_date is not null
Row count is greater than zero
Duplicate count is tracked
Bronze-to-Silver row count difference is logged
```

---

## Question Bank Rules

Question content lives in standalone `questions/DP700-XXX.md` files. Coverage totals and links live at `questions/tracker/question_bank.md`. These rules apply to every question added.

### What belongs here

Original questions written from the published DP-700 skills outline and Microsoft Learn documentation. Every question must map to one of the three exam domains.

### What never belongs here

Copied certification exam questions, brain dumps, leaked exam content, or questions from commercial test banks. No exceptions.

### Coverage target

| Domain | Foundation | Intermediate | Advanced | Target Total |
|---|---:|---:|---:|---:|
| Implement and manage an analytics solution | 5 | 5 | 5 | 15 |
| Ingest and transform data | 5 | 5 | 5 | 15 |
| Monitor and optimize an analytics solution | 5 | 5 | 5 | 15 |
| **Total** | **15** | **15** | **15** | **45** |

Reach 15 questions (5 per domain, Foundation only) by end of Phase 1. Reach 45 by end of Phase 3.

### Question-to-module mapping

Every question must connect to a lab concept. When adding a question, note which module demonstrates the concept it tests.

| Module | Example question topics |
|---|---|
| Bronze ingestion | What does the Bronze layer store? What metadata columns are added? |
| Silver cleaning | What operations happen in Silver? Why are duplicates removed here, not Bronze? |
| Gold aggregation | What makes a table Gold? When would you aggregate here vs Silver? |
| Validation checks | Which check would catch a pipeline that loaded zero rows? |
| Run history | What field tracks whether a run succeeded? What is logged on failure? |
| T-SQL queries | How does SELECT TOP 10 translate to PySpark orderBy? |
| KQL queries | How does `top 10 by` in KQL compare to SQL ORDER BY + TOP? |

### Writing strong distractors

The best distractors come from real mistakes. Use these patterns:

- Put an operation in the wrong layer (e.g., "aggregate metrics in Silver")
- Confuse a load type (e.g., "full load" when the scenario requires incremental)
- Swap a PySpark method for a T-SQL equivalent
- Use a correct concept in the wrong context

---

## Anki Export Workflow

The Anki import file is a generated study artifact, not the question-bank source of truth.

Use this repo-local skill for Anki-focused work:

```text
$dp700-anki-export
```

### Source files

- `files/DP-700 Consolidated Review.txt` stores Anki-only recall cards.
- `questions/DP700-*.md` stores full quiz-bank questions and should only be edited when adding or fixing canonical practice questions.
- `apps/quiz/scripts/export-anki.mjs` generates `exports/anki/dp700-anki-import.tsv`.
- `exports/anki/dp700-anki-import.tsv` is the file to import into Anki. Do not hand-edit it.

### Add Anki-only cards

Add one tab-separated card per line to `files/DP-700 Consolidated Review.txt`:

```text
Front question<TAB>Back answer with explanation and source
```

Before adding a card, search for a distinctive phrase from the front:

```bash
rg -n "Direct Lake mode" files questions apps/quiz/scripts/export-anki.mjs exports/anki/dp700-anki-import.tsv
```

### Regenerate and validate

Run from WSL Ubuntu with WSL-native Node.js:

```bash
cd apps/quiz
nvm use
npm run export:anki
npm run validate:questions
cd ../..
git diff --check
awk 'BEGIN{bad=0; cards=0} /^#/ {next} { cards++; if (NF != 3) { print "bad row", NR, "fields", NF; bad=1 } } END{ print "card rows", cards; if (bad) exit 1 }' FS='\t' exports/anki/dp700-anki-import.tsv
```

If `npm run export:anki` reports skipped duplicate fronts, inspect the source card and either merge, rewrite, or remove it before importing.

### Import behavior

Import `exports/anki/dp700-anki-import.tsv` into the existing Anki deck. Keep the note type as `Basic` and keep card fronts stable after import. Anki uses the first field to match existing notes during text import, so editing a front can create a new note instead of updating the existing one.

---

## DP-700 Skills Map

This table connects the lab modules to the official DP-700 exam skill areas. Use this when writing questions and documentation.

| Lab Module | DP-700 Domain | Skill Area |
|---|---|---|
| Bronze ingestion | Ingest and transform data | Implement a data ingestion solution |
| Silver cleaning | Ingest and transform data | Implement data transformations |
| Gold aggregation | Ingest and transform data | Implement data transformations |
| Validation checks | Monitor and optimize | Monitor data pipelines |
| Run history logging | Monitor and optimize | Monitor data pipelines |
| SQL Server export | Implement and manage | Configure and manage a Fabric lakehouse |
| T-SQL queries | Ingest and transform data | Query data using T-SQL |
| KQL queries | Ingest and transform data | Query data using KQL |
| Medallion architecture | Implement and manage | Design a lakehouse solution |

---

## What Not to Do

These are recurring mistakes that would reduce the project's value. Avoid them.

```text
DO NOT separate the question bank into a different branch from the lab code.
DO NOT add KQL or Docker Compose before the PySpark MVP pipeline works end to end.
DO NOT skip validation checks — they are core to the MVP, not a bonus.
DO NOT create long-lived branches by language (e.g., tsql-only, kql-branch).
DO NOT copy exam questions or link to brain dump sites anywhere in the repo.
DO NOT market this project as a guaranteed pass or official Microsoft resource.
DO NOT leave main in a broken or incomplete state after a merge.
DO NOT write questions without connecting them to a lab module or Microsoft Learn source.
```

---

## Definition of Done

A phase is complete when all of the following are true.

### Phase 1 Done

- `pipelines/taxi_pipeline.py` runs end to end without errors on a fresh WSL2 setup
- Bronze, Silver, and Gold Delta tables are produced and queryable
- All minimum validation checks pass and results are logged
- Run history records are written for every pipeline stage
- Gold data is exported and queryable in SQL Server via the provided T-SQL queries
- `docs/01-setup.md` allows a new learner to reproduce the environment from scratch
- `questions/` contains at least 15 standalone question files, and `questions/tracker/question_bank.md` accurately indexes their coverage
- `README.md` includes the DP-700 skill map linking modules to exam domains
- main is clean, presentable, and fully functional

### Phase 2 Done

- KQL queries run against exported Gold data in the Kusto emulator
- Cross-language comparison exercises exist for at least 3 business questions
- Incremental load simulation works and is logged in run history
- Question bank contains at least 30 questions across Foundation and Intermediate

### Phase 3 Done

- `docker-compose.yml` spins up the full environment (SQL Server, Kusto emulator, MinIO)
- CI checks pass on every push to main
- Question bank contains 45 questions at all three difficulty levels
- Practice exercises with answer keys exist for each doc module

---

## Quick Reference: First Things to Build

If you are starting now, build in this order:

1. `docs/01-setup.md` — environment setup guide
2. `src/lakehouse/spark_session.py` — shared SparkSession
3. `src/lakehouse/io.py` — read/write helpers
4. `src/lakehouse/bronze.py` — raw ingestion
5. `src/lakehouse/silver.py` — cleaning and validation
6. `src/lakehouse/gold.py` — aggregation
7. `src/lakehouse/validations.py` — validation check functions
8. `src/lakehouse/run_history.py` — run history logging
9. `pipelines/taxi_pipeline.py` — orchestrates 3–8
10. `sql/taxi_queries.sql` — T-SQL practice queries
11. `questions/DP700-XXX.md` and `questions/tracker/question_bank.md` — 15 MVP questions (5 per domain)
12. `README.md` — project overview with DP-700 skill map

Do not start Phase 2 work until item 12 is done and main is clean.
