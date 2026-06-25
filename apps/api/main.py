from __future__ import annotations

import os
import random
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


REPO_ROOT = Path(__file__).resolve().parents[2]
QUESTIONS_DIR = REPO_ROOT / "questions"
TRACKER_PATH = QUESTIONS_DIR / "tracker" / "question_bank.md"
DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "progress.sqlite"
DB_PATH = Path(os.environ.get("DP700_API_DB", DEFAULT_DB_PATH))

DOMAINS = [
    "Implement and manage an analytics solution",
    "Ingest and transform data",
    "Monitor and optimize an analytics solution",
]
DIFFICULTIES = ["Foundation", "Intermediate", "Advanced"]


class Source(BaseModel):
    title: str
    url: str


class Choice(BaseModel):
    label: str
    text: str


class PublicQuestion(BaseModel):
    id: str
    title: str
    domain: str
    topic: str
    difficulty: str
    questionType: str
    source: Source
    lastVerified: str
    status: str
    prompt: str
    choices: list[Choice]


class Question(PublicQuestion):
    correctAnswer: str
    correctAnswerText: str
    explanation: str
    reasons: dict[str, str]


class DomainCoverage(BaseModel):
    domain: str
    Foundation: int
    Intermediate: int
    Advanced: int
    total: int


class QuestionBank(BaseModel):
    questions: list[PublicQuestion]
    coverage: dict[str, list[DomainCoverage] | int]


class ProgressEntry(BaseModel):
    questionId: str
    attempts: int
    correct: int
    accuracy: int
    lastResult: Literal["correct", "incorrect"] | None
    lastAnswer: str | None
    lastAttemptedAt: str | None
    dueAt: str
    intervalDays: float
    easeFactor: float
    consecutiveCorrect: int
    lapses: int
    status: Literal["New", "Due", "Learning", "Scheduled", "Mature"]
    isDue: bool


class ProgressSummary(BaseModel):
    totalAttempts: int
    totalCorrect: int
    accuracy: int
    attemptedQuestions: int
    dueNow: int
    scheduled: int
    mature: int


class ProgressResponse(BaseModel):
    entries: dict[str, ProgressEntry]
    summary: ProgressSummary


class SessionRequest(BaseModel):
    count: int = Field(default=5, ge=1, le=100)
    domain: str | None = None
    difficulty: str | None = None
    dueOnly: bool = False


class SessionResponse(BaseModel):
    questions: list[PublicQuestion]


class AnswerRequest(BaseModel):
    questionId: str
    answer: str = ""
    timedOut: bool = False


class AnswerResponse(BaseModel):
    questionId: str
    selectedAnswer: str
    correct: bool
    correctAnswer: str
    correctAnswerText: str
    explanation: str
    reasons: dict[str, str]
    progress: ProgressEntry
    summary: ProgressSummary


