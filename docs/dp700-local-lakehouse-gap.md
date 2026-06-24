# DP-700 Local Lakehouse Lab: Open-Source Gap Analysis

## Core Gap to Solve

A strong open-source gap for this project is:

> A free, local, hands-on DP-700 practice lab for people who do not have easy Microsoft Fabric access.

Most DP-700 learners can find theory, practice questions, Microsoft Learn modules, and scattered YouTube tutorials. What is harder to find is a repeatable local project where learners can practice the core engineering ideas behind Microsoft Fabric using tools they can run on their own machine.

This project can become a practical companion for DP-700 review by helping learners understand Fabric-style data engineering through PySpark, Delta Lake, T-SQL, and KQL-style workflows.

---

## Project Positioning

Recommended positioning:

> A local Microsoft Fabric-style data engineering lab for DP-700 review.

This should not be marketed as an exam dump, guaranteed pass resource, or official Microsoft lab. It should be presented as a hands-on companion project for learners who want to understand the real engineering concepts behind the exam.

Possible repository names:

```text
dp700-local-lakehouse-lab
fabric-style-local-lakehouse
dp700-hands-on-lakehouse
```

Suggested README description:

> This project helps DP-700 learners practice Fabric-style data engineering concepts locally using PySpark, Delta Lake, T-SQL, and KQL patterns without needing a Fabric workspace for the first round of learning.

---

## Why This Project Is Useful

DP-700 learners are expected to understand data loading patterns, data architectures, orchestration, ingestion, transformation, monitoring, optimization, and working with SQL, PySpark, and KQL.

The problem is that many learners only study these concepts in isolation. They may memorize the terms but still struggle to understand what a complete data engineering workflow looks like.

This project can connect the concepts into one local workflow:

```text
Public dataset
    ↓
Raw data ingestion
    ↓
Bronze Delta table
    ↓
Silver cleaned table
    ↓
Gold business-ready table
    ↓
PySpark queries
    ↓
T-SQL queries
    ↓
KQL-style analytics queries
    ↓
Validation and run history
```

---

## Specific Gaps the Project Can Solve

### 1. Learners Without Fabric Access

Some learners may not have access to a Fabric-enabled tenant, work or school account, trial capacity, or supported region.

This project lets them practice the concepts locally using:

```text
WSL2 Ubuntu
Docker
PySpark
Delta Lake
SQL Server container
Kusto emulator
Public datasets
```

The goal is not to fully replace Microsoft Fabric. The goal is to help learners understand the concepts before they use Fabric directly.

---

### 2. Turning Microsoft Learn Theory Into Code

Microsoft Learn explains the concepts, but many learners still ask:

```text
What does Bronze actually contain?
What makes Silver different from Bronze?
What belongs in Gold?
How do I validate a load?
How do I query the same data using PySpark, T-SQL, and KQL?
How does a local pipeline map to Fabric concepts?
```

This project can answer those questions with real scripts, folders, and exercises.

Example learning modules:

```text
Module 01 - Set up WSL2, Python, Spark, and Delta Lake
Module 02 - Download the NYC Taxi dataset
Module 03 - Ingest raw data into Bronze
Module 04 - Clean and validate data into Silver
Module 05 - Aggregate business metrics into Gold
Module 06 - Query the Gold table using PySpark
Module 07 - Export Gold tables into SQL Server
Module 08 - Practice equivalent T-SQL queries
Module 09 - Export analytics data into Kusto emulator
Module 10 - Practice equivalent KQL queries
Module 11 - Add validation checks
Module 12 - Add local run history
```

---

### 3. Practicing PySpark, T-SQL, and KQL on the Same Business Question

Most reviewers teach PySpark, SQL, and KQL separately. This project can make the learning more useful by using the same dataset and the same business questions across all three languages.

Example business question:

> Which pickup days had the highest taxi revenue?

PySpark:

```python
gold_df.orderBy(col("total_revenue").desc()).show(10)
```

T-SQL:

```sql
SELECT TOP 10
    pickup_date,
    total_trips,
    total_revenue
FROM dbo.daily_taxi_revenue
ORDER BY total_revenue DESC;
```

KQL:

```kql
DailyTaxiRevenue
| top 10 by total_revenue desc
| project pickup_date, total_trips, total_revenue
```

This teaches the deeper pattern instead of only teaching syntax.

---

### 4. Clear Local Medallion Architecture Templates

Many beginners know the terms Bronze, Silver, and Gold, but they do not know what belongs in each layer.

This project can define simple rules:

#### Bronze Layer

Purpose: raw ingested data with minimal transformation.

Recommended columns:

```text
source_file
ingestion_timestamp
run_id
```

Typical operations:

```text
Read raw CSV or Parquet files
Add ingestion metadata
Write as Delta table
Preserve source-level detail
```

#### Silver Layer

Purpose: cleaned, typed, validated data.

Typical operations:

```text
Remove duplicates
Fix data types
Handle nulls
Remove invalid records
Add cleaned date columns
Apply validation checks
```

#### Gold Layer

Purpose: business-ready data for reporting and analytics.

Typical operations:

```text
Aggregate metrics
Create dimensional/reporting tables
Prepare data for SQL queries
Prepare data for dashboard-style analysis
```

---

### 5. Validation and Run History Practice

This is one of the strongest gaps to solve because many beginner projects only show transformations. Real data engineering also needs observability.

The project should include a local run history table or file.

Example schema:

```text
run_id
pipeline_name
source_path
target_table
load_type
rows_read
rows_written
rows_failed
status
start_time
end_time
duration_seconds
error_message
```

