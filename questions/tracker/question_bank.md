# DP-700 Question Tracker

This file tracks coverage and links to the standalone DP-700 practice questions in this repository. Question text, choices, answers, explanations, and sources live only in `questions/DP700-XXX.md` files.

## Exam Domains

1. Implement and manage an analytics solution
2. Ingest and transform data
3. Monitor and optimize an analytics solution

## Coverage Tracker

| Domain | Foundation | Intermediate | Advanced | Total |
|---|---:|---:|---:|---:|
| Implement and manage an analytics solution | 2 | 2 | 1 | 5 |
| Ingest and transform data | 1 | 2 | 2 | 5 |
| Monitor and optimize an analytics solution | 2 | 1 | 2 | 5 |
| **Total** | **5** | **5** | **5** | **15** |

Update this table whenever a standalone question is added, removed, or changes domain or difficulty.

## Question Index

| ID | Title | Domain | Topic | Difficulty | Status | Last verified |
|---|---|---|---|---|---|---|
| [DP700-001](../DP700-001.md) | Least-privilege workspace author | Implement and manage an analytics solution | Workspace-level access control | Foundation | Verified | 2026-06-25 |
| [DP700-002](../DP700-002.md) | Low-code cleansing for analysts | Implement and manage an analytics solution | Choosing an orchestration and transformation tool | Foundation | Verified | 2026-06-25 |
| [DP700-003](../DP700-003.md) | Stage-specific notebook lakehouse | Implement and manage an analytics solution | Deployment pipeline rules | Intermediate | Verified | 2026-06-25 |
| [DP700-004](../DP700-004.md) | Version a Fabric SQL database schema | Implement and manage an analytics solution | Version control for database objects | Intermediate | Verified | 2026-06-25 |
| [DP700-005](../DP700-005.md) | Restrict a lakehouse to one folder | Implement and manage an analytics solution | OneLake table and folder security | Advanced | Verified | 2026-06-25 |
| [DP700-006](../DP700-006.md) | Reference ADLS data without copying | Ingest and transform data | OneLake shortcuts | Foundation | Verified | 2026-06-25 |
| [DP700-007](../DP700-007.md) | Incremental load that captures deletes | Ingest and transform data | Incremental loading with Copy job | Intermediate | Verified | 2026-06-25 |
| [DP700-008](../DP700-008.md) | Code-first custom transformation | Ingest and transform data | Choosing a batch transformation tool | Intermediate | Verified | 2026-06-25 |
| [DP700-009](../DP700-009.md) | No-code processing of events in motion | Ingest and transform data | Eventstream transformations and routing | Advanced | Verified | 2026-06-25 |
| [DP700-010](../DP700-010.md) | Recover a Structured Streaming job | Ingest and transform data | Spark Structured Streaming reliability | Advanced | Verified | 2026-06-25 |
| [DP700-011](../DP700-011.md) | Central view of pipeline runs | Monitor and optimize an analytics solution | Monitoring pipeline runs | Foundation | Verified | 2026-06-25 |
| [DP700-012](../DP700-012.md) | Isolate a failing pipeline activity | Monitor and optimize an analytics solution | Pipeline debugging | Foundation | Verified | 2026-06-25 |
| [DP700-013](../DP700-013.md) | Alert on a live event threshold | Monitor and optimize an analytics solution | Eventstream alerts with Activator | Intermediate | Verified | 2026-06-25 |
| [DP700-014](../DP700-014.md) | Compact and cluster a read-heavy Delta table | Monitor and optimize an analytics solution | Delta table optimization, Z-Order, and V-Order | Advanced | Verified | 2026-06-25 |
| [DP700-015](../DP700-015.md) | Refresh warehouse statistics after a major load | Monitor and optimize an analytics solution | Fabric Data Warehouse statistics | Advanced | Verified | 2026-06-25 |

## Maintenance Rules

- Treat each standalone question file as the source of truth for that question.
- Use the next unused sequential `DP700-XXX` ID for a new question.
- Keep every index row synchronized with the metadata in its linked question.
- Recalculate every affected coverage total after adding, removing, or reclassifying a question.
- Do not store answer content in this tracker.