app = FastAPI(title="DP-700 Quiz API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def normalize(content: str) -> str:
    return content.replace("\r\n", "\n")


def fail(message: str) -> None:
    raise RuntimeError(f"Question bank validation failed: {message}")


def field(content: str, name: str, file_name: str) -> str:
    prefix = f"| {name} |"
    for line in content.splitlines():
        if line.startswith(prefix):
            cells = [cell.strip() for cell in line.split("|")]
            if len(cells) > 2 and cells[2]:
                return cells[2]
    fail(f"{file_name} is missing the {name} field")


def section(content: str, start_heading: str, end_heading: str, file_name: str) -> str:
    start = content.find(start_heading)
    if start < 0:
        fail(f"{file_name} is missing {start_heading}")
    body_start = start + len(start_heading)
    end = content.find(end_heading, body_start)
    if end < 0:
        fail(f"{file_name} is missing {end_heading}")
    value = content[body_start:end].strip()
    if not value:
        fail(f"{file_name} has an empty {start_heading} section")
    return value


def parse_source(value: str, file_name: str) -> Source:
    match = re.match(r"^\[([^\]]+)]\((https://[^)]+)\)$", value)
    if not match:
        fail(f"{file_name} must use an HTTPS Markdown link in Source")
    return Source(title=match.group(1), url=match.group(2))


def parse_question(file_path: Path) -> Question:
    file_name = file_path.name
    content = normalize(file_path.read_text(encoding="utf-8"))
    heading = re.search(r"^### (DP700-\d{3}): (.+)$", content, re.MULTILINE)
    if not heading:
        fail(f"{file_name} has an invalid question heading")

    choices_text = section(content, "#### Choices", "<details>", file_name)
    choices = [
        Choice(label=match.group(1), text=match.group(2).strip())
        for match in re.finditer(r"^- ([A-Z])\. (.+)$", choices_text, re.MULTILINE)
    ]
    if len(choices) < 2:
        fail(f"{file_name} must contain at least two choices")

    answer_text = section(content, "#### Correct answer", "#### Explanation", file_name)
    answer = re.search(r"^\*\*([A-Z])\.\s*(.+)\*\*$", answer_text, re.MULTILINE)
    if not answer:
        fail(f"{file_name} has an invalid Correct answer section")

    reasons_text = section(
        content,
        "#### Why the other choices are incorrect",
        "</details>",
        file_name,
    )
    reasons = {
        match.group(1): match.group(2).strip()
        for match in re.finditer(r"^- \*\*([A-Z]):\*\*\s*(.+)$", reasons_text, re.MULTILINE)
    }

    question = Question(
        id=heading.group(1),
        title=heading.group(2).strip(),
        domain=field(content, "Domain", file_name),
        topic=field(content, "Topic", file_name),
        difficulty=field(content, "Difficulty", file_name),
        questionType=field(content, "Question type", file_name),
        source=parse_source(field(content, "Source", file_name), file_name),
        lastVerified=field(content, "Last verified", file_name),
        status=field(content, "Status", file_name),
        prompt=section(content, "#### Question", "#### Choices", file_name),
        choices=choices,
        correctAnswer=answer.group(1),
        correctAnswerText=answer.group(2).strip(),
        explanation=section(
            content,
            "#### Explanation",
            "#### Why the other choices are incorrect",
            file_name,
        ),
        reasons=reasons,
    )
    validate_question(question, file_name)
    return question


def validate_question(question: Question, file_name: str) -> None:
    if f"{question.id}.md" != file_name:
        fail(f"{file_name} heading ID does not match its filename")
    if question.domain not in DOMAINS:
        fail(f"{file_name} has unsupported domain: {question.domain}")
    if question.difficulty not in DIFFICULTIES:
        fail(f"{file_name} has unsupported difficulty: {question.difficulty}")
    if question.status not in {"Draft", "Verified"}:
        fail(f"{file_name} has unsupported status: {question.status}")
    labels = [choice.label for choice in question.choices]
    if len(set(labels)) != len(labels):
        fail(f"{file_name} has duplicate choice labels")
    if question.correctAnswer not in labels:
        fail(f"{file_name} correct answer does not match a choice")
    for label in labels:
        if label not in question.reasons:
            fail(f"{file_name} is missing reasoning for choice {label}")


def load_questions() -> list[Question]:
    if (QUESTIONS_DIR / "question_bank.md").exists():
        fail("obsolete path exists: questions/question_bank.md")
    if (REPO_ROOT / "docs" / "question_bank.md").exists():
        fail("obsolete path exists: docs/question_bank.md")
    if not TRACKER_PATH.exists():
        fail(f"tracker does not exist: {TRACKER_PATH}")

    question_files = sorted(QUESTIONS_DIR.glob("DP700-*.md"))
    if not question_files:
        fail("no standalone question files were found")
    return [parse_question(path) for path in question_files]


def public_question(question: Question) -> PublicQuestion:
    return PublicQuestion(**question.model_dump(exclude={"correctAnswer", "correctAnswerText", "explanation", "reasons"}))


def compute_coverage(questions: list[Question]) -> dict[str, list[DomainCoverage] | int]:
    domains = []
    for domain in DOMAINS:
        counts = {difficulty: 0 for difficulty in DIFFICULTIES}
        for question in questions:
            if question.domain == domain:
                counts[question.difficulty] += 1
        domains.append(
            DomainCoverage(
                domain=domain,
                Foundation=counts["Foundation"],
                Intermediate=counts["Intermediate"],
                Advanced=counts["Advanced"],
                total=sum(counts.values()),
            )
        )
    return {"domains": domains, "total": sum(domain.total for domain in domains)}


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    with connect() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS progress (
                question_id TEXT PRIMARY KEY,
                attempts INTEGER NOT NULL DEFAULT 0,
                correct INTEGER NOT NULL DEFAULT 0,
                consecutive_correct INTEGER NOT NULL DEFAULT 0,
                lapses INTEGER NOT NULL DEFAULT 0,
                interval_days REAL NOT NULL DEFAULT 0,
                ease_factor REAL NOT NULL DEFAULT 2.5,
                due_at TEXT NOT NULL,
                last_result TEXT,
                last_answer TEXT,
                last_attempted_at TEXT,
                updated_at TEXT NOT NULL
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id TEXT NOT NULL,
                selected_answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                attempted_at TEXT NOT NULL,
                timed_out INTEGER NOT NULL,
                interval_days REAL NOT NULL,
                due_at TEXT NOT NULL
            )
            """
        )


@app.on_event("startup")
def startup() -> None:
    init_db()


def row_to_progress(row: sqlite3.Row, now: datetime) -> ProgressEntry:
    attempts = int(row["attempts"])
    correct = int(row["correct"])
    due_at = parse_iso(row["due_at"]) or now
    is_due = due_at <= now
    accuracy = round((correct / attempts) * 100) if attempts else 0
    interval_days = float(row["interval_days"])
    last_result = row["last_result"]

    if attempts == 0:
        status = "New"
    elif is_due:
        status = "Due"
    elif interval_days >= 14 and last_result == "correct":
        status = "Mature"
    elif last_result == "correct":
        status = "Scheduled"
    else:
        status = "Learning"

    return ProgressEntry(
        questionId=row["question_id"],
        attempts=attempts,
        correct=correct,
        accuracy=accuracy,
        lastResult=last_result,
        lastAnswer=row["last_answer"],
        lastAttemptedAt=row["last_attempted_at"],
        dueAt=iso(due_at),
        intervalDays=interval_days,
        easeFactor=round(float(row["ease_factor"]), 2),
        consecutiveCorrect=int(row["consecutive_correct"]),
        lapses=int(row["lapses"]),
        status=status,
        isDue=is_due,
    )


def load_progress() -> dict[str, ProgressEntry]:
    now = utc_now()
    with connect() as db:
        rows = db.execute("SELECT * FROM progress").fetchall()
    return {row["question_id"]: row_to_progress(row, now) for row in rows}


def progress_summary(progress: dict[str, ProgressEntry], questions: list[Question]) -> ProgressSummary:
    now = utc_now()
    total_attempts = sum(entry.attempts for entry in progress.values())
    total_correct = sum(entry.correct for entry in progress.values())
    question_ids = {question.id for question in questions}
    due_now = 0
    scheduled = 0
    mature = 0
    for question_id in question_ids:
        entry = progress.get(question_id)
        if entry is None:
            due_now += 1
        elif entry.isDue:
            due_now += 1
        elif entry.status == "Mature":
            mature += 1
            scheduled += 1
        else:
            due_at = parse_iso(entry.dueAt) or now
            if due_at > now:
                scheduled += 1
    return ProgressSummary(
        totalAttempts=total_attempts,
        totalCorrect=total_correct,
        accuracy=round((total_correct / total_attempts) * 100) if total_attempts else 0,
        attemptedQuestions=len(progress),
        dueNow=due_now,
        scheduled=scheduled,
        mature=mature,
    )


def due_score(question: Question, progress: ProgressEntry | None, now: datetime) -> float:
    if progress is None:
        return 10_000
    due_at = parse_iso(progress.dueAt) or now
    overdue_seconds = (now - due_at).total_seconds()
    if progress.isDue:
        result_bonus = 20_000 if progress.lastResult == "incorrect" else 0
        lapse_bonus = progress.lapses * 500
        return 30_000 + result_bonus + lapse_bonus + max(0, overdue_seconds / 60)
    return -max(0, (due_at - now).total_seconds() / 3600)


def schedule_after_answer(previous: ProgressEntry | None, correct: bool, now: datetime) -> tuple[int, int, float, float, str]:
    previous_attempts = previous.attempts if previous else 0
    previous_correct = previous.correct if previous else 0
    previous_streak = previous.consecutiveCorrect if previous else 0
    previous_lapses = previous.lapses if previous else 0
    previous_interval = previous.intervalDays if previous else 0
    previous_ease = previous.easeFactor if previous else 2.5

    attempts = previous_attempts + 1
    correct_count = previous_correct + (1 if correct else 0)
    if correct:
        streak = previous_streak + 1
        if streak == 1:
            interval_days = 1
        elif streak == 2:
            interval_days = 3
        else:
            interval_days = max(5, round(max(previous_interval, 1) * previous_ease))
        ease_factor = min(2.8, previous_ease + 0.08)
        lapses = previous_lapses
        due_at = now + timedelta(days=interval_days)
    else:
        streak = 0
        interval_days = 0
        ease_factor = max(1.3, previous_ease - 0.2)
        lapses = previous_lapses + 1
        due_at = now

    return attempts, correct_count, streak, lapses, interval_days, ease_factor, iso(due_at)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/question-bank", response_model=QuestionBank)
def get_question_bank() -> QuestionBank:
    questions = load_questions()
    return QuestionBank(
        questions=[public_question(question) for question in questions],
        coverage=compute_coverage(questions),
    )


@app.get("/api/progress", response_model=ProgressResponse)
def get_progress() -> ProgressResponse:
    questions = load_questions()
    progress = load_progress()
    return ProgressResponse(entries=progress, summary=progress_summary(progress, questions))


@app.post("/api/sessions", response_model=SessionResponse)
def create_session(request: SessionRequest) -> SessionResponse:
    questions = load_questions()
    progress = load_progress()
    now = utc_now()

    pool = [
        question
        for question in questions
        if (not request.domain or question.domain == request.domain)
        and (not request.difficulty or question.difficulty == request.difficulty)
    ]
    if request.dueOnly:
        pool = [
            question
            for question in pool
            if question.id not in progress or progress[question.id].isDue
        ]

    random.shuffle(pool)
    pool.sort(key=lambda question: due_score(question, progress.get(question.id), now), reverse=True)
    return SessionResponse(questions=[public_question(question) for question in pool[: request.count]])


@app.post("/api/answers", response_model=AnswerResponse)
def submit_answer(request: AnswerRequest) -> AnswerResponse:
    questions = {question.id: question for question in load_questions()}
    question = questions.get(request.questionId)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    selected_answer = request.answer.strip().upper()
    correct = bool(selected_answer) and selected_answer == question.correctAnswer and not request.timedOut
    now = utc_now()
    now_text = iso(now)

    with connect() as db:
        row = db.execute("SELECT * FROM progress WHERE question_id = ?", (question.id,)).fetchone()
        previous = row_to_progress(row, now) if row else None
        attempts, correct_count, streak, lapses, interval_days, ease_factor, due_at = schedule_after_answer(
            previous,
            correct,
            now,
        )
        db.execute(
            """
            INSERT INTO progress (
                question_id, attempts, correct, consecutive_correct, lapses,
                interval_days, ease_factor, due_at, last_result, last_answer,
                last_attempted_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(question_id) DO UPDATE SET
                attempts = excluded.attempts,
                correct = excluded.correct,
                consecutive_correct = excluded.consecutive_correct,
                lapses = excluded.lapses,
                interval_days = excluded.interval_days,
                ease_factor = excluded.ease_factor,
                due_at = excluded.due_at,
                last_result = excluded.last_result,
                last_answer = excluded.last_answer,
                last_attempted_at = excluded.last_attempted_at,
                updated_at = excluded.updated_at
            """,
            (
                question.id,
                attempts,
                correct_count,
                streak,
                lapses,
                interval_days,
                ease_factor,
                due_at,
                "correct" if correct else "incorrect",
                selected_answer,
                now_text,
                now_text,
            ),
        )
        db.execute(
            """
            INSERT INTO attempts (
                question_id, selected_answer, is_correct, attempted_at,
                timed_out, interval_days, due_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                question.id,
                selected_answer,
                1 if correct else 0,
                now_text,
                1 if request.timedOut else 0,
                interval_days,
                due_at,
            ),
        )

    progress = load_progress()
    return AnswerResponse(
        questionId=question.id,
        selectedAnswer=selected_answer,
        correct=correct,
        correctAnswer=question.correctAnswer,
        correctAnswerText=question.correctAnswerText,
        explanation=question.explanation,
        reasons=question.reasons,
        progress=progress[question.id],
        summary=progress_summary(progress, list(questions.values())),
    )


@app.delete("/api/progress", response_model=ProgressResponse)
def clear_progress() -> ProgressResponse:
    with connect() as db:
        db.execute("DELETE FROM attempts")
        db.execute("DELETE FROM progress")
    questions = load_questions()
    return ProgressResponse(entries={}, summary=progress_summary({}, questions))