Example validation checks:

```text
Required columns exist
No negative fares
No negative trip distances
Pickup date is not null
Row count is greater than zero
Duplicate count is tracked
Bronze-to-Silver row count difference is logged
```

This helps learners understand that data engineering is not only about writing transformations. It is also about checking whether the pipeline actually worked.

---

## Recommended MVP Scope

The first public version should stay focused.

### MVP Features

```text
1. WSL2 Ubuntu setup guide
2. Python virtual environment setup
3. PySpark and Delta Lake setup
4. NYC Taxi dataset download script
5. Bronze/Silver/Gold pipeline
6. Reusable PySpark functions
7. Basic validation checks
8. Local run history logging
9. Gold table export to SQL Server
10. Equivalent PySpark and T-SQL queries
11. README mapping modules to DP-700 skills
```

### Version 2 Features

```text
1. Kusto emulator setup
2. KQL practice queries
3. KQL vs SQL vs PySpark comparison exercises
4. More validation scenarios
5. Incremental load simulation
6. Config-driven pipeline support
```

### Version 3 Features

```text
1. Docker Compose full environment
2. MinIO object storage option
3. CI checks for Python formatting/tests
4. More datasets
5. Practice exercises with answers
6. YouTube tutorial companion branches
```

---

## Recommended Repository Structure

```text
dp700-local-lakehouse-lab/
│
├── configs/
│   └── taxi.yml
│
├── data/
│   └── raw/
│
├── lakehouse/
│   ├── bronze/
│   ├── silver/
│   └── gold/
│
├── exports/
│   ├── sql/
│   └── kql/
│
├── src/
│   └── lakehouse/
│       ├── spark_session.py
│       ├── io.py
│       ├── bronze.py
│       ├── silver.py
│       ├── gold.py
│       ├── validations.py
│       └── run_history.py
│
├── pipelines/
│   └── taxi_pipeline.py
│
├── sql/
│   └── taxi_queries.sql
│
├── kql/
│   └── taxi_queries.kql
│
├── docs/
│   ├── 01-setup.md
│   ├── 02-bronze-silver-gold.md
│   ├── 03-pyspark-practice.md
│   ├── 04-tsql-practice.md
│   └── 05-kql-practice.md
│
├── docker-compose.yml
├── requirements.txt
├── README.md
└── LICENSE
```

---

## Recommended Branch Strategy

Branches should represent development stages or tutorial episodes, not permanent language separation.

Good branch strategy:

```text
main
feature/pyspark-lakehouse
feature/tsql-sqlserver
feature/kql-emulator
feature/config-driven-pipeline
```

For YouTube tutorial checkpoints:

```text
episode-01-local-spark-delta
episode-02-bronze-silver-gold
episode-03-tsql-sqlserver
episode-04-kql-emulator
episode-05-validation-run-history
```

Final `main` should contain the complete project:

```text
PySpark modules
T-SQL scripts
KQL scripts
Docker setup
Documentation
Exercises
```

This is better than hiding T-SQL and KQL in separate long-lived branches because most people who visit the repository will only inspect `main`.

---

## What Not to Do

Avoid positioning the project as:

```text
DP-700 exam dumps
Guaranteed pass reviewer
Official Microsoft DP-700 lab
Leaked exam questions
```

Better positioning:

```text
DP-700 hands-on companion
Fabric-style local lakehouse lab
Open-source data engineering practice project
Local-first DP-700 practice environment
```

This keeps the project clean, ethical, and professional.

---

## Best Gap Statement

The clearest gap statement is:

> DP-700 has plenty of study material, but not enough beginner-friendly, open-source, local-first, end-to-end practice projects that connect Microsoft Fabric concepts to real data engineering code.

This project solves that by giving learners a practical environment where they can build a lakehouse, transform real data, query it in multiple languages, validate pipeline runs, and understand how the pieces map to Microsoft Fabric.

---

## Portfolio and Community Value

This project can help three audiences:

### 1. DP-700 Learners

They get a free practical lab that helps them understand concepts before using Fabric directly.

### 2. Beginner Data Engineers

They get a reusable local project showing medallion architecture, Delta Lake, Spark, SQL, validation, and analytics workflows.

### 3. Your Own Portfolio

You show that you can build more than a notebook. You can design a reusable data engineering project, explain it clearly, and make it useful for other learners.

That is the strongest reason to make it open source.

---

## Suggested README Opening

```markdown
# DP-700 Local Lakehouse Lab

A free, open-source, local-first data engineering lab for learners reviewing for the Microsoft DP-700 Fabric Data Engineer Associate exam.

This project simulates Microsoft Fabric-style lakehouse workflows using PySpark, Delta Lake, T-SQL, and KQL-style analytics patterns. It is designed for learners who want hands-on practice with medallion architecture, data ingestion, transformation, validation, and analytics without needing a Fabric workspace for the first round of learning.

## What You Will Build

- A local Bronze/Silver/Gold lakehouse
- Reusable PySpark transformation modules
- Delta Lake tables
- SQL Server exports for T-SQL practice
- Kusto emulator exports for KQL practice
- Validation checks and run history logging
- DP-700-style exercises using real public data
```

---

## Final Recommendation

Start with a small, working MVP:

```text
NYC Taxi data
PySpark pipeline
Delta Lake Bronze/Silver/Gold
Validation checks
Run history
T-SQL export
Clean README
```

Then add KQL after the core project works.

A clean and complete MVP will be more valuable than a huge unfinished repo. The open-source goal should be to help learners bridge the gap between DP-700 theory and real data engineering practice.
