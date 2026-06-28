#!/usr/bin/env python3
"""Analyze an Anki .apkg export and write a DP-700 weak-area report."""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import shutil
import sqlite3
import tempfile
import zipfile
from pathlib import Path


FIELD_SEP = "\x1f"
SQLITE_MAGIC = b"SQLite format 3\x00"
ZSTD_MAGIC = b"\x28\xb5\x2f\xfd"
EASE_LABELS = {1: "Again", 2: "Hard", 3: "Good", 4: "Easy"}


def strip_html(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def unslug(value: str) -> str:
    return value.replace("-", " ").strip().title()


def tag_value(tags: list[str], prefix: str) -> str:
    for tag in tags:
        if tag.startswith(prefix):
            return unslug(tag[len(prefix) :])
    return ""


def read_collection(apkg: Path, workdir: Path) -> Path:
    with zipfile.ZipFile(apkg) as package:
        names = set(package.namelist())
        for candidate in ("collection.anki21b", "collection.anki2"):
            if candidate not in names:
                continue
            raw = package.read(candidate)
            if raw.startswith(SQLITE_MAGIC):
                db_path = workdir / candidate
                db_path.write_bytes(raw)
                return db_path
            if raw.startswith(ZSTD_MAGIC):
                try:
                    import zstandard as zstd  # type: ignore
                except ImportError as exc:
                    raise SystemExit(
                        "The APKG uses compressed collection.anki21b data. "
                        "Install Zstandard support in WSL with "
                        "`python3 -m pip install zstandard`, then rerun this script."
                    ) from exc
                db_path = workdir / f"{candidate}.sqlite"
                db_path.write_bytes(zstd.ZstdDecompressor().decompress(raw))
                return db_path
    raise SystemExit("No readable Anki collection database was found in the APKG.")


def load_decks(conn: sqlite3.Connection) -> dict[int, str]:
    row = conn.execute("select decks from col").fetchone()
    if not row:
        return {}
    decks = json.loads(row[0])
    return {int(deck_id): deck.get("name", "") for deck_id, deck in decks.items()}


def load_cards(conn: sqlite3.Connection, deck_filter: str, recent_days: int) -> list[dict[str, object]]:
    decks = load_decks(conn)
    cutoff_ms = int((dt.datetime.now(dt.UTC) - dt.timedelta(days=recent_days)).timestamp() * 1000)
    rows = conn.execute(
        """
        select
          c.id, c.nid, c.did, c.reps, c.lapses, c.ivl, c.factor, c.data,
          n.tags, n.flds
        from cards c
        join notes n on n.id = c.nid
        """
    ).fetchall()

    results: list[dict[str, object]] = []
    for card_id, note_id, deck_id, reps, lapses, interval, factor, card_data, tags_raw, fields_raw in rows:
        deck_name = decks.get(int(deck_id), "")
        tags = [tag for tag in str(tags_raw).strip().split() if tag]
        if deck_filter and deck_filter.lower() not in deck_name.lower() and "dp700" not in tags:
            continue

        fields = str(fields_raw).split(FIELD_SEP)
        front = strip_html(fields[0]) if fields else ""
        dp700_id_match = re.search(r"\bDP700-\d{3}\b", front, flags=re.I)
        dp700_id = dp700_id_match.group(0).upper() if dp700_id_match else ""

        revs = conn.execute(
            "select id, ease, time, type from revlog where cid = ? order by id",
            (card_id,),
        ).fetchall()
        review_count = len(revs)
        again_count = sum(1 for _, ease, _, _ in revs if ease == 1)
        recent_again = sum(1 for rev_id, ease, _, _ in revs if ease == 1 and rev_id >= cutoff_ms)
        recent_hard = sum(1 for rev_id, ease, _, _ in revs if ease == 2 and rev_id >= cutoff_ms)
        latest_ease = int(revs[-1][1]) if revs else 0
        success_rate = (review_count - again_count) / review_count if review_count else None

        weak_score = (
            recent_again * 5
            + int(lapses or 0) * 4
            + again_count * 2
            + recent_hard * 2
            + (3 if latest_ease == 1 else 1 if latest_ease == 2 else 0)
        )
        if success_rate is not None and review_count >= 2 and success_rate < 0.70:
            weak_score += int(round((0.70 - success_rate) * 10))

        if review_count == 0:
            status = "Unreviewed"
        elif latest_ease == 1 or recent_again > 0 or int(lapses or 0) > 0 or (review_count >= 2 and success_rate is not None and success_rate < 0.70):
            status = "Needs review"
        elif review_count >= 3 and success_rate is not None and success_rate >= 0.85 and latest_ease >= 3 and recent_again == 0:
            status = "Strong"
        else:
            status = "Learning"

        results.append(
            {
                "card_id": card_id,
                "note_id": note_id,
                "deck": deck_name,
                "front": front,
                "dp700_id": dp700_id,
                "domain": tag_value(tags, "domain-"),
                "topic": tag_value(tags, "topic-"),
                "difficulty": tag_value(tags, "difficulty-"),
                "tags": " ".join(tags),
                "reviews": review_count,
                "again": again_count,
                "recent_again": recent_again,
                "recent_hard": recent_hard,
                "lapses": int(lapses or 0),
                "success_rate": success_rate,
                "latest": EASE_LABELS.get(latest_ease, "None"),
                "status": status,
                "weak_score": weak_score,
            }
        )
    return results


def aggregate(cards: list[dict[str, object]], key: str) -> list[tuple[str, int, int, int]]:
    buckets: dict[str, dict[str, int]] = {}
    for card in cards:
        name = str(card.get(key) or "Unclassified")
        bucket = buckets.setdefault(name, {"cards": 0, "needs": 0, "score": 0})
        bucket["cards"] += 1
        bucket["score"] += int(card["weak_score"])
        if card["status"] == "Needs review":
            bucket["needs"] += 1
    return sorted(
        ((name, data["cards"], data["needs"], data["score"]) for name, data in buckets.items()),
        key=lambda item: (item[3], item[2], item[1]),
        reverse=True,
    )


def pct(value: object) -> str:
    if value is None:
        return "-"
    return f"{float(value) * 100:.0f}%"


def md_escape(value: object) -> str:
    text = str(value or "")
    return text.replace("|", "\\|")


def write_report(output: Path, apkg: Path, cards: list[dict[str, object]], recent_days: int) -> None:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    status_counts: dict[str, int] = {}
    for card in cards:
        status_counts[str(card["status"])] = status_counts.get(str(card["status"]), 0) + 1

    weak_cards = sorted(cards, key=lambda card: (int(card["weak_score"]), int(card["recent_again"]), int(card["lapses"])), reverse=True)
    top_weak = [card for card in weak_cards if card["status"] == "Needs review" or int(card["weak_score"]) > 0][:25]

    lines = [
        "# DP-700 Anki Progress",
        "",
        "This file tracks weak areas detected from an Anki `.apkg` export with scheduling information. It is separate from `docs/quiz_progress.md`, the browser app database, and the generated Anki import TSV.",
        "",
        "## Latest Import",
        "",
        f"- Source APKG: `{apkg}`",
        f"- Analyzed at: {now}",
        f"- Recent review window: {recent_days} days",
        f"- Cards analyzed: {len(cards)}",
        "",
        "## Status Summary",
        "",
        "| Status | Cards |",
        "|---|---:|",
    ]
    for status in ("Needs review", "Learning", "Strong", "Unreviewed"):
        lines.append(f"| {status} | {status_counts.get(status, 0)} |")

    lines.extend(
        [
            f"| **Total tracked** | **{len(cards)}** |",
            "",
            "## Weak Domains",
            "",
            "| Domain | Cards | Needs review | Weak score |",
            "|---|---:|---:|---:|",
        ]
    )
    for name, total, needs, score in aggregate(cards, "domain"):
        lines.append(f"| {md_escape(name)} | {total} | {needs} | {score} |")

    lines.extend(
        [
            "",
            "## Weak Topics",
            "",
            "| Topic | Cards | Needs review | Weak score |",
            "|---|---:|---:|---:|",
        ]
    )
    for name, total, needs, score in aggregate(cards, "topic")[:30]:
        lines.append(f"| {md_escape(name)} | {total} | {needs} | {score} |")

    lines.extend(
        [
            "",
            "## Cards To Review First",
            "",
            "| Card | Domain | Topic | Reviews | Again | Recent Again | Lapses | Success | Latest | Status | Weak score |",
            "|---|---|---|---:|---:|---:|---:|---:|---|---|---:|",
        ]
    )
    for card in top_weak:
        label = card["dp700_id"] or card["front"][:90]
        lines.append(
            "| "
            + " | ".join(
                [
                    md_escape(label),
                    md_escape(card["domain"] or "Unclassified"),
                    md_escape(card["topic"] or "Unclassified"),
                    str(card["reviews"]),
                    str(card["again"]),
                    str(card["recent_again"]),
                    str(card["lapses"]),
                    pct(card["success_rate"]),
                    md_escape(card["latest"]),
                    md_escape(card["status"]),
                    str(card["weak_score"]),
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Follow-Up Plan",
            "",
            "- Review the highest-scoring cards in Anki first.",
            "- Run a `$dp700-quiz-bank` tracked quiz for the top weak topic.",
            "- Add new source-verified questions only when a weak topic has thin question-bank coverage.",
            "",
            "## Notes",
            "",
            "- `Again` is treated as incorrect for weak-area scoring.",
            "- The weak score is a prioritization signal, not an exam-score estimate.",
            "- Re-export the deck from Anki with scheduling information whenever you want to refresh this report.",
        ]
    )
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze Anki APKG review history for DP-700 weak points.")
    parser.add_argument("apkg", type=Path, help="Path to an Anki .apkg export with scheduling information.")
    parser.add_argument("--output", type=Path, default=Path("docs/quiz_progress_anki.md"), help="Markdown report path.")
    parser.add_argument("--deck", default="DP-700", help="Deck name filter. Cards tagged dp700 are also included.")
    parser.add_argument("--recent-days", type=int, default=31, help="Window for recent Again/Hard review counts.")
    args = parser.parse_args()

    if not args.apkg.exists():
        raise SystemExit(f"APKG not found: {args.apkg}")

    with tempfile.TemporaryDirectory(prefix="dp700-anki-") as temp_name:
        db_path = read_collection(args.apkg, Path(temp_name))
        conn = sqlite3.connect(db_path)
        try:
            cards = load_cards(conn, args.deck, args.recent_days)
        finally:
            conn.close()

    if not cards:
        raise SystemExit("No cards matched the requested deck filter or dp700 tags.")
    if all(int(card["reviews"]) == 0 for card in cards):
        raise SystemExit(
            "No review history was found for the matched cards. "
            "Re-export from Anki with scheduling information included."
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_report(args.output, args.apkg, cards, args.recent_days)
    print(f"Analyzed {len(cards)} cards")
    print(f"Wrote {args.output}")
    print(f"Needs review: {sum(1 for card in cards if card['status'] == 'Needs review')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
